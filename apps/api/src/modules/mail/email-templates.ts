export type EmailTemplate = {
  subject: string;
  text: string;
  html: string;
};

type WelcomeEmailInput = {
  recipientName: string;
  marketplaceUrl: string;
};

type NotificationEmailInput = {
  recipientName: string;
  title: string;
  message: string;
  dashboardUrl: string;
};

type PasswordResetEmailInput = {
  recipientName: string;
  resetUrl: string;
  expiresInMinutes: number;
};

type EmailVerificationEmailInput = {
  recipientName: string;
  verificationUrl: string;
  expiresInHours: number;
};

type SellerDecisionEmailInput = {
  recipientName: string;
  storeName: string;
  decision: "approved" | "rejected" | "suspended";
  reason?: string;
  sellerDashboardUrl: string;
};

type OrderEmailInput = {
  recipientName: string;
  orderNumber: string;
  itemCount: number;
  totalCents: number;
  currency: string;
  orderUrl: string;
};

type SellerNewOrderEmailInput = OrderEmailInput & {
  storeName: string;
};

type ShippingUpdateEmailInput = {
  recipientName: string;
  orderNumber: string;
  productTitle: string;
  status: "SHIPPED" | "DELIVERED";
  trackingNumber?: string;
  orderUrl: string;
};

export function renderWelcomeEmail(input: WelcomeEmailInput): EmailTemplate {
  const name = input.recipientName.trim() || "there";
  const subject = "Welcome to Marketo";
  const text = [
    `Hi ${name},`,
    "",
    "Welcome to Marketo. Your marketplace account is ready.",
    "Discover products from independent sellers or start building your own storefront.",
    "",
    `Explore Marketo: ${input.marketplaceUrl}`,
    "",
    "The Marketo team"
  ].join("\n");

  return {
    subject,
    text,
    html: emailLayout({
      preheader: "Your Marketo marketplace account is ready.",
      eyebrow: "Welcome to Marketo",
      heading: `Hi ${name},`,
      body: [
        "Your marketplace account is ready.",
        "Discover products from independent sellers or start building your own storefront."
      ],
      actionLabel: "Explore Marketo",
      actionUrl: input.marketplaceUrl
    })
  };
}

export function renderNotificationEmail(input: NotificationEmailInput): EmailTemplate {
  const name = input.recipientName.trim() || "there";
  const title = input.title.trim() || "New notification";
  const message = input.message.trim();
  const text = [
    `Hi ${name},`,
    "",
    title,
    message,
    "",
    `Open your dashboard: ${input.dashboardUrl}`,
    "",
    "The Marketo team"
  ].join("\n");

  return {
    subject: title,
    text,
    html: emailLayout({
      preheader: message || title,
      eyebrow: "Marketo notification",
      heading: title,
      greeting: `Hi ${name},`,
      body: message ? [message] : [],
      actionLabel: "Open dashboard",
      actionUrl: input.dashboardUrl
    })
  };
}


export function renderPasswordResetEmail(input: PasswordResetEmailInput): EmailTemplate {
  const name = input.recipientName.trim() || "there";
  const subject = "Reset your Marketo password";
  const body = [
    `Use this link to reset your password. It expires in ${input.expiresInMinutes} minutes.`,
    "If you did not request a password reset, you can ignore this email."
  ];

  return {
    subject,
    text: buildText(name, subject, body, "Reset password", input.resetUrl),
    html: emailLayout({
      preheader: `Your password reset link expires in ${input.expiresInMinutes} minutes.`,
      eyebrow: "Password reset",
      heading: "Reset your password",
      greeting: `Hi ${name},`,
      body,
      actionLabel: "Reset password",
      actionUrl: input.resetUrl
    })
  };
}

export function renderEmailVerificationEmail(input: EmailVerificationEmailInput): EmailTemplate {
  const name = input.recipientName.trim() || "there";
  const subject = "Verify your Marketo email";
  const body = [
    `Use this link to verify your email address. It expires in ${input.expiresInHours} hours.`,
    "If you did not create a Marketo account, you can ignore this email."
  ];

  return {
    subject,
    text: buildText(name, subject, body, "Verify email", input.verificationUrl),
    html: emailLayout({
      preheader: `Your email verification link expires in ${input.expiresInHours} hours.`,
      eyebrow: "Email verification",
      heading: "Verify your email",
      greeting: `Hi ${name},`,
      body,
      actionLabel: "Verify email",
      actionUrl: input.verificationUrl
    })
  };
}

export function renderSellerDecisionEmail(input: SellerDecisionEmailInput): EmailTemplate {
  const name = input.recipientName.trim() || "there";
  const decisionCopy = {
    approved: {
      subject: `Your ${input.storeName} seller application was approved`,
      eyebrow: "Seller application approved",
      heading: "Your store is ready",
      message: `${input.storeName} is approved. You can now manage your storefront and publish products.`
    },
    rejected: {
      subject: `Update on your ${input.storeName} seller application`,
      eyebrow: "Seller application update",
      heading: "Your application needs attention",
      message: `${input.storeName} was not approved at this time.`
    },
    suspended: {
      subject: `${input.storeName} seller access was suspended`,
      eyebrow: "Seller access update",
      heading: "Your seller access is suspended",
      message: `${input.storeName} cannot currently sell on Marketo.`
    }
  }[input.decision];
  const body = [decisionCopy.message];

  if (input.reason?.trim()) {
    body.push(`Reason: ${input.reason.trim()}`);
  }

  return {
    subject: decisionCopy.subject,
    text: buildText(name, decisionCopy.heading, body, "Open seller dashboard", input.sellerDashboardUrl),
    html: emailLayout({
      preheader: decisionCopy.message,
      eyebrow: decisionCopy.eyebrow,
      heading: decisionCopy.heading,
      greeting: `Hi ${name},`,
      body,
      actionLabel: "Open seller dashboard",
      actionUrl: input.sellerDashboardUrl
    })
  };
}

export function renderOrderConfirmationEmail(input: OrderEmailInput): EmailTemplate {
  const name = input.recipientName.trim() || "there";
  const subject = `Order ${input.orderNumber} confirmed`;
  const body = [
    "Your payment was successful and your order is now being prepared.",
    `${formatItemCount(input.itemCount)} Ã‚Â· ${formatMoney(input.totalCents, input.currency)}`
  ];

  return {
    subject,
    text: buildText(name, subject, body, "View order", input.orderUrl),
    html: emailLayout({
      preheader: `We received order ${input.orderNumber}.`,
      eyebrow: "Order confirmed",
      heading: `Thanks for your order, ${name}`,
      body,
      actionLabel: "View order",
      actionUrl: input.orderUrl
    })
  };
}

export function renderSellerNewOrderEmail(input: SellerNewOrderEmailInput): EmailTemplate {
  const name = input.recipientName.trim() || "there";
  const subject = `New order ${input.orderNumber} for ${input.storeName}`;
  const body = [
    "A customer has paid for items from your store. Review the order and begin fulfillment.",
    `${formatItemCount(input.itemCount)} Ã‚Â· ${formatMoney(input.totalCents, input.currency)}`
  ];

  return {
    subject,
    text: buildText(name, subject, body, "Manage order", input.orderUrl),
    html: emailLayout({
      preheader: `${input.storeName} received a new paid order.`,
      eyebrow: "New paid order",
      heading: "You have a new order",
      greeting: `Hi ${name},`,
      body,
      actionLabel: "Manage order",
      actionUrl: input.orderUrl
    })
  };
}

export function renderShippingUpdateEmail(input: ShippingUpdateEmailInput): EmailTemplate {
  const name = input.recipientName.trim() || "there";
  const delivered = input.status === "DELIVERED";
  const subject = delivered
    ? `Order ${input.orderNumber} delivery update`
    : `Order ${input.orderNumber} is on the way`;
  const body = [
    delivered
      ? `${input.productTitle} was marked as delivered.`
      : `${input.productTitle} has shipped.`
  ];

  if (input.trackingNumber?.trim()) {
    body.push(`Tracking number: ${input.trackingNumber.trim()}`);
  }

  return {
    subject,
    text: buildText(name, subject, body, "View order", input.orderUrl),
    html: emailLayout({
      preheader: body[0],
      eyebrow: delivered ? "Delivery update" : "Shipping update",
      heading: delivered ? "Your delivery was updated" : "Your order is on the way",
      greeting: `Hi ${name},`,
      body,
      actionLabel: "View order",
      actionUrl: input.orderUrl
    })
  };
}

function buildText(
  recipientName: string,
  heading: string,
  body: string[],
  actionLabel: string,
  actionUrl: string
) {
  return [
    `Hi ${recipientName},`,
    "",
    heading,
    ...body,
    "",
    `${actionLabel}: ${actionUrl}`,
    "",
    "The Marketo team"
  ].join("\n");
}

function formatItemCount(itemCount: number) {
  return `${itemCount} ${itemCount === 1 ? "item" : "items"}`;
}

function formatMoney(totalCents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase()
    }).format(totalCents / 100);
  } catch {
    return `${currency.toUpperCase()} ${(totalCents / 100).toFixed(2)}`;
  }
}

function emailLayout(input: {
  preheader: string;
  eyebrow: string;
  heading: string;
  greeting?: string;
  body: string[];
  actionLabel: string;
  actionUrl: string;
}) {
  const paragraphs = input.body
    .map((paragraph) => `<p style="margin:0 0 16px;color:#475569;font-size:16px;line-height:1.65;">${escapeHtml(paragraph)}</p>`)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(input.heading)}</title>
  </head>
  <body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,.08);">
            <tr>
              <td style="background:#0f172a;padding:24px 32px;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-.4px;">Marketo<span style="color:#34d399;">.</span></td>
            </tr>
            <tr>
              <td style="padding:38px 32px 34px;">
                <p style="margin:0 0 10px;color:#059669;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">${escapeHtml(input.eyebrow)}</p>
                ${input.greeting ? `<p style="margin:0 0 14px;color:#475569;font-size:16px;line-height:1.6;">${escapeHtml(input.greeting)}</p>` : ""}
                <h1 style="margin:0 0 18px;color:#0f172a;font-size:28px;line-height:1.25;letter-spacing:-.6px;">${escapeHtml(input.heading)}</h1>
                ${paragraphs}
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:26px;">
                  <tr>
                    <td style="border-radius:10px;background:#059669;">
                      <a href="${escapeHtml(normalizeActionUrl(input.actionUrl))}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">${escapeHtml(input.actionLabel)}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e2e8f0;padding:22px 32px;color:#64748b;font-size:13px;line-height:1.5;">You received this email because you have a Marketo account.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function normalizeActionUrl(value: string) {
  try {
    const url = new URL(value);

    if (!["https:", "http:"].includes(url.protocol)) {
      return "#";
    }

    return url.toString();
  } catch {
    return "#";
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}
