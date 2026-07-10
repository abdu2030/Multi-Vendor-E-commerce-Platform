import { renderNotificationEmail, renderWelcomeEmail } from "./email-templates";

describe("email templates", () => {
  it("renders a multipart welcome email with a marketplace link", () => {
    const email = renderWelcomeEmail({
      recipientName: "Amina",
      marketplaceUrl: "https://marketo.example"
    });

    expect(email.subject).toBe("Welcome to Marketo");
    expect(email.text).toContain("Hi Amina,");
    expect(email.text).toContain("https://marketo.example");
    expect(email.html).toContain("Explore Marketo");
    expect(email.html).toContain("https://marketo.example");
  });

  it("escapes user-controlled notification content in HTML", () => {
    const email = renderNotificationEmail({
      recipientName: '<script>alert("name")</script>',
      title: "Review <approved>",
      message: "Great & ready",
      dashboardUrl: "https://marketo.example/dashboard"
    });

    expect(email.subject).toBe("Review <approved>");
    expect(email.text).toContain("Great & ready");
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).toContain("Review &lt;approved&gt;");
    expect(email.html).toContain("Great &amp; ready");
  });
});
