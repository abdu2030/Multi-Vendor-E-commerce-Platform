import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, Role, User } from "@prisma/client";
import { createHash, randomBytes, randomUUID } from "crypto";
import { EmailQueueService } from "../jobs/email-queue.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { EmailActionRateLimitService } from "./email-action-rate-limit.service";
import { JwtTokenService } from "./jwt-token.service";
import { LoginRateLimitService } from "./login-rate-limit.service";
import { PasswordService } from "./password.service";

type PublicUser = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  phone: string | null;
  createdAt: Date;
};

type CreateSessionOptions = {
  tokenStore?: Prisma.TransactionClient;
  refreshToken?: string;
  refreshTokenHash?: string;
  refreshTokenId?: string;
  familyId?: string;
};

const DUMMY_BCRYPT_HASH = "$2b$12$C7cD7YV6kzF5lz7K7n9zSOFZctq0pG6fMEx04lXtiAY7JUTbaYJTW";

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly passwordService: PasswordService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly loginRateLimit: LoginRateLimitService,
    private readonly emailQueue: EmailQueueService,
    private readonly emailActionRateLimit: EmailActionRateLimitService
  ) {}

  async register(dto: RegisterDto) {
    const email = normalizeEmail(dto.email);
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException("Registration could not be completed.");
    }

    const verificationToken = this.generateEmailVerificationToken();
    const verificationTtlHours = this.emailVerificationTokenTtlHours();
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        email,
        phone: dto.phone?.trim(),
        role: Role.BUYER,
        passwordHash: await this.passwordService.hashPassword(dto.password),
        emailVerificationTokenHash: this.hashEmailVerificationToken(verificationToken),
        emailVerificationTokenExpiresAt: new Date(Date.now() + verificationTtlHours * 60 * 60 * 1000)
      }
    });

    const session = await this.createSession(user);

    await this.emailQueue.enqueue(`email-verification-${user.id}`, {
      kind: "email-verification",
      to: user.email,
      recipientName: user.fullName,
      actionUrl: this.buildEmailVerificationUrl(verificationToken),
      expiresInHours: verificationTtlHours
    });

    await this.notifications.create({
      userId: user.id,
      title: "Welcome to Marketo",
      message: "Your marketplace account is ready. Discover products or start building your storefront.",
      idempotencyKey: `user-welcome-${user.id}`,
      emailTemplate: "welcome"
    });

    return {
      ...session,
      verificationToken: this.shouldExposeEmailVerificationTokenForTesting() ? verificationToken : undefined
    };
  }

  async login(dto: LoginDto) {
    const email = normalizeEmail(dto.email);

    this.loginRateLimit.assertCanAttempt(email);

    const user = await this.prisma.user.findUnique({ where: { email } });
    const passwordHash = user?.passwordHash ?? DUMMY_BCRYPT_HASH;
    const passwordMatches = await this.passwordService.verifyPassword(dto.password, passwordHash);

    if (!user || !passwordMatches) {
      this.loginRateLimit.recordFailedAttempt(email);
      throw new UnauthorizedException("Invalid email or password.");
    }

    this.loginRateLimit.clear(email);

    return this.createSession(user);
  }

  async requestPasswordReset(emailInput: string) {
    const email = normalizeEmail(emailInput);

    this.emailActionRateLimit.assertCanSend("password-reset", email);

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return passwordResetAccepted();
    }

    const resetToken = this.generateResetToken();
    const resetTokenTtlMinutes = this.passwordResetTokenTtlMinutes();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: this.hashResetToken(resetToken),
        resetTokenExpiresAt: new Date(Date.now() + resetTokenTtlMinutes * 60 * 1000)
      }
    });

    await this.emailQueue.enqueue(`password-reset-${user.id}-${this.hashResetToken(resetToken).slice(0, 16)}`, {
      kind: "password-reset",
      to: user.email,
      recipientName: user.fullName,
      actionUrl: this.buildPasswordResetUrl(resetToken),
      expiresInMinutes: resetTokenTtlMinutes
    });

    return {
      ...passwordResetAccepted(),
      resetToken: this.shouldExposeResetTokenForTesting() ? resetToken : undefined
    };
  }

  async requestEmailVerification(emailInput: string) {
    const email = normalizeEmail(emailInput);

    this.emailActionRateLimit.assertCanSend("email-verification", email);

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.emailVerifiedAt) {
      return emailVerificationAccepted();
    }

    const verificationToken = this.generateEmailVerificationToken();
    const verificationTtlHours = this.emailVerificationTokenTtlHours();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationTokenHash: this.hashEmailVerificationToken(verificationToken),
        emailVerificationTokenExpiresAt: new Date(Date.now() + verificationTtlHours * 60 * 60 * 1000)
      }
    });

    await this.emailQueue.enqueue(`email-verification-${user.id}`, {
      kind: "email-verification",
      to: user.email,
      recipientName: user.fullName,
      actionUrl: this.buildEmailVerificationUrl(verificationToken),
      expiresInHours: verificationTtlHours
    });

    return {
      ...emailVerificationAccepted(),
      verificationToken: this.shouldExposeEmailVerificationTokenForTesting() ? verificationToken : undefined
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const tokenHash = this.hashEmailVerificationToken(dto.token);
    const now = new Date();
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationTokenHash: tokenHash },
      select: {
        id: true,
        emailVerificationTokenExpiresAt: true
      }
    });

    if (!user || !user.emailVerificationTokenExpiresAt || user.emailVerificationTokenExpiresAt <= now) {
      throw new UnauthorizedException("Invalid or expired email verification token.");
    }

    const update = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        emailVerificationTokenHash: tokenHash,
        emailVerificationTokenExpiresAt: { gt: now },
        emailVerifiedAt: null
      },
      data: {
        emailVerifiedAt: now,
        emailVerificationTokenHash: null,
        emailVerificationTokenExpiresAt: null
      }
    });

    if (update.count !== 1) {
      throw new UnauthorizedException("Invalid or expired email verification token.");
    }

    return { verified: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashResetToken(dto.token);
    const now = new Date();
    const user = await this.prisma.user.findFirst({
      where: { resetTokenHash: tokenHash },
      select: {
        id: true,
        resetTokenExpiresAt: true
      }
    });

    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt <= now) {
      throw new UnauthorizedException("Invalid or expired password reset token.");
    }

    const passwordHash = await this.passwordService.hashPassword(dto.newPassword);

    await this.prisma.$transaction(async (tx) => {
      const update = await tx.user.updateMany({
        where: {
          id: user.id,
          resetTokenHash: tokenHash,
          resetTokenExpiresAt: { gt: now }
        },
        data: {
          passwordHash,
          resetTokenHash: null,
          resetTokenExpiresAt: null
        }
      });

      if (update.count !== 1) {
        throw new UnauthorizedException("Invalid or expired password reset token.");
      }

      await this.revokeUserRefreshTokens(user.id, tx);
    });

    return { reset: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException("User account was not found.");
    }

    const passwordMatches = await this.passwordService.verifyPassword(dto.currentPassword, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid current password.");
    }

    const passwordHash = await this.passwordService.hashPassword(dto.newPassword);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetTokenHash: null,
          resetTokenExpiresAt: null
        }
      });
      await this.revokeUserRefreshTokens(user.id, tx);
    });

    return { changed: true };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const nextRefreshToken = this.generateRefreshToken();
    const nextRefreshTokenHash = this.hashRefreshToken(nextRefreshToken);
    const now = new Date();
    const nextTokenId = randomUUID();

    return this.prisma.$transaction(async (tx) => {
      const storedToken = await tx.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true }
      });

      if (!storedToken) {
        throw new UnauthorizedException("Invalid refresh token.");
      }

      if (storedToken.revokedAt || storedToken.replacedByTokenId) {
        await tx.refreshToken.updateMany({
          where: { familyId: storedToken.familyId, revokedAt: null },
          data: { revokedAt: now }
        });
        throw new UnauthorizedException("Invalid refresh token.");
      }

      if (storedToken.expiresAt <= now) {
        await tx.refreshToken.update({
          where: { id: storedToken.id },
          data: { revokedAt: now, lastUsedAt: now }
        });
        throw new UnauthorizedException("Invalid refresh token.");
      }

      const rotation = await tx.refreshToken.updateMany({
        where: {
          id: storedToken.id,
          revokedAt: null,
          replacedByTokenId: null
        },
        data: {
          revokedAt: now,
          replacedByTokenId: nextTokenId,
          lastUsedAt: now
        }
      });

      if (rotation.count !== 1) {
        await tx.refreshToken.updateMany({
          where: { familyId: storedToken.familyId, revokedAt: null },
          data: { revokedAt: now }
        });
        throw new UnauthorizedException("Invalid refresh token.");
      }

      return this.createSession(storedToken.user, {
        tokenStore: tx,
        refreshToken: nextRefreshToken,
        refreshTokenHash: nextRefreshTokenHash,
        refreshTokenId: nextTokenId,
        familyId: storedToken.familyId
      });
    });
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() }
    });

    return { loggedOut: true };
  }

  async logoutAll(userId: string) {
    await this.revokeUserRefreshTokens(userId);

    return { loggedOut: true };
  }

  private async createSession(user: User, options: CreateSessionOptions = {}) {
    const publicUser = this.toPublicUser(user);
    const sessionId = options.refreshTokenId ?? randomUUID();
    const accessToken = this.jwtTokenService.signAccessToken({
      id: user.id,
      role: user.role,
      sessionId
    });
    const refreshToken = options.refreshToken ?? this.generateRefreshToken();
    const tokenStore = options.tokenStore ?? this.prisma;
    const refreshTokenTtlDays = Number(this.config.get("JWT_REFRESH_TOKEN_TTL_DAYS") ?? 30);

    await tokenStore.refreshToken.create({
      data: {
        id: sessionId,
        userId: user.id,
        tokenHash: options.refreshTokenHash ?? this.hashRefreshToken(refreshToken),
        familyId: options.familyId ?? randomUUID(),
        expiresAt: new Date(Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000)
      }
    });

    return {
      user: publicUser,
      accessToken,
      refreshToken
    };
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt
    };
  }

  private revokeUserRefreshTokens(userId: string, tx: Prisma.TransactionClient | PrismaService = this.prisma) {
    return tx.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  private hashRefreshToken(refreshToken: string) {
    return createSecretHash(refreshToken, this.getSecret("JWT_REFRESH_SECRET"));
  }

  private hashResetToken(resetToken: string) {
    return createSecretHash(resetToken, this.getSecret("JWT_REFRESH_SECRET"));
  }

  private hashEmailVerificationToken(token: string) {
    return createSecretHash(token, this.getSecret("JWT_REFRESH_SECRET"));
  }

  private getSecret(key: string) {
    const secret = this.config.get<string>(key);

    if (!secret) {
      throw new Error(`${key} is required.`);
    }

    return secret;
  }

  private generateRefreshToken() {
    return randomBytes(48).toString("base64url");
  }

  private generateResetToken() {
    return randomBytes(48).toString("base64url");
  }

  private generateEmailVerificationToken() {
    return randomBytes(48).toString("base64url");
  }

  private passwordResetTokenTtlMinutes() {
    return Math.min(Number(this.config.get("PASSWORD_RESET_TOKEN_TTL_MINUTES") ?? 30), 60);
  }

  private emailVerificationTokenTtlHours() {
    return Math.min(Number(this.config.get("EMAIL_VERIFICATION_TOKEN_TTL_HOURS") ?? 24), 24);
  }

  private buildPasswordResetUrl(token: string) {
    return `${this.frontendUrl()}/password-reset?token=${encodeURIComponent(token)}`;
  }

  private buildEmailVerificationUrl(token: string) {
    return `${this.frontendUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  }

  private frontendUrl() {
    return (this.config.get<string>("FRONTEND_URL")?.trim() || "http://localhost:3000").replace(/\/$/, "");
  }

  private shouldExposeResetTokenForTesting() {
    return this.config.get<string>("NODE_ENV") === "test";
  }

  private shouldExposeEmailVerificationTokenForTesting() {
    return this.config.get<string>("NODE_ENV") === "test";
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createSecretHash(value: string, secret: string) {
  return createHash("sha256").update(`${value}.${secret}`).digest("hex");
}

function passwordResetAccepted() {
  return { accepted: true };
}

function emailVerificationAccepted() {
  return { accepted: true };
}
