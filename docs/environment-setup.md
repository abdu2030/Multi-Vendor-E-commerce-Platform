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

