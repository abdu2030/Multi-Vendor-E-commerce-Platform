import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { Transporter } from "nodemailer";
import {
  renderEmailVerificationEmail,
  renderNotificationEmail,
  renderOrderConfirmationEmail,
  renderPasswordResetEmail,
  renderSellerDecisionEmail,
  renderSellerNewOrderEmail,
  renderShippingUpdateEmail,
  renderWelcomeEmail
} from "./email-templates";
import { QueuedEmailJob, SendMailOptions } from "./mail.types";

const emailAddressPattern = /^[^\s@<>"'(),;:\\[\]]+@[^\s@<>"'(),;:\\[\]]+\.[^\s@<>"'(),;:\\[\]]+$/;

@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;
  private readonly fromAddress?: string;
  private readonly fromName: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    const user = config.get<string>("GMAIL_USER")?.trim();
    const appPassword = config.get<string>("GMAIL_APP_PASSWORD")?.replace(/\s/g, "");

    this.fromAddress = user;
    this.fromName = config.get<string>("GMAIL_FROM_NAME")?.trim() || "Marketo";
    this.frontendUrl = (config.get<string>("FRONTEND_URL")?.trim() || "http://localhost:3000").replace(/\/$/, "");

    if (!user || !appPassword) {
      this.logger.warn("Gmail SMTP is not configured; email delivery is disabled.");
      return;
    }

    const port = Number(config.get("GMAIL_SMTP_PORT") ?? 465);
    const secure = config.get<boolean>("GMAIL_SMTP_SECURE") ?? port === 465;

    this.transporter = nodemailer.createTransport({
      host: config.get<string>("GMAIL_SMTP_HOST")?.trim() || "smtp.gmail.com",
      port,
      secure,
      auth: {
        user,
        pass: appPassword
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000
    });
  }

  isConfigured() {
    return Boolean(this.transporter && this.fromAddress);
  }

  async sendQueuedEmail(job: QueuedEmailJob, options: SendMailOptions = {}) {
    const template = this.renderQueuedEmail(job);

    return this.send(job.to, template, options);
  }

  async onModuleDestroy() {
    this.transporter?.close();
  }

  private renderQueuedEmail(job: QueuedEmailJob) {
    switch (job.kind) {
      case "welcome":
        return renderWelcomeEmail({
          recipientName: job.recipientName,
          marketplaceUrl: this.frontendUrl
        });
      case "notification":
        return renderNotificationEmail({
          recipientName: job.recipientName,
          title: job.title,
          message: job.message,
          dashboardUrl: `${this.frontendUrl}/dashboard`
        });
      case "password-reset":
        return renderPasswordResetEmail({
          recipientName: job.recipientName,
          resetUrl: job.actionUrl,
          expiresInMinutes: job.expiresInMinutes
        });
      case "email-verification":
        return renderEmailVerificationEmail({
          recipientName: job.recipientName,
          verificationUrl: job.actionUrl,
          expiresInHours: job.expiresInHours
        });
      case "seller-decision":
        return renderSellerDecisionEmail({
          recipientName: job.recipientName,
          storeName: job.storeName,
          decision: job.decision,
          reason: job.reason,
          sellerDashboardUrl: `${this.frontendUrl}/dashboard/seller/status`
        });
      case "order-confirmation":
        return renderOrderConfirmationEmail({
          recipientName: job.recipientName,
          orderNumber: job.orderNumber,
          itemCount: job.itemCount,
          totalCents: job.totalCents,
          currency: job.currency,
          orderUrl: `${this.frontendUrl}/dashboard/orders/${job.orderId}`
        });
      case "seller-new-order":
        return renderSellerNewOrderEmail({
          recipientName: job.recipientName,
          storeName: job.storeName,
          orderNumber: job.orderNumber,
          itemCount: job.itemCount,
          totalCents: job.totalCents,
          currency: job.currency,
          orderUrl: `${this.frontendUrl}/dashboard/seller/orders`
        });
      case "shipping-update":
        return renderShippingUpdateEmail({
          recipientName: job.recipientName,
          orderNumber: job.orderNumber,
          productTitle: job.productTitle,
          status: job.status,
          trackingNumber: job.trackingNumber,
          orderUrl: `${this.frontendUrl}/dashboard/orders/${job.orderId}`
        });
    }
  }

  private async send(
    to: string,
    email: { subject: string; text: string; html: string },
    options: SendMailOptions
  ) {
    if (!this.transporter || !this.fromAddress) {
      return false;
    }

    const recipient = normalizeEmailAddress(to);
    const fromAddress = normalizeEmailAddress(this.fromAddress);
    const fromName = validateHeaderValue(this.fromName, "from name");
    const subject = validateHeaderValue(email.subject, "subject");

    try {
      const info = await this.transporter.sendMail({
        from: {
          name: fromName,
          address: fromAddress
        },
        to: recipient,
        subject,
        text: email.text,
        html: email.html
      });
      this.logger.log(`Email ${info.messageId} sent to ${maskEmail(recipient)}.`);
      return true;
    } catch {
      this.logger.error(`Email delivery to ${maskEmail(recipient)} failed.`);

      if (options.throwOnError) {
        throw new Error("Email delivery failed.");
      }

      return false;
    }
  }
}

function normalizeEmailAddress(value: string) {
  const email = value.trim().toLowerCase();

  if (/[\r\n]/.test(value) || !emailAddressPattern.test(email)) {
    throw new Error("Invalid email recipient address.");
  }

  return email;
}

function validateHeaderValue(value: string, field: string) {
  const headerValue = value.trim();

  if (!headerValue || /[\r\n]/.test(headerValue)) {
    throw new Error(`Invalid email ${field}.`);
  }

  return headerValue;
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return "invalid-address";
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}
