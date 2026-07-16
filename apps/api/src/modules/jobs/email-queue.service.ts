import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";
import { MailService } from "../mail/mail.service";
import { QueuedEmailJob } from "../mail/mail.types";
import { EMAILS_QUEUE, SEND_EMAIL_JOB } from "./jobs.constants";
import { assertSafeJobPayload } from "./job-payload-safety";
import { RedisConnectionFactory } from "./redis-connection.factory";

@Injectable()
export class EmailQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailQueueService.name);
  private queue?: Queue<QueuedEmailJob>;

  constructor(
    private readonly redis: RedisConnectionFactory,
    private readonly mail: MailService
  ) {}

  onModuleInit() {
    if (!this.redis.isConfigured()) {
      this.logger.warn("REDIS_URL is not configured; email jobs will run synchronously.");
      return;
    }

    this.queue = new Queue<QueuedEmailJob>(EMAILS_QUEUE, {
      connection: this.redis.createProducerConnection(),
      prefix: this.redis.queuePrefix(),
      defaultJobOptions: EMAIL_QUEUE_DEFAULT_JOB_OPTIONS
    });
    this.queue.on("error", () => this.logger.error("Email queue error."));
  }

  async enqueue(jobId: string, data: QueuedEmailJob) {
    assertSafeJobPayload(data);

    if (this.queue) {
      try {
        await this.queue.add(SEND_EMAIL_JOB, data, { jobId });
        return true;
      } catch {
        this.logger.warn("Email queue unavailable; using SMTP fallback.");
      }
    }

    return this.mail.sendQueuedEmail(data);
  }

  async onModuleDestroy() {
    await this.queue?.close();
  }
}

export const EMAIL_QUEUE_DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: "exponential", delay: 3_000 },
  removeOnComplete: { count: 2_000 },
  removeOnFail: { count: 5_000 },
  timeout: 30_000
} as const;
