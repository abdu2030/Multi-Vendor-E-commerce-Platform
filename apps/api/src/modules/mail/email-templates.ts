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
                      <a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">${escapeHtml(input.actionLabel)}</a>
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
