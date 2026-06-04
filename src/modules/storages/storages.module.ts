import { Module } from "@nestjs/common";
import { StoragesController } from "./infra/controllers/storages.controller";
import { PrismaStorageRepository } from "./infra/repositories/prisma-storage.repository";
import { STORAGE_REPOSITORY } from "./domain/repositories/storage.repository.interface";
import { CreateStorageUseCase } from "./application/use-cases/create-storage.use-case";
import { ListStoragesUseCase } from "./application/use-cases/list-storages.use-case";
import { GetStorageUseCase } from "./application/use-cases/get-storage.use-case";
import { UpdateStorageUseCase } from "./application/use-cases/update-storage.use-case";
import { DeleteStorageUseCase } from "./application/use-cases/delete-storage.use-case";

@Module({
  controllers: [StoragesController],
  providers: [
    {
      provide: STORAGE_REPOSITORY,
      useClass: PrismaStorageRepository,
    },
    CreateStorageUseCase,
    ListStoragesUseCase,
    GetStorageUseCase,
    UpdateStorageUseCase,
    DeleteStorageUseCase,
  ],
})
export class StoragesModule {}
