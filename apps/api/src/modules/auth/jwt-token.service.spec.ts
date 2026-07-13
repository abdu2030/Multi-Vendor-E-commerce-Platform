import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Role } from "@prisma/client";
import { createHmac } from "crypto";
import { JwtTokenService } from "./jwt-token.service";

describe("JwtTokenService", () => {
  const secret = "access_secret_for_tests_32_bytes_long";
  const issuer = "marketo-api-test";
  const audience = "marketo-web-test";

  function createService() {
    return new JwtTokenService({
      get: jest.fn((key: string) => {
        const values: Record<string, string | number> = {
          JWT_ACCESS_SECRET: secret,
          JWT_ACCESS_TOKEN_TTL_SECONDS: 900,
          JWT_ACCESS_ISSUER: issuer,
          JWT_ACCESS_AUDIENCE: audience
        };

        return values[key];
      })
    } as unknown as ConfigService);
  }

  it("signs and verifies a minimal session-bound access token", () => {
    const service = createService();
    const token = service.signAccessToken({
      id: "user_1",
      role: Role.BUYER,
      sessionId: "session_1"
    });
    const payload = decodePayload(token);

    expect(payload).toEqual(expect.objectContaining({
      sub: "user_1",
      role: Role.BUYER,
      sessionId: "session_1",
      type: "access",
      iss: issuer,
      aud: audience,
      jti: expect.any(String),
      iat: expect.any(Number),
      exp: expect.any(Number)
    }));
    expect(payload).not.toHaveProperty("email");
    expect(payload).not.toHaveProperty("fullName");
    expect(service.verifyAccessToken(token)).toEqual({
      id: "user_1",
      role: Role.BUYER,
      sessionId: "session_1"
    });
  });

  it("rejects an expired token", () => {
    const service = createService();
    const token = signToken({
      exp: Math.floor(Date.now() / 1000) - 1
    });

    expect(() => service.verifyAccessToken(token)).toThrow(UnauthorizedException);
  });

  it("rejects an invalid signature", () => {
    const service = createService();
    const token = signToken();
    const [header, body] = token.split(".");

    expect(() => service.verifyAccessToken(`${header}.${body}.invalid_signature`)).toThrow(UnauthorizedException);
  });

  it("rejects a modified token payload", () => {
    const service = createService();
    const token = service.signAccessToken({
      id: "user_1",
      role: Role.BUYER,
      sessionId: "session_1"
    });
    const [header, body, signature] = token.split(".");
    const payload = decodePayload(token);
    const modifiedBody = Buffer.from(JSON.stringify({
      ...payload,
      role: Role.ADMIN
    })).toString("base64url");

    expect(() => service.verifyAccessToken(`${header}.${modifiedBody}.${signature}`)).toThrow(UnauthorizedException);
    expect(body).not.toEqual(modifiedBody);
  });

  it("rejects a token with an unexpected JWT algorithm header", () => {
    const service = createService();
    const token = signToken({}, { alg: "none", typ: "JWT" });

    expect(() => service.verifyAccessToken(token)).toThrow(UnauthorizedException);
  });

  it("rejects a token with the wrong issuer", () => {
    const service = createService();
    const token = signToken({ iss: "wrong-issuer" });

    expect(() => service.verifyAccessToken(token)).toThrow(UnauthorizedException);
  });

  it("rejects a token with the wrong audience", () => {
    const service = createService();
    const token = signToken({ aud: "wrong-audience" });

    expect(() => service.verifyAccessToken(token)).toThrow(UnauthorizedException);
  });

  function signToken(
    payloadOverrides: Record<string, unknown> = {},
    header: Record<string, unknown> = { alg: "HS256", typ: "JWT" }
  ) {
    const now = Math.floor(Date.now() / 1000);
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    const encodedPayload = Buffer.from(JSON.stringify({
      sub: "user_1",
      role: Role.BUYER,
      sessionId: "session_1",
      jti: "token_1",
      type: "access",
      iss: issuer,
      aud: audience,
      iat: now,
      exp: now + 900,
      ...payloadOverrides
    })).toString("base64url");
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = createHmac("sha256", secret).update(data).digest("base64url");

    return `${data}.${signature}`;
  }

  function decodePayload(token: string) {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as Record<string, unknown>;
  }
});