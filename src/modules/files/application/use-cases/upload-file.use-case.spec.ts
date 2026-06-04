import { Test, TestingModule } from "@nestjs/testing";
import { BadGatewayException, Logger, NotFoundException } from "@nestjs/common";
import { UploadFileUseCase } from "./upload-file.use-case";
import { STORAGE_PROVIDER } from "../../../storage/domain/storage-provider.interface";
import { FILE_REPOSITORY } from "../../domain/repositories/file.repository.interface";
import { PrismaService } from "../../../../shared/database/prisma.service";

const mockStorageProvider = {
  uploadObject: jest.fn(),
};

const mockFileRepository = {
  create: jest.fn(),
};

const mockPrismaService = {
  storage: {
    findUnique: jest.fn(),
  },
};

describe("UploadFileUseCase", () => {
  let useCase: UploadFileUseCase;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    loggerErrorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadFileUseCase,
        { provide: STORAGE_PROVIDER, useValue: mockStorageProvider },
        { provide: FILE_REPOSITORY, useValue: mockFileRepository },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    useCase = module.get<UploadFileUseCase>(UploadFileUseCase);
    jest.clearAllMocks();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it("uploads the file to storage and registers it", async () => {
    const storage = {
      id: "storage-id",
      name: "default",
      bucket: "bucket",
      region: "us-east-1",
    };
    const file = {
      id: "file-id",
      key: "avatars/generated.png",
      fileName: "avatar.png",
      mimeType: "image/png",
      size: 123,
      storageId: "storage-id",
    };

    mockPrismaService.storage.findUnique.mockResolvedValue(storage);
    mockStorageProvider.uploadObject.mockResolvedValue(undefined);
    mockFileRepository.create.mockResolvedValue(file);

    const result = await useCase.execute({
      storageName: "default",
      folder: "avatars",
      fileName: "avatar.png",
      mimeType: "image/png",
      buffer: Buffer.from("image"),
      size: 123,
    });

    expect(result).toBe(file);
    expect(mockStorageProvider.uploadObject).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: "bucket",
        mimeType: "image/png",
      }),
    );
    expect(mockFileRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "avatar.png",
        mimeType: "image/png",
        size: 123,
        storageId: "storage-id",
      }),
    );
  });

  it("throws NotFoundException when storage does not exist", async () => {
    mockPrismaService.storage.findUnique.mockResolvedValue(null);

    await expect(
      useCase.execute({
        storageName: "missing",
        fileName: "avatar.png",
        mimeType: "image/png",
        buffer: Buffer.from("image"),
        size: 123,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(mockStorageProvider.uploadObject).not.toHaveBeenCalled();
    expect(mockFileRepository.create).not.toHaveBeenCalled();
  });

  it("throws BadGatewayException when storage upload fails", async () => {
    mockPrismaService.storage.findUnique.mockResolvedValue({
      id: "storage-id",
      name: "default",
      bucket: "bucket",
      region: "us-east-1",
    });
    mockStorageProvider.uploadObject.mockRejectedValue(new Error("S3 error"));

    await expect(
      useCase.execute({
        storageName: "default",
        fileName: "avatar.png",
        mimeType: "image/png",
        buffer: Buffer.from("image"),
        size: 123,
      }),
    ).rejects.toThrow(BadGatewayException);

    expect(mockFileRepository.create).not.toHaveBeenCalled();
  });
});
