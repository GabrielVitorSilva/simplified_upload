import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { GenerateUploadUrlUseCase } from "../../application/use-cases/generate-upload-url.use-case";
import { GetFileUrlUseCase } from "../../application/use-cases/get-file-url.use-case";
import { DeleteFileUseCase } from "../../application/use-cases/delete-file.use-case";
import { ListFilesUseCase } from "../../application/use-cases/list-files.use-case";
import { UploadFileUseCase } from "../../application/use-cases/upload-file.use-case";
import { UploadWithPresignedUrlUseCase } from "../../application/use-cases/upload-with-presigned-url.use-case";
import { GenerateUploadUrlDto } from "../dtos/generate-upload-url.dto";
import { ListFilesDto } from "../dtos/list-files.dto";

@ApiTags("Files")
@ApiSecurity("x-api-key")
@Controller("files")
export class FilesController {
  constructor(
    private readonly generateUploadUrlUseCase: GenerateUploadUrlUseCase,
    private readonly getFileUrlUseCase: GetFileUrlUseCase,
    private readonly deleteFileUseCase: DeleteFileUseCase,
    private readonly listFilesUseCase: ListFilesUseCase,
    private readonly uploadFileUseCase: UploadFileUseCase,
    private readonly uploadWithPresignedUrlUseCase: UploadWithPresignedUrlUseCase,
  ) {}

  @Post("upload-url")
  @ApiOperation({
    summary: "Generate a presigned S3 upload URL",
    description:
      "Use this in real client applications. Send storageName from GET /storages, optional folder, original fileName, and mimeType. The response returns fileId, key, and uploadUrl. Then upload the binary file directly to uploadUrl with HTTP PUT and the same Content-Type.",
  })
  @ApiResponse({
    status: 201,
    description: "Presigned upload URL generated",
    schema: {
      example: {
        fileId: "uuid",
        key: "avatars/uuid-avatar.png",
        uploadUrl: "https://s3.amazonaws.com/...",
        expiresIn: 300,
      },
    },
  })
  async generateUploadUrl(@Body() dto: GenerateUploadUrlDto) {
    return this.generateUploadUrlUseCase.execute(dto);
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Upload a file through the API",
    description:
      "Swagger/manual helper. The backend receives the multipart file and uploads it to S3 with the configured AWS credentials. Use storageName from GET /storages. For real client apps, prefer POST /files/upload-url and direct upload to S3.",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["storageName", "file"],
      properties: {
        storageName: {
          type: "string",
          description:
            "Storage name from GET /storages or POST /storages response. This is not the storage UUID.",
          example: "default",
        },
        folder: {
          type: "string",
          description:
            "Optional S3 prefix/folder. You can choose any path, for example avatars or documents/2026.",
          example: "avatars",
        },
        file: {
          type: "string",
          format: "binary",
          description: "File selected from your machine.",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "File uploaded and registered",
    schema: {
      example: {
        id: "uuid",
        key: "avatars/uuid-avatar.png",
        fileName: "avatar.png",
        mimeType: "image/png",
        size: 12345,
        storageId: "uuid",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  async uploadFile(
    @Body("storageName") storageName: string,
    @Body("folder") folder: string | undefined,
    @UploadedFile() file?: any,
  ) {
    if (!storageName) {
      throw new BadRequestException("storageName is required.");
    }

    if (!file) {
      throw new BadRequestException("file is required.");
    }

    return this.uploadFileUseCase.execute({
      storageName,
      folder,
      fileName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
      size: file.size,
    });
  }

  @Post("upload-url/test")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Test upload through a presigned URL",
    description:
      "Swagger/manual helper to validate the presigned URL flow. It receives a file, generates a presigned URL using storageName from GET /storages, then performs the HTTP PUT to that URL. Use this to test S3 permissions and presigned upload behavior without leaving Swagger.",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["storageName", "file"],
      properties: {
        storageName: {
          type: "string",
          description:
            "Storage name from GET /storages or POST /storages response. This is not the storage UUID.",
          example: "default",
        },
        folder: {
          type: "string",
          description:
            "Optional S3 prefix/folder. You can choose any path, for example avatars or documents/2026.",
          example: "avatars",
        },
        file: {
          type: "string",
          format: "binary",
          description: "File selected from your machine.",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Presigned URL generated and file uploaded through it",
    schema: {
      example: {
        fileId: "uuid",
        key: "avatars/uuid-avatar.png",
        uploadUrl: "https://s3.amazonaws.com/...",
        expiresIn: 300,
        uploaded: true,
      },
    },
  })
  async testPresignedUpload(
    @Body("storageName") storageName: string,
    @Body("folder") folder: string | undefined,
    @UploadedFile() file?: any,
  ) {
    if (!storageName) {
      throw new BadRequestException("storageName is required.");
    }

    if (!file) {
      throw new BadRequestException("file is required.");
    }

    return this.uploadWithPresignedUrlUseCase.execute({
      storageName,
      folder,
      fileName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
    });
  }

  @Get(":id/url")
  @ApiOperation({
    summary: "Get presigned download URL for a file",
    description:
      "Generates a temporary URL to download/read a stored file. Use the file id returned by POST /files/upload-url, POST /files/upload, POST /files/upload-url/test, or GET /files.",
  })
  @ApiParam({
    name: "id",
    description:
      "File UUID. Get this value from upload responses or from GET /files.",
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        url: "https://s3.amazonaws.com/...",
        key: "avatars/uuid-avatar.png",
        fileName: "avatar.png",
        mimeType: "image/png",
      },
    },
  })
  async getFileUrl(@Param("id", ParseUUIDPipe) id: string) {
    return this.getFileUrlUseCase.execute(id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a file from S3 and database",
    description:
      "Deletes the S3 object and removes its metadata from the database. Use the file id returned by upload responses or GET /files.",
  })
  @ApiParam({
    name: "id",
    description:
      "File UUID. Get this value from upload responses or from GET /files.",
  })
  @ApiResponse({ status: 204, description: "File deleted" })
  @ApiResponse({ status: 404, description: "File not found" })
  async deleteFile(@Param("id", ParseUUIDPipe) id: string) {
    return this.deleteFileUseCase.execute(id);
  }

  @Get()
  @ApiOperation({
    summary: "List all files with pagination",
    description:
      "Lists stored file metadata. Use returned file ids for GET /files/{id}/url or DELETE /files/{id}. To filter by storage, use storageId from GET /storages.",
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    },
  })
  async listFiles(@Query() query: ListFilesDto) {
    return this.listFilesUseCase.execute({
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
      storageId: query.storageId,
    });
  }
}
