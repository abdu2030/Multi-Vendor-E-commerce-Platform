import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";
import { MailService } from "../mail/mail.service";
import { QueuedEmailJob } from "../mail/mail.types";
import { EMAILS_QUEUE, SEND_EMAIL_JOB } from "./jobs.constants";
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
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 3_000 },
        removeOnComplete: { count: 2_000 },
        removeOnFail: { count: 5_000 }
      }
    });
    this.queue.on("error", (error) => this.logger.error(`Email queue error: ${error.message}`));
  }

  async enqueue(jobId: string, data: QueuedEmailJob) {
    if (this.queue) {
      try {
        await this.queue.add(SEND_EMAIL_JOB, data, { jobId });
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown queue error";
        this.logger.warn(`Email queue unavailable; using SMTP fallback: ${message}`);
      }
    }

    return this.mail.sendQueuedEmail(data);
  }

  async onModuleDestroy() {
    await this.queue?.close();
  }
}
