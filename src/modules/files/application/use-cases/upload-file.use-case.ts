import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import {
  STORAGE_PROVIDER,
  StorageProvider,
} from "../../../storage/domain/storage-provider.interface";
import { assertAllowedUpload } from "../../../../shared/upload/upload-policy";
import {
  FILE_REPOSITORY,
  FileRepository,
} from "../../domain/repositories/file.repository.interface";
import { FileEntity } from "../../domain/entities/file.entity";
import { PrismaService } from "../../../../shared/database/prisma.service";

export interface UploadFileInput {
  storageName: string;
  folder?: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  size: number;
  clientId: string;
}

@Injectable()
export class UploadFileUseCase {
  private readonly logger = new Logger(UploadFileUseCase.name);

  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
    @Inject(FILE_REPOSITORY) private readonly fileRepository: FileRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: UploadFileInput): Promise<FileEntity> {
    assertAllowedUpload({
      mimeType: input.mimeType,
      size: input.size,
    });

    const storage = await this.prisma.storage.findUnique({
      where: { name: input.storageName },
    });

    if (!storage) {
      throw new NotFoundException(`Storage "${input.storageName}" not found.`);
    }

    const extension = input.fileName.includes(".")
      ? `.${input.fileName.split(".").pop()}`
      : "";
    const uniqueFileName = `${uuidv4()}${extension}`;
    const key = input.folder
      ? `${input.folder}/${uniqueFileName}`
      : uniqueFileName;

    try {
      await this.storageProvider.uploadObject({
        bucket: storage.bucket,
        key,
        body: input.buffer,
        mimeType: input.mimeType,
      });
    } catch (error) {
      this.logger.error(
        `Failed to upload file "${input.fileName}" to bucket "${storage.bucket}" with key "${key}".`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadGatewayException(
        "Failed to upload file to storage. Check the bucket, region, AWS credentials, and S3 permissions.",
      );
    }

    return this.fileRepository.create({
      key,
      fileName: input.fileName,
      mimeType: input.mimeType,
      size: input.size,
      status: "UPLOADED",
      storageId: storage.id,
      clientId: input.clientId,
    });
  }
}
