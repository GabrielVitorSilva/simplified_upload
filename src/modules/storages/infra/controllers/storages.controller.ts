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
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { AdminGuard } from "../../../auth/infra/guards/admin.guard";
import { CreateStorageDto } from "../dtos/create-storage.dto";
import { UpdateStorageDto } from "../dtos/update-storage.dto";
import { StorageEntity } from "../../domain/entities/storage.entity";
import { CreateStorageUseCase } from "../../application/use-cases/create-storage.use-case";
import { ListStoragesUseCase } from "../../application/use-cases/list-storages.use-case";
import { GetStorageUseCase } from "../../application/use-cases/get-storage.use-case";
import { UpdateStorageUseCase } from "../../application/use-cases/update-storage.use-case";
import { DeleteStorageUseCase } from "../../application/use-cases/delete-storage.use-case";

@ApiTags("Storages")
@ApiSecurity("x-api-key")
@UseGuards(AdminGuard)
@Controller("storages")
export class StoragesController {
  constructor(
    private readonly createStorageUseCase: CreateStorageUseCase,
    private readonly listStoragesUseCase: ListStoragesUseCase,
    private readonly getStorageUseCase: GetStorageUseCase,
    private readonly updateStorageUseCase: UpdateStorageUseCase,
    private readonly deleteStorageUseCase: DeleteStorageUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: "Create a new storage configuration",
    description:
      "Admin endpoint. Registers an existing S3 bucket so upload endpoints can use it. The response id is storageId; the name is storageName for /files upload endpoints.",
  })
  @ApiResponse({ status: 201, description: "Storage created" })
  @ApiResponse({ status: 409, description: "Storage name already exists" })
  async create(@Body() dto: CreateStorageDto): Promise<StorageEntity> {
    return this.createStorageUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({
    summary: "List all storage configurations",
    description:
      "Admin endpoint. Use this to find storageName for file uploads and storageId for filtering files or updating/deleting a storage.",
  })
  async findAll(): Promise<StorageEntity[]> {
    return this.listStoragesUseCase.execute();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a storage by ID",
    description:
      "Admin endpoint. Shows bucket and region for a storage. Get the id from GET /storages or POST /storages.",
  })
  @ApiParam({
    name: "id",
    description:
      "Storage UUID. Get this value from GET /storages or the response of POST /storages.",
  })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<StorageEntity> {
    return this.getStorageUseCase.execute(id);
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update a storage configuration",
    description:
      "Admin endpoint. Changes the bucket or region used by this storage. Get the id from GET /storages.",
  })
  @ApiParam({
    name: "id",
    description: "Storage UUID. Get this value from GET /storages.",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateStorageDto,
  ): Promise<StorageEntity> {
    return this.updateStorageUseCase.execute(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a storage configuration",
    description:
      "Admin endpoint. Deletes the storage configuration. It returns 409 if files are still associated with this storage; delete those files first.",
  })
  @ApiParam({
    name: "id",
    description: "Storage UUID. Get this value from GET /storages.",
  })
  @ApiResponse({ status: 204, description: "Storage deleted" })
  @ApiResponse({ status: 409, description: "Storage has associated files" })
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteStorageUseCase.execute(id);
  }
}
