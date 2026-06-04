import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";
import {
  STORAGE_PROVIDER,
  StorageProvider,
} from "../../../storage/domain/storage-provider.interface";
import {
  FILE_REPOSITORY,
  FileRepository,
} from "../../domain/repositories/file.repository.interface";
import { PrismaService } from "../../../../shared/database/prisma.service";

export interface GenerateUploadUrlInput {
  storageName: string;
  folder?: string;
  fileName: string;
  mimeType: string;
  clientId: string;
}

export interface GenerateUploadUrlOutput {
  fileId: string;
  key: string;
  uploadUrl: string;
  expiresIn: number;
}

@Injectable()
export class GenerateUploadUrlUseCase {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
    @Inject(FILE_REPOSITORY) private readonly fileRepository: FileRepository,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    input: GenerateUploadUrlInput,
  ): Promise<GenerateUploadUrlOutput> {
    const { storageName, folder, fileName, mimeType } = input;

    const storage = await this.prisma.storage.findUnique({
      where: { name: storageName },
    });

    if (!storage) {
      throw new NotFoundException(`Storage "${storageName}" not found.`);
    }

    const extension = fileName.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${extension}`;
    const key = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

    const expiresIn = this.configService.get<number>(
      "aws.presignedUrlExpiresIn",
      300,
    );

    const { uploadUrl } = await this.storageProvider.generateUploadUrl({
      bucket: storage.bucket,
      key,
      mimeType,
      expiresIn,
    });

    const file = await this.fileRepository.create({
      key,
      fileName,
      mimeType,
      status: "PENDING",
      storageId: storage.id,
      clientId: input.clientId,
    });

    return {
      fileId: file.id,
      key,
      uploadUrl,
      expiresIn,
    };
  }
}
