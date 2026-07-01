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

## Dependencies

Project dependencies are installed locally and `package-lock.json` is present. The temporary npm cache was removed after installation.

## Next Step

When you are ready, we can test this setup locally, then continue with the correct Week 1 roadmap task.
