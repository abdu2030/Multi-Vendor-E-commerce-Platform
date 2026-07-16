import { Request, Response } from "express";
import { createRequestLoggingMiddleware } from "./request-logging.middleware";

describe("createRequestLoggingMiddleware", () => {
  it("sets request IDs and logs sanitized structured request metadata", () => {
    const logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    const response = buildResponse(200);
    const request = buildRequest({
      originalUrl: "/api/auth/login?token=raw-token",
      path: "/api/auth/login",
      headers: {
        "x-request-id": "request-abc123",
        "user-agent": "jest-agent\r\nInjected: secret"
      }
    });
    const next = jest.fn();

    createRequestLoggingMiddleware(logger as never)(request, response, next);
    response.emitFinish();

    expect(next).toHaveBeenCalled();
    expect(response.setHeader).toHaveBeenCalledWith("X-Request-Id", "request-abc123");
    expect((request as Request & { requestId?: string }).requestId).toBe("request-abc123");
    expect(logger.log).toHaveBeenCalledTimes(1);

    const payload = logger.log.mock.calls[0][0] as string;

    expect(payload).toContain('"event":"HTTP_REQUEST"');
    expect(payload).toContain('"path":"/api/auth/login"');
    expect(payload).not.toContain("raw-token");
    expect(payload).not.toContain("\r");
    expect(payload).not.toContain("\n");
  });
});

type HeaderMap = Record<string, string | undefined>;

function buildRequest({
  originalUrl,
  path,
  headers
}: {
  originalUrl: string;
  path: string;
  headers: HeaderMap;
}) {
  return {
    method: "POST",
    originalUrl,
    path,
    ip: "127.0.0.1",
    socket: { remoteAddress: "127.0.0.1" },
    get: jest.fn((header: string) => headers[header.toLowerCase()])
  } as unknown as Request;
}

function buildResponse(statusCode: number) {
  let finishHandler: (() => void) | undefined;

  return {
    statusCode,
    setHeader: jest.fn(),
    on: jest.fn((event: string, handler: () => void) => {
      if (event === "finish") {
        finishHandler = handler;
      }
    }),
    emitFinish: () => finishHandler?.()
  } as unknown as Response & { emitFinish: () => void };
}
