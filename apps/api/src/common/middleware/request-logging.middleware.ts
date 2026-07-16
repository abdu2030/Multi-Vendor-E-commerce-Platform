import { Logger } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { safeStringifyLog } from "../logging/redaction";

export const REQUEST_ID_HEADER = "x-request-id";
export const RESPONSE_REQUEST_ID_HEADER = "X-Request-Id";

export type RequestWithRequestId = Request & {
  requestId?: string;
};

export function createRequestLoggingMiddleware(logger = new Logger("HTTP")) {
  return (request: Request, response: Response, next: NextFunction) => {
    const startedAt = Date.now();
    const requestWithId = request as RequestWithRequestId;
    const requestId = getRequestId(request);

    requestWithId.requestId = requestId;
    response.setHeader(RESPONSE_REQUEST_ID_HEADER, requestId);

    response.on("finish", () => {
      const durationMs = Date.now() - startedAt;
      const method = request.method;
      const path = getSafePath(request);
      const statusCode = response.statusCode;
      const ip = request.ip || request.socket.remoteAddress || "unknown";
      const userAgent = normalizeLogString(request.get("user-agent") ?? "unknown");
      const message = safeStringifyLog({
        event: "HTTP_REQUEST",
        requestId,
        method,
        path,
        statusCode,
        durationMs,
        ip,
        userAgent
      });

      if (statusCode >= 500) {
        logger.error(message);
        return;
      }

      if (statusCode >= 400) {
        logger.warn(message);
        return;
      }

      logger.log(message);
    });

    next();
  };
}

export function getSafePath(request: Request) {
  const path = request.path || request.originalUrl || request.url || "/";

  return path.split("?")[0] || "/";
}

function getRequestId(request: Request) {
  const requestIdHeader = request.get(REQUEST_ID_HEADER);

  if (requestIdHeader && /^[A-Za-z0-9._:-]{8,128}$/.test(requestIdHeader)) {
    return requestIdHeader;
  }

  return randomUUID();
}

function normalizeLogString(value: string) {
  return value.replace(/[\r\n]/g, " ").slice(0, 512);
}
