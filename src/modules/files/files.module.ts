import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";
import { FilesController } from "./infra/controllers/files.controller";
import { PrismaFileRepository } from "./infra/repositories/prisma-file.repository";
import { FILE_REPOSITORY } from "./domain/repositories/file.repository.interface";
import { GenerateUploadUrlUseCase } from "./application/use-cases/generate-upload-url.use-case";
import { GetFileUrlUseCase } from "./application/use-cases/get-file-url.use-case";
import { DeleteFileUseCase } from "./application/use-cases/delete-file.use-case";
import { ListFilesUseCase } from "./application/use-cases/list-files.use-case";
import { RegisterFileUseCase } from "./application/use-cases/register-file.use-case";
import { UploadFileUseCase } from "./application/use-cases/upload-file.use-case";
import { UploadWithPresignedUrlUseCase } from "./application/use-cases/upload-with-presigned-url.use-case";

@Module({
  imports: [StorageModule],
  controllers: [FilesController],
  providers: [
    {
      provide: FILE_REPOSITORY,
      useClass: PrismaFileRepository,
    },
    GenerateUploadUrlUseCase,
    GetFileUrlUseCase,
    DeleteFileUseCase,
    ListFilesUseCase,
    RegisterFileUseCase,
    UploadFileUseCase,
    UploadWithPresignedUrlUseCase,
  ],
  exports: [RegisterFileUseCase],
})
export class FilesModule {}
