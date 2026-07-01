import { apiRequest } from "./api";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: "BUYER" | "PENDING_SELLER" | "SELLER" | "ADMIN" | "SUPPORT";
  phone?: string | null;
  createdAt?: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export function register(input: RegisterInput) {
  return apiRequest<AuthSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function login(input: LoginInput) {
  return apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function refreshSession(refreshToken: string) {
  return apiRequest<AuthSession>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  });
}

export function logout(refreshToken: string) {
  return apiRequest<{ loggedOut: boolean }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  });
}

export function getMe(accessToken: string) {
  return apiRequest<AuthUser>("/auth/me", {
    token: accessToken
  });
}
