import { ConflictException, Inject, Injectable } from "@nestjs/common";
import {
  STORAGE_REPOSITORY,
  StorageRepository,
} from "../../domain/repositories/storage.repository.interface";
import { StorageEntity } from "../../domain/entities/storage.entity";

export interface CreateStorageInput {
  name: string;
  bucket: string;
  region: string;
}

@Injectable()
export class CreateStorageUseCase {
  constructor(
    @Inject(STORAGE_REPOSITORY)
    private readonly storageRepository: StorageRepository,
  ) {}

  async execute(input: CreateStorageInput): Promise<StorageEntity> {
    const existing = await this.storageRepository.findByName(input.name);
    if (existing) {
      throw new ConflictException(
        `Storage with name "${input.name}" already exists.`,
      );
    }
    return this.storageRepository.create(input);
  }
}
