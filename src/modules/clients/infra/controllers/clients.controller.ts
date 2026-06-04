import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
  UseGuards,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { AdminGuard } from "../../../auth/infra/guards/admin.guard";
import { CreateClientDto } from "../dtos/create-client.dto";
import { ClientEntity } from "../../domain/entities/client.entity";
import { CreateClientUseCase } from "../../application/use-cases/create-client.use-case";
import { ListClientsUseCase } from "../../application/use-cases/list-clients.use-case";
import { GetClientUseCase } from "../../application/use-cases/get-client.use-case";
import { RegenerateKeyUseCase } from "../../application/use-cases/regenerate-key.use-case";
import { DeleteClientUseCase } from "../../application/use-cases/delete-client.use-case";

@ApiTags("Clients")
@ApiSecurity("x-api-key")
@UseGuards(AdminGuard)
@Controller("clients")
export class ClientsController {
  constructor(
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly listClientsUseCase: ListClientsUseCase,
    private readonly getClientUseCase: GetClientUseCase,
    private readonly regenerateKeyUseCase: RegenerateKeyUseCase,
    private readonly deleteClientUseCase: DeleteClientUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a new API client" })
  @ApiResponse({
    status: 201,
    description: "Client created with API key",
    schema: {
      example: {
        id: "uuid",
        name: "My App",
        apiKey: "fsk_abc123...",
        active: true,
        isAdmin: false,
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  async create(@Body() dto: CreateClientDto): Promise<ClientEntity> {
    return this.createClientUseCase.execute({ name: dto.name });
  }

  @Get()
  @ApiOperation({ summary: "List all clients" })
  async findAll(): Promise<Omit<ClientEntity, "apiKey">[]> {
    const clients = await this.listClientsUseCase.execute();
    return clients.map(
      ({ apiKey: _apiKey, ...rest }) => new ClientEntity(rest),
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a client by ID" })
  @ApiParam({ name: "id", description: "Client UUID" })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<Omit<ClientEntity, "apiKey">> {
    const client = await this.getClientUseCase.execute(id);
    const { apiKey: _apiKey, ...rest } = client;
    return new ClientEntity(rest);
  }

  @Patch(":id/regenerate-key")
  @ApiOperation({ summary: "Regenerate API key for a client" })
  @ApiParam({ name: "id", description: "Client UUID" })
  @ApiResponse({
    status: 200,
    description: "New API key generated",
    schema: { example: { apiKey: "fsk_newkey..." } },
  })
  async regenerateKey(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<{ apiKey: string }> {
    return this.regenerateKeyUseCase.execute(id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a client" })
  @ApiParam({ name: "id", description: "Client UUID" })
  @ApiResponse({ status: 204, description: "Client deleted" })
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteClientUseCase.execute(id);
  }
}
