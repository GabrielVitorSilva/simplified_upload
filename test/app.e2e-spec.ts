import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/shared/database/prisma.service";
import { S3_CLIENT } from "../src/shared/aws/s3-client.provider";
import { AllExceptionsFilter } from "../src/shared/exceptions/http-exception.filter";

const mockPrisma = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
  client: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  storage: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  file: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

describe("App (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(S3_CLIENT)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/health returns 200", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);
    return request(app.getHttpServer()).get("/api/v1/health").expect(200);
  });

  it("GET /api/v1/files returns 401 without api key", () => {
    return request(app.getHttpServer()).get("/api/v1/files").expect(401);
  });

  describe("Admin guard — /api/v1/clients", () => {
    it("returns 401 without api key", () => {
      return request(app.getHttpServer()).get("/api/v1/clients").expect(401);
    });

    it("returns 403 for authenticated non-admin client", async () => {
      mockPrisma.client.findUnique.mockResolvedValueOnce({
        id: "normal-id",
        apiKey: "fsk_normal",
        active: true,
        isAdmin: false,
      });
      return request(app.getHttpServer())
        .get("/api/v1/clients")
        .set("x-api-key", "fsk_normal")
        .expect(403);
    });

    it("returns 200 for authenticated admin client", async () => {
      mockPrisma.client.findUnique.mockResolvedValueOnce({
        id: "admin-id",
        apiKey: "fsk_admin",
        active: true,
        isAdmin: true,
      });
      mockPrisma.client.findMany.mockResolvedValueOnce([]);
      return request(app.getHttpServer())
        .get("/api/v1/clients")
        .set("x-api-key", "fsk_admin")
        .expect(200);
    });
  });
});
