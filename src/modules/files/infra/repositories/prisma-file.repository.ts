import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import {
  FileRepository,
  CreateFileData,
  FindAllFilesOptions,
  PaginatedFiles,
} from '../../domain/repositories/file.repository.interface';
import { FileEntity } from '../../domain/entities/file.entity';

@Injectable()
export class PrismaFileRepository implements FileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFileData): Promise<FileEntity> {
    const file = await this.prisma.file.create({ data });
    return new FileEntity(file);
  }

  async findById(id: string): Promise<FileEntity | null> {
    const file = await this.prisma.file.findUnique({ where: { id } });
    return file ? new FileEntity(file) : null;
  }

  async findByKey(key: string): Promise<FileEntity | null> {
    const file = await this.prisma.file.findUnique({ where: { key } });
    return file ? new FileEntity(file) : null;
  }

  async findAll(options: FindAllFilesOptions): Promise<PaginatedFiles> {
    const { page, limit, storageId } = options;
    const skip = (page - 1) * limit;
    const where = storageId ? { storageId } : {};

    const [data, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.file.count({ where }),
    ]);

    return {
      data: data.map((f) => new FileEntity(f)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.file.delete({ where: { id } });
  }
}
