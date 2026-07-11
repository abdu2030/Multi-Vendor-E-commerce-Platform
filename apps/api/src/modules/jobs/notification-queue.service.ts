import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";
import { CREATE_NOTIFICATION_JOB, NOTIFICATIONS_QUEUE } from "./jobs.constants";
import { CreateNotificationJob } from "./jobs.types";
import { RedisConnectionFactory } from "./redis-connection.factory";

@Injectable()
export class NotificationQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationQueueService.name);
  private queue?: Queue<CreateNotificationJob>;

  constructor(private readonly redis: RedisConnectionFactory) {}

  onModuleInit() {
    if (!this.redis.isConfigured()) {
      this.logger.warn("REDIS_URL is not configured; notification jobs will run synchronously.");
      return;
    }

    this.queue = new Queue<CreateNotificationJob>(NOTIFICATIONS_QUEUE, {
      connection: this.redis.createProducerConnection(),
      prefix: this.redis.queuePrefix(),
      defaultJobOptions: NOTIFICATION_QUEUE_DEFAULT_JOB_OPTIONS
    });
    this.queue.on("error", (error) => this.logger.error(`Notification queue error: ${error.message}`));
  }

  async enqueue(data: CreateNotificationJob) {
    if (!this.queue) {
      return false;
    }

    try {
      await this.queue.add(CREATE_NOTIFICATION_JOB, data, { jobId: data.notificationId });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown queue error";
      this.logger.warn(`Notification queue unavailable; using database fallback: ${message}`);
      return false;
    }
  }

  async onModuleDestroy() {
    await this.queue?.close();
  }
}

export const NOTIFICATION_QUEUE_DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2_000 },
  removeOnComplete: { count: 1_000 },
  removeOnFail: { count: 5_000 }
} as const;
