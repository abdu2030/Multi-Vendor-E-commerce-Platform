import { createCorsOriginHandler, parseCsvList } from "./cors.config";

describe("CORS configuration", () => {
  it("parses comma-separated allowed origins without empty entries", () => {
    expect(parseCsvList(" https://shop.example.test, ,https://admin.example.test ")).toEqual([
      "https://shop.example.test",
      "https://admin.example.test"
    ]);
  });

  it("parses the local development frontend fallback ports", () => {
    expect(
      parseCsvList("http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001")
    ).toEqual([
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001"
    ]);
  });

  it("allows requests without an Origin header and configured trusted origins", () => {
    const handler = createCorsOriginHandler(["https://shop.example.test"]);
    const callback = jest.fn();

    handler(undefined, callback);
    handler("https://shop.example.test", callback);

    expect(callback).toHaveBeenNthCalledWith(1, null, true);
    expect(callback).toHaveBeenNthCalledWith(2, null, true);
  });

  it("rejects unauthorized origins", () => {
    const handler = createCorsOriginHandler(["https://shop.example.test"]);
    const callback = jest.fn();

    handler("https://attacker.example.test", callback);

    expect(callback).toHaveBeenCalledWith(expect.any(Error), false);
    expect(callback.mock.calls[0][0].message).toBe("CORS origin is not allowed.");
  });
});