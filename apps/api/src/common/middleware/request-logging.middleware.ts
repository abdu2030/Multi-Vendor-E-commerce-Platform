import { Logger } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

export function createRequestLoggingMiddleware(logger = new Logger("HTTP")) {
  return (request: Request, response: Response, next: NextFunction) => {
    const startedAt = Date.now();

    response.on("finish", () => {
      const durationMs = Date.now() - startedAt;
      const method = request.method;
      const url = request.originalUrl;
      const statusCode = response.statusCode;
      const ip = request.ip || request.socket.remoteAddress || "unknown";
      const userAgent = request.get("user-agent") ?? "unknown";
      const message = `${method} ${url} ${statusCode} ${durationMs}ms ip=${ip} ua="${userAgent}"`;

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
