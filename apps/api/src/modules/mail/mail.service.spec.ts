import { ConfigService } from "@nestjs/config";
import { MailService } from "./mail.service";

describe("MailService SMTP security", () => {
  it("rejects recipient header injection before Nodemailer receives the message", async () => {
    const { service, sendMail } = createMailService();

    await expect(service.sendQueuedEmail({
      kind: "welcome",
      to: "victim@example.com\r\nBcc: attacker@example.com",
      recipientName: "Buyer"
    }, { throwOnError: true })).rejects.toThrow("Invalid email recipient address");
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("rejects subject header injection from user-controlled template content", async () => {
    const { service, sendMail } = createMailService();

    await expect(service.sendQueuedEmail({
      kind: "notification",
      to: "buyer@example.com",
      recipientName: "Buyer",
      title: "Order update\r\nBcc: attacker@example.com",
      message: "Your order changed."
    }, { throwOnError: true })).rejects.toThrow("Invalid email subject");
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("does not include SMTP provider errors or credentials in logs", async () => {
    const { service, sendMail, logger } = createMailService();

    sendMail.mockRejectedValue(new Error("535 auth failed for super-secret-app-password"));

    await expect(service.sendQueuedEmail({
      kind: "welcome",
      to: "buyer@example.com",
      recipientName: "Buyer"
    })).resolves.toBe(false);

    const logged = JSON.stringify(logger.error.mock.calls);

    expect(logged).toContain("Email delivery to bu***@example.com failed.");
    expect(logged).not.toContain("super-secret-app-password");
    expect(logged).not.toContain("535 auth failed");
  });
});

function createMailService() {
  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string | number | boolean> = {
        GMAIL_USER: "sender@example.com",
        GMAIL_APP_PASSWORD: "super-secret-app-password",
        GMAIL_FROM_NAME: "Marketo",
        FRONTEND_URL: "https://marketo.example",
        GMAIL_SMTP_PORT: 465,
        GMAIL_SMTP_SECURE: true
      };

      return values[key];
    })
  } as unknown as ConfigService;
  const service = new MailService(config);
  const sendMail = jest.fn().mockResolvedValue({ messageId: "message_1" });
  const logger = {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn()
  };

  (service as unknown as { transporter: { sendMail: typeof sendMail } }).transporter = { sendMail };
  (service as unknown as { logger: typeof logger }).logger = logger;

  return { service, sendMail, logger };
}
