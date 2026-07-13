import { ForbiddenException } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type CsrfOriginOptions = {
  exemptPaths?: string[];
};

export function createCsrfOriginMiddleware(
  allowedOrigins: string[],
  options: CsrfOriginOptions = {}
) {
  const allowed = new Set(allowedOrigins);
  const exemptPaths = new Set(options.exemptPaths ?? []);

  return (request: Request, _response: Response, next: NextFunction) => {
    const method = request.method.toUpperCase();
    const path = getRequestPath(request);

    if (!unsafeMethods.has(method) || exemptPaths.has(path)) {
      next();
      return;
    }

    const origin = getHeader(request, "origin");

    if (origin) {
      if (allowed.has(origin)) {
        next();
        return;
      }

      next(new ForbiddenException("CSRF origin is not allowed."));
      return;
    }

    const refererOrigin = parseOrigin(getHeader(request, "referer"));

    if (refererOrigin) {
      if (allowed.has(refererOrigin)) {
        next();
        return;
      }

      next(new ForbiddenException("CSRF referer is not allowed."));
      return;
    }

    if (getHeader(request, "sec-fetch-site") === "cross-site") {
      next(new ForbiddenException("Cross-site state-changing requests are not allowed."));
      return;
    }

    if (isCookieBackedAuthPath(path) && getHeader(request, "cookie")) {
      next(new ForbiddenException("CSRF origin is required for cookie-authenticated requests."));
      return;
    }

    next();
  };
}

function getRequestPath(request: Request) {
  return (request.originalUrl ?? request.url ?? "").split("?")[0];
}

function getHeader(request: Request, name: string) {
  const value = request.headers[name.toLowerCase()];

  return Array.isArray(value) ? value[0] : value;
}

function parseOrigin(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function isCookieBackedAuthPath(path: string) {
  return path === "/api/auth/refresh" || path === "/api/auth/logout";
}
