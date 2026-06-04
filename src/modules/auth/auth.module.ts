import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ApiKeyGuard } from "./infra/guards/api-key.guard";

@Module({
  providers: [
    ApiKeyGuard,
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
  exports: [ApiKeyGuard],
})
export class AuthModule {}
