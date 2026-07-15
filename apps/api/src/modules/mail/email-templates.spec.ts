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

  it("renders short-lived reset and verification links", () => {
    const reset = renderPasswordResetEmail({
      recipientName: "Buyer One",
      resetUrl: "https://marketo.example/password-reset?token=abc",
      expiresInMinutes: 30
    });
    const verification = renderEmailVerificationEmail({
      recipientName: "Buyer One",
      verificationUrl: "https://marketo.example/verify-email?token=abc",
      expiresInHours: 24
    });

    expect(reset.subject).toBe("Reset your Marketo password");
    expect(reset.text).toContain("expires in 30 minutes");
    expect(reset.html).toContain("https://marketo.example/password-reset?token=abc");
    expect(verification.subject).toBe("Verify your Marketo email");
    expect(verification.text).toContain("expires in 24 hours");
    expect(verification.html).toContain("https://marketo.example/verify-email?token=abc");
  });

  it("renders each queued marketplace lifecycle template", () => {
    const sellerDecision = renderSellerDecisionEmail({
      recipientName: "Seller One",
      storeName: "Seller Store",
      decision: "rejected",
      reason: "Document needs renewal",
      sellerDashboardUrl: "https://marketo.example/dashboard/seller/status"
    });
    const orderConfirmation = renderOrderConfirmationEmail({
      recipientName: "Buyer One",
      orderNumber: "ORD-TEST",
      itemCount: 2,
      totalCents: 4000,
      currency: "USD",
      orderUrl: "https://marketo.example/dashboard/orders/order_1"
    });
    const sellerNewOrder = renderSellerNewOrderEmail({
      recipientName: "Seller One",
      storeName: "Seller Store",
      orderNumber: "ORD-TEST",
      itemCount: 2,
      totalCents: 4000,
      currency: "USD",
      orderUrl: "https://marketo.example/dashboard/seller/orders"
    });
    const shippingUpdate = renderShippingUpdateEmail({
      recipientName: "Buyer One",
      orderNumber: "ORD-TEST",
      productTitle: "Seller Product",
      status: "SHIPPED",
      trackingNumber: "TRACK123",
      orderUrl: "https://marketo.example/dashboard/orders/order_1"
    });

    expect(sellerDecision.text).toContain("Document needs renewal");
    expect(orderConfirmation.text).toContain("$40.00");
    expect(sellerNewOrder.subject).toContain("Seller Store");
    expect(shippingUpdate.text).toContain("TRACK123");
  });
});
