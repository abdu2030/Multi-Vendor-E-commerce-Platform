import { ForbiddenException } from "@nestjs/common";
import { Request, Response } from "express";
import { createCsrfOriginMiddleware } from "./csrf-origin.middleware";

describe("CSRF origin middleware", () => {
  const middleware = createCsrfOriginMiddleware(["https://shop.example.test"], {
    exemptPaths: ["/api/checkout/webhooks/stripe"]
  });

  it("rejects forged state-changing requests from untrusted origins", () => {
    const next = jest.fn();

    middleware(buildRequest("POST", "/api/cart/items", { origin: "https://attacker.example.test" }), {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenException));
    expect(next.mock.calls[0][0].message).toBe("CSRF origin is not allowed.");
  });

  it("allows trusted browser origins for state-changing requests", () => {
    const next = jest.fn();

    middleware(buildRequest("PATCH", "/api/cart/items/item_1", { origin: "https://shop.example.test" }), {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("rejects cookie-backed auth mutations when browser origin context is missing", () => {
    const next = jest.fn();

    middleware(buildRequest("POST", "/api/auth/refresh", { cookie: "marketo_refresh_token=token" }), {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenException));
    expect(next.mock.calls[0][0].message).toBe("CSRF origin is required for cookie-authenticated requests.");
  });

  it("does not block read-only GET requests", () => {
    const next = jest.fn();

    middleware(buildRequest("GET", "/api/products", { origin: "https://attacker.example.test" }), {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("exempts Stripe webhooks from browser-origin checks", () => {
    const next = jest.fn();

    middleware(buildRequest("POST", "/api/checkout/webhooks/stripe"), {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });
});

function buildRequest(method: string, originalUrl: string, headers: Record<string, string> = {}) {
  return { method, originalUrl, headers } as Request;
}
