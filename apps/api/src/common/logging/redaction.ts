const sensitiveKeyPattern =
  /(password|passwordHash|accessToken|refreshToken|authorization|bearer|cookie|apiKey|api[_-]?key|secret|smtp|card|cvv|pan|privateKey|private[_-]?key)/i;
const bearerTokenPattern = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const tokenLikePattern = /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g;
const urlCredentialPattern = /(\b[a-z][a-z0-9+.-]*:\/\/)([^\s/@:]+):([^\s/@]+)@/gi;
const sensitiveQueryPattern = /([?&](?:token|access_token|refresh_token|api_key|apikey|key|secret|password|signature)=)[^&\s]+/gi;

export const REDACTED_VALUE = "[REDACTED]";

export function redactSensitive(value: unknown): unknown {
  if (typeof value === "string") {
    return redactString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const redacted: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    redacted[key] = sensitiveKeyPattern.test(key) ? REDACTED_VALUE : redactSensitive(nestedValue);
  }

  return redacted;
}

export function safeStringifyLog(fields: Record<string, unknown>) {
  return JSON.stringify(redactSensitive(fields));
}

function redactString(value: string) {
  return value
    .replace(bearerTokenPattern, `Bearer ${REDACTED_VALUE}`)
    .replace(tokenLikePattern, REDACTED_VALUE)
    .replace(urlCredentialPattern, `$1${REDACTED_VALUE}:${REDACTED_VALUE}@`)
    .replace(sensitiveQueryPattern, `$1${REDACTED_VALUE}`);
}
