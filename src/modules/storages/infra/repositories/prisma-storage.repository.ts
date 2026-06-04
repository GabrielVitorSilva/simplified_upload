import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../shared/database/prisma.service";
import {
  StorageRepository,
  CreateStorageData,
  UpdateStorageData,
} from "../../domain/repositories/storage.repository.interface";
import { StorageEntity } from "../../domain/entities/storage.entity";

@Injectable()
export class PrismaStorageRepository implements StorageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateStorageData): Promise<StorageEntity> {
    const storage = await this.prisma.storage.create({ data });
    return new StorageEntity(storage);
  }

  async findById(id: string): Promise<StorageEntity | null> {
    const storage = await this.prisma.storage.findUnique({ where: { id } });
    return storage ? new StorageEntity(storage) : null;
  }

  async findByName(name: string): Promise<StorageEntity | null> {
    const storage = await this.prisma.storage.findUnique({ where: { name } });
    return storage ? new StorageEntity(storage) : null;
  }

  async findAll(): Promise<StorageEntity[]> {
    const storages = await this.prisma.storage.findMany({
      orderBy: { createdAt: "desc" },
    });
    return storages.map((s) => new StorageEntity(s));
  }

  async update(id: string, data: UpdateStorageData): Promise<StorageEntity> {
    const storage = await this.prisma.storage.update({ where: { id }, data });
    return new StorageEntity(storage);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.storage.delete({ where: { id } });
  }

  async countFiles(storageId: string): Promise<number> {
    return this.prisma.file.count({ where: { storageId } });
  }
}
