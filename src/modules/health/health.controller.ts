import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  HealthIndicator,
} from "@nestjs/terminus";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";
import { Public } from "../auth/infra/decorators/public.decorator";

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch (error) {
      return this.getStatus(key, false, { message: (error as Error).message });
    }
  }
}

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly dbHealth: DatabaseHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({
    summary: "Health check endpoint",
    description:
      "Public endpoint. Use it to verify that the API is running and can reach the database. It does not require x-api-key.",
  })
  check() {
    return this.health.check([() => this.dbHealth.isHealthy("database")]);
  }
}
