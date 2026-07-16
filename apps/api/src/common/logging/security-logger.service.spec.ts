import { Test } from "@nestjs/testing";
import { SecurityLoggerService } from "./security-logger.service";

describe("SecurityLoggerService", () => {
  it("writes structured security events with sensitive values redacted", () => {
    const logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    const service = new SecurityLoggerService(logger as never);

    service.log("LOGIN_FAILURE", {
      authorization: "Bearer raw.access.token",
      refreshToken: "raw-refresh-token",
      cookie: "sid=raw-cookie",
      password: "plain-password",
      passwordHash: "hashed-password",
      smtpPassword: "smtp-secret",
      cardNumber: "4242424242424242",
      nested: {
        apiKey: "provider-api-key"
      }
    });

    expect(logger.warn).toHaveBeenCalledTimes(1);
    const payload = logger.warn.mock.calls[0][0] as string;

    expect(payload).toContain('"event":"LOGIN_FAILURE"');
    expect(payload).toContain("[REDACTED]");
    expect(payload).not.toContain("raw.access.token");
    expect(payload).not.toContain("raw-refresh-token");
    expect(payload).not.toContain("raw-cookie");
    expect(payload).not.toContain("plain-password");
    expect(payload).not.toContain("hashed-password");
    expect(payload).not.toContain("smtp-secret");
    expect(payload).not.toContain("4242424242424242");
    expect(payload).not.toContain("provider-api-key");
  });
  it("can be resolved by Nest without an injected logger provider", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [SecurityLoggerService]
    }).compile();

    expect(moduleRef.get(SecurityLoggerService)).toBeInstanceOf(SecurityLoggerService);
    await moduleRef.close();
  });
});
