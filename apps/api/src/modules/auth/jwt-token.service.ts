import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Role } from "@prisma/client";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

type JwtHeader = {
  alg?: unknown;
  typ?: unknown;
};

type AccessTokenSubject = {
  id: string;
  role: Role;
  sessionId: string;
};

type AccessTokenPayload = {
  sub: string;
  sessionId: string;
  role: Role;
  jti: string;
  type: "access";
  iss: string;
  aud: string;
  iat: number;
  exp: number;
};

const ACCESS_TOKEN_ALGORITHM = "HS256";
const ACCESS_TOKEN_TYPE = "access";
const DEFAULT_ACCESS_TOKEN_ISSUER = "marketo-api";
const DEFAULT_ACCESS_TOKEN_AUDIENCE = "marketo-web";

@Injectable()
export class JwtTokenService {
  constructor(private readonly config: ConfigService) {}

  signAccessToken(user: AccessTokenSubject) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresInSeconds = Number(this.config.get("JWT_ACCESS_TOKEN_TTL_SECONDS") ?? 900);
    const payload: AccessTokenPayload = {
      sub: user.id,
      sessionId: user.sessionId,
      role: user.role,
      jti: randomUUID(),
      type: ACCESS_TOKEN_TYPE,
      iss: this.getIssuer(),
      aud: this.getAudience(),
      iat: issuedAt,
      exp: issuedAt + expiresInSeconds
    };

    return this.sign(payload, this.getSecret());
  }

  verifyAccessToken(token: string): AuthenticatedUser {
    const payload = this.verify<AccessTokenPayload>(token, this.getSecret());

    if (
      payload.type !== ACCESS_TOKEN_TYPE ||
      !isNonEmptyString(payload.sub) ||
      !isNonEmptyString(payload.sessionId) ||
      !isRole(payload.role) ||
      !isNonEmptyString(payload.jti)
    ) {
      throw new UnauthorizedException("Invalid authentication token.");
    }

    return {
      id: payload.sub,
      role: payload.role,
      sessionId: payload.sessionId
    };
  }

  private sign(payload: AccessTokenPayload, secret: string) {
    const header = this.encode({ alg: ACCESS_TOKEN_ALGORITHM, typ: "JWT" });
    const body = this.encode(payload);
    const data = `${header}.${body}`;
    const signature = createHmac("sha256", secret).update(data).digest("base64url");

    return `${data}.${signature}`;
  }

  private verify<T extends { aud?: unknown; exp?: unknown; iat?: unknown; iss?: unknown }>(token: string, secret: string): T {
    const parts = token.split(".");

    if (parts.length !== 3) {
      throw new UnauthorizedException("Invalid authentication token.");
    }

    const [header, body, signature] = parts;

    if (!header || !body || !signature) {
      throw new UnauthorizedException("Invalid authentication token.");
    }

    const jwtHeader = this.decode<JwtHeader>(header);

    if (jwtHeader.alg !== ACCESS_TOKEN_ALGORITHM || jwtHeader.typ !== "JWT") {
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

    const payload = this.decode<T>(body);
    const now = Math.floor(Date.now() / 1000);

    if (payload.iss !== this.getIssuer() || payload.aud !== this.getAudience()) {
      throw new UnauthorizedException("Invalid authentication token.");
    }

    if (typeof payload.iat !== "number" || !Number.isInteger(payload.iat) || payload.iat > now) {
      throw new UnauthorizedException("Invalid authentication token.");
    }

    if (typeof payload.exp !== "number" || !Number.isInteger(payload.exp)) {
      throw new UnauthorizedException("Invalid authentication token.");
    }

    if (payload.exp <= now) {
      throw new UnauthorizedException("Authentication token has expired.");
    }

    return payload;
  }

  private encode(value: unknown) {
    return Buffer.from(JSON.stringify(value)).toString("base64url");
  }

  private decode<T>(value: string): T {
    try {
      const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));

      if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
        throw new Error("JWT segment must be an object.");
      }

      return decoded as T;
    } catch {
      throw new UnauthorizedException("Invalid authentication token.");
    }
  }

  private getSecret() {
    const secret = this.config.get<string>("JWT_ACCESS_SECRET");

    if (!secret) {
      throw new Error("JWT_ACCESS_SECRET is required.");
    }

    return secret;
  }

  private getIssuer() {
    return this.config.get<string>("JWT_ACCESS_ISSUER") ?? DEFAULT_ACCESS_TOKEN_ISSUER;
  }

  private getAudience() {
    return this.config.get<string>("JWT_ACCESS_AUDIENCE") ?? DEFAULT_ACCESS_TOKEN_AUDIENCE;
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRole(value: unknown): value is Role {
  return typeof value === "string" && Object.values(Role).includes(value as Role);
}