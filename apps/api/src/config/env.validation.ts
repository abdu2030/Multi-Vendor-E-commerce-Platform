type EnvConfig = Record<string, string | undefined>;

const requiredVariables = ["DATABASE_URL"] as const;

export function validateEnv(config: EnvConfig) {
  const missing = requiredVariables.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const port = Number(config.PORT ?? 5000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port.");
  }

  return {
    ...config,
    PORT: port
  };
}
