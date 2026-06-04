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
  @ApiOperation({
    summary: "Create a new API client",
    description:
      "Admin endpoint. Creates an API client and returns its API key once. Use this API key in the x-api-key header to call protected endpoints. New clients are not admins by default.",
  })
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
  @ApiOperation({
    summary: "List all clients",
    description:
      "Admin endpoint. Lists clients without exposing their API keys. Use the returned id as clientId for GET /clients/{id}, DELETE /clients/{id}, or PATCH /clients/{id}/regenerate-key.",
  })
  async findAll(): Promise<Omit<ClientEntity, "apiKey" | "apiKeyHash">[]> {
    const clients = await this.listClientsUseCase.execute();
    return clients.map(
      ({ apiKey: _apiKey, apiKeyHash: _apiKeyHash, ...rest }) =>
        new ClientEntity(rest),
    );
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a client by ID",
    description:
      "Admin endpoint. Shows one client without exposing the API key. Get the id from GET /clients or from the response of POST /clients.",
  })
  @ApiParam({
    name: "id",
    description:
      "Client UUID. Get this value from GET /clients or the response of POST /clients.",
  })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<Omit<ClientEntity, "apiKey" | "apiKeyHash">> {
    const client = await this.getClientUseCase.execute(id);
    const { apiKey: _apiKey, apiKeyHash: _apiKeyHash, ...rest } = client;
    return new ClientEntity(rest);
  }

  @Patch(":id/regenerate-key")
  @ApiOperation({
    summary: "Regenerate API key for a client",
    description:
      "Admin endpoint. Invalidates the old API key and returns a new one. Save the returned apiKey immediately; normal list/detail endpoints do not show API keys.",
  })
  @ApiParam({
    name: "id",
    description:
      "Client UUID. Get this value from GET /clients or the response of POST /clients.",
  })
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
  @ApiOperation({
    summary: "Delete a client",
    description:
      "Admin endpoint. Deletes the API client, making its API key unusable. Get the id from GET /clients.",
  })
  @ApiParam({
    name: "id",
    description: "Client UUID. Get this value from GET /clients.",
  })
  @ApiResponse({ status: 204, description: "Client deleted" })
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteClientUseCase.execute(id);
  }
}
