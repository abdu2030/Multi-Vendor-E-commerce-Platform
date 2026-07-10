import { Injectable } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";
import { NotificationQueueService } from "../jobs/notification-queue.service";
import { PrismaService } from "../prisma/prisma.service";

type CreateNotificationInput = {
  userId: string;
  type?: NotificationType;
  title: string;
  message: string;
  idempotencyKey?: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueue: NotificationQueueService
  ) {}

  async create(input: CreateNotificationInput) {
    const notification = {
      notificationId: createNotificationId(input.idempotencyKey),
      userId: input.userId,
      type: input.type ?? NotificationType.INFO,
      title: input.title.trim(),
      message: input.message.trim()
    };

    if (await this.notificationQueue.enqueue(notification)) {
      return { id: notification.notificationId, queued: true };
    }

    return this.prisma.notification.upsert({
      where: { id: notification.notificationId },
      update: {},
      create: {
        id: notification.notificationId,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message
      },
      select: {
        id: true,
        userId: true,
        type: true,
        title: true,
        message: true,
        readAt: true,
        createdAt: true
      }
    });
  }
}

function createNotificationId(idempotencyKey?: string) {
  if (!idempotencyKey) {
    return "notification-" + randomUUID();
  }

  const digest = createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 32);
  return "notification-" + digest;
}
