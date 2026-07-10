import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Job, Worker } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { EmailQueueService } from "./email-queue.service";
import { CREATE_NOTIFICATION_JOB, NOTIFICATIONS_QUEUE } from "./jobs.constants";
import { CreateNotificationJob } from "./jobs.types";
import { RedisConnectionFactory } from "./redis-connection.factory";

@Injectable()
export class NotificationProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationProcessor.name);
  private worker?: Worker<CreateNotificationJob>;

  constructor(
    private readonly redis: RedisConnectionFactory,
    private readonly prisma: PrismaService,
    private readonly emailQueue: EmailQueueService
  ) {}

  onModuleInit() {
    if (!this.redis.isConfigured()) {
      return;
    }

    this.worker = new Worker<CreateNotificationJob>(
      NOTIFICATIONS_QUEUE,
      (job) => this.process(job),
      {
        connection: this.redis.createWorkerConnection(),
        concurrency: this.redis.workerConcurrency(),
        prefix: this.redis.queuePrefix()
      }
    );
    this.worker.on("completed", (job) => this.logger.debug(`Completed notification job ${job.id}.`));
    this.worker.on("failed", (job, error) => {
      this.logger.error(`Notification job ${job?.id ?? "unknown"} failed: ${error.message}`);
    });
    this.worker.on("error", (error) => this.logger.error(`Notification worker error: ${error.message}`));
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  private async process(job: Job<CreateNotificationJob>) {
    if (job.name !== CREATE_NOTIFICATION_JOB) {
      throw new Error(`Unsupported notification job: ${job.name}`);
    }

    const { notificationId, userId, type, title, message, emailTemplate } = job.data;

    const notification = await this.prisma.notification.upsert({
      where: { id: notificationId },
      update: {},
      create: {
        id: notificationId,
        userId,
        type,
        title,
        message
      },
      select: {
        id: true,
        user: {
          select: {
            email: true,
            fullName: true
          }
        }
      }
    });

    const emailAccepted = await this.emailQueue.enqueue(
      `notification-email-${notification.id}`,
      emailTemplate === "welcome"
        ? {
            kind: "welcome",
            to: notification.user.email,
            recipientName: notification.user.fullName
          }
        : {
            kind: "notification",
            to: notification.user.email,
            recipientName: notification.user.fullName,
            title,
            message
          }
    );

    return { id: notification.id, emailAccepted };
  }
}
