import { Inject, Injectable } from "@nestjs/common";
import {
  CLIENT_REPOSITORY,
  ClientRepository,
} from "../../domain/repositories/client.repository.interface";
import { ClientEntity } from "../../domain/entities/client.entity";

@Injectable()
export class ListClientsUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(): Promise<ClientEntity[]> {
    return this.clientRepository.findAll();
  }
}
