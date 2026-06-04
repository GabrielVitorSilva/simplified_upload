import { Inject, Injectable } from "@nestjs/common";
import {
  CLIENT_REPOSITORY,
  ClientRepository,
} from "../../domain/repositories/client.repository.interface";
import { ClientEntity } from "../../domain/entities/client.entity";
import { generateApiKey } from "../../../../shared/utils/generate-api-key.util";

export interface CreateClientInput {
  name: string;
}

@Injectable()
export class CreateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(input: CreateClientInput): Promise<ClientEntity> {
    const apiKey = generateApiKey();
    return this.clientRepository.create({ name: input.name, apiKey });
  }
}
