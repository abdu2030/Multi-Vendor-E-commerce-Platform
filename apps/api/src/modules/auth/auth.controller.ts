import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { AuthService } from "./auth.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { RequestEmailVerificationDto } from "./dto/request-email-verification.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";

const REFRESH_TOKEN_COOKIE_NAME = "marketo_refresh_token";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService
  ) {}

  @Post("register")
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.authService.register(dto);
    this.setRefreshTokenCookie(response, session.refreshToken);

    return session;
  }

  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.authService.login(dto);
    this.setRefreshTokenCookie(response, session.refreshToken);

    return session;
  }

  @Post("password-reset/request")
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post("password-reset/confirm")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post("email-verification/request")
  requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
    return this.authService.requestEmailVerification(dto.email);
  }

  @Post("email-verification/confirm")
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }
  @Post("password/change")
  @UseGuards(JwtAuthGuard)
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }

  @Post("refresh")
  async refresh(
    @Body() dto: RefreshTokenDto = {},
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const refreshToken = dto.refreshToken ?? this.getRefreshTokenCookie(request);

    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token is required.");
    }

    const session = await this.authService.refresh(refreshToken);
    this.setRefreshTokenCookie(response, session.refreshToken);

    return session;
  }

  @Post("logout")
  async logout(
    @Body() dto: RefreshTokenDto = {},
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const refreshToken = dto.refreshToken ?? this.getRefreshTokenCookie(request);

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    this.clearRefreshTokenCookie(response);

    return { loggedOut: true };
  }

  @Post("logout-all")
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.authService.logoutAll(user.id);
    this.clearRefreshTokenCookie(response);

    return { loggedOut: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  private setRefreshTokenCookie(response: Response, refreshToken: string) {
    response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      ...this.getRefreshTokenCookieOptions(),
      maxAge: this.getRefreshTokenMaxAgeMs()
    });
  }

  private clearRefreshTokenCookie(response: Response) {
    response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, this.getRefreshTokenCookieOptions());
  }

  private getRefreshTokenCookie(request: Request) {
    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
      return undefined;
    }

    const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
    const refreshCookie = cookies.find((cookie) => cookie.startsWith(`${REFRESH_TOKEN_COOKIE_NAME}=`));

    if (!refreshCookie) {
      return undefined;
    }

    return decodeURIComponent(refreshCookie.slice(REFRESH_TOKEN_COOKIE_NAME.length + 1));
  }

  private getRefreshTokenCookieOptions() {
    return {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: this.isProductionLike(),
      path: "/api/auth"
    };
  }

  private getRefreshTokenMaxAgeMs() {
    const refreshTokenTtlDays = Number(this.config.get("JWT_REFRESH_TOKEN_TTL_DAYS") ?? 30);

    return refreshTokenTtlDays * 24 * 60 * 60 * 1000;
  }

  private isProductionLike() {
    return ["production", "staging"].includes(this.config.get<string>("NODE_ENV") ?? "development");
  }
}