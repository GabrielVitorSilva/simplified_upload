import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  CLIENT_REPOSITORY,
  ClientRepository,
} from "../../domain/repositories/client.repository.interface";
import {
  generateApiKey,
  hashApiKey,
} from "../../../../shared/utils/generate-api-key.util";

@Injectable()
export class RegenerateKeyUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(id: string): Promise<{ apiKey: string }> {
    const existing = await this.clientRepository.findById(id);
    if (!existing) throw new NotFoundException(`Client "${id}" not found.`);

    const apiKey = generateApiKey();
    await this.clientRepository.update(id, { apiKeyHash: hashApiKey(apiKey) });
    return { apiKey };
  }
}
