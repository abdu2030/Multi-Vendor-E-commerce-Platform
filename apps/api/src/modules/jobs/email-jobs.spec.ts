import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { SEND_EMAIL_JOB } from "./jobs.constants";
import { EmailProcessor } from "./email.processor";
import { EMAIL_QUEUE_DEFAULT_JOB_OPTIONS, EmailQueueService } from "./email-queue.service";
import { NOTIFICATION_QUEUE_DEFAULT_JOB_OPTIONS } from "./notification-queue.service";
import { QueuedEmailJob } from "../mail/mail.types";

const sentStatus = "SENT";
const failedStatus = "FAILED";

describe("email jobs", () => {
  const welcomeJob: QueuedEmailJob = {
    kind: "welcome",
    to: "buyer@example.com",
    recipientName: "Buyer One"
  };

  it("keeps BullMQ retry, backoff, retention, and timeout options explicit", () => {
    expect(EMAIL_QUEUE_DEFAULT_JOB_OPTIONS).toEqual({
      attempts: 5,
      backoff: { type: "exponential", delay: 3_000 },
      removeOnComplete: { count: 2_000 },
      removeOnFail: { count: 5_000 },
      timeout: 30_000
    });
    expect(NOTIFICATION_QUEUE_DEFAULT_JOB_OPTIONS).toEqual({
      attempts: 3,
      backoff: { type: "exponential", delay: 2_000 },
      removeOnComplete: { count: 1_000 },
      removeOnFail: { count: 5_000 },
      timeout: 15_000
    });
  });

  it("adds queued emails with a stable job id when Redis is available", async () => {
    const add = jest.fn().mockResolvedValue({ id: "welcome-buyer_1" });
    const mail = { sendQueuedEmail: jest.fn() };
    const service = new EmailQueueService({} as never, mail as never);
    (service as unknown as { queue: { add: typeof add } }).queue = { add };

    const accepted = await service.enqueue("welcome-buyer_1", welcomeJob);

    expect(accepted).toBe(true);
    expect(add).toHaveBeenCalledWith(SEND_EMAIL_JOB, welcomeJob, { jobId: "welcome-buyer_1" });
    expect(mail.sendQueuedEmail).not.toHaveBeenCalled();
  });

  it("rejects sensitive tokens before queueing or fallback delivery", async () => {
    const add = jest.fn();
    const mail = { sendQueuedEmail: jest.fn() };
    const service = new EmailQueueService({} as never, mail as never);
    (service as unknown as { queue: { add: typeof add } }).queue = { add };

    await expect(service.enqueue("unsafe-email", {
      ...welcomeJob,
      accessToken: "secret-access-token"
    } as never)).rejects.toThrow("Job payload must not include sensitive field");

    expect(add).not.toHaveBeenCalled();
    expect(mail.sendQueuedEmail).not.toHaveBeenCalled();
  });

  it("falls back to synchronous SMTP delivery when the email queue add fails", async () => {
    const add = jest.fn().mockRejectedValue(new Error("redis unavailable"));
    const mail = { sendQueuedEmail: jest.fn().mockResolvedValue(true) };
    const service = new EmailQueueService({} as never, mail as never);
    (service as unknown as { queue: { add: typeof add } }).queue = { add };

    const accepted = await service.enqueue("welcome-buyer_1", welcomeJob);

    expect(accepted).toBe(true);
    expect(mail.sendQueuedEmail).toHaveBeenCalledWith(welcomeJob);
  });

  it("marks failed email delivery attempts and lets BullMQ retry up to the configured limit", async () => {
    const smtpError = new Error("SMTP rejected the message");
    const mail = { sendQueuedEmail: jest.fn().mockRejectedValue(smtpError) };
    const prisma = createEmailDeliveryPrisma();
    const service = new EmailProcessor({} as never, mail as never, prisma as never);
    const process = getProcess(service);

    await expect(process({ id: "welcome-buyer_1", name: SEND_EMAIL_JOB, data: welcomeJob })).rejects.toThrow(smtpError);

    expect(EMAIL_QUEUE_DEFAULT_JOB_OPTIONS.attempts).toBe(5);
    expect(mail.sendQueuedEmail).toHaveBeenCalledWith(welcomeJob, { throwOnError: true });
    expect(prisma.emailJobDelivery.update).toHaveBeenCalledWith({
      where: { jobId: "welcome-buyer_1" },
      data: expect.objectContaining({
        status: failedStatus,
        lastError: "Email job failed."
      })
    });
    expect(JSON.stringify(prisma.emailJobDelivery.update.mock.calls)).not.toContain("SMTP rejected the message");
  });

  it("records successful delivery so duplicate email jobs do not send twice", async () => {
    const mail = { sendQueuedEmail: jest.fn().mockResolvedValue(true) };
    const prisma = createEmailDeliveryPrisma();
    const service = new EmailProcessor({} as never, mail as never, prisma as never);
    const process = getProcess(service);

    await expect(process({ id: "welcome-buyer_1", name: SEND_EMAIL_JOB, data: welcomeJob })).resolves.toEqual({
      sent: true,
      kind: "welcome"
    });

    prisma.emailJobDelivery.findUnique.mockResolvedValueOnce({ status: sentStatus, sentAt: new Date() });

    await expect(process({ id: "welcome-buyer_1", name: SEND_EMAIL_JOB, data: welcomeJob })).resolves.toEqual({
      sent: false,
      kind: "welcome",
      deduplicated: true
    });

    expect(mail.sendQueuedEmail).toHaveBeenCalledTimes(1);
  });

  it("does not define BullMQ workers for payment, inventory, refund, or payout operations", () => {
    const jobFiles = getSourceFiles(path.resolve(process.cwd(), "src/modules/jobs"))
      .filter((file) => !file.endsWith(".spec.ts"));
    const jobSource = jobFiles.map((file) => readFileSync(file, "utf8")).join("\n");

    expect(jobSource).not.toMatch(/charge|refund|payout|inventory|stock|PaymentIntent|stripe/i);
  });
});

function getProcess(service: EmailProcessor) {
  return (service as unknown as {
    process: (job: { id?: string; name: string; data: QueuedEmailJob }) => Promise<unknown>;
  }).process.bind(service);
}

function createEmailDeliveryPrisma() {
  return {
    emailJobDelivery: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({})
    }
  };
}

function getSourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const file = path.join(root, entry);
    const stats = statSync(file);

    if (stats.isDirectory()) {
      return getSourceFiles(file);
    }

    return file.endsWith(".ts") ? [file] : [];
  });
}
