import { ConflictException, HttpException, HttpStatus, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Role } from "@prisma/client";
import { createHash } from "crypto";
import { EmailQueueService } from "../jobs/email-queue.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "./auth.service";
import { JwtTokenService } from "./jwt-token.service";
import { LoginRateLimitService } from "./login-rate-limit.service";
import { PasswordService } from "./password.service";

type MockPrisma = ReturnType<typeof buildPrisma>;

describe("AuthService", () => {
  function createService(overrides: {
    prisma?: Partial<MockPrisma>;
    password?: Partial<PasswordService>;
    jwt?: Partial<JwtTokenService>;
    notifications?: Partial<NotificationsService>;
    config?: Partial<ConfigService>;
    loginRateLimit?: Partial<LoginRateLimitService>;
    emailQueue?: Partial<EmailQueueService>;
    emailActionRateLimit?: { assertCanSend?: jest.Mock };
  } = {}) {
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string | number> = {
          NODE_ENV: "test",
          JWT_REFRESH_SECRET: "refresh_secret",
          JWT_REFRESH_TOKEN_TTL_DAYS: 30,
          PASSWORD_RESET_TOKEN_TTL_MINUTES: 30,
          EMAIL_VERIFICATION_TOKEN_TTL_HOURS: 24,
          FRONTEND_URL: "https://marketo.example"
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
      ...buildPrisma(),
      ...overrides.prisma
    } as MockPrisma;
    prisma.$transaction = jest.fn(async (callback: (tx: MockPrisma) => Promise<unknown>) => callback(prisma));
    const notifications = {
      create: jest.fn().mockResolvedValue(undefined),
      ...overrides.notifications
    } as unknown as NotificationsService;
    const loginRateLimit = {
      assertCanAttempt: jest.fn(),
      recordFailedAttempt: jest.fn(),
      clear: jest.fn(),
      ...overrides.loginRateLimit
    } as unknown as LoginRateLimitService;
    const emailQueue = {
      enqueue: jest.fn().mockResolvedValue(true),
      ...overrides.emailQueue
    } as unknown as EmailQueueService;
    const emailActionRateLimit = {
      assertCanSend: jest.fn(),
      ...overrides.emailActionRateLimit
    };

    return {
      config,
      jwt,
      password,
      prisma,
      notifications,
      loginRateLimit,
      emailQueue,
      emailActionRateLimit,
      service: new AuthService(
        config,
        jwt,
        password,
        prisma as unknown as PrismaService,
        notifications,
        loginRateLimit,
        emailQueue,
        emailActionRateLimit as never
      )
    };
  }

  it("registers a normalized buyer, stores only the password hash, and queues a welcome notification", async () => {
    const user = buildUser({ email: "buyer@example.com", fullName: "Buyer One" });
    const { service, prisma, password, jwt, notifications, emailQueue } = createService();

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(user);

    const result = await service.register({
      fullName: " Buyer One ",
      email: " BUYER@EXAMPLE.COM ",
      password: "StrongPass123",
      phone: " +251900000000 "
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "buyer@example.com" } });
    expect(password.hashPassword).toHaveBeenCalledWith("StrongPass123");
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        fullName: "Buyer One",
        email: "buyer@example.com",
        phone: "+251900000000",
        role: Role.BUYER,
        passwordHash: "hashed_password",
        emailVerificationTokenHash: expect.any(String),
        emailVerificationTokenExpiresAt: expect.any(Date)
      }
    });
    expect(JSON.stringify(prisma.user.create.mock.calls[0][0])).not.toContain("StrongPass123");
    expect(jwt.signAccessToken).toHaveBeenCalledWith(expect.objectContaining({
      id: user.id,
      role: Role.BUYER,
      sessionId: expect.any(String)
    }));
    expect(jwt.signAccessToken).not.toHaveBeenCalledWith(expect.objectContaining({
      email: expect.any(String),
      fullName: expect.any(String)
    }));
    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: user.id,
        tokenHash: expect.any(String),
        familyId: expect.any(String),
        expiresAt: expect.any(Date)
      })
    });
    expect(emailQueue.enqueue).toHaveBeenCalledWith(`email-verification-${user.id}`, expect.objectContaining({
      kind: "email-verification",
      to: "buyer@example.com",
      actionUrl: expect.stringContaining("/verify-email?token="),
      expiresInHours: 24
    }));
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

  it("does not allow registration to assign an administrator role", async () => {
    const user = buildUser({ role: Role.BUYER });
    const { service, prisma } = createService();

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(user);

    await service.register({
      fullName: "Buyer One",
      email: "buyer@example.com",
      password: "StrongPass123",
      role: Role.ADMIN
    } as never);

    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ role: Role.BUYER })
    }));
    expect(prisma.user.create.mock.calls[0][0].data.role).not.toBe(Role.ADMIN);
  });

  it("rejects duplicate registration emails without creating a user", async () => {
    const { service, prisma } = createService();

    prisma.user.findUnique.mockResolvedValue(buildUser());

    await expect(service.register({
      fullName: "Buyer One",
      email: "buyer@example.com",
      password: "StrongPass123"
    })).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("uses a generic login failure and records failed attempts for missing users", async () => {
    const { service, prisma, password, loginRateLimit } = createService({
      password: { verifyPassword: jest.fn().mockResolvedValue(false) }
    });

    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.login({
      email: "missing@example.com",
      password: "wrong-password"
    })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(password.verifyPassword).toHaveBeenCalledWith("wrong-password", expect.stringMatching(/^\$2b\$/));
    expect(loginRateLimit.recordFailedAttempt).toHaveBeenCalledWith("missing@example.com");
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it("rejects invalid login credentials and triggers login rate limiting", async () => {
    const { service, prisma, password, loginRateLimit } = createService({
      password: { verifyPassword: jest.fn().mockResolvedValue(false) }
    });

    prisma.user.findUnique.mockResolvedValue(buildUser());

    await expect(service.login({
      email: "buyer@example.com",
      password: "wrong-password"
    })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(loginRateLimit.assertCanAttempt).toHaveBeenCalledWith("buyer@example.com");
    expect(loginRateLimit.recordFailedAttempt).toHaveBeenCalledWith("buyer@example.com");
    expect(password.verifyPassword).toHaveBeenCalledWith("wrong-password", "hashed_password");
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it("blocks login when the rate limiter rejects the attempt", async () => {
    const { service, prisma } = createService({
      loginRateLimit: {
        assertCanAttempt: jest.fn(() => {
          throw new HttpException("Too many login attempts. Try again later.", HttpStatus.TOO_MANY_REQUESTS);
        })
      }
    });

    await expect(service.login({
      email: "buyer@example.com",
      password: "wrong-password"
    })).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("creates password reset tokens without enumerating unknown accounts", async () => {
    const { service, prisma, emailQueue, emailActionRateLimit } = createService();

    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.requestPasswordReset("missing@example.com")).resolves.toEqual({ accepted: true });
    expect(prisma.user.update).not.toHaveBeenCalled();

    prisma.user.findUnique.mockResolvedValueOnce(buildUser());
    const result = await service.requestPasswordReset("BUYER@EXAMPLE.COM");

    expect(result).toEqual({ accepted: true, resetToken: expect.any(String) });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        resetTokenHash: expect.any(String),
        resetTokenExpiresAt: expect.any(Date)
      }
    });
    expect(emailQueue.enqueue).toHaveBeenCalledWith(expect.stringMatching(/^password-reset-user_1-/), expect.objectContaining({
      kind: "password-reset",
      to: "buyer@example.com",
      actionUrl: expect.stringContaining("/password-reset?token="),
      expiresInMinutes: 30
    }));
    expect(emailActionRateLimit.assertCanSend).toHaveBeenCalledWith("password-reset", "buyer@example.com");
  });


  it("rate-limits repeated password reset requests before account lookup", async () => {
    const { service, prisma, emailActionRateLimit } = createService({
      emailActionRateLimit: {
        assertCanSend: jest.fn(() => {
          throw new HttpException("Too many email requests. Try again later.", HttpStatus.TOO_MANY_REQUESTS);
        })
      }
    });

    await expect(service.requestPasswordReset("buyer@example.com")).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
    expect(emailActionRateLimit.assertCanSend).toHaveBeenCalledWith("password-reset", "buyer@example.com");
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("queues short-lived email verification links without enumerating unknown accounts", async () => {
    const { service, prisma, emailQueue, emailActionRateLimit } = createService();

    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.requestEmailVerification("missing@example.com")).resolves.toEqual({ accepted: true });
    expect(prisma.user.update).not.toHaveBeenCalled();

    prisma.user.findUnique.mockResolvedValueOnce(buildUser());
    const result = await service.requestEmailVerification("BUYER@EXAMPLE.COM");

    expect(result).toEqual({ accepted: true, verificationToken: expect.any(String) });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        emailVerificationTokenHash: expect.any(String),
        emailVerificationTokenExpiresAt: expect.any(Date)
      }
    });
    expect(emailQueue.enqueue).toHaveBeenCalledWith(`email-verification-user_1`, expect.objectContaining({
      kind: "email-verification",
      to: "buyer@example.com",
      actionUrl: expect.stringContaining("/verify-email?token="),
      expiresInHours: 24
    }));
    expect(emailActionRateLimit.assertCanSend).toHaveBeenCalledWith("email-verification", "buyer@example.com");
  });

  it("rejects expired email verification links", async () => {
    const { service, prisma } = createService();

    prisma.user.findFirst.mockResolvedValue({
      id: "user_1",
      emailVerificationTokenExpiresAt: new Date(Date.now() - 1_000)
    });

    await expect(service.verifyEmail({ token: "expired_verification_token_1234567890" })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a used verification link that no longer updates a row", async () => {
    const { service, prisma } = createService();

    prisma.user.findFirst.mockResolvedValue({
      id: "user_1",
      emailVerificationTokenExpiresAt: new Date(Date.now() + 60_000)
    });
    prisma.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.verifyEmail({ token: "used_verification_token_123456789012" })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("marks a valid email verification token as used", async () => {
    const { service, prisma } = createService();

    prisma.user.findFirst.mockResolvedValue({
      id: "user_1",
      emailVerificationTokenExpiresAt: new Date(Date.now() + 60_000)
    });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.verifyEmail({ token: "valid_verification_token_12345678901" })).resolves.toEqual({ verified: true });
    expect(prisma.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: "user_1",
        emailVerificationTokenHash: expect.any(String),
        emailVerificationTokenExpiresAt: { gt: expect.any(Date) },
        emailVerifiedAt: null
      }),
      data: expect.objectContaining({
        emailVerifiedAt: expect.any(Date),
        emailVerificationTokenHash: null,
        emailVerificationTokenExpiresAt: null
      })
    }));
  });

  it("rejects an expired reset token", async () => {
    const { service, prisma } = createService();

    prisma.user.findFirst.mockResolvedValue({
      id: "user_1",
      resetTokenExpiresAt: new Date(Date.now() - 1_000)
    });

    await expect(service.resetPassword({
      token: "expired_reset_token_12345678901234567890",
      newPassword: "NewStrongPass123"
    })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
  });

  it("uses reset tokens once and invalidates existing sessions", async () => {
    const { service, prisma, password } = createService({
      password: { hashPassword: jest.fn().mockResolvedValue("new_hashed_password") }
    });

    prisma.user.findFirst.mockResolvedValue({
      id: "user_1",
      resetTokenExpiresAt: new Date(Date.now() + 60_000)
    });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.resetPassword({
      token: "valid_reset_token_1234567890123456789012",
      newPassword: "NewStrongPass123"
    })).resolves.toEqual({ reset: true });

    expect(password.hashPassword).toHaveBeenCalledWith("NewStrongPass123");
    expect(prisma.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: "user_1",
        resetTokenHash: expect.any(String),
        resetTokenExpiresAt: { gt: expect.any(Date) }
      }),
      data: expect.objectContaining({
        passwordHash: "new_hashed_password",
        resetTokenHash: null,
        resetTokenExpiresAt: null
      })
    }));
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: "user_1", revokedAt: null },
      data: { revokedAt: expect.any(Date) }
    });
  });

  it("rejects a used reset token that no longer updates a row", async () => {
    const { service, prisma } = createService();

    prisma.user.findFirst.mockResolvedValue({
      id: "user_1",
      resetTokenExpiresAt: new Date(Date.now() + 60_000)
    });
    prisma.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.resetPassword({
      token: "used_reset_token_12345678901234567890123",
      newPassword: "NewStrongPass123"
    })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
  });

  it("changes a password and revokes active refresh sessions", async () => {
    const { service, prisma, password } = createService({
      password: {
        verifyPassword: jest.fn().mockResolvedValue(true),
        hashPassword: jest.fn().mockResolvedValue("changed_hashed_password")
      }
    });

    prisma.user.findUnique.mockResolvedValue(buildUser());

    await expect(service.changePassword("user_1", {
      currentPassword: "OldPassword123",
      newPassword: "NewStrongPass123"
    })).resolves.toEqual({ changed: true });

    expect(password.verifyPassword).toHaveBeenCalledWith("OldPassword123", "hashed_password");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        passwordHash: "changed_hashed_password",
        resetTokenHash: null,
        resetTokenExpiresAt: null
      }
    });
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: "user_1", revokedAt: null },
      data: { revokedAt: expect.any(Date) }
    });
  });

  it("rotates a valid refresh token atomically into the same token family", async () => {
    const user = buildUser();
    const storedRefreshToken = {
      id: "refresh_1",
      tokenHash: hashSecretToken("refresh_token", "refresh_secret"),
      familyId: "family_1",
      revokedAt: null,
      replacedByTokenId: null,
      expiresAt: new Date(Date.now() + 60_000),
      user
    };
    const { service, prisma } = createService();

    prisma.refreshToken.findUnique.mockResolvedValue(storedRefreshToken);
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.refresh("refresh_token");

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
    expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: storedRefreshToken.tokenHash },
      include: { user: true }
    });
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        id: "refresh_1",
        revokedAt: null,
        replacedByTokenId: null
      },
      data: {
        revokedAt: expect.any(Date),
        replacedByTokenId: expect.any(String),
        lastUsedAt: expect.any(Date)
      }
    });
    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: expect.any(String),
        userId: user.id,
        familyId: "family_1"
      })
    });
    expect(result.refreshToken).toEqual(expect.any(String));
  });

  it("revokes a refresh-token family when an already rotated token is reused", async () => {
    const storedRefreshToken = {
      id: "refresh_1",
      tokenHash: hashSecretToken("refresh_token", "refresh_secret"),
      familyId: "family_1",
      revokedAt: new Date("2026-07-01T10:00:00.000Z"),
      replacedByTokenId: "refresh_2",
      expiresAt: new Date(Date.now() + 60_000),
      user: buildUser()
    };
    const { service, prisma } = createService();

    prisma.refreshToken.findUnique.mockResolvedValue(storedRefreshToken);

    await expect(service.refresh("refresh_token")).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId: "family_1", revokedAt: null },
      data: { revokedAt: expect.any(Date) }
    });
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });
  it("stores only a SHA-256 hash of the raw refresh token", async () => {
    const user = buildUser();
    const { service, prisma } = createService();

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(user);

    const result = await service.register({
      fullName: "Buyer One",
      email: "buyer@example.com",
      password: "StrongPass123"
    });
    const tokenData = prisma.refreshToken.create.mock.calls[0][0].data;

    expect(tokenData.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenData.tokenHash).not.toBe(result.refreshToken);
    expect(JSON.stringify(tokenData)).not.toContain(result.refreshToken);
  });

  it("rejects an expired refresh token and marks it revoked", async () => {
    const storedRefreshToken = {
      id: "refresh_1",
      tokenHash: hashSecretToken("refresh_token", "refresh_secret"),
      familyId: "family_1",
      revokedAt: null,
      replacedByTokenId: null,
      expiresAt: new Date(Date.now() - 60_000),
      user: buildUser()
    };
    const { service, prisma } = createService();

    prisma.refreshToken.findUnique.mockResolvedValue(storedRefreshToken);

    await expect(service.refresh("refresh_token")).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: "refresh_1" },
      data: { revokedAt: expect.any(Date), lastUsedAt: expect.any(Date) }
    });
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it("rejects a revoked refresh token and revokes the token family", async () => {
    const storedRefreshToken = {
      id: "refresh_1",
      tokenHash: hashSecretToken("refresh_token", "refresh_secret"),
      familyId: "family_1",
      revokedAt: new Date("2026-07-01T10:00:00.000Z"),
      replacedByTokenId: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: buildUser()
    };
    const { service, prisma } = createService();

    prisma.refreshToken.findUnique.mockResolvedValue(storedRefreshToken);

    await expect(service.refresh("refresh_token")).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId: "family_1", revokedAt: null },
      data: { revokedAt: expect.any(Date) }
    });
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it("does not store the rotated raw refresh token", async () => {
    const storedRefreshToken = {
      id: "refresh_1",
      tokenHash: hashSecretToken("refresh_token", "refresh_secret"),
      familyId: "family_1",
      revokedAt: null,
      replacedByTokenId: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: buildUser()
    };
    const { service, prisma } = createService();

    prisma.refreshToken.findUnique.mockResolvedValue(storedRefreshToken);
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.refresh("refresh_token");
    const tokenData = prisma.refreshToken.create.mock.calls[0][0].data;

    expect(tokenData.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenData.tokenHash).not.toBe(result.refreshToken);
    expect(JSON.stringify(tokenData)).not.toContain(result.refreshToken);
  });

  it("invalidates a single refresh session during logout", async () => {
    const { service, prisma } = createService();

    await expect(service.logout("refresh_token")).resolves.toEqual({ loggedOut: true });
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        tokenHash: hashSecretToken("refresh_token", "refresh_secret"),
        revokedAt: null
      },
      data: { revokedAt: expect.any(Date) }
    });
  });

  it("invalidates all active refresh sessions during logout-all", async () => {
    const { service, prisma } = createService();

    await expect(service.logoutAll("user_1")).resolves.toEqual({ loggedOut: true });
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: "user_1", revokedAt: null },
      data: { revokedAt: expect.any(Date) }
    });
  });
});

function buildPrisma() {
  return {
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    }
  };
}

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
    emailVerificationTokenHash: null,
    emailVerificationTokenExpiresAt: null,
    refreshTokenHash: null,
    resetTokenHash: null,
    resetTokenExpiresAt: null,
    createdAt: new Date("2026-07-01T10:00:00.000Z"),
    updatedAt: new Date("2026-07-01T10:00:00.000Z")
  };
}

function hashSecretToken(token: string, secret: string) {
  return createHash("sha256").update(`${token}.${secret}`).digest("hex");
}