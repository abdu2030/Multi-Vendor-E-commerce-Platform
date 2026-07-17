# Threat Model

Stage 19 review date: 2026-07-17

## System Overview

The platform is a multi-vendor marketplace with a Next.js frontend, NestJS API, PostgreSQL via Prisma, Redis/BullMQ for queues and cache, Stripe for payments, Cloudinary for media, and Gmail SMTP for transactional email.

Primary user groups:

- Buyers who browse products, manage carts, check out, review products, and manage orders.
- Sellers who manage stores, products, inventory, uploads, and fulfillment.
- Admins who moderate sellers/products/categories/orders and access platform-level dashboards.
- External providers: Stripe, Cloudinary, Gmail SMTP, managed PostgreSQL, Redis, Render, and the frontend host.

## Assets

- User identities, password hashes, refresh-session hashes, reset/verification token hashes.
- Buyer addresses, order history, payment status, Stripe transaction references.
- Seller store settings, product inventory, revenue metrics, uploads, and fulfillment data.
- Admin privileges and audit logs.
- PostgreSQL data, Redis queue/cache data, and deployment secrets.
- Stripe webhook signing secret, Stripe secret key, Cloudinary credentials, Gmail app password, JWT secrets.

## Trust Boundaries

| Boundary | Risk | Controls |
| --- | --- | --- |
| Browser to API | XSS, CSRF, token theft, origin spoofing | HTTPS, trusted CORS, CSRF origin middleware, secure HTTP-only refresh cookie, short-lived access token, CSP/security headers. |
| API to PostgreSQL | Data exposure, destructive migration, SQL injection | Prisma query API, migration runbook, TLS-required database URL, provider network restrictions, no unsafe query concatenation. |
| API to Redis/BullMQ | Queue poisoning, secret leakage, duplicate side effects | `rediss://`, Redis password, job payload safety checks, bounded retries, idempotent money/inventory jobs. |
| API to Stripe | Fake paid orders, duplicate payment events, refund abuse | Webhook signature verification, provider status checks, processed-event IDs, transaction references, admin-only refunds/payouts. |
| API to Cloudinary | Malicious upload, overwrite, public sensitive document | MIME/signature checks, size limits, server-side filenames, ownership checks, dangerous SVG/HTML blocking. |
| API to Gmail SMTP | Header injection, spam, credential leakage | Recipient validation, escaped templates, queued sending, rate limits, provider-error suppression. |
| CI/CD to production | Secret exposure, unreviewed dependency drift, failed migrations | Pinned actions, restricted CI permissions, `.dockerignore`, `render.yaml` secret prompts, Prisma deploy before API build. |

## Threats and Mitigations

| Threat | Impact | Current Mitigation | Remaining Work |
| --- | --- | --- | --- |
| Credential leakage from repository | Full service compromise | `.gitignore`, `.dockerignore`, placeholders, provider secret prompts, env validation | Continue secret scanning before every release. |
| Account takeover by password or token abuse | Unauthorized buyer/seller/admin access | Password hashing, login rate limiting, reset token expiration/single use, refresh token rotation and reuse detection | Add MFA for admin accounts. |
| Broken object-level authorization | Cross-account order/address/product/revenue access | Authorization matrix, `@CurrentUser`, role guards, ownership-scoped queries, tests | Keep matrix updated with every new endpoint. |
| Client-side price manipulation | Revenue loss/fraud | Backend calculates prices, totals, coupons, commissions, stock | Add provider-backed tax/shipping integrations if introduced. |
| Fake payment completion | Orders marked paid without real funds | Stripe signature verification and provider status verification | Live Stripe webhook smoke test after deployment. |
| Duplicate payment or inventory events | Double stock decrement/refund/payout | Webhook/event ID idempotency, transactions, stock concurrency tests | Keep all future money/inventory jobs idempotent. |
| XSS through user content | Session theft or fraudulent actions | Text rendering, URL protocol validation, email escaping, CSP | Add browser E2E tests with stored malicious content. |
| CSRF through cookie refresh/session endpoints | Session mutation by attacker site | SameSite refresh cookie and origin checks for state-changing requests | Confirm frontend always sends requests from configured HTTPS origin. |
| Queue/job replay | Duplicate emails, charges, stock mutation | Unique job IDs, bounded retries, payload safety, idempotent processors | Move any future financial queue work behind provider idempotency keys. |
| Production outage from pending migrations | API runtime failure | Render build runs `prisma:deploy`; migration docs exist | Confirm migrations in Render logs after deploy. |
| Distributed rate-limit bypass | Abuse across multiple instances | In-process rate limit and login/email limits | Replace global API rate limiter with Redis-backed storage before horizontal scaling. |
| Admin privilege misuse | Platform-wide data and financial impact | Admin-only routes, audit logs, role-change security logs | Add MFA, admin IP allowlisting, and periodic admin role review. |

## Abuse Cases To Test Manually

- Buyer tries to access another buyer's order and address from a real browser session.
- Seller tries to edit another seller's product and view another seller's revenue.
- Admin route is accessed with a normal user token.
- Checkout is submitted with tampered price, total, quantity, and coupon values.
- Stripe sends the same webhook event twice.
- Password reset and verification links are reused after successful consumption.
- Upload endpoint receives oversized files, SVG/HTML, and renamed executables.
- Production API receives requests from an untrusted `Origin`.

## Review Cadence

- Re-run the threat model after every new payment, payout, inventory, upload, admin, or authentication feature.
- Review secrets and provider console access monthly.
- Review admin users and audit logs before each major release.
- Run dependency audit and CI before every production deploy.