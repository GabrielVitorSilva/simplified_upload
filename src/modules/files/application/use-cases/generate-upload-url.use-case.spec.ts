import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { NotFoundException } from "@nestjs/common";
import { GenerateUploadUrlUseCase } from "./generate-upload-url.use-case";
import { STORAGE_PROVIDER } from "../../../storage/domain/storage-provider.interface";
import { FILE_REPOSITORY } from "../../domain/repositories/file.repository.interface";
import { PrismaService } from "../../../../shared/database/prisma.service";

const mockStorageProvider = {
  generateUploadUrl: jest.fn(),
  generateDownloadUrl: jest.fn(),
  deleteObject: jest.fn(),
};

const mockFileRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByKey: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
};

const mockPrismaService = {
  storage: {
    findUnique: jest.fn(),
  },
};

const mockConfigService = {
  get: jest.fn().mockReturnValue(300),
};

describe("GenerateUploadUrlUseCase", () => {
  let useCase: GenerateUploadUrlUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateUploadUrlUseCase,
        { provide: STORAGE_PROVIDER, useValue: mockStorageProvider },
        { provide: FILE_REPOSITORY, useValue: mockFileRepository },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get<GenerateUploadUrlUseCase>(GenerateUploadUrlUseCase);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });

  it("should generate an upload URL successfully", async () => {
    const mockStorage = {
      id: "storage-id",
      name: "default",
      bucket: "my-bucket",
      region: "us-east-1",
    };

    const mockFile = {
      id: "file-id",
      key: "avatars/uuid-avatar.png",
      fileName: "avatar.png",
      mimeType: "image/png",
      storageId: "storage-id",
    };

    mockPrismaService.storage.findUnique.mockResolvedValue(mockStorage);
    mockStorageProvider.generateUploadUrl.mockResolvedValue({
      uploadUrl: "https://s3.aws.com/presigned-url",
      key: "avatars/uuid-avatar.png",
      expiresIn: 300,
    });
    mockFileRepository.create.mockResolvedValue(mockFile);

    const result = await useCase.execute({
      storageName: "default",
      folder: "avatars",
      fileName: "avatar.png",
      mimeType: "image/png",
    });

    expect(result).toMatchObject({
      fileId: "file-id",
      uploadUrl: "https://s3.aws.com/presigned-url",
      expiresIn: 300,
    });

    expect(mockPrismaService.storage.findUnique).toHaveBeenCalledWith({
      where: { name: "default" },
    });

    expect(mockStorageProvider.generateUploadUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: "my-bucket",
        mimeType: "image/png",
        expiresIn: 300,
      }),
    );

    expect(mockFileRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "avatar.png",
        mimeType: "image/png",
        storageId: "storage-id",
      }),
    );
  });

  it("should throw NotFoundException when storage does not exist", async () => {
    mockPrismaService.storage.findUnique.mockResolvedValue(null);

    await expect(
      useCase.execute({
        storageName: "nonexistent",
        fileName: "avatar.png",
        mimeType: "image/png",
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("should build key without folder when folder is not provided", async () => {
    const mockStorage = {
      id: "storage-id",
      bucket: "bucket",
      region: "us-east-1",
    };
    const mockFile = {
      id: "file-id",
      key: "uuid.png",
      fileName: "img.png",
      storageId: "storage-id",
    };

    mockPrismaService.storage.findUnique.mockResolvedValue(mockStorage);
    mockStorageProvider.generateUploadUrl.mockResolvedValue({
      uploadUrl: "https://s3.url",
      key: "uuid.png",
      expiresIn: 300,
    });
    mockFileRepository.create.mockResolvedValue(mockFile);

    const result = await useCase.execute({
      storageName: "default",
      fileName: "img.png",
      mimeType: "image/png",
    });

    // Key should NOT contain a folder prefix
    expect(result.key).not.toContain("/");
  });
});
