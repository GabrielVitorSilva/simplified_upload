import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  ConflictException,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { CreateStorageDto } from '../dtos/create-storage.dto';
import { UpdateStorageDto } from '../dtos/update-storage.dto';
import { StorageEntity } from '../../domain/entities/storage.entity';

@ApiTags('Storages')
@ApiSecurity('x-api-key')
@Controller('storages')
export class StoragesController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new storage configuration' })
  @ApiResponse({ status: 201, description: 'Storage created' })
  @ApiResponse({ status: 409, description: 'Storage name already exists' })
  async create(@Body() dto: CreateStorageDto): Promise<StorageEntity> {
    const existing = await this.prisma.storage.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Storage with name "${dto.name}" already exists.`);
    }
    const storage = await this.prisma.storage.create({ data: dto });
    return new StorageEntity(storage);
  }

  @Get()
  @ApiOperation({ summary: 'List all storage configurations' })
  async findAll(): Promise<StorageEntity[]> {
    const storages = await this.prisma.storage.findMany({ orderBy: { createdAt: 'desc' } });
    return storages.map((s) => new StorageEntity(s));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a storage by ID' })
  @ApiParam({ name: 'id', description: 'Storage UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<StorageEntity> {
    const storage = await this.prisma.storage.findUnique({ where: { id } });
    if (!storage) throw new NotFoundException(`Storage "${id}" not found.`);
    return new StorageEntity(storage);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a storage configuration' })
  @ApiParam({ name: 'id', description: 'Storage UUID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStorageDto,
  ): Promise<StorageEntity> {
    const existing = await this.prisma.storage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Storage "${id}" not found.`);
    const storage = await this.prisma.storage.update({ where: { id }, data: dto });
    return new StorageEntity(storage);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a storage configuration' })
  @ApiParam({ name: 'id', description: 'Storage UUID' })
  @ApiResponse({ status: 204, description: 'Storage deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const existing = await this.prisma.storage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Storage "${id}" not found.`);
    await this.prisma.storage.delete({ where: { id } });
  }
}
