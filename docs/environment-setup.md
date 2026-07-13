# Environment Setup

This guide prepares local, staging, and production environments.

## Requirements

- Node.js 20 or newer
- npm
- Neon or Supabase PostgreSQL database

## Install Dependencies

```bash
npm install
```

Dependencies are installed in the workspace. The local `.npm-cache` folder is ignored by Git.

## API Environment

Create `apps/api/.env` from the development example for local work:

```bash
copy apps\api\.env.development.example apps\api\.env
```

Required values:

```text
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

Recommended local values:

```text
PORT=5000
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
JWT_ACCESS_TOKEN_TTL_SECONDS=900
JWT_REFRESH_TOKEN_TTL_DAYS=30
```

Do not commit `.env` files.

The API loads environment files in this order:

1. `apps/api/.env.<NODE_ENV>`
2. `apps/api/.env`

For staging or production, set `NODE_ENV` before starting the API and inject real secrets through the hosting platform whenever possible. If you need file-based configuration, copy the matching template to the ignored runtime file:

```bash
copy apps\api\.env.staging.example apps\api\.env.staging
copy apps\api\.env.production.example apps\api\.env.production
```

Production-like environments (`staging` and `production`) are validated more strictly:

- `FRONTEND_URL` and every `CORS_ORIGIN` must use HTTPS.
- `CORS_ORIGIN` cannot contain `*`.
- `DATABASE_URL` must include `sslmode=require`.
- `REDIS_URL` must use `rediss://`.
- JWT secrets must be different, non-placeholder values with at least 32 characters.
- `ADMIN_PASSWORD` must be non-placeholder and at least 12 characters.
- Production requires live Stripe keys, Stripe webhook secret, and Gmail SMTP credentials.
- During deployment testing only, `ALLOW_TEST_STRIPE_KEYS=true` permits Stripe test secret keys while `NODE_ENV=production`. Remove it or set it to `false` before accepting real payments.

## Web Environment

Create `apps/web/.env` from the development example for local work:

```bash
copy apps\web\.env.development.example apps\web\.env
```

Default local API URL:

```text
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

For staging and production builds, set the public web variables in the deployment platform or copy the matching template into the environment file used by the build:

```bash
copy apps\web\.env.staging.example apps\web\.env.production
copy apps\web\.env.production.example apps\web\.env.production
```

Next.js embeds `NEXT_PUBLIC_*` values at build time, so rebuild the web app after changing staging or production API URLs.

## Cloudinary Uploads

Product images, store logos, and store banners use signed Cloudinary uploads from the API. Add these values to `apps/api/.env`:

```text
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=multi-vendor-ecommerce
```

The upload endpoints accept a `file` string containing a data URI, base64 payload, or remote image URL.

## Gmail SMTP

Transactional email uses Nodemailer with Gmail SMTP. Enable 2-Step Verification on the sender account, create a Gmail app password, and add these values to `apps/api/.env`:

```text
GMAIL_USER=sender@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
GMAIL_SMTP_HOST=smtp.gmail.com
GMAIL_SMTP_PORT=465
GMAIL_SMTP_SECURE=true
GMAIL_FROM_NAME=Marketo
```

Do not use the Gmail account password and do not commit the app password. When the Gmail variables are omitted, the API keeps notifications working and skips email delivery.

## Database

Generate Prisma Client:

```bash
npm run prisma:generate -w apps/api
```

Apply checked-in migrations:

```bash
npm run prisma:deploy -w apps/api
```

Seed the admin user:

```bash
npm run seed:admin -w apps/api
```

## Production PostgreSQL Deployment

Use a managed PostgreSQL provider such as Neon, Supabase, Railway, Render, or another production PostgreSQL host. Create a dedicated production database and user, then put the production connection string in the deployment platform as `DATABASE_URL`. If you use a file locally for a one-time deployment, copy the production template and keep the real file ignored by Git:

```bash
copy apps\api\.env.production.example apps\api\.env.production
```

Production requirements:

- `NODE_ENV=production`
- `DATABASE_URL` points at the production PostgreSQL database, not local or staging.
- `DATABASE_URL` includes `sslmode=require`.
- The database user has permission to create tables, indexes, constraints, and Prisma migration records.
- Do not commit `apps/api/.env.production`.

Check production migration status without applying changes:

```bash
npm run prisma:status:production -w apps/api
```

Deploy checked-in migrations to production:

```bash
npm run prisma:deploy:production -w apps/api
```

To seed the production admin user and starter categories immediately after migration, include `-- --seed-admin` and make sure `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` are set with production values:

```bash
npm run prisma:deploy:production -w apps/api -- --seed-admin
```

The production migration runner masks database credentials in logs and refuses placeholder database URLs.

## Production Service Configuration

Configure these values in the Render API service environment. Do not commit real service credentials.

### Cloudinary

Render environment variables:

```text
CLOUDINARY_CLOUD_NAME=your Cloudinary cloud name
CLOUDINARY_API_KEY=your Cloudinary API key
CLOUDINARY_API_SECRET=your Cloudinary API secret
CLOUDINARY_UPLOAD_FOLDER=multi-vendor-ecommerce/production
```

Use Cloudinary's dashboard API credentials for the production cloud. Product images, store logos, and store banners depend on these values.

### Upstash Redis

Render environment variables:

```text
REDIS_URL=replace_with_upstash_rediss_connection_string
REDIS_TLS=true
QUEUE_PREFIX=marketo-production
QUEUE_WORKER_CONCURRENCY=5
```

Production must use `rediss://`, not `redis://`. If a Redis URL was pasted into chat, rotate the Upstash credential and update Render with the new `rediss://` URL.

### Gmail SMTP

Render environment variables:

```text
GMAIL_USER=sender@gmail.com
GMAIL_APP_PASSWORD=your Gmail app password
GMAIL_SMTP_HOST=smtp.gmail.com
GMAIL_SMTP_PORT=465
GMAIL_SMTP_SECURE=true
GMAIL_FROM_NAME=Marketo
```

Use a Gmail app password from an account with 2-Step Verification enabled. Do not use the normal Gmail account password.

### Stripe Webhook

Backend webhook URL:

```text
https://multi-vendor-ecommerce-api.onrender.com/api/checkout/webhooks/stripe
```

If the Render service URL changes, replace the hostname and keep the path `/api/checkout/webhooks/stripe`.

In Stripe Dashboard, create a webhook endpoint for that URL and subscribe to the checkout/payment events used by the marketplace. At minimum, enable:

```text
checkout.session.completed
payment_intent.payment_failed
payment_intent.succeeded
charge.refunded
```

After creating the webhook endpoint, copy its signing secret into Render:

```text
STRIPE_WEBHOOK_SECRET=replace_with_stripe_webhook_signing_secret
```

During deployment testing, `ALLOW_TEST_STRIPE_KEYS=true` can be used with Stripe test secret keys. Before real production payments, set `ALLOW_TEST_STRIPE_KEYS=false`, use a Stripe live secret key, and create the webhook endpoint in Stripe live mode.

## Render API Deployment

The repository includes a Render Blueprint at `render.yaml` for the backend API. Render supports Node web services with `buildCommand`, `preDeployCommand`, `startCommand`, and `healthCheckPath`; this project uses `/api/health` for the platform health check.

Blueprint behavior:

- Build command: `npm ci --include=dev && npm run build -w apps/api`
- API builds run `prisma generate` automatically before TypeScript compilation.
- Start command: `npm run start -w apps/api`
- Health check path: `/api/health`
- Auto deploy trigger: commits to `main`
- Instance plan: Render free plan for initial verification. Free services can sleep when inactive, and Render does not support pre-deploy commands on the free tier.

Deploy steps:

1. In Render, create a new Blueprint from the GitHub repository.
2. Select `render.yaml` from the repository root.
3. Fill every `sync: false` environment variable from the production values in `apps/api/.env` or your password manager.
4. Set `FRONTEND_URL` and `CORS_ORIGIN` to HTTPS production URLs. Include the Render API URL in any frontend API config after deploy.
5. If Stripe has not verified your business yet, set `ALLOW_TEST_STRIPE_KEYS=true` in Render and use your Stripe test secret key. Switch back to `false` and use a Stripe live secret key before real production payments.
6. Before the first deploy, run production migrations from your machine or CI:

```bash
npm run prisma:deploy:production -w apps/api
```

7. Confirm the first deploy finishes the build and starts the API.
8. Verify health:

```bash
curl https://YOUR_RENDER_SERVICE.onrender.com/api/health
```

Expected response shape:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "multi-vendor-ecommerce-api"
  }
}
```

Do not paste real secret values into `render.yaml`. The Blueprint uses `sync: false` for secrets so Render prompts for them during setup.

## Vercel Frontend Deployment

The frontend is a Next.js app in `apps/web`. Deploy it to Vercel with the project root set to `apps/web`.

Vercel settings:

- Framework preset: Next.js
- Root directory: `apps/web`
- Install command: `npm install --include=dev`
- Build command: `npm run build`
- Output directory: leave default

Environment variables:

```text
NEXT_PUBLIC_API_URL=https://multi-vendor-ecommerce-api.onrender.com/api
NEXT_PUBLIC_APP_NAME=MultiVendor Marketplace
```

After Vercel deploys, update the Render API environment variables so browser requests from the frontend are allowed:

```text
FRONTEND_URL=https://YOUR_VERCEL_APP.vercel.app
CORS_ORIGIN=https://YOUR_VERCEL_APP.vercel.app
```

Then redeploy the Render API and verify the frontend can log in, load products, and call dashboard APIs.

## Production QA

Use the production QA runbook after backend and frontend deployment:

```text
docs/production-qa.md
```

The automated API smoke flow can be run with:

```bash
set PRODUCTION_API_URL=https://YOUR_RENDER_SERVICE.onrender.com/api
npm run qa:production -w apps/api
```

In PowerShell, set the URL with `$env:PRODUCTION_API_URL="https://YOUR_RENDER_SERVICE.onrender.com/api"` before running the command.

## Local Development

Run the API:

```bash
npm run dev -w apps/api
```

Run the web app:

```bash
npm run dev -w apps/web
```

Open:

```text
http://localhost:3000
```

## Verification

Build API:

```bash
npm run build -w apps/api
```

Build web:

```bash
npm run build -w apps/web
```

Auth endpoints to verify:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
GET  /api/users/profile
POST /api/auth/refresh
POST /api/auth/logout
```

