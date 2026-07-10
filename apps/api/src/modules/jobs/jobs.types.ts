import { NotificationType } from "@prisma/client";
import { MailTemplateKind } from "../mail/mail.types";

export type CreateNotificationJob = {
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  emailTemplate?: MailTemplateKind;
};
