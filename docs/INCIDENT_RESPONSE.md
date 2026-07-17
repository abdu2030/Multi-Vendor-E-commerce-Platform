# Incident Response Notes

Stage 19 review date: 2026-07-17

## Severity Levels

| Severity | Examples | Initial Response Target |
| --- | --- | --- |
| Critical | Secret leak, admin account takeover, fake paid orders, database compromise, payment/refund abuse | Immediate containment |
| High | Cross-account data exposure, production auth bypass, persistent XSS, webhook signature bypass | Same day containment |
| Medium | Rate-limit bypass, email abuse, upload policy bypass without code execution | Next maintenance window or faster if exploited |
| Low | Documentation drift, non-sensitive logging issue, provider alert tuning | Planned remediation |

## First 15 Minutes

1. Assign an incident owner.
2. Stop the bleeding: disable affected endpoint, rotate exposed secret, revoke compromised user/session, or pause deploys.
3. Preserve evidence: Render logs, database audit records, Stripe event IDs, Cloudinary asset IDs, Redis job IDs, request IDs.
4. Avoid deleting data until evidence is copied.
5. Record the timeline in the incident ticket.

## Secret Exposure

1. Rotate the exposed secret in the provider first.
2. Update Render/Vercel/Stripe/Cloudinary/Gmail/Redis configuration.
3. Redeploy if the application reads the value only at startup.
4. Revoke affected refresh sessions when JWT or auth secrets are involved.
5. Search logs and Git history for the exposed value.
6. Confirm old credentials no longer work.

## Payment or Webhook Incident

1. Disable payment-processing endpoints only if active exploitation is ongoing.
2. Preserve Stripe event IDs and local `WebhookEvent` records.
3. Verify affected orders directly against Stripe.
4. Reconcile stock, refunds, and order status with database transactions.
5. Reject any order that cannot be verified through Stripe provider APIs.

## Account or Admin Compromise

1. Revoke all sessions for the affected account.
2. Rotate the password and any reset/verification tokens.
3. Review audit logs for role changes, admin actions, refunds, payouts, product approvals, and seller suspensions.
4. Revert unauthorized role or status changes using audited corrective actions.
5. Add affected user IDs and request IDs to the incident record.

## Data Exposure

1. Identify impacted resources and users.
2. Preserve request IDs and authorization decisions from logs.
3. Patch the backend authorization gap before re-enabling affected endpoints.
4. Notify affected users if legal or policy obligations apply.

## Upload Abuse

1. Remove malicious Cloudinary assets.
2. Revoke or suspend the uploading account if abuse is confirmed.
3. Review repeated upload failure logs.
4. Add new signature/MIME tests for the bypass before closing the incident.

## Post-Incident Requirements

- Root cause summary.
- Customer/data/payment impact assessment.
- Secrets rotated and old secrets verified dead.
- Tests added for the failed control.
- Documentation updated if the runbook was incomplete.
- Follow-up owner and due date for remaining hardening work.