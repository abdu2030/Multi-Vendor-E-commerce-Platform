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

  if (config.REDIS_URL && !/^rediss?:\/\//i.test(config.REDIS_URL)) {
    throw new Error("REDIS_URL must use the redis:// or rediss:// protocol.");
  }

  return {
    ...config,
    PORT: port,
    JWT_ACCESS_TOKEN_TTL_SECONDS: accessTokenTtlSeconds,
    JWT_REFRESH_TOKEN_TTL_DAYS: refreshTokenTtlDays,
    QUEUE_WORKER_CONCURRENCY: queueWorkerConcurrency
  };
}
