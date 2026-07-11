import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Role } from "@prisma/client";
import { createHash } from "crypto";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "./auth.service";
import { JwtTokenService } from "./jwt-token.service";
import { PasswordService } from "./password.service";

describe("AuthService", () => {
  function createService(overrides: {
    prisma?: Record<string, unknown>;
    password?: Partial<PasswordService>;
    jwt?: Partial<JwtTokenService>;
    notifications?: Partial<NotificationsService>;
    config?: Partial<ConfigService>;
  } = {}) {
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string | number> = {
          JWT_REFRESH_SECRET: "refresh_secret",
          JWT_REFRESH_TOKEN_TTL_DAYS: 30
        };

        return values[key];
      }),
      ...overrides.config
    } as unknown as ConfigService;
    const jwt = {
      signAccessToken: jest.fn().mockReturnValue("access_token"),
      ...overrides.jwt
    } as unknown as JwtTokenService;
    const password = {
      hashPassword: jest.fn().mockResolvedValue("hashed_password"),
      verifyPassword: jest.fn().mockResolvedValue(true),
      ...overrides.password
    } as unknown as PasswordService;
    const prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn()
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn()
      },
      ...overrides.prisma
    };
    const notifications = {
      create: jest.fn().mockResolvedValue(undefined),
      ...overrides.notifications
    } as unknown as NotificationsService;

    return {
      config,
      jwt,
      password,
      prisma,
      notifications,
      service: new AuthService(
        config,
        jwt,
        password,
        prisma as unknown as PrismaService,
        notifications
      )
    };
  }

  it("registers a normalized user, creates a refresh token, and queues a welcome notification", async () => {
    const user = buildUser({ email: "buyer@example.com", fullName: "Buyer One" });
    const { service, prisma, password, jwt, notifications } = createService();

    (prisma.user as { findUnique: jest.Mock; create: jest.Mock }).findUnique.mockResolvedValue(null);
    (prisma.user as { findUnique: jest.Mock; create: jest.Mock }).create.mockResolvedValue(user);

    const result = await service.register({
      fullName: " Buyer One ",
      email: " BUYER@EXAMPLE.COM ",
      password: "password123",
      phone: " +251900000000 "
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "buyer@example.com" } });
    expect(password.hashPassword).toHaveBeenCalledWith("password123");
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        fullName: "Buyer One",
        email: "buyer@example.com",
        phone: "+251900000000",
        passwordHash: "hashed_password"
      }
    });
    expect(jwt.signAccessToken).toHaveBeenCalledWith(expect.objectContaining({
      id: user.id,
      email: user.email,
      role: Role.BUYER
    }));
    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: user.id,
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date)
      })
    });
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: user.id,
      idempotencyKey: `user-welcome-${user.id}`,
      emailTemplate: "welcome"
    }));
    expect(result).toEqual(expect.objectContaining({
      accessToken: "access_token",
      refreshToken: expect.any(String),
      user: expect.not.objectContaining({ passwordHash: expect.any(String) })
    }));
  });

  it("rejects duplicate registration emails", async () => {
    const { service, prisma } = createService();

    (prisma.user as { findUnique: jest.Mock }).findUnique.mockResolvedValue(buildUser());

    await expect(service.register({
      fullName: "Buyer One",
      email: "buyer@example.com",
      password: "password123"
    })).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects invalid login credentials", async () => {
    const { service, prisma, password } = createService({
      password: { verifyPassword: jest.fn().mockResolvedValue(false) }
    });

    (prisma.user as { findUnique: jest.Mock }).findUnique.mockResolvedValue(buildUser());

    await expect(service.login({
      email: "buyer@example.com",
      password: "wrong-password"
    })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(password.verifyPassword).toHaveBeenCalledWith("wrong-password", "hashed_password");
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it("rotates a valid refresh token", async () => {
    const user = buildUser();
    const storedRefreshToken = {
      id: "refresh_1",
      tokenHash: hashRefreshToken("refresh_token", "refresh_secret"),
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user
    };
    const { service, prisma } = createService();

    (prisma.refreshToken as { findUnique: jest.Mock }).findUnique.mockResolvedValue(storedRefreshToken);

    const result = await service.refresh("refresh_token");

    expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: storedRefreshToken.tokenHash },
      include: { user: true }
    });
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: "refresh_1" },
      data: { revokedAt: expect.any(Date) }
    });
    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: user.id })
    });
    expect(result.refreshToken).toEqual(expect.any(String));
  });
});

function buildUser(overrides: Partial<ReturnType<typeof buildUserShape>> = {}) {
  return {
    ...buildUserShape(),
    ...overrides
  };
}

function buildUserShape() {
  return {
    id: "user_1",
    fullName: "Buyer One",
    email: "buyer@example.com",
    passwordHash: "hashed_password",
    role: Role.BUYER,
    phone: null,
    emailVerifiedAt: null,
    refreshTokenHash: null,
    resetTokenHash: null,
    resetTokenExpiresAt: null,
    createdAt: new Date("2026-07-01T10:00:00.000Z"),
    updatedAt: new Date("2026-07-01T10:00:00.000Z")
  };
}

function hashRefreshToken(refreshToken: string, secret: string) {
  return createHash("sha256").update(`${refreshToken}.${secret}`).digest("hex");
}
