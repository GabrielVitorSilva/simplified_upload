import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { CreateClientDto } from '../dtos/create-client.dto';
import { ClientEntity } from '../../domain/entities/client.entity';
import { generateApiKey } from '../../../../shared/utils/generate-api-key.util';

@ApiTags('Clients')
@ApiSecurity('x-api-key')
@Controller('clients')
export class ClientsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API client' })
  @ApiResponse({
    status: 201,
    description: 'Client created with API key',
    schema: {
      example: {
        id: 'uuid',
        name: 'My App',
        apiKey: 'fsk_abc123...',
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  async create(@Body() dto: CreateClientDto): Promise<ClientEntity> {
    const apiKey = generateApiKey();
    const client = await this.prisma.client.create({
      data: { name: dto.name, apiKey },
    });
    return new ClientEntity(client);
  }

  @Get()
  @ApiOperation({ summary: 'List all clients' })
  async findAll(): Promise<Omit<ClientEntity, 'apiKey'>[]> {
    const clients = await this.prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
    return clients.map(({ apiKey: _apiKey, ...rest }) => new ClientEntity(rest));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client by ID' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Omit<ClientEntity, 'apiKey'>> {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException(`Client "${id}" not found.`);
    const { apiKey: _apiKey, ...rest } = client;
    return new ClientEntity(rest);
  }

  @Patch(':id/regenerate-key')
  @ApiOperation({ summary: 'Regenerate API key for a client' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({
    status: 200,
    description: 'New API key generated',
    schema: { example: { apiKey: 'fsk_newkey...' } },
  })
  async regenerateKey(@Param('id', ParseUUIDPipe) id: string): Promise<{ apiKey: string }> {
    const existing = await this.prisma.client.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Client "${id}" not found.`);

    const apiKey = generateApiKey();
    await this.prisma.client.update({ where: { id }, data: { apiKey } });

    return { apiKey };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a client' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({ status: 204, description: 'Client deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const existing = await this.prisma.client.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Client "${id}" not found.`);
    await this.prisma.client.delete({ where: { id } });
  }
}
