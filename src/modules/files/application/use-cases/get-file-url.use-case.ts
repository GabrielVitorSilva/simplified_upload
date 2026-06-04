import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  STORAGE_PROVIDER,
  StorageProvider,
} from "../../../storage/domain/storage-provider.interface";
import {
  FILE_REPOSITORY,
  FileRepository,
} from "../../domain/repositories/file.repository.interface";
import { PrismaService } from "../../../../shared/database/prisma.service";

export interface GetFileUrlOutput {
  url: string;
  key: string;
  fileName: string;
  mimeType: string;
}

@Injectable()
export class GetFileUrlUseCase {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
    @Inject(FILE_REPOSITORY) private readonly fileRepository: FileRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(fileId: string): Promise<GetFileUrlOutput> {
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

    const { url } = await this.storageProvider.generateDownloadUrl({
      bucket: storage.bucket,
      key: file.key,
      expiresIn: 3600,
    });

    return {
      url,
      key: file.key,
      fileName: file.fileName,
      mimeType: file.mimeType,
    };
  }
}
