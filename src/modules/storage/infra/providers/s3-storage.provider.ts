import { Inject, Injectable, Logger } from "@nestjs/common";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { S3_CLIENT } from "../../../../shared/aws/s3-client.provider";
import {
  StorageProvider,
  GenerateUploadUrlParams,
  GenerateDownloadUrlParams,
  DeleteObjectParams,
  UploadUrlResult,
  DownloadUrlResult,
} from "../../domain/storage-provider.interface";

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);

  constructor(@Inject(S3_CLIENT) private readonly s3Client: S3Client) {}

  async generateUploadUrl(
    params: GenerateUploadUrlParams,
  ): Promise<UploadUrlResult> {
    const { bucket, key, mimeType, expiresIn } = params;

    this.logger.debug(
      `Generating upload URL for key: ${key} in bucket: ${bucket}`,
    );

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

    return { uploadUrl, key, expiresIn };
  }

  async generateDownloadUrl(
    params: GenerateDownloadUrlParams,
  ): Promise<DownloadUrlResult> {
    const { bucket, key, expiresIn = 3600 } = params;

    this.logger.debug(
      `Generating download URL for key: ${key} in bucket: ${bucket}`,
    );

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });

    return { url };
  }

  async deleteObject(params: DeleteObjectParams): Promise<void> {
    const { bucket, key } = params;

    this.logger.debug(`Deleting object: ${key} from bucket: ${bucket}`);

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }
}
