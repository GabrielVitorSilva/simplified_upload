import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ApiKeyGuard } from "./api-key.guard";
import { PrismaService } from "../../../../shared/database/prisma.service";

const mockPrismaService = {
  client: {
    findUnique: jest.fn(),
  },
};

const mockReflector = {
  getAllAndOverride: jest.fn(),
};

function createMockExecutionContext(
  headers: Record<string, string>,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe("ApiKeyGuard", () => {
  let guard: ApiKeyGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should allow access for public routes", async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockExecutionContext({});

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrismaService.client.findUnique).not.toHaveBeenCalled();
  });

  it("should throw UnauthorizedException when no API key is provided", async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockExecutionContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("should throw UnauthorizedException when API key is invalid", async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockPrismaService.client.findUnique.mockResolvedValue(null);

    const context = createMockExecutionContext({ "x-api-key": "invalid-key" });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("should throw UnauthorizedException when client is inactive", async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockPrismaService.client.findUnique.mockResolvedValue({
      id: "client-id",
      apiKey: "valid-key",
      active: false,
    });

    const context = createMockExecutionContext({ "x-api-key": "valid-key" });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("should allow access with valid and active API key", async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockPrismaService.client.findUnique.mockResolvedValue({
      id: "client-id",
      name: "Test App",
      apiKey: "valid-key",
      active: true,
    });

    const context = createMockExecutionContext({ "x-api-key": "valid-key" });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({
      where: { apiKey: "valid-key" },
    });
  });
});
