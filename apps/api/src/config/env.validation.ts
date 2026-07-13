type EnvConfig = Record<string, string | undefined>;

type AppEnvironment = "development" | "test" | "staging" | "production";

const appEnvironments = ["development", "test", "staging", "production"] as const;
const productionLikeEnvironments = new Set<AppEnvironment>(["staging", "production"]);
const requiredVariables = ["DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const;
const defaultJwtAccessIssuer = "marketo-api";
const defaultJwtAccessAudience = "marketo-web";
const placeholderValues = new Set([
  "change_this_password",
  "replace_with_strong_secret",
  "replace_with_database_url",
  "replace_with_redis_url",
  "replace_with_stripe_secret_key",
  "replace_with_stripe_webhook_secret",
  "your_16_character_app_password",
  "your_app_password",
  "your_api_key",
  "your_api_secret",
  "your_cloud_name",
  "your_email@gmail.com"
]);
const placeholderFragments = [
  "example.com",
  "user:password@host",
  "user:password@db-host",
  "default:password@host",
  "default:password@redis-host",
  "replace_with_",
  "your_"
];

export function validateEnv(config: EnvConfig) {
  const nodeEnv = parseNodeEnv(config.NODE_ENV);
  const missing = requiredVariables.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const port = Number(config.PORT ?? 5000);
  const accessTokenTtlSeconds = Number(config.JWT_ACCESS_TOKEN_TTL_SECONDS ?? 900);
  const refreshTokenTtlDays = Number(config.JWT_REFRESH_TOKEN_TTL_DAYS ?? 30);
  const queueWorkerConcurrency = Number(config.QUEUE_WORKER_CONCURRENCY ?? 5);
  const gmailSmtpPort = Number(config.GMAIL_SMTP_PORT ?? 465);
  const gmailSmtpSecure = parseBoolean(config.GMAIL_SMTP_SECURE, true, "GMAIL_SMTP_SECURE");
  const allowTestStripeKeys = parseBoolean(config.ALLOW_TEST_STRIPE_KEYS, false, "ALLOW_TEST_STRIPE_KEYS");
  const rateLimitWindowMs = Number(config.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const rateLimitMax = Number(config.RATE_LIMIT_MAX ?? 120);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port.");
  }

  if (!Number.isInteger(accessTokenTtlSeconds) || accessTokenTtlSeconds < 60 || accessTokenTtlSeconds > 900) {
    throw new Error("JWT_ACCESS_TOKEN_TTL_SECONDS must be between 60 and 900 seconds.");
  }

  if (!Number.isInteger(refreshTokenTtlDays) || refreshTokenTtlDays < 1) {
    throw new Error("JWT_REFRESH_TOKEN_TTL_DAYS must be at least 1 day.");
  }

  if (!Number.isInteger(queueWorkerConcurrency) || queueWorkerConcurrency < 1 || queueWorkerConcurrency > 50) {
    throw new Error("QUEUE_WORKER_CONCURRENCY must be an integer between 1 and 50.");
  }

  if (!Number.isInteger(rateLimitWindowMs) || rateLimitWindowMs < 1_000) {
    throw new Error("RATE_LIMIT_WINDOW_MS must be at least 1000 milliseconds.");
  }

  if (!Number.isInteger(rateLimitMax) || rateLimitMax < 1) {
    throw new Error("RATE_LIMIT_MAX must be at least 1.");
  }

  validateUrls(config);
  validateRedis(config, nodeEnv);
  validateGmail(config, gmailSmtpPort);
  validateProductionLikeConfig(config, nodeEnv, allowTestStripeKeys);

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: port,
    JWT_ACCESS_TOKEN_TTL_SECONDS: accessTokenTtlSeconds,
    JWT_ACCESS_ISSUER: config.JWT_ACCESS_ISSUER ?? defaultJwtAccessIssuer,
    JWT_ACCESS_AUDIENCE: config.JWT_ACCESS_AUDIENCE ?? defaultJwtAccessAudience,
    JWT_REFRESH_TOKEN_TTL_DAYS: refreshTokenTtlDays,
    QUEUE_WORKER_CONCURRENCY: queueWorkerConcurrency,
    GMAIL_SMTP_PORT: gmailSmtpPort,
    GMAIL_SMTP_SECURE: gmailSmtpSecure,
    ALLOW_TEST_STRIPE_KEYS: allowTestStripeKeys,
    RATE_LIMIT_WINDOW_MS: rateLimitWindowMs,
    RATE_LIMIT_MAX: rateLimitMax
  };
}

function parseNodeEnv(value: string | undefined): AppEnvironment {
  const normalized = (value?.trim() || "development") as AppEnvironment;

  if (!appEnvironments.includes(normalized)) {
    throw new Error(`NODE_ENV must be one of: ${appEnvironments.join(", ")}.`);
  }

  return normalized;
}

function validateUrls(config: EnvConfig) {
  if (config.FRONTEND_URL) {
    parseUrl(config.FRONTEND_URL, "FRONTEND_URL");
  }

  const corsOrigins = splitCsv(config.CORS_ORIGIN);

  for (const origin of corsOrigins) {
    if (origin === "*") {
      throw new Error("CORS_ORIGIN cannot include *.");
    }

    parseUrl(origin, "CORS_ORIGIN");
  }
}

function validateRedis(config: EnvConfig, nodeEnv: AppEnvironment) {
  if (config.REDIS_URL && !/^rediss?:\/\//i.test(config.REDIS_URL)) {
    throw new Error("REDIS_URL must use the redis:// or rediss:// protocol.");
  }

  if (productionLikeEnvironments.has(nodeEnv) && config.REDIS_URL && !config.REDIS_URL.startsWith("rediss://")) {
    throw new Error("REDIS_URL must use rediss:// in staging and production.");
  }
}

function validateGmail(config: EnvConfig, gmailSmtpPort: number) {
  const gmailUser = config.GMAIL_USER?.trim();
  const gmailAppPassword = config.GMAIL_APP_PASSWORD?.trim();

  if (Boolean(gmailUser) !== Boolean(gmailAppPassword)) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be configured together.");
  }

  if (gmailUser && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmailUser)) {
    throw new Error("GMAIL_USER must be a valid email address.");
  }

  if (!Number.isInteger(gmailSmtpPort) || gmailSmtpPort < 1 || gmailSmtpPort > 65535) {
    throw new Error("GMAIL_SMTP_PORT must be a valid TCP port.");
  }
}

function validateProductionLikeConfig(config: EnvConfig, nodeEnv: AppEnvironment, allowTestStripeKeys: boolean) {
  if (!productionLikeEnvironments.has(nodeEnv)) {
    return;
  }

  requireHttps(config.FRONTEND_URL, "FRONTEND_URL");
  requirePresent(config.CORS_ORIGIN, "CORS_ORIGIN");
  requirePresent(config.REDIS_URL, "REDIS_URL");

  for (const origin of splitCsv(config.CORS_ORIGIN)) {
    requireHttps(origin, "CORS_ORIGIN");
  }

  requireStrongSecret(config.JWT_ACCESS_SECRET, "JWT_ACCESS_SECRET");
  requireStrongSecret(config.JWT_REFRESH_SECRET, "JWT_REFRESH_SECRET");

  if (config.JWT_ACCESS_SECRET === config.JWT_REFRESH_SECRET) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.");
  }

  if (!config.DATABASE_URL?.includes("sslmode=require")) {
    throw new Error("DATABASE_URL must include sslmode=require in staging and production.");
  }

  if (nodeEnv === "production") {
    requirePresent(config.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY");
    requirePresent(config.STRIPE_WEBHOOK_SECRET, "STRIPE_WEBHOOK_SECRET");
    requirePresent(config.GMAIL_USER, "GMAIL_USER");
    requirePresent(config.GMAIL_APP_PASSWORD, "GMAIL_APP_PASSWORD");

    if (!isAllowedProductionStripeKey(config.STRIPE_SECRET_KEY, allowTestStripeKeys)) {
      throw new Error("STRIPE_SECRET_KEY must use a live Stripe key in production unless ALLOW_TEST_STRIPE_KEYS=true.");
    }
  }

  requireNonPlaceholder(config.ADMIN_PASSWORD, "ADMIN_PASSWORD");

  if (config.ADMIN_PASSWORD && config.ADMIN_PASSWORD.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters in staging and production.");
  }

  if (config.ADMIN_EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.ADMIN_EMAIL)) {
    throw new Error("ADMIN_EMAIL must be a valid email address.");
  }

  for (const key of Object.keys(config)) {
    requireNonPlaceholder(config[key], key);
  }
}

function isAllowedProductionStripeKey(value: string | undefined, allowTestStripeKeys: boolean) {
  if (!value) {
    return false;
  }

  return value.startsWith("sk_live_") || (allowTestStripeKeys && value.startsWith("sk_test_"));
}

function requireStrongSecret(value: string | undefined, key: string) {
  requirePresent(value, key);
  requireNonPlaceholder(value, key);

  if (value && value.length < 32) {
    throw new Error(`${key} must be at least 32 characters in staging and production.`);
  }
}

function requirePresent(value: string | undefined, key: string) {
  if (!value?.trim()) {
    throw new Error(`${key} is required in production.`);
  }
}

function requireNonPlaceholder(value: string | undefined, key: string) {
  if (!value) {
    return;
  }

  const normalized = value.trim().toLowerCase();

  if (
    placeholderValues.has(normalized) ||
    placeholderFragments.some((fragment) => normalized.includes(fragment))
  ) {
    throw new Error(`${key} must not use a placeholder value in staging or production.`);
  }
}

function requireHttps(value: string | undefined, key: string) {
  const url = parseUrl(value, key);

  if (url.protocol !== "https:") {
    throw new Error(`${key} must use https:// in staging and production.`);
  }
}

function parseUrl(value: string | undefined, key: string) {
  if (!value?.trim()) {
    throw new Error(`${key} must be a valid URL.`);
  }

  try {
    return new URL(value.trim());
  } catch {
    throw new Error(`${key} must be a valid URL.`);
  }
}

function splitCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseBoolean(value: string | undefined, fallback: boolean, key: string) {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no"].includes(normalized)) {
    return false;
  }

  throw new Error(`${key} must be true or false.`);
}