import { FileEntity } from "../entities/file.entity";

export interface FindAllFilesOptions {
  page: number;
  limit: number;
  storageId?: string;
}

export interface PaginatedFiles {
  data: FileEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateFileData {
  key: string;
  fileName: string;
  mimeType: string;
  size?: number;
  storageId: string;
}

export interface FileRepository {
  create(data: CreateFileData): Promise<FileEntity>;
  findById(id: string): Promise<FileEntity | null>;
  findByKey(key: string): Promise<FileEntity | null>;
  findAll(options: FindAllFilesOptions): Promise<PaginatedFiles>;
  delete(id: string): Promise<void>;
}

export const FILE_REPOSITORY = "FILE_REPOSITORY";
