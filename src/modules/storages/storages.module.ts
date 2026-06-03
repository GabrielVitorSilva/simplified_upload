import { Module } from '@nestjs/common';
import { StoragesController } from './infra/controllers/storages.controller';

@Module({
  controllers: [StoragesController],
})
export class StoragesModule {}
