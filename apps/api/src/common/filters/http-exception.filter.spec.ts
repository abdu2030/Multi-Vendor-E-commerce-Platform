import { ArgumentsHost, BadRequestException, ForbiddenException, InternalServerErrorException } from "@nestjs/common";
import { HttpExceptionFilter } from "./http-exception.filter";

describe("HttpExceptionFilter", () => {
  it("does not expose production stack traces or internal 500 details", () => {
    const response = buildResponse();
    const logger = { error: jest.fn() };
    const filter = new HttpExceptionFilter(true, logger as never, buildSecurityLogger() as never);

    filter.catch(
      new InternalServerErrorException({
        message: "database password leaked in internal detail",
        stack: "Error: sensitive stack"
      }),
      buildHost(response)
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      statusCode: 500,
      message: "Internal server error",
      requestId: "request-12345",
      path: "/api/test"
    }));
    expect(response.setHeader).toHaveBeenCalledWith("X-Request-Id", "request-12345");
    expect(JSON.stringify(response.json.mock.calls[0][0])).not.toContain("database password");
    expect(JSON.stringify(response.json.mock.calls[0][0])).not.toContain("sensitive stack");
  });

  it("keeps client validation messages visible", () => {
    const response = buildResponse();
    const filter = new HttpExceptionFilter(true, undefined as never, buildSecurityLogger() as never);

    filter.catch(new BadRequestException("Invalid email."), buildHost(response));

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      statusCode: 400,
      message: "Invalid email."
    }));
  });

  it("logs authorization failures without turning them into success responses", () => {
    const response = buildResponse();
    const securityLogger = buildSecurityLogger();
    const filter = new HttpExceptionFilter(true, undefined as never, securityLogger as never);

    filter.catch(new ForbiddenException("Denied."), buildHost(response));

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      statusCode: 403,
      requestId: "request-12345"
    }));
    expect(securityLogger.log).toHaveBeenCalledWith("UNAUTHORIZED_RESOURCE_ACCESS", {
      requestId: "request-12345",
      method: "GET",
      path: "/api/test",
      statusCode: 403
    });
  });
});

function buildResponse() {
  return {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

function buildSecurityLogger(): { log: jest.Mock } {
  return { log: jest.fn() };
}

function buildHost(response: ReturnType<typeof buildResponse>) {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({
        method: "GET",
        url: "/api/test?token=secret-token",
        originalUrl: "/api/test?token=secret-token",
        path: "/api/test",
        requestId: "request-12345",
        get: jest.fn()
      })
    })
  } as unknown as ArgumentsHost;
}
