import { validateEnv } from "./env.validation";

const strongSecret = "1234567890abcdefghijklmnopqrstuvwxyz";

const baseConfig = {
  DATABASE_URL: "postgresql://market_user:password@db.market.internal:5432/app?sslmode=require",
  JWT_ACCESS_SECRET: `${strongSecret}-access`,
  JWT_REFRESH_SECRET: `${strongSecret}-refresh`
};

describe("validateEnv", () => {
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
        ...baseConfig,
        NODE_ENV: "production",
        JWT_ACCESS_SECRET: "replace_with_strong_secret",
        FRONTEND_URL: "https://market.internal",
        CORS_ORIGIN: "https://market.internal",
        REDIS_URL: "rediss://default:password@redis.market.internal:6379",
        STRIPE_SECRET_KEY: "sk_live_123",
        STRIPE_WEBHOOK_SECRET: "whsec_123",
        GMAIL_USER: "sender@market.internal",
        GMAIL_APP_PASSWORD: "app-password",
        ADMIN_PASSWORD: "long-admin-password"
      })
    ).toThrow("JWT_ACCESS_SECRET must not use a placeholder value");
  });

  it("rejects production CORS wildcards", () => {
    expect(() =>
      validateEnv({
        ...baseConfig,
        NODE_ENV: "production",
        FRONTEND_URL: "https://market.internal",
        CORS_ORIGIN: "*",
        REDIS_URL: "rediss://default:password@redis.market.internal:6379",
        STRIPE_SECRET_KEY: "sk_live_123",
        STRIPE_WEBHOOK_SECRET: "whsec_123",
        GMAIL_USER: "sender@market.internal",
        GMAIL_APP_PASSWORD: "app-password",
        ADMIN_PASSWORD: "long-admin-password"
      })
    ).toThrow("CORS_ORIGIN cannot include *");
  });

  it("allows complete production configuration", () => {
    const validated = validateEnv({
      ...baseConfig,
      NODE_ENV: "production",
      FRONTEND_URL: "https://market.internal",
      CORS_ORIGIN: "https://market.internal,https://admin.market.internal",
      REDIS_URL: "rediss://default:password@redis.market.internal:6379",
      STRIPE_SECRET_KEY: "sk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_123",
      GMAIL_USER: "sender@market.internal",
      GMAIL_APP_PASSWORD: "app-password",
      ADMIN_EMAIL: "admin@market.internal",
      ADMIN_PASSWORD: "long-admin-password"
    });

    expect(validated.NODE_ENV).toBe("production");
    expect(validated.GMAIL_SMTP_PORT).toBe(465);
  });

  it("allows production test Stripe keys only when explicitly enabled", () => {
    const validated = validateEnv({
      ...baseConfig,
      NODE_ENV: "production",
      FRONTEND_URL: "https://market.internal",
      CORS_ORIGIN: "https://market.internal",
      REDIS_URL: "rediss://default:password@redis.market.internal:6379",
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_123",
      GMAIL_USER: "sender@market.internal",
      GMAIL_APP_PASSWORD: "app-password",
      ADMIN_PASSWORD: "long-admin-password",
      ALLOW_TEST_STRIPE_KEYS: "true"
    });

    expect(validated.ALLOW_TEST_STRIPE_KEYS).toBe(true);
  });
});
