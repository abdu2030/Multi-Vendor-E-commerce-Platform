# Security Checklist

Stage 19 review date: 2026-07-17

This checklist is the production deployment gate for the multi-vendor marketplace. Mark an item complete only after it has been verified in the production provider console or with a production smoke test.

## Transport and Browser Security

| Control | Status | Verification |
| --- | --- | --- |
| HTTPS required for frontend and API | Source enforced, production verification required | `FRONTEND_URL` and `CORS_ORIGIN` must be `https://`; Render/Vercel must serve TLS certificates. |
| Secure refresh-token cookies | Verified by tests | Refresh cookie is `httpOnly`, `sameSite=lax`, and `secure` in production-like environments. |
| Trusted CORS origins only | Verified by validation/tests | `CORS_ORIGIN` cannot contain `*`; only production frontend origins should be configured. |
| CSRF origin checks for cookie-backed mutations | Verified by tests | Browser state-changing requests must carry a trusted `Origin` or `Referer`; Stripe webhook path is exempt. |
| Security headers enabled | Source verified | API uses Helmet, disables `x-powered-by`, sets restrictive CSP for API responses. |
| Swagger/OpenAPI exposure disabled | Verified by tests | No `@nestjs/swagger` dependency or Swagger setup exists in production code. |

## Secrets and Configuration

| Control | Status | Verification |
| --- | --- | --- |
| Secrets stored in provider secret manager | Production verification required | Render `sync: false` is used for database, Redis, Cloudinary, Stripe, Gmail, admin, and URL values. |
| No real secrets in tracked source | Verified by source audit and tests | `.env` files are ignored; examples contain placeholders only. |
| Stripe live keys required for real production | Verified by validation/tests | `ALLOW_TEST_STRIPE_KEYS=false` is the production default. |
| JWT secrets are strong and distinct | Verified by validation/tests | Staging/production require non-placeholder 32+ character access and refresh secrets. |
| Frontend exposes only public config | Source verified | Only `NEXT_PUBLIC_*` values are included in web examples. |

## Data Stores

| Control | Status | Verification |
| --- | --- | --- |
| PostgreSQL TLS | Verified by validation/tests | Production-like `DATABASE_URL` must include `sslmode=require`. |
| PostgreSQL network restrictions | Provider verification required | Restrict database access to trusted deployment/network paths where the provider supports it. |
| Database backups | Provider verification required | Enable point-in-time recovery or scheduled backups in the managed PostgreSQL provider. |
| Redis TLS and password | Verified by validation/tests | Production-like `REDIS_URL` must be `rediss://` and include a password. |
| Redis network restrictions | Provider verification required | Restrict Redis to trusted network paths where supported; rotate credentials after exposure. |
| Rate-limit storage | Remaining risk | Global API rate limiting is in-memory and per instance. Login/email limits are service-level in process. Use Redis-backed rate limiting before horizontal scaling. |

## Payments, Webhooks, and Checkout

| Control | Status | Verification |
| --- | --- | --- |
| Backend authoritative pricing | Verified by tests | Client-supplied prices/totals are ignored. |
| Stripe webhook signature verification | Verified by tests | Webhook requires raw body and valid `STRIPE_WEBHOOK_SECRET`. |
| Stripe endpoint configured | Production verification required | Stripe Dashboard must point to `https://YOUR_API_HOST/api/checkout/webhooks/stripe`. |
| Duplicate webhook protection | Verified by tests | Processed webhook event IDs are stored and duplicate stock/payment changes are ignored. |
| Refund and payout authorization | Source/test verified for available flows | Admin-only mutation paths are guarded; no public payout endpoint exists. |

## Identity and Authorization

| Control | Status | Verification |
| --- | --- | --- |
| Admin account protected | Partially verified | Admin bootstrap requires env credentials. After first login, rotate the bootstrap password and limit who has admin role. |
| Privileged role assignment blocked in registration | Verified by tests | Registration forces buyer role. |
| Resource ownership enforced | Verified by tests and authorization matrix | Resource-by-ID endpoints use verified token identity and backend ownership checks. |
| Session rotation and reuse detection | Verified by tests | Refresh tokens are opaque, hashed, single-use, and revoke token families on reuse. |

## Operations

| Control | Status | Verification |
| --- | --- | --- |
| Production logging uses request IDs and redaction | Verified by tests | Sensitive fields are redacted from structured logs. |
| Monitoring and alerts | Production setup required | Configure provider alerts for deploy failures, health-check failures, error spikes, payment verification failures, and database/Redis availability. |
| Migration process | Source verified | Render build runs `npm run prisma:deploy -w apps/api`; external deploys must run Prisma deploy before API startup. |
| Incident response runbook | Documented | See `docs/INCIDENT_RESPONSE.md`. |
| Remaining risks tracked | Documented | See `docs/REMAINING_RISK_REPORT.md`. |

## Release Gate

Do not promote a deployment that has any of the following:

- Failing high or critical security tests.
- Missing production secrets in the provider secret manager.
- `ALLOW_TEST_STRIPE_KEYS=true` for real payment traffic.
- Wildcard CORS, HTTP production origins, or database URLs without TLS.
- Pending Prisma migrations against the production database.
- Stripe webhook endpoint missing or using the wrong signing secret.