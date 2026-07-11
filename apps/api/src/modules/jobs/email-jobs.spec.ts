import { SEND_EMAIL_JOB } from "./jobs.constants";
import { EmailProcessor } from "./email.processor";
import { EMAIL_QUEUE_DEFAULT_JOB_OPTIONS, EmailQueueService } from "./email-queue.service";
import { NOTIFICATION_QUEUE_DEFAULT_JOB_OPTIONS } from "./notification-queue.service";
import { QueuedEmailJob } from "../mail/mail.types";

describe("email jobs", () => {
  const welcomeJob: QueuedEmailJob = {
    kind: "welcome",
    to: "buyer@example.com",
    recipientName: "Buyer One"
  };

  it("keeps BullMQ retry options explicit for email and notification jobs", () => {
    expect(EMAIL_QUEUE_DEFAULT_JOB_OPTIONS).toEqual({
      attempts: 5,
      backoff: { type: "exponential", delay: 3_000 },
      removeOnComplete: { count: 2_000 },
      removeOnFail: { count: 5_000 }
    });
    expect(NOTIFICATION_QUEUE_DEFAULT_JOB_OPTIONS).toEqual({
      attempts: 3,
      backoff: { type: "exponential", delay: 2_000 },
      removeOnComplete: { count: 1_000 },
      removeOnFail: { count: 5_000 }
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

  it("falls back to synchronous SMTP delivery when the email queue add fails", async () => {
    const add = jest.fn().mockRejectedValue(new Error("redis unavailable"));
    const mail = { sendQueuedEmail: jest.fn().mockResolvedValue(true) };
    const service = new EmailQueueService({} as never, mail as never);
    (service as unknown as { queue: { add: typeof add } }).queue = { add };

    const accepted = await service.enqueue("welcome-buyer_1", welcomeJob);

    expect(accepted).toBe(true);
    expect(mail.sendQueuedEmail).toHaveBeenCalledWith(welcomeJob);
  });

  it("lets failed email delivery throw inside the processor so BullMQ can retry", async () => {
    const smtpError = new Error("SMTP rejected the message");
    const mail = { sendQueuedEmail: jest.fn().mockRejectedValue(smtpError) };
    const service = new EmailProcessor({} as never, mail as never);
    const process = (service as unknown as {
      process: (job: { name: string; data: QueuedEmailJob }) => Promise<unknown>;
    }).process.bind(service);

    await expect(process({ name: SEND_EMAIL_JOB, data: welcomeJob })).rejects.toThrow(smtpError);
    expect(mail.sendQueuedEmail).toHaveBeenCalledWith(welcomeJob, { throwOnError: true });
  });

  it("returns the email kind after a successful processor delivery", async () => {
    const mail = { sendQueuedEmail: jest.fn().mockResolvedValue(true) };
    const service = new EmailProcessor({} as never, mail as never);
    const process = (service as unknown as {
      process: (job: { name: string; data: QueuedEmailJob }) => Promise<unknown>;
    }).process.bind(service);

    await expect(process({ name: SEND_EMAIL_JOB, data: welcomeJob })).resolves.toEqual({
      sent: true,
      kind: "welcome"
    });
  });
});
