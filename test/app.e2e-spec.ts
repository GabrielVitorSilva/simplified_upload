import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/shared/database/prisma.service";
import { S3_CLIENT } from "../src/shared/aws/s3-client.provider";
import { AllExceptionsFilter } from "../src/shared/exceptions/http-exception.filter";

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://s3.example/presigned"),
}));

const storageId = "550e8400-e29b-41d4-a716-446655440000";
const fileId = "550e8400-e29b-41d4-a716-446655440001";
const clientId = "550e8400-e29b-41d4-a716-446655440002";
const adminClient = {
  id: "admin-id",
  name: "Admin",
  apiKey: "fsk_admin",
  active: true,
  isAdmin: true,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
};
const normalClient = {
  id: "normal-id",
  name: "Normal",
  apiKey: "fsk_normal",
  active: true,
  isAdmin: false,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
};
const storage = {
  id: storageId,
  name: "default",
  bucket: "bucket",
  region: "us-east-1",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};
const file = {
  id: fileId,
  key: "avatars/file.png",
  fileName: "avatar.png",
  mimeType: "image/png",
  size: 123,
  storageId,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};
const mockS3Client = {
  send: jest.fn(),
};

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
      .useValue(mockS3Client)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mockS3Client.send.mockResolvedValue({});
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterAll(async () => {
    await app.close();
  });

  function authenticateAs(client: typeof adminClient | typeof normalClient) {
    mockPrisma.client.findUnique.mockResolvedValueOnce(client);
  }

  it("GET /api/v1/health returns 200", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);
    return request(app.getHttpServer()).get("/api/v1/health").expect(200);
  });

  it("GET /api/v1/files returns 401 without api key", () => {
    return request(app.getHttpServer()).get("/api/v1/files").expect(401);
  });

  describe("Auth and admin guard", () => {
    it("returns 401 without api key", () => {
      return request(app.getHttpServer()).get("/api/v1/clients").expect(401);
    });

    it("returns 403 for authenticated non-admin client", async () => {
      authenticateAs(normalClient);
      return request(app.getHttpServer())
        .get("/api/v1/clients")
        .set("x-api-key", "fsk_normal")
        .expect(403);
    });

    it("returns 200 for authenticated admin client", async () => {
      authenticateAs(adminClient);
      mockPrisma.client.findMany.mockResolvedValueOnce([]);
      return request(app.getHttpServer())
        .get("/api/v1/clients")
        .set("x-api-key", "fsk_admin")
        .expect(200);
    });
  });

  describe("Clients routes", () => {
    it("POST /api/v1/clients creates a client", async () => {
      authenticateAs(adminClient);
      mockPrisma.client.create.mockResolvedValueOnce({
        ...normalClient,
        id: clientId,
        name: "My App",
        apiKey: "fsk_created",
      });

      const response = await request(app.getHttpServer())
        .post("/api/v1/clients")
        .set("x-api-key", "fsk_admin")
        .send({ name: "My App" })
        .expect(201);

      expect(response.body).toMatchObject({
        id: clientId,
        name: "My App",
        apiKey: "fsk_created",
        active: true,
        isAdmin: false,
      });
    });

    it("GET /api/v1/clients/:id returns a client without apiKey", async () => {
      authenticateAs(adminClient);
      mockPrisma.client.findUnique.mockResolvedValueOnce({
        ...normalClient,
        id: clientId,
        apiKey: "fsk_hidden",
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/clients/${clientId}`)
        .set("x-api-key", "fsk_admin")
        .expect(200);

      expect(response.body).toMatchObject({ id: clientId, name: "Normal" });
      expect(response.body.apiKey).toBeUndefined();
    });

    it("PATCH /api/v1/clients/:id/regenerate-key returns a new key", async () => {
      authenticateAs(adminClient);
      mockPrisma.client.findUnique.mockResolvedValueOnce({
        ...normalClient,
        id: clientId,
      });
      mockPrisma.client.update.mockResolvedValueOnce({
        ...normalClient,
        id: clientId,
        apiKey: "fsk_new",
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/clients/${clientId}/regenerate-key`)
        .set("x-api-key", "fsk_admin")
        .expect(200);

      expect(response.body.apiKey).toMatch(/^fsk_/);
    });

    it("DELETE /api/v1/clients/:id deletes a client", async () => {
      authenticateAs(adminClient);
      mockPrisma.client.findUnique.mockResolvedValueOnce({
        ...normalClient,
        id: clientId,
      });
      mockPrisma.client.delete.mockResolvedValueOnce({ id: clientId });

      await request(app.getHttpServer())
        .delete(`/api/v1/clients/${clientId}`)
        .set("x-api-key", "fsk_admin")
        .expect(204);

      expect(mockPrisma.client.delete).toHaveBeenCalledWith({
        where: { id: clientId },
      });
    });
  });

  describe("Storages routes", () => {
    it("POST /api/v1/storages creates a storage", async () => {
      authenticateAs(adminClient);
      mockPrisma.storage.findUnique.mockResolvedValueOnce(null);
      mockPrisma.storage.create.mockResolvedValueOnce(storage);

      const response = await request(app.getHttpServer())
        .post("/api/v1/storages")
        .set("x-api-key", "fsk_admin")
        .send({ name: "default", bucket: "bucket", region: "us-east-1" })
        .expect(201);

      expect(response.body).toMatchObject({
        id: storageId,
        name: "default",
        bucket: "bucket",
      });
    });

    it("GET /api/v1/storages lists storages", async () => {
      authenticateAs(adminClient);
      mockPrisma.storage.findMany.mockResolvedValueOnce([storage]);

      const response = await request(app.getHttpServer())
        .get("/api/v1/storages")
        .set("x-api-key", "fsk_admin")
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: storageId,
        name: "default",
      });
    });

    it("GET /api/v1/storages/:id returns one storage", async () => {
      authenticateAs(adminClient);
      mockPrisma.storage.findUnique.mockResolvedValueOnce(storage);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/storages/${storageId}`)
        .set("x-api-key", "fsk_admin")
        .expect(200);

      expect(response.body).toMatchObject({ id: storageId, bucket: "bucket" });
    });

    it("PUT /api/v1/storages/:id updates a storage", async () => {
      authenticateAs(adminClient);
      mockPrisma.storage.findUnique.mockResolvedValueOnce(storage);
      mockPrisma.storage.update.mockResolvedValueOnce({
        ...storage,
        region: "sa-east-1",
      });

      const response = await request(app.getHttpServer())
        .put(`/api/v1/storages/${storageId}`)
        .set("x-api-key", "fsk_admin")
        .send({ region: "sa-east-1" })
        .expect(200);

      expect(response.body.region).toBe("sa-east-1");
    });

    it("DELETE /api/v1/storages/:id returns 409 when files are associated", async () => {
      authenticateAs(adminClient);
      mockPrisma.storage.findUnique.mockResolvedValueOnce(storage);
      mockPrisma.file.count.mockResolvedValueOnce(1);

      await request(app.getHttpServer())
        .delete(`/api/v1/storages/${storageId}`)
        .set("x-api-key", "fsk_admin")
        .expect(409);

      expect(mockPrisma.storage.delete).not.toHaveBeenCalled();
    });
  });

  describe("Files routes", () => {
    it("GET /api/v1/files lists files", async () => {
      authenticateAs(normalClient);
      mockPrisma.file.findMany.mockResolvedValueOnce([file]);
      mockPrisma.file.count.mockResolvedValueOnce(1);

      const response = await request(app.getHttpServer())
        .get("/api/v1/files?page=1&limit=10")
        .set("x-api-key", "fsk_normal")
        .expect(200);

      expect(response.body).toMatchObject({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(response.body.data[0]).toMatchObject({ id: fileId });
    });

    it("POST /api/v1/files/upload-url generates a presigned URL", async () => {
      authenticateAs(normalClient);
      mockPrisma.storage.findUnique.mockResolvedValueOnce(storage);
      mockPrisma.file.create.mockResolvedValueOnce(file);

      const response = await request(app.getHttpServer())
        .post("/api/v1/files/upload-url")
        .set("x-api-key", "fsk_normal")
        .send({
          storageName: "default",
          folder: "avatars",
          fileName: "avatar.png",
          mimeType: "image/png",
        })
        .expect(201);

      expect(response.body).toMatchObject({
        fileId,
        uploadUrl: "https://s3.example/presigned",
        expiresIn: 300,
      });
    });

    it("POST /api/v1/files/upload uploads multipart through the API", async () => {
      authenticateAs(normalClient);
      mockPrisma.storage.findUnique.mockResolvedValueOnce(storage);
      mockPrisma.file.create.mockResolvedValueOnce(file);

      const response = await request(app.getHttpServer())
        .post("/api/v1/files/upload")
        .set("x-api-key", "fsk_normal")
        .field("storageName", "default")
        .field("folder", "avatars")
        .attach("file", Buffer.from("image"), {
          filename: "avatar.png",
          contentType: "image/png",
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: fileId,
        fileName: "avatar.png",
        storageId,
      });
      expect(mockS3Client.send).toHaveBeenCalled();
    });

    it("POST /api/v1/files/upload-url/test uploads through a presigned URL", async () => {
      authenticateAs(normalClient);
      mockPrisma.storage.findUnique.mockResolvedValueOnce(storage);
      mockPrisma.file.create.mockResolvedValueOnce(file);

      const response = await request(app.getHttpServer())
        .post("/api/v1/files/upload-url/test")
        .set("x-api-key", "fsk_normal")
        .field("storageName", "default")
        .field("folder", "avatars")
        .attach("file", Buffer.from("image"), {
          filename: "avatar.png",
          contentType: "image/png",
        })
        .expect(201);

      expect(response.body).toMatchObject({
        fileId,
        uploaded: true,
        uploadUrl: "https://s3.example/presigned",
      });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://s3.example/presigned",
        expect.objectContaining({ method: "PUT" }),
      );
    });

    it("GET /api/v1/files/:id/url returns a download URL", async () => {
      authenticateAs(normalClient);
      mockPrisma.file.findUnique.mockResolvedValueOnce(file);
      mockPrisma.storage.findUnique.mockResolvedValueOnce(storage);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/files/${fileId}/url`)
        .set("x-api-key", "fsk_normal")
        .expect(200);

      expect(response.body).toMatchObject({
        url: "https://s3.example/presigned",
        fileName: "avatar.png",
      });
    });

    it("DELETE /api/v1/files/:id deletes a file", async () => {
      authenticateAs(normalClient);
      mockPrisma.file.findUnique.mockResolvedValueOnce(file);
      mockPrisma.storage.findUnique.mockResolvedValueOnce(storage);
      mockPrisma.file.delete.mockResolvedValueOnce(file);

      await request(app.getHttpServer())
        .delete(`/api/v1/files/${fileId}`)
        .set("x-api-key", "fsk_normal")
        .expect(204);

      expect(mockS3Client.send).toHaveBeenCalled();
      expect(mockPrisma.file.delete).toHaveBeenCalledWith({
        where: { id: fileId },
      });
    });
  });

  describe("Rate limit", () => {
    it("returns rate limit headers on protected routes", async () => {
      authenticateAs(normalClient);
      mockPrisma.file.findMany.mockResolvedValueOnce([]);
      mockPrisma.file.count.mockResolvedValueOnce(0);

      const response = await request(app.getHttpServer())
        .get("/api/v1/files")
        .set("x-api-key", "fsk_rate_limit")
        .expect(200);

      expect(response.headers["x-ratelimit-limit"]).toBeDefined();
      expect(response.headers["x-ratelimit-remaining"]).toBeDefined();
      expect(response.headers["x-ratelimit-reset"]).toBeDefined();
    });
  });
});
