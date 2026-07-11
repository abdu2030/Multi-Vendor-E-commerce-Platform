type EnvConfig = Record<string, string | undefined>;

const requiredVariables = ["DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const;

export function validateEnv(config: EnvConfig) {
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
  const rateLimitWindowMs = Number(config.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const rateLimitMax = Number(config.RATE_LIMIT_MAX ?? 120);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port.");
  }

  if (!Number.isInteger(accessTokenTtlSeconds) || accessTokenTtlSeconds < 60) {
    throw new Error("JWT_ACCESS_TOKEN_TTL_SECONDS must be at least 60 seconds.");
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

  if (config.REDIS_URL && !/^rediss?:\/\//i.test(config.REDIS_URL)) {
    throw new Error("REDIS_URL must use the redis:// or rediss:// protocol.");
  }

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

  return {
    ...config,
    PORT: port,
    JWT_ACCESS_TOKEN_TTL_SECONDS: accessTokenTtlSeconds,
    JWT_REFRESH_TOKEN_TTL_DAYS: refreshTokenTtlDays,
    QUEUE_WORKER_CONCURRENCY: queueWorkerConcurrency,
    GMAIL_SMTP_PORT: gmailSmtpPort,
    GMAIL_SMTP_SECURE: gmailSmtpSecure,
    RATE_LIMIT_WINDOW_MS: rateLimitWindowMs,
    RATE_LIMIT_MAX: rateLimitMax
  };
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
