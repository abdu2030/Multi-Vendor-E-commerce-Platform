# Multi-Vendor E-commerce Platform

Setup-only checkpoint for the SRS-driven project.

The GitHub repository was empty, so this workspace now contains the Week 1 Day 1 monorepo scaffold only. We will build the rest step by step from the SRS when assigned.

## Current Scope: Week 1 Day 1

- Monorepo structure with `apps/api` and `apps/web`
- Backend scaffold for NestJS + TypeScript
- Frontend scaffold for Next.js + TypeScript + Tailwind
- Shared root workspace scripts
- Environment example files
- Basic folder structure for future modules

## Current Assignment Additions

- Day 2: Seller application frontend form with validation
- Day 2: Seller application pending status page
- Day 3: Admin seller approval APIs for pending list, approve, reject, and suspend
- Day 4: Admin seller approval UI table with approve, reject, and suspend decision modal
- Day 5: Seller dashboard shell with sidebar, overview cards, store status, and store settings form

## Local API Notes

Until JWT authentication is assigned, admin seller approval endpoints use a temporary development guard:

```text
x-user-role: admin
```

Example endpoints:

```text
POST  /api/sellers/apply
GET   /api/admin/sellers/pending
PATCH /api/admin/sellers/:id/approve
PATCH /api/admin/sellers/:id/reject
PATCH /api/admin/sellers/:id/suspend
```

Reject and suspend requests require a JSON body:

```json
{
  "reason": "Application needs clearer business details."
}
```

Frontend routes:

```text
/seller/apply
/seller/application/pending
/admin/sellers
/seller/dashboard
```

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

## Next Step

When you are ready, we can test this setup locally by installing dependencies once, then running the API and web dev servers. After that, we continue with Week 1 Day 2 only.
