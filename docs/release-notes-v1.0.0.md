# Release Notes: v1.0.0

## Summary

Initial production-ready release of the multi-vendor e-commerce platform.

## Highlights

- Buyer storefront, cart, checkout, order history, notifications, and reviews.
- Seller onboarding, store dashboard, product management, uploads, and order fulfillment.
- Admin dashboard with analytics, seller approvals, product moderation, categories, orders, and audit logs.
- Stripe Checkout integration with signed webhook validation.
- Cloudinary image uploads.
- Gmail SMTP transactional emails through queued BullMQ jobs.
- Upstash Redis connection for queues/cache.
- Production env separation and validation for development, staging, and production.
- Render backend deployment and Vercel frontend deployment configuration.
- Production QA runbook and smoke script.

## Verification

Validated during release preparation:

```bash
npm run build -w apps/api
npm run build -w apps/web
node --check apps/api/scripts/production-qa.js
```

Backend health endpoint verified after Render deployment:

```text
/api/health
```

## Required production configuration

- `DATABASE_URL` with PostgreSQL SSL.
- `REDIS_URL` using `rediss://`.
- Cloudinary production cloud credentials.
- Gmail SMTP app password.
- Stripe secret key and webhook secret.
- `FRONTEND_URL` and `CORS_ORIGIN` set to the deployed frontend URL.

## Temporary deployment exception

Stripe test keys are allowed only when:

```text
ALLOW_TEST_STRIPE_KEYS=true
```

Before real payments, switch to live Stripe keys and set:

```text
ALLOW_TEST_STRIPE_KEYS=false
```

## GitHub release checklist

1. Confirm backend health endpoint returns `status: ok`.
2. Confirm frontend deployment is live.
3. Run production QA from `docs/production-qa.md`.
4. Capture screenshots listed in `docs/demo-and-assets.md`.
5. Record and upload the demo video.
6. Create GitHub release `v1.0.0` using these notes.
