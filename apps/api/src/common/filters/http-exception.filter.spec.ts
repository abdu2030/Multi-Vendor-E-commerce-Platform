import { ArgumentsHost, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { HttpExceptionFilter } from "./http-exception.filter";

describe("HttpExceptionFilter", () => {
  it("does not expose production stack traces or internal 500 details", () => {
    const response = buildResponse();
    const filter = new HttpExceptionFilter(true);

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
      message: "Internal server error"
    }));
    expect(JSON.stringify(response.json.mock.calls[0][0])).not.toContain("database password");
    expect(JSON.stringify(response.json.mock.calls[0][0])).not.toContain("sensitive stack");
  });

  it("keeps client validation messages visible", () => {
    const response = buildResponse();
    const filter = new HttpExceptionFilter(true);

    filter.catch(new BadRequestException("Invalid email."), buildHost(response));

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      statusCode: 400,
      message: "Invalid email."
    }));
  });
});

function buildResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

function buildHost(response: ReturnType<typeof buildResponse>) {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ url: "/api/test" })
    })
  } as unknown as ArgumentsHost;
}