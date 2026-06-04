import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  STORAGE_REPOSITORY,
  StorageRepository,
} from "../../domain/repositories/storage.repository.interface";
import { StorageEntity } from "../../domain/entities/storage.entity";

@Injectable()
export class GetStorageUseCase {
  constructor(
    @Inject(STORAGE_REPOSITORY)
    private readonly storageRepository: StorageRepository,
  ) {}

  async execute(id: string): Promise<StorageEntity> {
    const storage = await this.storageRepository.findById(id);
    if (!storage) throw new NotFoundException(`Storage "${id}" not found.`);
    return storage;
  }
}
