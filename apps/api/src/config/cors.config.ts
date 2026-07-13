type CorsCallback = (error: Error | null, allow?: boolean) => void;

export function parseCsvList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function createCorsOriginHandler(allowedOrigins: string[]) {
  const allowed = new Set(allowedOrigins);

  return (origin: string | undefined, callback: CorsCallback) => {
    if (!origin || allowed.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("CORS origin is not allowed."), false);
  };
}
