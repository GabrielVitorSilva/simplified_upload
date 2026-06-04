import { StorageEntity } from "../entities/storage.entity";

export interface CreateStorageData {
  name: string;
  bucket: string;
  region: string;
}

export interface UpdateStorageData {
  bucket?: string;
  region?: string;
}

export interface StorageRepository {
  create(data: CreateStorageData): Promise<StorageEntity>;
  findById(id: string): Promise<StorageEntity | null>;
  findByName(name: string): Promise<StorageEntity | null>;
  findAll(): Promise<StorageEntity[]>;
  update(id: string, data: UpdateStorageData): Promise<StorageEntity>;
  delete(id: string): Promise<void>;
  countFiles(storageId: string): Promise<number>;
}

export const STORAGE_REPOSITORY = "STORAGE_REPOSITORY";
