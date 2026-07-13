# DTO Validation and Mass-Assignment Audit

Stage 7 audit date: 2026-07-13

Global request validation is enabled in `apps/api/src/main.ts` with:
- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`
- centralized validation error formatting

Protected client-controlled fields are not present in public write DTOs: `role`, `isAdmin`, `isVerified`, `vendorId`, `ownerId`, `paymentStatus`, `orderTotal`, `commissionRate`, `passwordHash`, `refreshTokenHash`, `createdAt`, and `updatedAt`.

| Endpoint | DTO / Input Contract | Database Field Mapping |
| --- | --- | --- |
| `POST /auth/register` | `RegisterDto` | Explicit `user.create.data` with forced `Role.BUYER` and hashed password |
| `POST /auth/login` | `LoginDto` | No write from body; creates mapped refresh session after credential verification |
| `POST /auth/password-reset/request` | `RequestPasswordResetDto` | Explicit reset token hash and expiration fields |
| `POST /auth/password-reset/confirm` | `ResetPasswordDto` | Explicit password hash update and reset-token clearing |
| `POST /auth/password/change` | `ChangePasswordDto` | Explicit password hash update and reset-token clearing |
| `POST /auth/refresh` | `RefreshTokenDto` or HTTP-only cookie | Explicit refresh-session rotation fields inside transaction |
| `POST /auth/logout` | `RefreshTokenDto` or HTTP-only cookie | Explicit `revokedAt` update by token hash |
| `POST /users/addresses` | `CreateAddressDto` | Explicit address field mapping with `userId` from token |
| `PATCH /users/addresses/:addressId/default` | `ParseCuidPipe` route param | Explicit owner-scoped update flow |
| `POST /cart/items` | `AddCartItemDto` | Explicit cart item fields with cart from token user |
| `PATCH /cart/items/:itemId` | `UpdateCartItemDto` + `ParseCuidPipe` | Explicit quantity update after cart ownership check |
| `DELETE /cart/items/:itemId` | `ParseCuidPipe` route param | Owner-scoped delete by cart id and item id |
| `DELETE /cart` | No body | Owner-scoped delete by active cart id |
| `POST /checkout/sessions` | `CreateCheckoutSessionDto` | Address id validated; payment/order fields built server-side |
| `POST /products/:productId/reviews` | `CreateReviewDto` + `ParseCuidPipe` | Explicit review fields with `userId` from token |
| `POST /seller-applications` | `CreateSellerApplicationDto` | Explicit application fields with `userId` from token |
| `PATCH /seller/store/settings` | `UpdateStoreSettingsDto` | Explicit seller profile/store update maps |
| `POST /seller/products` | `CreateSellerProductDto` | Explicit product, image, variant, audit, and inventory mappings |
| `PATCH /seller/products/:id` | `UpdateSellerProductDto` + `ParseCuidPipe` | Explicit product/image/variant mappings after ownership check |
| `PATCH /seller/products/:id/archive` | `ParseCuidPipe` route param | Explicit status update after ownership check |
| `DELETE /seller/products/:id` | `ParseCuidPipe` route param | Same archive path; explicit status update |
| `POST /seller/uploads/store/logo` | `UploadImageDto` | Explicit store logo URL update after store ownership check |
| `POST /seller/uploads/store/banner` | `UploadImageDto` | Explicit store banner URL update after store ownership check |
| `POST /seller/uploads/products/:productId/images` | `UploadImageDto` + `ParseCuidPipe` | Explicit product image create after product ownership check |
| `PATCH /seller/orders/:itemId/fulfillment` | `UpdateSellerOrderFulfillmentDto` + `ParseCuidPipe` | Explicit fulfillment fields after store/item ownership check |
| `PATCH /notifications/read-all` | No body | Owner-scoped notification update |
| `PATCH /notifications/:id/read` | `ParseCuidPipe` route param | Owner-scoped notification update |
| `POST /admin/categories` | `CreateCategoryDto` | Explicit category create fields and admin audit actor |
| `PATCH /admin/categories/:id` | `UpdateCategoryDto` + `ParseCuidPipe` | Explicit category update fields and admin audit actor |
| `PATCH /admin/categories/:id/activate` | `ParseCuidPipe` route param | Explicit active flag update |
| `PATCH /admin/categories/:id/deactivate` | `ParseCuidPipe` route param | Explicit active flag update |
| `PATCH /admin/orders/:id/status` | `UpdateAdminOrderStatusDto` + `ParseCuidPipe` | Explicit status update and audit record |
| `PATCH /admin/products/:id/approve` | `ParseCuidPipe` route param | Explicit product status update and audit record |
| `PATCH /admin/products/:id/reject` | `RejectProductDto` + `ParseCuidPipe` | Explicit product status update and audit record |
| `PATCH /admin/seller-applications/:id/approve` | `ParseCuidPipe` route param | Explicit seller/store/user status updates and audit records |
| `PATCH /admin/seller-applications/:id/reject` | `RejectSellerApplicationDto` + `ParseCuidPipe` | Explicit rejection/status updates and audit records |
| `PATCH /admin/seller-applications/:id/suspend` | `SuspendSellerApplicationDto` + `ParseCuidPipe` | Explicit suspension/status updates and audit records |

Query validation is handled by explicit DTOs for product listing, notification listing, seller product filters, seller order filters, admin order filters, and admin category include-inactive filters.