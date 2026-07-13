import { HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LoginRateLimitService } from "./login-rate-limit.service";

describe("LoginRateLimitService", () => {
  it("blocks repeated login attempts", () => {
    const service = new LoginRateLimitService({
      get: jest.fn((key: string) => {
        const values: Record<string, number> = {
          LOGIN_RATE_LIMIT_MAX: 2,
          LOGIN_RATE_LIMIT_WINDOW_MS: 60_000,
          LOGIN_RATE_LIMIT_LOCKOUT_MS: 60_000
        };

        return values[key];
      })
    } as unknown as ConfigService);

    service.assertCanAttempt("buyer@example.com");
    service.recordFailedAttempt("buyer@example.com");
    service.assertCanAttempt("BUYER@example.com");
    service.recordFailedAttempt("buyer@example.com");

    expect(() => service.assertCanAttempt("buyer@example.com")).toThrow(HttpException);
    try {
      service.assertCanAttempt("buyer@example.com");
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it("clears failed login attempts after successful authentication", () => {
    const service = new LoginRateLimitService({
      get: jest.fn((key: string) => {
        const values: Record<string, number> = {
          LOGIN_RATE_LIMIT_MAX: 2,
          LOGIN_RATE_LIMIT_WINDOW_MS: 60_000,
          LOGIN_RATE_LIMIT_LOCKOUT_MS: 60_000
        };

        return values[key];
      })
    } as unknown as ConfigService);

    service.recordFailedAttempt("buyer@example.com");
    service.clear("buyer@example.com");

    expect(() => service.assertCanAttempt("buyer@example.com")).not.toThrow();
  });
});