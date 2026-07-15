export type MailTemplateKind = "notification" | "welcome";

type EmailRecipient = {
  to: string;
  recipientName: string;
};

export type QueuedEmailJob = EmailRecipient & (
  | {
      kind: "welcome";
    }
  | {
      kind: "notification";
      title: string;
      message: string;
    }
  | {
      kind: "password-reset";
      actionUrl: string;
      expiresInMinutes: number;
    }
  | {
      kind: "email-verification";
      actionUrl: string;
      expiresInHours: number;
    }
  | {
      kind: "seller-decision";
      applicationId: string;
      storeName: string;
      decision: "approved" | "rejected" | "suspended";
      reason?: string;
    }
  | {
      kind: "order-confirmation";
      orderId: string;
      orderNumber: string;
      itemCount: number;
      totalCents: number;
      currency: string;
    }
  | {
      kind: "seller-new-order";
      orderId: string;
      orderNumber: string;
      storeName: string;
      itemCount: number;
      totalCents: number;
      currency: string;
    }
  | {
      kind: "shipping-update";
      orderId: string;
      orderNumber: string;
      productTitle: string;
      status: "SHIPPED" | "DELIVERED";
      trackingNumber?: string;
    }
);

export type SendMailOptions = {
  throwOnError?: boolean;
};
