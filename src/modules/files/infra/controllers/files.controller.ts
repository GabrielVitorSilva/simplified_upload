import {
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
} from "@nestjs/common";
import {
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
