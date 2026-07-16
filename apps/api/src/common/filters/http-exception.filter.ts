import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Response } from "express";
import { safeStringifyLog } from "../logging/redaction";
import { SecurityLoggerService } from "../logging/security-logger.service";
import { getSafePath, RESPONSE_REQUEST_ID_HEADER, RequestWithRequestId } from "../middleware/request-logging.middleware";

type ErrorResponseBody = {
  message?: string | string[];
  error?: string;
  errors?: unknown;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly isProduction = false,
    private readonly logger = new Logger(HttpExceptionFilter.name),
    private readonly securityLogger = new SecurityLoggerService()
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithRequestId>();
    const statusCode = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const requestId = request.requestId ?? request.get?.("x-request-id") ?? "unknown";
    const path = getSafePath(request);
    const errorResponse = this.shouldSanitize(statusCode)
      ? "Internal server error"
      : exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";
    const message = typeof errorResponse === "object" && errorResponse !== null && "message" in errorResponse
      ? (errorResponse as ErrorResponseBody).message
      : errorResponse;
    const error = typeof errorResponse === "object" && errorResponse !== null && "error" in errorResponse
      ? (errorResponse as ErrorResponseBody).error
      : undefined;
    const errors = typeof errorResponse === "object" && errorResponse !== null && "errors" in errorResponse
      ? (errorResponse as ErrorResponseBody).errors
      : undefined;

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(safeStringifyLog({
        event: "HTTP_EXCEPTION",
        requestId,
        method: request.method,
        path,
        statusCode,
        errorName: exception instanceof Error ? exception.name : "UnknownError",
        errorMessage: exception instanceof Error ? exception.message : "Unknown server error",
        stack: exception instanceof Error ? exception.stack : undefined
      }));
    }

    if (statusCode === HttpStatus.UNAUTHORIZED || statusCode === HttpStatus.FORBIDDEN) {
      this.securityLogger.log("UNAUTHORIZED_RESOURCE_ACCESS", {
        requestId,
        method: request.method,
        path,
        statusCode
      });
    }

    response.setHeader(RESPONSE_REQUEST_ID_HEADER, requestId);
    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      ...(error ? { error } : {}),
      ...(errors ? { errors } : {}),
      path,
      requestId,
      timestamp: new Date().toISOString()
    });
  }

  private shouldSanitize(statusCode: number) {
    return this.isProduction && statusCode >= HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
