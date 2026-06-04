import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../shared/database/prisma.service";
import {
  ClientRepository,
  CreateClientData,
  UpdateClientData,
} from "../../domain/repositories/client.repository.interface";
import { ClientEntity } from "../../domain/entities/client.entity";

@Injectable()
export class PrismaClientRepository implements ClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClientData): Promise<ClientEntity> {
    const client = await this.prisma.client.create({ data });
    return new ClientEntity(client);
  }

  async findById(id: string): Promise<ClientEntity | null> {
    const client = await this.prisma.client.findUnique({ where: { id } });
    return client ? new ClientEntity(client) : null;
  }

  async findAll(): Promise<ClientEntity[]> {
    const clients = await this.prisma.client.findMany({
      orderBy: { createdAt: "desc" },
    });
    return clients.map((c) => new ClientEntity(c));
  }

  async countActiveAdmins(): Promise<number> {
    return this.prisma.client.count({
      where: {
        active: true,
        isAdmin: true,
      },
    });
  }

  async update(id: string, data: UpdateClientData): Promise<ClientEntity> {
    const client = await this.prisma.client.update({ where: { id }, data });
    return new ClientEntity(client);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.client.delete({ where: { id } });
  }
}
