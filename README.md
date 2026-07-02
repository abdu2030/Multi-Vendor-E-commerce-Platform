# Multi-Vendor E-commerce Platform

Production-style multi-vendor marketplace built step by step from the provided SRS.

The project currently contains the Week 1 Day 1-7 foundation. Future work should continue one assigned day/module at a time.

## Current Scope: Week 1 Day 1-7

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
```

## Frontend Auth Routes

```text
GET /login
GET /register
GET /dashboard
GET /dashboard/profile
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
