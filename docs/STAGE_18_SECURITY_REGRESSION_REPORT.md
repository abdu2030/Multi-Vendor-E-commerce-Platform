# Stage 18 Security Regression Report

Date: 2026-07-17

## Scope

This stage verified the security fixes from Stages 2 through 17 together using the repository's available automated checks, dependency checks, production build, Prisma migration status, and deployment configuration.

## Tests passed

| Check | Command | Result |
| --- | --- | --- |
| Full API unit/integration/security regression suite | `npm.cmd test -- --runInBand` | Passed: 32 suites, 158 tests |
| Authentication tests | Included in Jest suite: auth controller/service, JWT, password, login rate limiting | Passed |
| Authorization and ownership tests | Included in Jest suite: security QA authorization ownership | Passed |
| Checkout pricing tests | Included in Jest suite: checkout pricing security | Passed |
| Checkout concurrency and inventory tests | Included in Jest suite: inventory concurrency security | Passed |
| Webhook idempotency tests | Included in Jest suite: payment webhook security | Passed |
| Upload security tests | Included in Jest suite: file upload security | Passed |
| Rate-limit tests | Included in Jest suite: login rate limit and security QA coverage | Passed |
| Lint | `npm.cmd run lint` | Passed |
| Production build | `npm.cmd run build` | Passed for API and web |
| High/critical dependency gate | `npm.cmd audit --audit-level=high` | Passed: no high or critical vulnerabilities reported |
| Prisma migration status | `npm.cmd run prisma:status -w apps/api` | Passed after applying pending migrations |

## Tests failed or not fully automated

| Check | Status | Notes |
| --- | --- | --- |
| Moderate dependency audit | Fails by design at `npm.cmd audit --audit-level=moderate` | `next` currently brings a nested vulnerable `postcss <8.5.10`. `npm audit fix --force` suggests a breaking downgrade to `next@9.3.3`, so this was not applied. No high or critical dependency vulnerabilities are currently reported. |
| Dedicated browser E2E runner | Not configured | The repository has API Jest security regression tests and a Next production build, but no Playwright/Cypress E2E test script. |
| Local Docker image build/scan | Not run locally | Docker CLI is installed, but Docker Desktop daemon is not running on this machine. CI remains configured to build Docker images. |
| External provider smoke tests | Manual required | Real Stripe webhook delivery, Gmail delivery, Cloudinary upload delivery, and Render runtime health need environment-backed manual verification. |

## Security findings fixed

- Secrets and production configuration: environment validation, safe production errors, secure CORS and headers, no tracked real secrets intentionally added.
- Password and account security: hashed passwords, reset expiration and single-use behavior, privileged role assignment controls, login rate limiting, account flow tests.
- Access-token security: verified JWT flow with expected expiration, issuer, audience, algorithm, and minimal claims.
- Refresh-token and session security: opaque refresh tokens, hashed storage, rotation, reuse detection, revocation, logout, and logout-all tests.
- Authorization and ownership: deny-by-default resource checks for users, vendors, products, orders, addresses, payments, payouts, and admin flows.
- DTO validation and mass-assignment protection: explicit DTOs, protected field controls, validation coverage for IDs, quantities, prices, roles, and protected updates.
- Injection and unsafe input handling: unsafe raw query and command patterns audited, sort/filter/path traversal protections covered by tests.
- Browser, XSS, and CSRF: text-first rendering, URL protocol validation, CSP/security headers, origin validation, and state-changing request protections.
- Checkout and pricing: backend-authoritative prices, totals, coupons, shipping, taxes, commissions, and stock checks.
- Payment and webhook security: Stripe signature verification, provider status verification, event idempotency, duplicate handling, refund protection, transaction use.
- Inventory and concurrency: transactional and idempotent stock operations with concurrent checkout tests.
- File upload security: size limits, MIME/signature checks, server-side naming, ownership checks, dangerous file blocking, upload rate limiting.
- Redis, BullMQ, and jobs: bounded retries, backoff, idempotent job handling, sensitive payload protection.
- Email and SMTP security: environment-backed credentials, recipient/header validation, escaped templates, queued sending, single-use links, rate limiting.
- Logging and error handling: structured security events, request IDs, token redaction, safe production errors.
- Dependencies, Docker, and CI/CD: pinned GitHub Actions, restricted CI permissions, non-root Docker runtimes, `.dockerignore` secret exclusions, Prisma generation before tests.

## Security findings remaining

- Moderate dependency advisory remains for Next's nested PostCSS dependency. Current audit output offers only a breaking downgrade, so this should be revisited when a safe Next/PostCSS fix is available.
- No dedicated browser E2E suite exists for full login, checkout, upload, and dashboard workflows.
- Local Docker image build and image scan could not be performed because the Docker daemon was unavailable.
- External provider behavior still needs live/manual confirmation for Stripe, Gmail SMTP, Cloudinary, Redis TLS, and Render runtime health.

No critical or high-severity automated tests are currently failing.

## Database migrations

The following 8 Prisma migrations exist:

- `20260701000100_initial_schema`
- `20260701000200_add_refresh_tokens`
- `20260703000100_product_catalog_inventory_relations`
- `20260705000100_add_payouts`
- `20260705000200_add_webhook_events`
- `20260712000100_harden_refresh_sessions`
- `20260715000100_add_email_job_deliveries`
- `20260715000200_add_email_verification_tokens`

Before remediation, Prisma reported 3 pending migrations:

- `20260712000100_harden_refresh_sessions`
- `20260715000100_add_email_job_deliveries`
- `20260715000200_add_email_verification_tokens`

Action taken:

- Ran `npm.cmd run prisma:deploy -w apps/api`.
- Re-ran `npm.cmd run prisma:status -w apps/api`.
- Result: database schema is up to date.

## New environment variables

No new application secret variables were added during Stage 18.

Deployment/configuration variables relevant to this stage:

- `NODE_VERSION=22` for Render Node runtime compatibility.
- Existing production secrets remain required in Render, including database, Redis, Cloudinary, Stripe, Gmail SMTP, JWT, and admin bootstrap values.
- `ALLOW_TEST_STRIPE_KEYS=false` remains the production default. Production deploys require live Stripe keys unless this is intentionally overridden outside production.

## Deployment changes

- Updated `render.yaml` so the API build command runs `npm run prisma:deploy -w apps/api` before building the API. This prevents Render from starting the API against an out-of-date database schema after new migrations are committed.

## Manual testing required

- Trigger a Render deployment and confirm `/api/health` is healthy after migration deploy and API startup.
- Confirm production environment values are present and are not test credentials unless explicitly intended.
- Send a real Stripe signed webhook event and verify duplicate delivery is ignored.
- Complete a checkout smoke test with provider verification enabled.
- Send password reset and verification emails through the configured Gmail SMTP account.
- Upload allowed and blocked files through Cloudinary-backed endpoints.
- Run Docker image build and image scan on a machine with Docker daemon available, or verify the CI Docker job output.
- Add a dedicated browser E2E suite for login, checkout, upload, and role-based dashboard flows.
