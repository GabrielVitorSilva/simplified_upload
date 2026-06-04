import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { PrismaService } from "../../../../shared/database/prisma.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers["x-api-key"] as string;

    if (!apiKey) {
      throw new UnauthorizedException(
        "Missing API key. Provide x-api-key header.",
      );
    }

    const client = await this.prisma.client.findUnique({
      where: { apiKey },
    });

    if (!client) {
      throw new UnauthorizedException("Invalid API key.");
    }

    if (!client.active) {
      throw new UnauthorizedException("API key is inactive.");
    }

    // Attach client to request for downstream use
    (request as any).client = client;

    return true;
  }
}
