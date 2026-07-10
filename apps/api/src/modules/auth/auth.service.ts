import {
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Role, User } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtTokenService } from "./jwt-token.service";
import { PasswordService } from "./password.service";

type PublicUser = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  phone: string | null;
  createdAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly passwordService: PasswordService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException("An account with this email already exists.");
    }

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        email,
        phone: dto.phone?.trim(),
        passwordHash: await this.passwordService.hashPassword(dto.password)
      }
    });

    const session = await this.createSession(user);

    await this.notifications.create({
      userId: user.id,
      title: "Welcome to Marketo",
      message: "Your marketplace account is ready. Discover products or start building your storefront.",
      idempotencyKey: `user-welcome-${user.id}`,
      emailTemplate: "welcome"
    });

    return session;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() }
    });

    if (!user || !(await this.passwordService.verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    return this.createSession(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt <= new Date()) {
      throw new UnauthorizedException("Invalid refresh token.");
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() }
    });

    return this.createSession(storedToken.user);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() }
    });

    return { loggedOut: true };
  }

  private async createSession(user: User) {
    const publicUser = this.toPublicUser(user);
    const accessToken = this.jwtTokenService.signAccessToken(publicUser);
    const refreshToken = randomBytes(48).toString("base64url");
    const refreshTokenTtlDays = Number(this.config.get("JWT_REFRESH_TOKEN_TTL_DAYS") ?? 30);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashRefreshToken(refreshToken),
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

  private hashRefreshToken(refreshToken: string) {
    const secret = this.config.get<string>("JWT_REFRESH_SECRET");

    if (!secret) {
      throw new Error("JWT_REFRESH_SECRET is required.");
    }

    return createHash("sha256").update(`${refreshToken}.${secret}`).digest("hex");
  }
}
