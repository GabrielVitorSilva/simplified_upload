import { Module } from '@nestjs/common';
import { ClientsController } from './infra/controllers/clients.controller';

@Module({
  controllers: [ClientsController],
})
export class ClientsModule {}
