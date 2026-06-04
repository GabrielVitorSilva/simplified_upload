import { Inject, Injectable } from "@nestjs/common";
import {
  STORAGE_REPOSITORY,
  StorageRepository,
} from "../../domain/repositories/storage.repository.interface";
import { StorageEntity } from "../../domain/entities/storage.entity";

@Injectable()
export class ListStoragesUseCase {
  constructor(
    @Inject(STORAGE_REPOSITORY)
    private readonly storageRepository: StorageRepository,
  ) {}

  async execute(): Promise<StorageEntity[]> {
    return this.storageRepository.findAll();
  }
}
