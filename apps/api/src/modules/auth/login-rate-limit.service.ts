import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type LoginAttemptEntry = {
  count: number;
  resetAt: number;
  lockedUntil?: number;
};

@Injectable()
export class LoginRateLimitService {
  private readonly attempts = new Map<string, LoginAttemptEntry>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly lockoutMs: number;

  constructor(config: ConfigService) {
    this.maxAttempts = Number(config.get("LOGIN_RATE_LIMIT_MAX") ?? 5);
    this.windowMs = Number(config.get("LOGIN_RATE_LIMIT_WINDOW_MS") ?? 15 * 60 * 1000);
    this.lockoutMs = Number(config.get("LOGIN_RATE_LIMIT_LOCKOUT_MS") ?? 15 * 60 * 1000);
  }

  assertCanAttempt(identifier: string) {
    const key = this.normalizeIdentifier(identifier);
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry) {
      return;
    }

    if (entry.lockedUntil && entry.lockedUntil > now) {
      throw new HttpException("Too many login attempts. Try again later.", HttpStatus.TOO_MANY_REQUESTS);
    }

    if (entry.resetAt <= now) {
      this.attempts.delete(key);
    }
  }

  recordFailedAttempt(identifier: string) {
    const key = this.normalizeIdentifier(identifier);
    const now = Date.now();
    const existing = this.attempts.get(key);
    const entry = existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + this.windowMs };

    entry.count += 1;

    if (entry.count >= this.maxAttempts) {
      entry.lockedUntil = now + this.lockoutMs;
    }

    this.attempts.set(key, entry);
  }

  clear(identifier: string) {
    this.attempts.delete(this.normalizeIdentifier(identifier));
  }

  private normalizeIdentifier(identifier: string) {
    return identifier.trim().toLowerCase();
  }
}