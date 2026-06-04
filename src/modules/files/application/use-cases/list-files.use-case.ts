import { Inject, Injectable } from "@nestjs/common";
import {
  FILE_REPOSITORY,
  FileRepository,
  PaginatedFiles,
} from "../../domain/repositories/file.repository.interface";

export interface ListFilesInput {
  page?: number;
  limit?: number;
  storageId?: string;
  clientId: string;
  isAdmin: boolean;
}

@Injectable()
export class ListFilesUseCase {
  constructor(
    @Inject(FILE_REPOSITORY) private readonly fileRepository: FileRepository,
  ) {}

  async execute(input: ListFilesInput): Promise<PaginatedFiles> {
    const { page = 1, limit = 10, storageId, clientId, isAdmin } = input;

    return this.fileRepository.findAll({
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)),
      storageId,
      clientId: isAdmin ? undefined : clientId,
    });
  }
}
