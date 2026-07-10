import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Job, Worker } from "bullmq";
import { MailService } from "../mail/mail.service";
import { QueuedEmailJob } from "../mail/mail.types";
import { EMAILS_QUEUE, SEND_EMAIL_JOB } from "./jobs.constants";
import { RedisConnectionFactory } from "./redis-connection.factory";

@Injectable()
export class EmailProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailProcessor.name);
  private worker?: Worker<QueuedEmailJob>;

  constructor(
    private readonly redis: RedisConnectionFactory,
    private readonly mail: MailService
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
    this.worker.on("failed", (job, error) => {
      this.logger.error(`Email job ${job?.id ?? "unknown"} failed: ${error.message}`);
    });
    this.worker.on("error", (error) => this.logger.error(`Email worker error: ${error.message}`));
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  private async process(job: Job<QueuedEmailJob>) {
    if (job.name !== SEND_EMAIL_JOB) {
      throw new Error(`Unsupported email job: ${job.name}`);
    }

    const sent = await this.mail.sendQueuedEmail(job.data, { throwOnError: true });
    return { sent, kind: job.data.kind };
  }
}
