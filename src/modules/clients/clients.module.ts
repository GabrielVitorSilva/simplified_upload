import { Module } from "@nestjs/common";
import { ClientsController } from "./infra/controllers/clients.controller";
import { PrismaClientRepository } from "./infra/repositories/prisma-client.repository";
import { CLIENT_REPOSITORY } from "./domain/repositories/client.repository.interface";
import { CreateClientUseCase } from "./application/use-cases/create-client.use-case";
import { ListClientsUseCase } from "./application/use-cases/list-clients.use-case";
import { GetClientUseCase } from "./application/use-cases/get-client.use-case";
import { RegenerateKeyUseCase } from "./application/use-cases/regenerate-key.use-case";
import { DeleteClientUseCase } from "./application/use-cases/delete-client.use-case";

@Module({
  controllers: [ClientsController],
  providers: [
    {
      provide: CLIENT_REPOSITORY,
      useClass: PrismaClientRepository,
    },
    CreateClientUseCase,
    ListClientsUseCase,
    GetClientUseCase,
    RegenerateKeyUseCase,
    DeleteClientUseCase,
  ],
})
export class ClientsModule {}
