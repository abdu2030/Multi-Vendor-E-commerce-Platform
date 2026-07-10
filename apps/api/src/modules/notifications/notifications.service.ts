import { Injectable } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type CreateNotificationInput = {
  userId: string;
  type?: NotificationType;
  title: string;
  message: string;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type ?? NotificationType.INFO,
        title: input.title.trim(),
        message: input.message.trim()
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
