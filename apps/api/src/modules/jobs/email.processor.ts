import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Job, Worker } from "bullmq";
import { createHash } from "crypto";
import { MailService } from "../mail/mail.service";
import { QueuedEmailJob } from "../mail/mail.types";
import { PrismaService } from "../prisma/prisma.service";
import { EMAILS_QUEUE, SEND_EMAIL_JOB } from "./jobs.constants";
import { RedisConnectionFactory } from "./redis-connection.factory";

const sentStatus = "SENT";
const failedStatus = "FAILED";
const processingStatus = "PROCESSING";

@Injectable()
export class EmailProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailProcessor.name);
  private worker?: Worker<QueuedEmailJob>;

  constructor(
    private readonly redis: RedisConnectionFactory,
    private readonly mail: MailService,
    private readonly prisma: PrismaService
  ) {}

  onModuleInit() {
    if (!this.redis.isConfigured()) {
      return;
    }

    this.worker = new Worker<QueuedEmailJob>(
      EMAILS_QUEUE,
      (job) => this.process(job),
      {
        connection: this.redis.createWorkerConnection(),
        concurrency: this.redis.workerConcurrency(),
        prefix: this.redis.queuePrefix()
      }
    );
    this.worker.on("completed", (job) => this.logger.debug(`Completed email job ${job.id}.`));
    this.worker.on("failed", (job) => {
      this.logger.error(`Email job ${job?.id ?? "unknown"} failed.`);
    });
    this.worker.on("error", () => this.logger.error("Email worker error."));
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  private async process(job: Job<QueuedEmailJob>) {
    if (job.name !== SEND_EMAIL_JOB) {
      throw new Error(`Unsupported email job: ${job.name}`);
    }

    const jobId = getDurableJobId(job);
    const existingDelivery = await this.prisma.emailJobDelivery.findUnique({
      where: { jobId },
      select: { status: true, sentAt: true }
    });

    if (existingDelivery?.status === sentStatus) {
      return { sent: false, kind: job.data.kind, deduplicated: true };
    }

    await this.prisma.emailJobDelivery.upsert({
      where: { jobId },
      create: {
        jobId,
        kind: job.data.kind,
        status: processingStatus
      },
      update: {
        status: processingStatus,
        attemptCount: { increment: 1 },
        lastError: null
      }
    });

    try {
      const sent = await this.mail.sendQueuedEmail(job.data, { throwOnError: true });

      await this.prisma.emailJobDelivery.update({
        where: { jobId },
        data: {
          status: sentStatus,
          sentAt: new Date(),
          lastError: null
        }
      });

      return { sent, kind: job.data.kind };
    } catch (error) {
      await this.prisma.emailJobDelivery.update({
        where: { jobId },
        data: {
          status: failedStatus,
          lastError: getErrorMessage(error)
        }
      });

      throw error;
    }
  }
}

function getDurableJobId(job: Job<QueuedEmailJob>) {
  if (job.id) {
    return String(job.id);
  }

  return createHash("sha256")
    .update(`${job.name}:${JSON.stringify(job.data)}`)
    .digest("hex");
}

function getErrorMessage(_error: unknown) {
  return "Email job failed.";
}
