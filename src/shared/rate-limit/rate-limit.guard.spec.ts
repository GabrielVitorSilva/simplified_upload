import { ExecutionContext, HttpException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { RateLimitGuard } from "./rate-limit.guard";

function createContext(headers: Record<string, string> = {}): ExecutionContext {
  const response = {
    setHeader: jest.fn(),
  };

  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        headers,
        ip: "127.0.0.1",
        socket: { remoteAddress: "127.0.0.1" },
      }),
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
}

describe("RateLimitGuard", () => {
  let reflector: jest.Mocked<Reflector>;

  function makeGuard(maxRequests = 2): RateLimitGuard {
    const configService = {
      get: jest.fn((key: string, fallback: number) => {
        if (key === "app.rateLimitTtlSeconds") return 60;
        if (key === "app.rateLimitMaxRequests") return maxRequests;
        return fallback;
      }),
    } as unknown as ConfigService;

    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<Reflector>;

    return new RateLimitGuard(configService, reflector);
  }

  it("allows requests within the configured limit", () => {
    const guard = makeGuard(2);
    const context = createContext({ "x-api-key": "fsk_test" });

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
  });

  it("throws TooManyRequestsException after the configured limit", () => {
    const guard = makeGuard(1);
    const context = createContext({ "x-api-key": "fsk_test" });

    expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(() => guard.canActivate(context)).toThrow("Rate limit exceeded");
  });

  it("skips rate limit when the route is decorated to skip it", () => {
    const guard = makeGuard(1);
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = createContext();

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
  });
});
