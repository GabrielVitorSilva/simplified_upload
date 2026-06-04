import { ClientEntity } from "../entities/client.entity";

export interface CreateClientData {
  name: string;
  apiKey: string;
}

export interface UpdateClientData {
  apiKey?: string;
}

export interface ClientRepository {
  create(data: CreateClientData): Promise<ClientEntity>;
  findById(id: string): Promise<ClientEntity | null>;
  findAll(): Promise<ClientEntity[]>;
  update(id: string, data: UpdateClientData): Promise<ClientEntity>;
  delete(id: string): Promise<void>;
}

export const CLIENT_REPOSITORY = "CLIENT_REPOSITORY";
