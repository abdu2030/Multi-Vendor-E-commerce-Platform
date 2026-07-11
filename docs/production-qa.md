# Production QA Runbook

Use this checklist after the backend and frontend are deployed.

## Required production URLs

```text
Backend API: https://YOUR_RENDER_SERVICE.onrender.com/api
Frontend: https://YOUR_VERCEL_APP.vercel.app
Stripe webhook: https://YOUR_RENDER_SERVICE.onrender.com/api/checkout/webhooks/stripe
```

## Automated API smoke flow

The API includes a production QA script that creates temporary QA buyer/seller accounts, approves a seller, creates and approves a product, adds it to cart, creates a Stripe Checkout session, and verifies reviews are blocked before purchase.

Set the live backend URL first:

```bash
set PRODUCTION_API_URL=https://YOUR_RENDER_SERVICE.onrender.com/api
npm run qa:production -w apps/api
```

In PowerShell, use:

```powershell
$env:PRODUCTION_API_URL="https://YOUR_RENDER_SERVICE.onrender.com/api"
npm run qa:production -w apps/api
```

The script reads admin credentials from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `apps/api/.env` or from `PRODUCTION_QA_ADMIN_EMAIL` and `PRODUCTION_QA_ADMIN_PASSWORD`.

The script intentionally stops before completing payment. It prints the Stripe Checkout URL for the manual payment step.

## Manual browser QA checklist

1. Register a buyer account from the frontend.
2. Register a seller account from the frontend.
3. Submit a seller application.
4. Log in as admin and approve the seller application.
5. Log in as the seller and create a product with an image.
6. Log in as admin and approve the product.
7. Log in as buyer, add the product to cart, and verify cart count/summary.
8. Start checkout and complete a Stripe test-mode payment.
9. Confirm Stripe sends `checkout.session.completed` to the production webhook.
10. Verify the buyer order appears in the dashboard.
11. Verify the seller sees the new order.
12. Submit a product review as the buyer.
13. Verify product `averageRating` and `reviewCount` update on the product page.

## Stripe test card

For test-mode checkout, use Stripe's standard successful test card:

```text
4242 4242 4242 4242
Any future expiry date
Any CVC
Any postal code
```

## Expected results

- Registration returns a logged-in session.
- Seller approval changes the seller role to `SELLER`.
- Seller product creation works only after seller approval.
- Product must be approved before it is purchasable.
- Cart accepts approved, in-stock products only.
- Checkout returns a Stripe session URL.
- Orders are created only after a valid Stripe webhook.
- Reviews are blocked before verified purchase and accepted after paid order exists.
