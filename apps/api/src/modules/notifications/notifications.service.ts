import { Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";
import { EmailQueueService } from "../jobs/email-queue.service";
import { NotificationQueueService } from "../jobs/notification-queue.service";
import { MailTemplateKind } from "../mail/mail.types";
import { PrismaService } from "../prisma/prisma.service";
import { ListNotificationsQueryDto } from "./dto/list-notifications-query.dto";

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
    private readonly emailQueue: EmailQueueService
  ) {}

  async listForUser(userId: string, query: ListNotificationsQueryDto) {
    const where = {
      userId,
      ...(query.unreadOnly ? { readAt: null } : {})
    };
    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: notificationDashboardSelect
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } })
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit)
      }
    };
  }

  async getUnreadCount(userId: string) {
    const unreadCount = await this.prisma.notification.count({
      where: { userId, readAt: null }
    });

    return { unreadCount };
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
      select: notificationDashboardSelect
    });

    if (!notification) {
      throw new NotFoundException("Notification was not found.");
    }

    if (notification.readAt) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id: notification.id },
      data: { readAt: new Date() },
      select: notificationDashboardSelect
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() }
    });

    return { updated: result.count, unreadCount: 0 };
  }

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

    await this.emailQueue.enqueue(
      `notification-email-${persisted.id}`,
      input.emailTemplate === "welcome"
        ? {
            kind: "welcome",
            to: persisted.user.email,
            recipientName: persisted.user.fullName
          }
        : {
            kind: "notification",
            to: persisted.user.email,
            recipientName: persisted.user.fullName,
            title: persisted.title,
            message: persisted.message
          }
    );

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

const notificationDashboardSelect = {
  id: true,
  type: true,
  title: true,
  message: true,
  readAt: true,
  createdAt: true
} as const;

function createNotificationId(idempotencyKey?: string) {
  if (!idempotencyKey) {
    return "notification-" + randomUUID();
  }

  const digest = createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 32);
  return "notification-" + digest;
}
