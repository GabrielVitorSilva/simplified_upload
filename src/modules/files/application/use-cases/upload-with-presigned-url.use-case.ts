import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import {
  FILE_REPOSITORY,
  FileRepository,
} from "../../domain/repositories/file.repository.interface";
import {
  GenerateUploadUrlOutput,
  GenerateUploadUrlUseCase,
} from "./generate-upload-url.use-case";

export interface UploadWithPresignedUrlInput {
  storageName: string;
  folder?: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  clientId: string;
}

export interface UploadWithPresignedUrlOutput extends GenerateUploadUrlOutput {
  uploaded: boolean;
}

@Injectable()
export class UploadWithPresignedUrlUseCase {
  private readonly logger = new Logger(UploadWithPresignedUrlUseCase.name);

  constructor(
    private readonly generateUploadUrlUseCase: GenerateUploadUrlUseCase,
    @Inject(FILE_REPOSITORY) private readonly fileRepository: FileRepository,
  ) {}

  async execute(
    input: UploadWithPresignedUrlInput,
  ): Promise<UploadWithPresignedUrlOutput> {
    const presigned = await this.generateUploadUrlUseCase.execute({
      storageName: input.storageName,
      folder: input.folder,
      fileName: input.fileName,
      mimeType: input.mimeType,
      clientId: input.clientId,
    });

    try {
      const body = new Blob([new Uint8Array(input.buffer)], {
        type: input.mimeType,
      });

      const response = await fetch(presigned.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": input.mimeType,
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`Presigned upload failed with HTTP ${response.status}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to upload file "${input.fileName}" through presigned URL for key "${presigned.key}".`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadGatewayException(
        "Failed to upload file through the presigned URL. Check the bucket, region, AWS credentials, CORS, and S3 permissions.",
      );
    }

    const file = await this.fileRepository.updateStatus(
      presigned.fileId,
      "UPLOADED",
    );

    return {
      ...presigned,
      fileId: file.id,
      uploaded: true,
    };
  }
}
