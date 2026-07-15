import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

const windowMs = 15 * 60 * 1000;
const maxAttempts = 3;

type EmailActionAttempt = {
  count: number;
  resetAt: number;
};

@Injectable()
export class EmailActionRateLimitService {
  private readonly attempts = new Map<string, EmailActionAttempt>();

  assertCanSend(action: string, email: string) {
    const key = `${action}:${email.trim().toLowerCase()}`;
    const now = Date.now();
    const existing = this.attempts.get(key);

    if (!existing || existing.resetAt <= now) {
      this.attempts.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (existing.count >= maxAttempts) {
      throw new HttpException("Too many email requests. Try again later.", HttpStatus.TOO_MANY_REQUESTS);
    }

    existing.count += 1;
  }
}
