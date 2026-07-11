# API Documentation

Base URL:

```text
Production: https://YOUR_RENDER_SERVICE.onrender.com/api
Local: http://localhost:5000/api
```

Protected routes require:

```http
Authorization: Bearer <accessToken>
```

Responses use this shape:

```json
{
  "success": true,
  "data": {},
  "path": "/api/...",
  "timestamp": "2026-07-11T00:00:00.000Z"
}
```

Errors use:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation message",
  "error": "Bad Request",
  "path": "/api/...",
  "timestamp": "2026-07-11T00:00:00.000Z"
}
```

## Health

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | No | API health check |

## Auth

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | No | Register buyer account |
| POST | `/auth/login` | No | Login |
| POST | `/auth/refresh` | No | Rotate refresh token |
| POST | `/auth/logout` | No | Revoke refresh token |
| GET | `/auth/me` | Yes | Current authenticated user |

### Register

```json
{
  "fullName": "Buyer User",
  "email": "buyer@example.com",
  "password": "password123",
  "phone": "+15550101010"
}
```

### Login

```json
{
  "email": "buyer@example.com",
  "password": "password123"
}
```

## Users

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/users/profile` | Yes | Buyer/seller/admin profile |
| GET | `/users/addresses` | Yes | List addresses |
| POST | `/users/addresses` | Yes | Create address |
| PATCH | `/users/addresses/:addressId/default` | Yes | Set default address |

### Create address

```json
{
  "label": "Home",
  "line1": "100 Market Street",
  "city": "New York",
  "state": "NY",
  "country": "US",
  "postalCode": "10001",
  "isDefault": true
}
```

## Seller Applications

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/seller-applications` | Buyer | Submit seller application |
| GET | `/seller-applications/me` | Buyer/seller | Current user's latest application |

```json
{
  "storeName": "Demo Store",
  "storeDescription": "A production QA seller storefront.",
  "phone": "+15550101010",
  "address": "100 Seller Street",
  "businessDocument": "https://example.com/document.pdf"
}
```

## Seller Dashboard and Products

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/seller/dashboard` | Seller | Seller overview |
| GET | `/seller/store/settings` | Seller | Store settings |
| PATCH | `/seller/store/settings` | Seller | Update store settings |
| GET | `/seller/products` | Seller | List seller products |
| GET | `/seller/products/:id` | Seller | Product detail |
| POST | `/seller/products` | Seller | Create product |
| PATCH | `/seller/products/:id` | Seller | Update product |
| PATCH | `/seller/products/:id/archive` | Seller | Archive product |
| DELETE | `/seller/products/:id` | Seller | Delete product |

### Create product

```json
{
  "categoryId": "category_id",
  "title": "Demo Product",
  "description": "A product description with enough detail for validation.",
  "priceCents": 1999,
  "currency": "USD",
  "stockQuantity": 10,
  "status": "PENDING_REVIEW",
  "tags": ["demo", "qa"],
  "images": [
    {
      "url": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      "altText": "Demo product",
      "sortOrder": 0
    }
  ]
}
```

## Uploads

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/seller/uploads/store/logo` | Seller | Upload store logo |
| POST | `/seller/uploads/store/banner` | Seller | Upload store banner |
| POST | `/seller/uploads/products/:productId/images` | Seller | Upload product image |

## Catalog

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/categories` | No | Public categories |
| GET | `/categories/tree` | No | Public category tree |
| GET | `/products` | No | Public product list |
| GET | `/products/:slug` | No | Public product detail |

## Cart and Checkout

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/cart` | Buyer | Current cart |
| GET | `/cart/summary` | Buyer | Cart totals |
| GET | `/cart/count` | Buyer | Cart item count |
| POST | `/cart/items` | Buyer | Add item |
| PATCH | `/cart/items/:itemId` | Buyer | Update quantity |
| DELETE | `/cart/items/:itemId` | Buyer | Remove item |
| DELETE | `/cart` | Buyer | Clear cart |
| POST | `/checkout/sessions` | Buyer | Create Stripe Checkout session |

### Add cart item

```json
{
  "productId": "product_id",
  "quantity": 1
}
```

### Create checkout session

```json
{
  "addressId": "address_id"
}
```

## Stripe Webhook

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/checkout/webhooks/stripe` | Stripe signature | Stripe webhook receiver |

Configure this URL in Stripe:

```text
https://YOUR_RENDER_SERVICE.onrender.com/api/checkout/webhooks/stripe
```

Opening this URL in a browser returns 404 because browser requests use GET. Stripe must send POST requests with the signature header.

## Orders

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/orders` | Buyer | Buyer orders |
| GET | `/orders/:id` | Buyer | Buyer order detail |
| GET | `/seller/orders` | Seller | Seller order items |
| GET | `/seller/orders/:itemId` | Seller | Seller order item detail |
| PATCH | `/seller/orders/:itemId/fulfillment` | Seller | Update fulfillment/tracking |

## Reviews

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/products/:productId/reviews` | No | Approved reviews for product |
| POST | `/products/:productId/reviews` | Buyer | Create verified-purchase review |

```json
{
  "rating": 5,
  "comment": "Great product and smooth checkout experience.",
  "images": []
}
```

## Notifications

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/notifications` | Yes | Notification list |
| GET | `/notifications/unread-count` | Yes | Unread count |
| PATCH | `/notifications/read-all` | Yes | Mark all read |
| PATCH | `/notifications/:id/read` | Yes | Mark one read |

## Admin

Admin routes require an authenticated `ADMIN` user.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/dashboard/stats` | Admin stats and analytics |
| GET | `/admin/seller-applications/pending` | Pending seller applications |
| PATCH | `/admin/seller-applications/:id/approve` | Approve seller |
| PATCH | `/admin/seller-applications/:id/reject` | Reject seller |
| PATCH | `/admin/seller-applications/:id/suspend` | Suspend seller |
| GET | `/admin/products/pending` | Pending product moderation |
| GET | `/admin/products/:id` | Product moderation detail |
| PATCH | `/admin/products/:id/approve` | Approve product |
| PATCH | `/admin/products/:id/reject` | Reject product |
| GET | `/admin/categories` | Category list |
| GET | `/admin/categories/tree` | Category tree |
| POST | `/admin/categories` | Create category |
| PATCH | `/admin/categories/:id` | Update category |
| PATCH | `/admin/categories/:id/activate` | Activate category |
| PATCH | `/admin/categories/:id/deactivate` | Deactivate category |
| GET | `/admin/orders` | Admin order list |
| GET | `/admin/orders/:id` | Admin order detail |
| PATCH | `/admin/orders/:id/status` | Update order status |

### Reject product

```json
{
  "reason": "Product images need improvement."
}
```

### Update admin order status

```json
{
  "status": "DELIVERED",
  "reason": "Production QA fulfillment complete."
}
```
