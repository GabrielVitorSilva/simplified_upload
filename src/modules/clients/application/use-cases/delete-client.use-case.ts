import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  CLIENT_REPOSITORY,
  ClientRepository,
} from "../../domain/repositories/client.repository.interface";

@Injectable()
export class DeleteClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.clientRepository.findById(id);
    if (!existing) throw new NotFoundException(`Client "${id}" not found.`);
    await this.clientRepository.delete(id);
  }
}
