import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { appConfig, awsConfig } from "./shared/config";
import { PrismaModule } from "./shared/database/prisma.module";
import { AwsModule } from "./shared/aws/aws.module";
import { AuthModule } from "./modules/auth/auth.module";
import { FilesModule } from "./modules/files/files.module";
import { StoragesModule } from "./modules/storages/storages.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, awsConfig],
      envFilePath: ".env",
    }),
    PrismaModule,
    AwsModule,
    AuthModule,
    FilesModule,
    StoragesModule,
    ClientsModule,
    HealthModule,
  ],
})
export class AppModule {}
