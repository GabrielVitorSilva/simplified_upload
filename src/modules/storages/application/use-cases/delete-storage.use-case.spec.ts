import { ConflictException, NotFoundException } from "@nestjs/common";
import { DeleteStorageUseCase } from "./delete-storage.use-case";
import { StorageRepository } from "../../domain/repositories/storage.repository.interface";
import { StorageEntity } from "../../domain/entities/storage.entity";

const makeStorage = (): StorageEntity =>
  new StorageEntity({
    id: "storage-id",
    name: "default",
    bucket: "bucket",
    region: "us-east-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

describe("DeleteStorageUseCase", () => {
  let useCase: DeleteStorageUseCase;
  let repo: jest.Mocked<StorageRepository>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countFiles: jest.fn(),
    };
    useCase = new DeleteStorageUseCase(repo as any);
  });

  it("deletes when storage exists and has no files", async () => {
    repo.findById.mockResolvedValue(makeStorage());
    repo.countFiles.mockResolvedValue(0);

    await useCase.execute("storage-id");

    expect(repo.delete).toHaveBeenCalledWith("storage-id");
  });

  it("throws NotFoundException when storage does not exist", async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute("missing-id")).rejects.toThrow(
      NotFoundException,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it("throws ConflictException when storage has associated files", async () => {
    repo.findById.mockResolvedValue(makeStorage());
    repo.countFiles.mockResolvedValue(3);

    await expect(useCase.execute("storage-id")).rejects.toThrow(
      ConflictException,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });
});
