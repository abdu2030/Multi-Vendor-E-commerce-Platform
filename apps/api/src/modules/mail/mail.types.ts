export type MailTemplateKind = "notification" | "welcome";

export type SendNotificationEmailInput = {
  to: string;
  recipientName: string;
  title: string;
  message: string;
  template?: MailTemplateKind;
};

export type SendMailOptions = {
  throwOnError?: boolean;
};
