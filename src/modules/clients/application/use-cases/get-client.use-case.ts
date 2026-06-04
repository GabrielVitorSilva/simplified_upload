import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  CLIENT_REPOSITORY,
  ClientRepository,
} from "../../domain/repositories/client.repository.interface";
import { ClientEntity } from "../../domain/entities/client.entity";

@Injectable()
export class GetClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(id: string): Promise<ClientEntity> {
    const client = await this.clientRepository.findById(id);
    if (!client) throw new NotFoundException(`Client "${id}" not found.`);
    return client;
  }
}
