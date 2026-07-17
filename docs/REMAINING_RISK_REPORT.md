# Remaining Risk Report

Stage 19 review date: 2026-07-17

## Summary

No critical or high-severity automated security regression tests are currently failing. The remaining risks are operational controls that require provider-console verification, a moderate dependency advisory, and production-readiness improvements that are outside the current source-only audit boundary.

## Remaining Risks

| Risk | Severity | Status | Recommended Action |
| --- | --- | --- | --- |
| Global API rate limiting is in-memory | Medium | Open | Use Redis-backed rate-limit storage before running multiple API instances or accepting high-volume public traffic. |
| No dedicated browser E2E suite | Medium | Open | Add Playwright or Cypress coverage for login, refresh/logout, checkout, upload, and role-based dashboards. |
| Moderate Next/PostCSS audit advisory | Medium | Open | Track Next.js/PostCSS updates and upgrade when a safe non-breaking fix is available. Do not apply audit's breaking downgrade. |
| Production provider HTTPS, backups, network restrictions, monitoring, and alerts require console verification | Medium | Open | Complete `docs/SECURITY_CHECKLIST.md` against Render/Vercel/Neon/Redis/Stripe/Cloudinary/Gmail consoles. |
| Admin accounts do not have MFA enforced by the app | Medium | Open | Add MFA or enforce SSO/MFA at the identity/provider layer for admin operators. |
| Docker local image scan was not performed in Stage 18 | Low | Open | Run image build and scan on a machine with a running Docker daemon or review the CI Docker output. |
| Production live Stripe smoke test not executed locally | Low | Open | Send a real signed webhook from Stripe Dashboard after deploying the production service. |

## Accepted Constraints

- Render free-tier deployments may sleep and may not provide every enterprise network restriction available on paid infrastructure.
- Managed provider network restrictions vary by vendor. Where IP allowlisting/private networking is unavailable, use strong credentials, TLS, least-privileged users, and alerting.
- Stripe test keys can be used only for deployment testing when `ALLOW_TEST_STRIPE_KEYS=true`; this must be `false` before real payment traffic.

## Closure Criteria

Stage 19 can be considered production-hardened only after:

- Provider-console checklist items are marked complete.
- Production health check passes over HTTPS.
- Stripe live webhook endpoint is configured with the matching signing secret.
- Production database migration status is clean.
- Backups and restore procedure are verified.
- Monitoring alerts are configured and tested.
- Admin accounts are reviewed and bootstrap credentials are rotated.