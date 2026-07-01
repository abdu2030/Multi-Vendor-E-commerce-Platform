# Multi-Vendor E-commerce Platform

Setup checkpoint for the SRS-driven project.

The GitHub repository was empty, so this workspace now contains the Week 1 Day 1-6 foundation only. We will build the rest step by step from the SRS when assigned.

## Current Scope: Week 1 Day 1-6

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
```

## Dependencies and Database Foundation

Project dependencies are installed locally and `package-lock.json` is present. The temporary npm cache is ignored by Git.

Week 1 Day 2 through Day 5 foundation items are now configured:

- Prisma and PostgreSQL datasource setup
- Initial SRS-aligned Prisma schema
- ConfigModule environment validation
- PrismaModule and PrismaService
- Health check endpoint at `GET /api/health`
- Global validation pipe
- Global exception filter
- Consistent API response wrapper
- Password hashing with Node scrypt
- JWT access token signing and verification
- Refresh token persistence in PostgreSQL
- Admin user seeding from environment variables
- Frontend auth session persistence in local storage
- Protected dashboard redirect flow

## API Auth Endpoints

```text
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

## Next Step

Add a Neon or Supabase PostgreSQL URL to `apps/api/.env`, then run:

```bash
npm run prisma:generate -w apps/api
npm run prisma:migrate -w apps/api
npm run seed:admin -w apps/api
npm run build -w apps/api
```

When those pass, continue with the next correct Week 1 roadmap task.
