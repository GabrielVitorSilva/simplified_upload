import { ForbiddenException } from "@nestjs/common";
import { ExecutionContext } from "@nestjs/common";
import { AdminGuard } from "./admin.guard";

function makeContext(client: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ client }),
    }),
  } as unknown as ExecutionContext;
}

describe("AdminGuard", () => {
  let guard: AdminGuard;

  beforeEach(() => {
    guard = new AdminGuard();
  });

  it("allows access when client.isAdmin is true", () => {
    const ctx = makeContext({ id: "uuid", isAdmin: true });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("throws ForbiddenException when client.isAdmin is false", () => {
    const ctx = makeContext({ id: "uuid", isAdmin: false });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it("throws ForbiddenException when request has no client", () => {
    const ctx = makeContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
