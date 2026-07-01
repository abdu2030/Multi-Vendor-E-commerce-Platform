import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Role } from "@prisma/client";
import { createHmac, timingSafeEqual } from "crypto";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

type AccessTokenPayload = AuthenticatedUser & {
  sub: string;
  type: "access";
  iat: number;
  exp: number;
};

@Injectable()
export class JwtTokenService {
  constructor(private readonly config: ConfigService) {}

  signAccessToken(user: AuthenticatedUser) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresInSeconds = Number(this.config.get("JWT_ACCESS_TOKEN_TTL_SECONDS") ?? 900);
    const payload: AccessTokenPayload = {
      ...user,
      sub: user.id,
      type: "access",
      iat: issuedAt,
      exp: issuedAt + expiresInSeconds
    };

    return this.sign(payload, this.getSecret());
  }

  verifyAccessToken(token: string): AuthenticatedUser {
    const payload = this.verify<AccessTokenPayload>(token, this.getSecret());

    if (payload.type !== "access" || !payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException("Invalid authentication token.");
    }

    return {
      id: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role
    };
  }

  private sign(payload: AccessTokenPayload, secret: string) {
    const header = this.encode({ alg: "HS256", typ: "JWT" });
    const body = this.encode(payload);
    const data = `${header}.${body}`;
    const signature = createHmac("sha256", secret).update(data).digest("base64url");

    return `${data}.${signature}`;
  }

  private verify<T extends { exp?: number }>(token: string, secret: string): T {
    const [header, body, signature] = token.split(".");

    if (!header || !body || !signature) {
      throw new UnauthorizedException("Invalid authentication token.");
    }

    const expectedSignature = createHmac("sha256", secret)
      .update(`${header}.${body}`)
      .digest("base64url");

    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(signature);

    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      throw new UnauthorizedException("Invalid authentication token.");
    }

    let payload: T;

    try {
      payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
    } catch {
      throw new UnauthorizedException("Invalid authentication token.");
    }

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException("Authentication token has expired.");
    }

    return payload;
  }

  private encode(value: unknown) {
    return Buffer.from(JSON.stringify(value)).toString("base64url");
  }

  private getSecret() {
    const secret = this.config.get<string>("JWT_ACCESS_SECRET");

    if (!secret) {
      throw new Error("JWT_ACCESS_SECRET is required.");
    }

    return secret;
  }
}
