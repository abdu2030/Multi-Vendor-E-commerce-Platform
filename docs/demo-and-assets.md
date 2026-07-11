# Demo, Screenshots, and Release Assets

Use this file to finalize the visual release assets after the frontend deployment URL is available.

## Screenshot checklist

Capture screenshots at desktop width and save them under a release asset folder or attach them to the GitHub release.

Recommended screenshots:

```text
01-homepage.png
02-product-list.png
03-product-detail.png
04-register-login.png
05-buyer-dashboard.png
06-seller-application.png
07-admin-seller-approval.png
08-seller-products.png
09-admin-product-moderation.png
10-cart.png
11-checkout.png
12-order-history.png
13-notifications.png
14-admin-dashboard.png
```

## Demo video script

Target length: 3-5 minutes.

1. Open the homepage and product catalog.
2. Register a buyer account.
3. Register a seller account and submit seller application.
4. Log in as admin and approve the seller.
5. Log in as seller and create a product.
6. Approve the product as admin.
7. Add product to cart as buyer.
8. Complete Stripe test checkout.
9. Show buyer order history and seller order dashboard.
10. Submit a review and show updated product rating.
11. Show admin dashboard stats and audit-driven moderation pages.

## Recording guidance

- Use the deployed frontend URL, not localhost.
- Use test accounts only.
- Do not show real environment variables, API keys, Gmail app passwords, Stripe keys, Redis URLs, or database URLs.
- If Stripe is still in test mode, clearly say it is a test checkout.

## GitHub release assets

Attach to the GitHub release:

- Demo video file or public video link.
- Selected screenshots.
- Link to deployed frontend.
- Link to backend health endpoint.
- Release notes from `docs/release-notes-v1.0.0.md`.
