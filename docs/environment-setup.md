# Environment Setup

This guide prepares the local app for the current Week 1 foundation.

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

Create `apps/api/.env` from the example:

```bash
copy apps\api\.env.example apps\api\.env
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

## Web Environment

Create `apps/web/.env` from the example:

```bash
copy apps\web\.env.example apps\web\.env
```

Default local API URL:

```text
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

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
