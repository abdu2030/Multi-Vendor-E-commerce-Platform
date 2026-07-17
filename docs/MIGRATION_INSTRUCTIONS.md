# Migration Instructions

Stage 19 review date: 2026-07-17

## Principles

- Only checked-in Prisma migrations may be applied to production.
- Never use `prisma migrate dev` against production.
- Run migration status before a manual production deploy.
- Apply migrations before starting a new API build or runtime version that depends on them.
- Keep `DATABASE_URL` in the deployment platform or ignored production env file only.

## Render Deployment

`render.yaml` runs migrations before the API build:

```bash
npm ci --include=dev && npm run prisma:deploy -w apps/api && npm run build -w apps/api
```

Required Render environment:

```text
NODE_ENV=production
DATABASE_URL=postgresql://...?...sslmode=require
```

Render deploy verification:

1. Confirm the deploy log shows `npm run prisma:deploy -w apps/api`.
2. Confirm Prisma reports all pending migrations applied or already up to date.
3. Confirm the API build succeeds.
4. Confirm `/api/health` returns `status: ok`.
5. Confirm no database credentials appear in logs.

## Manual Production Migration

Use the production helper only from a trusted machine with the production env file ignored by Git:

```bash
copy apps\api\.env.production.example apps\api\.env.production
npm run prisma:status:production -w apps/api
npm run prisma:deploy:production -w apps/api
npm run prisma:status:production -w apps/api
```

Seed the initial admin only when required:

```bash
npm run prisma:deploy:production -w apps/api -- --seed-admin
```

After seeding, rotate or retire the bootstrap admin password if it was shared with any deployment operator.

## Rollback Guidance

Prisma migrations are forward-only by default. If a production migration causes an incident:

1. Stop new deploys.
2. Preserve logs and migration output.
3. Determine whether the application can be rolled back safely without rolling back schema.
4. If data repair is required, create a new checked-in corrective migration.
5. Restore from a provider backup only when data corruption cannot be repaired safely.

## Backup Verification

Before high-risk migrations:

- Confirm point-in-time recovery or a fresh snapshot exists.
- Record the snapshot time and migration commit SHA in the release notes.
- Confirm the restore procedure has been tested in a non-production environment.