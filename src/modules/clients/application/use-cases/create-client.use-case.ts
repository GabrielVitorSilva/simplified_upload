import { Inject, Injectable } from "@nestjs/common";
import {
  CLIENT_REPOSITORY,
  ClientRepository,
} from "../../domain/repositories/client.repository.interface";
import { ClientEntity } from "../../domain/entities/client.entity";
import {
  generateApiKey,
  hashApiKey,
} from "../../../../shared/utils/generate-api-key.util";

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
    const client = await this.clientRepository.create({
      name: input.name,
      apiKeyHash: hashApiKey(apiKey),
    });
    return new ClientEntity({ ...client, apiKey });
  }
}
