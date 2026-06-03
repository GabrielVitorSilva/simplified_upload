import { Module } from '@nestjs/common';
import { S3StorageProvider } from './infra/providers/s3-storage.provider';
import { STORAGE_PROVIDER } from './domain/storage-provider.interface';

@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useClass: S3StorageProvider,
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
