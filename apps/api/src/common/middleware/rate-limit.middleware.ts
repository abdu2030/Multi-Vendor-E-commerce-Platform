import { NextFunction, Request, Response } from "express";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  windowMs: number;
  max: number;
  skipPaths?: string[];
  now?: () => number;
  keyGenerator?: (request: Request) => string;
};

export function createRateLimitMiddleware(options: RateLimitOptions) {
  const windowMs = Math.max(1_000, options.windowMs);
  const max = Math.max(1, options.max);
  const now = options.now ?? Date.now;
  const keyGenerator = options.keyGenerator ?? getClientIp;
  const skipPaths = new Set((options.skipPaths ?? []).map(normalizePath));
  const store = new Map<string, RateLimitEntry>();
  let requestCount = 0;

  return (request: Request, response: Response, next: NextFunction) => {
    const route = normalizePath(request.originalUrl.split("?")[0] ?? request.path);

    if (skipPaths.has(route)) {
      next();
      return;
    }

    const currentTime = now();
    requestCount += 1;

    if (requestCount % 250 === 0) {
      pruneExpiredEntries(store, currentTime);
    }

    const key = keyGenerator(request);
    const existing = store.get(key);
    const entry =
      existing && existing.resetAt > currentTime
        ? existing
        : {
            count: 0,
            resetAt: currentTime + windowMs
          };

    entry.count += 1;
    store.set(key, entry);
    setRateLimitHeaders(response, max, entry, currentTime);

    if (entry.count > max) {
      response.status(429).json({
        success: false,
        statusCode: 429,
        message: "Too many requests. Try again later.",
        path: request.originalUrl,
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
}

function getClientIp(request: Request) {
  return request.ip || request.socket.remoteAddress || "unknown";
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function pruneExpiredEntries(store: Map<string, RateLimitEntry>, currentTime: number) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= currentTime) {
      store.delete(key);
    }
  }
}

function setRateLimitHeaders(
  response: Response,
  max: number,
  entry: RateLimitEntry,
  currentTime: number
) {
  const remaining = Math.max(0, max - entry.count);
  const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - currentTime) / 1_000));

  response.setHeader("X-RateLimit-Limit", String(max));
  response.setHeader("X-RateLimit-Remaining", String(remaining));
  response.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1_000)));

  if (remaining === 0) {
    response.setHeader("Retry-After", String(resetSeconds));
  }
}
