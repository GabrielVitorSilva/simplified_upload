import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  STORAGE_REPOSITORY,
  StorageRepository,
} from "../../domain/repositories/storage.repository.interface";

@Injectable()
export class DeleteStorageUseCase {
  constructor(
    @Inject(STORAGE_REPOSITORY)
    private readonly storageRepository: StorageRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.storageRepository.findById(id);
    if (!existing) throw new NotFoundException(`Storage "${id}" not found.`);

    const fileCount = await this.storageRepository.countFiles(id);
    if (fileCount > 0) {
      throw new ConflictException(
        `Storage "${id}" has ${fileCount} associated file(s) and cannot be deleted. Remove all files first.`,
      );
    }

    await this.storageRepository.delete(id);
  }
}
