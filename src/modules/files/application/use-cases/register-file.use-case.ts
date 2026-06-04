import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  FILE_REPOSITORY,
  FileRepository,
} from "../../domain/repositories/file.repository.interface";
import { FileEntity } from "../../domain/entities/file.entity";
import { PrismaService } from "../../../../shared/database/prisma.service";

export interface RegisterFileInput {
  key: string;
  fileName: string;
  mimeType: string;
  size?: number;
  status?: "PENDING" | "UPLOADED";
  storageId: string;
  clientId: string;
}

@Injectable()
export class RegisterFileUseCase {
  constructor(
    @Inject(FILE_REPOSITORY) private readonly fileRepository: FileRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: RegisterFileInput): Promise<FileEntity> {
    const storage = await this.prisma.storage.findUnique({
      where: { id: input.storageId },
    });

    if (!storage) {
      throw new NotFoundException(
        `Storage with ID "${input.storageId}" not found.`,
      );
    }

    return this.fileRepository.create(input);
  }
}
