#!/usr/bin/env node

const { existsSync, readFileSync } = require("fs");
const path = require("path");

const apiRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(apiRoot, "..", "..");
const env = {
  ...loadEnvFile(path.join(apiRoot, ".env")),
  ...loadEnvFile(path.join(apiRoot, ".env.production")),
  ...process.env
};

const apiBaseUrl = normalizeApiBaseUrl(env.PRODUCTION_API_URL || env.API_BASE_URL);
const adminEmail = env.PRODUCTION_QA_ADMIN_EMAIL || env.ADMIN_EMAIL;
const adminPassword = env.PRODUCTION_QA_ADMIN_PASSWORD || env.ADMIN_PASSWORD;
const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const qaPassword = env.PRODUCTION_QA_PASSWORD || `QaPass-${runId}!`;

main().catch((error) => {
  console.error(`Production QA failed: ${error.message}`);
  process.exitCode = 1;
});

async function main() {
  assertRequired("PRODUCTION_API_URL or API_BASE_URL", apiBaseUrl);
  assertRequired("ADMIN_EMAIL or PRODUCTION_QA_ADMIN_EMAIL", adminEmail);
  assertRequired("ADMIN_PASSWORD or PRODUCTION_QA_ADMIN_PASSWORD", adminPassword);

  const result = {
    apiBaseUrl,
    runId,
    checks: []
  };

  await check(result, "health", async () => request("GET", "/health"));
  const categories = await check(result, "categories", async () => request("GET", "/categories"));
  const category = firstCategory(categories);

  if (!category) {
    throw new Error("No active category found. Seed production categories before running QA.");
  }

  const adminSession = await check(result, "admin login", async () =>
    request("POST", "/auth/login", { email: adminEmail, password: adminPassword })
  );
  const adminToken = adminSession.accessToken;

  const sellerEmail = `qa-seller-${runId}@example.test`;
  const buyerEmail = `qa-buyer-${runId}@example.test`;
  const sellerSession = await check(result, "seller register", async () =>
    request("POST", "/auth/register", {
      fullName: `QA Seller ${runId}`,
      email: sellerEmail,
      password: qaPassword,
      phone: "+15550101010"
    })
  );
  const buyerSession = await check(result, "buyer register", async () =>
    request("POST", "/auth/register", {
      fullName: `QA Buyer ${runId}`,
      email: buyerEmail,
      password: qaPassword,
      phone: "+15550202020"
    })
  );

  const application = await check(result, "seller application", async () =>
    request(
      "POST",
      "/seller-applications",
      {
        storeName: `QA Store ${runId}`,
        storeDescription: "Production QA seller application for deployment verification.",
        phone: "+15550101010",
        address: "100 QA Market Street",
        businessDocument: "https://example.com/qa-business-document.pdf"
      },
      sellerSession.accessToken
    )
  );

  await check(result, "seller approval", async () =>
    request("PATCH", `/admin/seller-applications/${application.id}/approve`, undefined, adminToken)
  );

  const sellerLogin = await check(result, "seller login after approval", async () =>
    request("POST", "/auth/login", { email: sellerEmail, password: qaPassword })
  );

  const product = await check(result, "seller product create", async () =>
    request(
      "POST",
      "/seller/products",
      {
        categoryId: category.id,
        title: `QA Product ${runId}`,
        description: "Production QA product used to verify seller upload, cart, checkout, and reviews.",
        priceCents: 1999,
        currency: "USD",
        stockQuantity: 5,
        status: "PENDING_REVIEW",
        tags: ["qa", "production"],
        images: [
          {
            url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
            altText: "QA sample product image",
            sortOrder: 0
          }
        ]
      },
      sellerLogin.accessToken
    )
  );

  await check(result, "product approval", async () =>
    request("PATCH", `/admin/products/${product.id}/approve`, undefined, adminToken)
  );

  const address = await check(result, "buyer address", async () =>
    request(
      "POST",
      "/users/addresses",
      {
        label: "QA",
        line1: "200 Buyer QA Road",
        city: "Test City",
        state: "QA",
        country: "US",
        postalCode: "10001",
        isDefault: true
      },
      buyerSession.accessToken
    )
  );

  await check(result, "cart add", async () =>
    request("POST", "/cart/items", { productId: product.id, quantity: 1 }, buyerSession.accessToken)
  );
  await check(result, "cart summary", async () => request("GET", "/cart/summary", undefined, buyerSession.accessToken));
  const checkoutSession = await check(result, "checkout session", async () =>
    request("POST", "/checkout/sessions", { addressId: address.id }, buyerSession.accessToken)
  );

  await check(result, "review blocked before paid order", async () => {
    try {
      await request(
        "POST",
        `/products/${product.id}/reviews`,
        { rating: 5, comment: "This review should be blocked before a paid order exists." },
        buyerSession.accessToken
      );
    } catch (error) {
      if (error.statusCode === 403) {
        return { blocked: true, message: error.message };
      }

      throw error;
    }

    throw new Error("Review was accepted before a verified purchase.");
  });

  result.manualNextSteps = [
    "Open the checkout session URL and complete Stripe test payment.",
    "Confirm Stripe sends checkout.session.completed to /api/checkout/webhooks/stripe.",
    "Log in as buyer and verify /orders shows the new paid order.",
    "Submit a review for the QA product; verify rating/review count updates.",
    "Optionally update the order to DELIVERED from the admin dashboard."
  ];
  result.qaAccounts = {
    sellerEmail,
    buyerEmail,
    password: "stored only in this local script output; rotate/delete QA accounts after testing"
  };
  result.checkoutUrl = checkoutSession.url;

  console.log(JSON.stringify(result, null, 2));
}

async function check(result, name, fn) {
  const startedAt = Date.now();

  try {
    const data = await fn();

    result.checks.push({ name, status: "passed", durationMs: Date.now() - startedAt });
    return data;
  } catch (error) {
    result.checks.push({ name, status: "failed", durationMs: Date.now() - startedAt, error: error.message });
    throw error;
  }
}

async function request(method, route, body, token) {
  const headers = { Accept: "application/json" };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBaseUrl}${route}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    const error = new Error(Array.isArray(payload.message) ? payload.message.join(" ") : payload.message || response.statusText);
    error.statusCode = response.status;
    throw error;
  }

  return payload.data;
}

function firstCategory(payload) {
  const categories = Array.isArray(payload) ? payload : payload?.categories || payload?.data || [];

  return categories.find((category) => category?.id && category?.isActive !== false);
}

function normalizeApiBaseUrl(value) {
  if (!value) {
    return "";
  }

  return value.replace(/\/+$/, "").replace(/\/api$/, "") + "/api";
}

function assertRequired(name, value) {
  if (!value) {
    throw new Error(`${name} is required.`);
  }
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        return env;
      }

      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();

      env[key] = unquote(value);
      return env;
    }, {});
}

function unquote(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}
