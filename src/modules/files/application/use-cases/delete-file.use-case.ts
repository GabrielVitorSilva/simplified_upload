import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { STORAGE_PROVIDER, StorageProvider } from '../../../storage/domain/storage-provider.interface';
import { FILE_REPOSITORY, FileRepository } from '../../domain/repositories/file.repository.interface';
import { PrismaService } from '../../../../shared/database/prisma.service';

@Injectable()
export class DeleteFileUseCase {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
    @Inject(FILE_REPOSITORY) private readonly fileRepository: FileRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(fileId: string): Promise<void> {
    const file = await this.fileRepository.findById(fileId);

    if (!file) {
      throw new NotFoundException(`File with ID "${fileId}" not found.`);
    }

    const storage = await this.prisma.storage.findUnique({
      where: { id: file.storageId },
    });

    if (!storage) {
      throw new NotFoundException(`Storage for file "${fileId}" not found.`);
    }

    await this.storageProvider.deleteObject({
      bucket: storage.bucket,
      key: file.key,
    });

    await this.fileRepository.delete(fileId);
  }
}
