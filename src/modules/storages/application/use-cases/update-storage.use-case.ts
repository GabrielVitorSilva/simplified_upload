import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  STORAGE_REPOSITORY,
  StorageRepository,
  UpdateStorageData,
} from "../../domain/repositories/storage.repository.interface";
import { StorageEntity } from "../../domain/entities/storage.entity";

@Injectable()
export class UpdateStorageUseCase {
  constructor(
    @Inject(STORAGE_REPOSITORY)
    private readonly storageRepository: StorageRepository,
  ) {}

  async execute(id: string, data: UpdateStorageData): Promise<StorageEntity> {
    const existing = await this.storageRepository.findById(id);
    if (!existing) throw new NotFoundException(`Storage "${id}" not found.`);
    return this.storageRepository.update(id, data);
  }
}
