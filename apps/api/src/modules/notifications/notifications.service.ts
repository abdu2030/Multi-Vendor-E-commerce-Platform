import { Injectable } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";
import { NotificationQueueService } from "../jobs/notification-queue.service";
import { MailService } from "../mail/mail.service";
import { MailTemplateKind } from "../mail/mail.types";
import { PrismaService } from "../prisma/prisma.service";

type CreateNotificationInput = {
  userId: string;
  type?: NotificationType;
  title: string;
  message: string;
  idempotencyKey?: string;
  emailTemplate?: MailTemplateKind;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueue: NotificationQueueService,
    private readonly mail: MailService
  ) {}

  async create(input: CreateNotificationInput) {
    const notification = {
      notificationId: createNotificationId(input.idempotencyKey),
      userId: input.userId,
      type: input.type ?? NotificationType.INFO,
      title: input.title.trim(),
      message: input.message.trim(),
      emailTemplate: input.emailTemplate
    };

    if (await this.notificationQueue.enqueue(notification)) {
      return { id: notification.notificationId, queued: true };
    }

    const persisted = await this.prisma.notification.upsert({
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
        createdAt: true,
        user: {
          select: {
            email: true,
            fullName: true
          }
        }
      }
    });

    await this.mail.sendNotificationEmail({
      to: persisted.user.email,
      recipientName: persisted.user.fullName,
      title: persisted.title,
      message: persisted.message,
      template: input.emailTemplate
    });

    return {
      id: persisted.id,
      userId: persisted.userId,
      type: persisted.type,
      title: persisted.title,
      message: persisted.message,
      readAt: persisted.readAt,
      createdAt: persisted.createdAt
    };
  }
}

function createNotificationId(idempotencyKey?: string) {
  if (!idempotencyKey) {
    return "notification-" + randomUUID();
  }

  const digest = createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 32);
  return "notification-" + digest;
}
