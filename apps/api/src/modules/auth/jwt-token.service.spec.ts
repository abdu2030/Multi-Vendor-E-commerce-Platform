import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Role } from "@prisma/client";
import { createHmac } from "crypto";
import { JwtTokenService } from "./jwt-token.service";

describe("JwtTokenService", () => {
  const secret = "access_secret_for_tests_32_bytes_long";

  function createService() {
    return new JwtTokenService({
      get: jest.fn((key: string) => {
        const values: Record<string, string | number> = {
          JWT_ACCESS_SECRET: secret,
          JWT_ACCESS_TOKEN_TTL_SECONDS: 900
        };

        return values[key];
      })
    } as unknown as ConfigService);
  }

  it("signs and verifies a minimal access token", () => {
    const service = createService();
    const token = service.signAccessToken({
      id: "user_1",
      email: "buyer@example.com",
      fullName: "Buyer One",
      role: Role.BUYER
    });

    expect(service.verifyAccessToken(token)).toEqual({
      id: "user_1",
      email: "buyer@example.com",
      fullName: "Buyer One",
      role: Role.BUYER
    });
  });

  it("rejects a token with a valid signature but unexpected JWT algorithm header", () => {
    const service = createService();
    const token = signToken(
      { alg: "none", typ: "JWT" },
      {
        sub: "user_1",
        id: "user_1",
        email: "buyer@example.com",
        fullName: "Buyer One",
        role: Role.BUYER,
        type: "access",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900
      }
    );

    expect(() => service.verifyAccessToken(token)).toThrow(UnauthorizedException);
  });

  it("rejects a signed access token without an expiration", () => {
    const service = createService();
    const token = signToken(
      { alg: "HS256", typ: "JWT" },
      {
        sub: "user_1",
        id: "user_1",
        email: "buyer@example.com",
        fullName: "Buyer One",
        role: Role.BUYER,
        type: "access",
        iat: Math.floor(Date.now() / 1000)
      }
    );

    expect(() => service.verifyAccessToken(token)).toThrow(UnauthorizedException);
  });

  function signToken(header: Record<string, unknown>, payload: Record<string, unknown>) {
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = createHmac("sha256", secret).update(data).digest("base64url");

    return `${data}.${signature}`;
  }
});