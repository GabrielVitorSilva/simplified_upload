import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { DeleteFileUseCase } from "./delete-file.use-case";
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

describe("DeleteFileUseCase", () => {
  let useCase: DeleteFileUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteFileUseCase,
        { provide: STORAGE_PROVIDER, useValue: mockStorageProvider },
        { provide: FILE_REPOSITORY, useValue: mockFileRepository },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    useCase = module.get<DeleteFileUseCase>(DeleteFileUseCase);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });

  it("should delete a file from S3 and database", async () => {
    const mockFile = {
      id: "file-id",
      key: "avatars/photo.jpg",
      storageId: "storage-id",
    };

    const mockStorage = {
      id: "storage-id",
      bucket: "my-bucket",
      region: "us-east-1",
    };

    mockFileRepository.findById.mockResolvedValue(mockFile);
    mockPrismaService.storage.findUnique.mockResolvedValue(mockStorage);
    mockStorageProvider.deleteObject.mockResolvedValue(undefined);
    mockFileRepository.delete.mockResolvedValue(undefined);

    await useCase.execute("file-id");

    expect(mockFileRepository.findById).toHaveBeenCalledWith("file-id");
    expect(mockStorageProvider.deleteObject).toHaveBeenCalledWith({
      bucket: "my-bucket",
      key: "avatars/photo.jpg",
    });
    expect(mockFileRepository.delete).toHaveBeenCalledWith("file-id");
  });

  it("should throw NotFoundException when file does not exist", async () => {
    mockFileRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("nonexistent-id")).rejects.toThrow(
      NotFoundException,
    );

    expect(mockStorageProvider.deleteObject).not.toHaveBeenCalled();
    expect(mockFileRepository.delete).not.toHaveBeenCalled();
  });

  it("should throw NotFoundException when storage does not exist", async () => {
    const mockFile = {
      id: "file-id",
      key: "photo.jpg",
      storageId: "storage-id",
    };

    mockFileRepository.findById.mockResolvedValue(mockFile);
    mockPrismaService.storage.findUnique.mockResolvedValue(null);

    await expect(useCase.execute("file-id")).rejects.toThrow(NotFoundException);

    expect(mockStorageProvider.deleteObject).not.toHaveBeenCalled();
    expect(mockFileRepository.delete).not.toHaveBeenCalled();
  });
});
