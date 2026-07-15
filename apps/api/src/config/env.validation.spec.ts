import { validateEnv } from "./env.validation";

const strongSecret = "1234567890abcdefghijklmnopqrstuvwxyz";
const liveStripeFixture = ["sk", "live", "fixture"].join("_");
const testStripeFixture = ["sk", "test", "fixture"].join("_");

const baseConfig = {
  DATABASE_URL: "postgresql://market_user@db.market.internal:5432/app?sslmode=require",
  JWT_ACCESS_SECRET: `${strongSecret}-access`,
  JWT_REFRESH_SECRET: `${strongSecret}-refresh`
};

const productionConfig = {
  ...baseConfig,
  NODE_ENV: "production",
  FRONTEND_URL: "https://market.internal",
  CORS_ORIGIN: "https://market.internal",
  REDIS_URL: "rediss://:redis-password@redis.market.internal:6379",
  STRIPE_SECRET_KEY: liveStripeFixture,
  STRIPE_WEBHOOK_SECRET: "stripe-webhook-fixture",
  GMAIL_USER: "sender@market.internal",
  GMAIL_APP_PASSWORD: "app-password",
  ADMIN_PASSWORD: "long-admin-password"
};

describe("validateEnv", () => {
  it("refuses to start when required secrets are missing", () => {
    expect(() =>
      validateEnv({
        NODE_ENV: "production"
      })
    ).toThrow("Missing required environment variables: DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET");
  });

  it("allows development configuration with local URLs", () => {
    const validated = validateEnv({
      ...baseConfig,
      NODE_ENV: "development",
      FRONTEND_URL: "http://localhost:3000",
      CORS_ORIGIN: "http://localhost:3000,http://127.0.0.1:3000"
    });

    expect(validated.NODE_ENV).toBe("development");
    expect(validated.PORT).toBe(5000);
  });

  it("rejects production configuration that still uses placeholder secrets", () => {
    expect(() =>
      validateEnv({
        ...productionConfig,
        JWT_ACCESS_SECRET: "replace_with_strong_secret"
      })
    ).toThrow("JWT_ACCESS_SECRET must not use a placeholder value");
  });

  it("rejects CORS wildcards because credentials are enabled", () => {
    expect(() =>
      validateEnv({
        ...baseConfig,
        NODE_ENV: "development",
        CORS_ORIGIN: "*"
      })
    ).toThrow("CORS_ORIGIN cannot include *");
  });

  it("allows complete production configuration", () => {
    const validated = validateEnv({
      ...productionConfig,
      CORS_ORIGIN: "https://market.internal,https://admin.market.internal",
      ADMIN_EMAIL: "admin@market.internal"
    });

    expect(validated.NODE_ENV).toBe("production");
    expect(validated.GMAIL_SMTP_PORT).toBe(465);
  });

  it("rejects production Redis without TLS, authentication, or a non-loopback host", () => {
    expect(() =>
      validateEnv({
        ...productionConfig,
        REDIS_URL: "redis://:redis-password@redis.market.internal:6379"
      })
    ).toThrow("REDIS_URL must use rediss:// in staging and production");

    expect(() =>
      validateEnv({
        ...productionConfig,
        REDIS_URL: "rediss://redis.market.internal:6379"
      })
    ).toThrow("REDIS_URL must include a Redis password in staging and production");

    expect(() =>
      validateEnv({
        ...productionConfig,
        REDIS_URL: "rediss://:redis-password@127.0.0.1:6379"
      })
    ).toThrow("REDIS_URL must not point to a loopback or listen-all host in staging and production");
  });

  it("allows production test Stripe keys only when explicitly enabled", () => {
    const validated = validateEnv({
      ...productionConfig,
      STRIPE_SECRET_KEY: testStripeFixture,
      ALLOW_TEST_STRIPE_KEYS: "true"
    });

    expect(validated.ALLOW_TEST_STRIPE_KEYS).toBe(true);
  });
});
