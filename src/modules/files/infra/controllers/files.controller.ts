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
      "Returns a presigned URL for direct browser/client upload to S3. The backend never receives the file.",
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
      "Helper endpoint for manual uploads in Swagger. For client applications, prefer POST /files/upload-url and direct upload to S3.",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["storageName", "file"],
      properties: {
        storageName: {
          type: "string",
          example: "default",
        },
        folder: {
          type: "string",
          example: "avatars",
        },
        file: {
          type: "string",
          format: "binary",
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
      "Helper endpoint for Swagger: it generates a presigned URL and then uploads the provided file to that URL with HTTP PUT.",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["storageName", "file"],
      properties: {
        storageName: {
          type: "string",
          example: "default",
        },
        folder: {
          type: "string",
          example: "avatars",
        },
        file: {
          type: "string",
          format: "binary",
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
  @ApiOperation({ summary: "Get presigned download URL for a file" })
  @ApiParam({ name: "id", description: "File UUID" })
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
  @ApiOperation({ summary: "Delete a file from S3 and database" })
  @ApiParam({ name: "id", description: "File UUID" })
  @ApiResponse({ status: 204, description: "File deleted" })
  @ApiResponse({ status: 404, description: "File not found" })
  async deleteFile(@Param("id", ParseUUIDPipe) id: string) {
    return this.deleteFileUseCase.execute(id);
  }

  @Get()
  @ApiOperation({ summary: "List all files with pagination" })
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
