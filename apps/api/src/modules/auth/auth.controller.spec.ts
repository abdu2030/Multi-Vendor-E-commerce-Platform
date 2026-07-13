import { ConfigService } from "@nestjs/config";
import { Role } from "@prisma/client";
import { Request, Response } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("AuthController refresh-session cookies", () => {
  function createController(overrides: Partial<AuthService> = {}) {
    const authService = {
      register: jest.fn().mockResolvedValue(buildSession("refresh_token")),
      login: jest.fn().mockResolvedValue(buildSession("refresh_token")),
      refresh: jest.fn().mockResolvedValue(buildSession("rotated_refresh_token")),
      logout: jest.fn().mockResolvedValue({ loggedOut: true }),
      logoutAll: jest.fn().mockResolvedValue({ loggedOut: true }),
      requestPasswordReset: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      ...overrides
    } as unknown as AuthService;
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string | number> = {
          NODE_ENV: "production",
          JWT_REFRESH_TOKEN_TTL_DAYS: 30
        };

        return values[key];
      })
    } as unknown as ConfigService;
    const controller = new AuthController(authService, config);
    const response = {
      cookie: jest.fn(),
      clearCookie: jest.fn()
    } as unknown as Response;

    return { authService, controller, response };
  }

  it("sets the refresh token in an HTTP-only cookie on login", async () => {
    const { controller, response } = createController();

    await controller.login({ email: "buyer@example.com", password: "StrongPass123" }, response);

    expect(response.cookie).toHaveBeenCalledWith("marketo_refresh_token", "refresh_token", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/api/auth",
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
  });

  it("refreshes from the secure cookie when no body token is sent", async () => {
    const { authService, controller, response } = createController();
    const request = buildRequest("marketo_refresh_token=cookie_refresh_token");

    await controller.refresh({}, request, response);

    expect(authService.refresh).toHaveBeenCalledWith("cookie_refresh_token");
    expect(response.cookie).toHaveBeenCalledWith("marketo_refresh_token", "rotated_refresh_token", expect.objectContaining({
      httpOnly: true,
      secure: true
    }));
  });

  it("clears the refresh cookie securely during logout", async () => {
    const { authService, controller, response } = createController();
    const request = buildRequest("marketo_refresh_token=cookie_refresh_token");

    await controller.logout({}, request, response);

    expect(authService.logout).toHaveBeenCalledWith("cookie_refresh_token");
    expect(response.clearCookie).toHaveBeenCalledWith("marketo_refresh_token", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/api/auth"
    });
  });

  it("revokes all sessions and clears the refresh cookie during logout-all", async () => {
    const { authService, controller, response } = createController();

    await controller.logoutAll({ id: "user_1", role: Role.BUYER }, response);

    expect(authService.logoutAll).toHaveBeenCalledWith("user_1");
    expect(response.clearCookie).toHaveBeenCalledWith("marketo_refresh_token", expect.objectContaining({
      httpOnly: true,
      path: "/api/auth"
    }));
  });
});

function buildSession(refreshToken: string) {
  return {
    user: {
      id: "user_1",
      fullName: "Buyer One",
      email: "buyer@example.com",
      role: Role.BUYER,
      phone: null,
      createdAt: new Date("2026-07-01T10:00:00.000Z")
    },
    accessToken: "access_token",
    refreshToken
  };
}

function buildRequest(cookie?: string) {
  return {
    headers: cookie ? { cookie } : {}
  } as Request;
}