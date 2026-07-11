import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import { Request, Response } from "express";

type ErrorResponseBody = {
  message?: string | string[];
  error?: string;
  errors?: unknown;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : "Internal server error";

    const message =
      typeof errorResponse === "object" && errorResponse !== null && "message" in errorResponse
        ? (errorResponse as ErrorResponseBody).message
        : errorResponse;
    const error =
      typeof errorResponse === "object" && errorResponse !== null && "error" in errorResponse
        ? (errorResponse as ErrorResponseBody).error
        : undefined;
    const errors =
      typeof errorResponse === "object" && errorResponse !== null && "errors" in errorResponse
        ? (errorResponse as ErrorResponseBody).errors
        : undefined;

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      ...(error ? { error } : {}),
      ...(errors ? { errors } : {}),
      path: request.url,
      timestamp: new Date().toISOString()
    });
  }
}
