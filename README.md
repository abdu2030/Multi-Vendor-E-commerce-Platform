# Multi-Vendor E-commerce Platform

Production-style multi-vendor marketplace built step by step from the provided SRS.

The project currently contains the Week 1 foundation and Week 2 Day 1-6 seller/admin approval workflow. Future work should continue one assigned day/module at a time.

## Current Scope: Week 1 + Week 2 Day 1-6

- Monorepo structure with `apps/api` and `apps/web`
- Backend scaffold for NestJS + TypeScript
- Frontend scaffold for Next.js + TypeScript + Tailwind
- Shared root workspace scripts
- Environment example files
- Basic folder structure for future modules
- Prisma PostgreSQL datasource and initial schema
- API configuration, health, validation, error, and response foundations
- AuthModule with register, login, access token, refresh token storage, and logout
- Role metadata and guards
- Admin seed script
- Protected profile and `/me` endpoints
- Frontend login/register pages
- Frontend auth state management
- Protected dashboard layout
- Auth flow tested end-to-end against PostgreSQL
- Initial environment setup guide
- Week 2 Day 1 seller application API
- Week 2 Day 2 seller application frontend form and pending status page
- Week 2 Day 3 admin seller approval API
- Week 2 Day 4 admin seller approval UI
- Week 2 Day 5 seller dashboard shell, overview, store status, and settings form
- Week 2 Day 6 audit logs for admin seller actions and seller profile/store changes

## Ground Rules

- The SRS is the source of truth.
- We will build only the assigned day/module, not the whole project at once.
- No large installs or builds unless you ask for them.
- No secrets in the repository.
- PostgreSQL, Prisma, Redis/BullMQ, Cloudinary, Stripe, and Nodemailer stay in the planned architecture.

## Project Structure

```text
apps/
  api/
    src/
      main.ts
      app.module.ts
      modules/
      common/
  web/
    src/
      app/
      components/
      lib/
docs/
  environment-setup.md
```

## Setup

See [Environment Setup](docs/environment-setup.md) for full local setup, database, migration, seed, and test instructions.

Quick start:

```bash
npm install
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env
npm run prisma:generate -w apps/api
npm run prisma:deploy -w apps/api
npm run seed:admin -w apps/api
npm run build -w apps/api
npm run build -w apps/web
```

For Neon on Windows, the API uses Prisma's PostgreSQL driver adapter so runtime queries use Node's TLS stack.

## API Auth Endpoints

```text
GET  /api/health
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
GET  /api/users/profile
POST /api/seller-applications
GET  /api/seller-applications/me
GET  /api/admin/seller-applications/pending
PATCH /api/admin/seller-applications/:id/approve
PATCH /api/admin/seller-applications/:id/reject
PATCH /api/admin/seller-applications/:id/suspend
GET  /api/seller/dashboard
GET  /api/seller/store/settings
PATCH /api/seller/store/settings
```

Admin seller decisions and seller profile/store updates write structured records to `audit_logs`.

## Frontend Auth Routes

```text
GET /login
GET /register
GET /dashboard
GET /dashboard/profile
GET /dashboard/seller
GET /dashboard/seller/apply
GET /dashboard/seller/status
GET /dashboard/seller/settings
GET /dashboard/admin/seller-applications
```

## Day 7 Verification

The auth flow was tested end-to-end against the configured PostgreSQL database:

```text
health -> register -> /auth/me -> /users/profile -> login -> refresh -> logout -> invalid login validation
```

Both builds now pass:

```bash
npm run build -w apps/api
npm run build -w apps/web
```

## Next Step

Continue with the next correct Week 1 roadmap task from the SRS.
