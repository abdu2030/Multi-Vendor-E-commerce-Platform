# Multi-Vendor E-commerce Platform

Production-style multi-vendor marketplace built with a NestJS API, Next.js storefront/dashboard, PostgreSQL, Redis queues, Stripe checkout, Cloudinary uploads, Gmail SMTP email delivery, notifications, admin analytics, and production deployment configuration.

## Status

The Week 8 deployment and final polish track is complete through production backend deployment and QA tooling.

Current production backend health endpoint:

```text
https://multi-vendor-ecommerce-api.onrender.com/api/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "multi-vendor-ecommerce-api"
  }
}
```

## Core Features

- Buyer registration, login, refresh tokens, profile, addresses, cart, checkout, orders, notifications, and reviews.
- Seller application workflow with admin approval/rejection/suspension.
- Seller dashboard, store settings, product creation, uploads, inventory, order fulfillment, and product status workflow.
- Admin dashboard stats, seller approvals, product moderation, category management, order management, and audit logs.
- Stripe Checkout with webhook-driven order creation.
- BullMQ/Redis email queue for welcome, seller decision, order confirmation, seller new order, and shipping update emails.
- Gmail SMTP transactional email templates.
- Cloudinary signed upload support for store and product images.
- Production hardening: Helmet, strict CORS, rate limiting, request logging, validation messages, role/ownership checks, webhook validation, and test coverage.

## Tech Stack

```text
Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS
Backend: NestJS 11, TypeScript, Prisma, PostgreSQL
Queue/cache: BullMQ, Upstash Redis
Payments: Stripe Checkout + webhooks
Media: Cloudinary
Email: Nodemailer + Gmail SMTP
Deployment: Render API, Vercel frontend
```

## Repository Structure

```text
apps/
  api/        NestJS API, Prisma schema, production scripts
  web/        Next.js marketplace frontend and dashboards
docs/
  api.md                  API endpoint reference
  environment-setup.md    Local, staging, production setup
  production-qa.md        Production QA runbook
  release-notes-v1.0.0.md Final release notes
  demo-and-assets.md      Screenshot and demo video checklist
```

## Local Setup

```bash
npm install
copy apps\api\.env.development.example apps\api\.env
copy apps\web\.env.development.example apps\web\.env
npm run prisma:generate -w apps/api
npm run prisma:deploy -w apps/api
npm run seed:admin -w apps/api
```

Run locally:

```bash
npm run dev -w apps/api
npm run dev -w apps/web
```

Build:

```bash
npm run build -w apps/api
npm run build -w apps/web
```

## Production Deployment

Backend API is configured for Render with `render.yaml`.

Frontend is configured for Vercel from `apps/web` with `apps/web/vercel.json`.

Production setup details:

- [Environment setup](docs/environment-setup.md)
- [Production QA runbook](docs/production-qa.md)
- [Demo and release assets](docs/demo-and-assets.md)

## API Documentation

See [API documentation](docs/api.md).

## Production QA

Automated API smoke flow:

```powershell
$env:PRODUCTION_API_URL="https://YOUR_RENDER_SERVICE.onrender.com/api"
npm run qa:production -w apps/api
```

Manual full-flow QA is documented in [docs/production-qa.md](docs/production-qa.md).

## Release

Release notes are in [docs/release-notes-v1.0.0.md](docs/release-notes-v1.0.0.md).

Before accepting real payments:

- Set `ALLOW_TEST_STRIPE_KEYS=false`.
- Replace `STRIPE_SECRET_KEY` with an `sk_live_` key.
- Configure the Stripe webhook in live mode.
- Rotate any credentials that were pasted into chats or logs.
