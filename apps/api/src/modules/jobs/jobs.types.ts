import { NotificationType } from "@prisma/client";

export type CreateNotificationJob = {
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
};
