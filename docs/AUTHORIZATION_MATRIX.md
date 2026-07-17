# Authorization Matrix

Stage 6 audit date: 2026-07-13

Principles applied:
- Identity comes from `JwtAuthGuard` and `@CurrentUser()` for protected endpoints.
- Role decisions use `RolesGuard` and `@Roles(...)`.
- Resource ownership is enforced in backend services with scoped queries or explicit owner checks.
- Cross-owner resource-by-ID lookups return `404` where resource existence should be hidden.
- Admin-only endpoints require both authentication and `Role.ADMIN`.

| Method | Route | Auth Required | Allowed Roles | Ownership Check | Returned Sensitive Data |
| --- | --- | --- | --- | --- | --- |
| POST | `/auth/register` | No | Public | Creates current account only; role forced to BUYER | Access token and refresh session; no password hash |
| POST | `/auth/login` | No | Public | Login by credentials only | Access token and refresh session; no password hash |
| POST | `/auth/password-reset/request` | No | Public | Generic response prevents account enumeration | Reset token only in test env |
| POST | `/auth/password-reset/confirm` | No | Public | Single-use reset token hash lookup | None |
| POST | `/auth/password/change` | Yes | Any authenticated user | `user.id` from verified token | None |
| POST | `/auth/refresh` | Refresh token/cookie | Session holder | Hash lookup, expiration, revocation, rotation, family reuse detection | New token pair |
| POST | `/auth/logout` | Refresh token/cookie | Session holder | Hash-scoped session revocation | None; clears refresh cookie |
| POST | `/auth/logout-all` | Yes | Any authenticated user | Revokes all sessions for `user.id` from verified token | None; clears refresh cookie |
| GET | `/auth/me` | Yes | Any authenticated user | Verified token subject only | Minimal token user claims |
| GET | `/users/profile` | Yes | Any authenticated user | `user.id` from verified token | Own profile only; no password/session fields |
| GET | `/users/addresses` | Yes | Any authenticated user | `Address.userId = user.id` | Own addresses only |
| POST | `/users/addresses` | Yes | Any authenticated user | Created with `user.id`; body userId ignored/not accepted | Own address fields |
| PATCH | `/users/addresses/:addressId/default` | Yes | Any authenticated user | `Address.id + userId`; returns 404 if not owned | Own address fields |
| GET | `/cart` | Yes | Any authenticated user | Active cart by `user.id` | Own cart only |
| GET | `/cart/summary` | Yes | Any authenticated user | Active cart by `user.id` | Own cart summary |
| GET | `/cart/count` | Yes | Any authenticated user | Active cart by `user.id` | Own cart count |
| POST | `/cart/items` | Yes | Any authenticated user | Active cart by `user.id`; product must be purchasable | Own cart only |
| PATCH | `/cart/items/:itemId` | Yes | Any authenticated user | Cart item scoped by active cart id for `user.id` | Own cart only |
| DELETE | `/cart/items/:itemId` | Yes | Any authenticated user | Delete by `itemId + cartId` for `user.id` | Own cart only |
| DELETE | `/cart` | Yes | Any authenticated user | Active cart by `user.id` | Own cart only |
| POST | `/checkout/sessions` | Yes | Any authenticated user | Checkout created for `user.id` cart | Stripe checkout URL; no raw payment secrets |
| POST | `/checkout/webhooks/stripe` | Stripe signature | Stripe | Signature and raw body verification | No user data returned |
| GET | `/orders` | Yes | Any authenticated user | `Order.buyerId = user.id` | Own orders; processor ref omitted |
| GET | `/orders/:id` | Yes | Any authenticated user | `Order.id + buyerId`; 404 if not owned | Own order detail; processor ref omitted |
| GET | `/products` | No | Public | Public catalog filters approved data | Public product data |
| GET | `/products/:slug` | No | Public | Public approved product by slug | Public product detail |
| GET | `/products/:productId/reviews` | No | Public | Product reviews only | Public review data |
| POST | `/products/:productId/reviews` | Yes | Any authenticated user | Review created with `user.id`; product id from route | Own review content |
| POST | `/seller-applications` | Yes | Any authenticated user | Application created for `user.id` | Own application data |
| GET | `/seller-applications/me` | Yes | Any authenticated user | Application lookup by `user.id` | Own seller application |
| GET | `/seller/dashboard` | Yes | SELLER | Store resolved by `sellerProfile.userId = user.id` | Own store metrics only |
| GET | `/seller/store/settings` | Yes | SELLER | Store resolved by `sellerProfile.userId = user.id` | Own store settings |
| PATCH | `/seller/store/settings` | Yes | SELLER | Store resolved by `sellerProfile.userId = user.id`; protected ids/status not accepted | Own store settings |
| GET | `/seller/products` | Yes | SELLER | Store resolved by `sellerProfile.userId = user.id` | Own products only |
| GET | `/seller/products/:id` | Yes | SELLER | Product owner `store.sellerProfile.userId`; 404 if not owned | Own product detail |
| POST | `/seller/products` | Yes | SELLER | Store id derived from `user.id`; protected storeId not accepted | Created own product |
| PATCH | `/seller/products/:id` | Yes | SELLER | Product owner check; sellers limited to editable statuses | Own product detail |
| PATCH | `/seller/products/:id/archive` | Yes | SELLER | Product owner check | Own product detail |
| DELETE | `/seller/products/:id` | Yes | SELLER | Product owner check | Own product deletion/archive result |
| POST | `/seller/uploads/store/logo` | Yes | SELLER | Store resolved by `user.id` | Own store media URL |
| POST | `/seller/uploads/store/banner` | Yes | SELLER | Store resolved by `user.id` | Own store media URL |
| POST | `/seller/uploads/products/:productId/images` | Yes | SELLER | Product owner check | Own product image URL |
| GET | `/seller/orders` | Yes | SELLER | Store resolved by `user.id`; items scoped to store id | Own revenue/order item metrics only |
| GET | `/seller/orders/:itemId` | Yes | SELLER | `OrderItem.id + storeId`; 404 if not owned | Own seller order item; processor ref omitted |
| PATCH | `/seller/orders/:itemId/fulfillment` | Yes | SELLER | `OrderItem.id + storeId`; 404 if not owned | Own fulfillment result |
| GET | `/notifications` | Yes | Any authenticated user | `Notification.userId = user.id` | Own notifications |
| GET | `/notifications/unread-count` | Yes | Any authenticated user | `Notification.userId = user.id` | Own unread count |
| PATCH | `/notifications/read-all` | Yes | Any authenticated user | `Notification.userId = user.id` | Own update count |
| PATCH | `/notifications/:id/read` | Yes | Any authenticated user | `Notification.id + userId`; 404 if not owned | Own notification |
| GET | `/categories` | No | Public | Public categories | Public category data |
| GET | `/categories/tree` | No | Public | Public category tree | Public category data |
| GET | `/admin/dashboard/stats` | Yes | ADMIN | Admin role gate | Platform aggregate data |
| GET | `/admin/orders` | Yes | ADMIN | Admin role gate | Admin order list with buyer contact/payment status |
| GET | `/admin/orders/:id` | Yes | ADMIN | Admin role gate; 404 if missing | Admin order detail, includes provider ref |
| PATCH | `/admin/orders/:id/status` | Yes | ADMIN | Admin role gate; actor from `user.id` | Admin order detail |
| GET | `/admin/products/pending` | Yes | ADMIN | Admin role gate | Pending product data |
| GET | `/admin/products/:id` | Yes | ADMIN | Admin role gate; 404 if missing | Product moderation detail |
| PATCH | `/admin/products/:id/approve` | Yes | ADMIN | Admin role gate; actor from `user.id` | Moderated product |
| PATCH | `/admin/products/:id/reject` | Yes | ADMIN | Admin role gate; actor from `user.id` | Moderated product |
| GET | `/admin/categories` | Yes | ADMIN | Admin role gate | Category admin data |
| GET | `/admin/categories/tree` | Yes | ADMIN | Admin role gate | Category admin data |
| POST | `/admin/categories` | Yes | ADMIN | Admin role gate; actor from `user.id` | Created category |
| PATCH | `/admin/categories/:id` | Yes | ADMIN | Admin role gate; actor from `user.id` | Updated category |
| PATCH | `/admin/categories/:id/activate` | Yes | ADMIN | Admin role gate; actor from `user.id` | Updated category |
| PATCH | `/admin/categories/:id/deactivate` | Yes | ADMIN | Admin role gate; actor from `user.id` | Updated category |
| GET | `/admin/seller-applications/pending` | Yes | ADMIN | Admin role gate | Pending seller applications |
| PATCH | `/admin/seller-applications/:id/approve` | Yes | ADMIN | Admin role gate; actor from `user.id` | Reviewed seller application |
| PATCH | `/admin/seller-applications/:id/reject` | Yes | ADMIN | Admin role gate; actor from `user.id` | Reviewed seller application |
| PATCH | `/admin/seller-applications/:id/suspend` | Yes | ADMIN | Admin role gate; actor from `user.id` | Suspended seller account/store |

## Areas Without Current Public Endpoints

| Area | Status | Authorization Note |
| --- | --- | --- |
| Inventory | Managed through seller product stock changes and audit logs | Seller product ownership required before stock changes |
| Coupons | No coupon endpoints present | Deny by absence |
| Payments | Created and updated through checkout/webhook services only | Buyer identity comes from cart/session metadata; webhooks require Stripe signature |
| Payouts | Prisma model exists but no payout endpoints present | Deny by absence |
## Stage 19 Operational Authorization Review

Review date: 2026-07-17

- Admin endpoints remain role-gated with `Role.ADMIN`; no public Swagger/OpenAPI route is exposed for endpoint discovery.
- Payment state changes remain restricted to backend checkout/provider verification paths; clients cannot mark orders paid.
- Payouts remain deny-by-absence because no public payout endpoint is present.
- Bootstrap admin creation is environment-driven and should be run only during controlled deployment or seeding. Rotate bootstrap credentials after first production use.
- Future endpoints must be added to this matrix before release with method, route, auth requirement, allowed roles, ownership check, and sensitive returned data.
