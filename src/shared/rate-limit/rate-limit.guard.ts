import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { Request, Response } from "express";
import { SKIP_RATE_LIMIT_KEY } from "./skip-rate-limit.decorator";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store = new Map<string, RateLimitEntry>();
  private readonly ttlMs: number;
  private readonly maxRequests: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {
    this.ttlMs =
      this.configService.get<number>("app.rateLimitTtlSeconds", 60) * 1000;
    this.maxRequests = this.configService.get<number>(
      "app.rateLimitMaxRequests",
      100,
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skip || this.maxRequests <= 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const now = Date.now();
    const key = this.getKey(request);
    const entry = this.getEntry(key, now);

    entry.count += 1;

    const remaining = Math.max(this.maxRequests - entry.count, 0);
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);

    response.setHeader("X-RateLimit-Limit", String(this.maxRequests));
    response.setHeader("X-RateLimit-Remaining", String(remaining));
    response.setHeader("X-RateLimit-Reset", String(resetSeconds));

    if (entry.count > this.maxRequests) {
      response.setHeader("Retry-After", String(resetSeconds));
      throw new HttpException(
        `Rate limit exceeded. Try again in ${resetSeconds} second(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getEntry(key: string, now: number): RateLimitEntry {
    const current = this.store.get(key);

    if (!current || current.resetAt <= now) {
      const next = { count: 0, resetAt: now + this.ttlMs };
      this.store.set(key, next);
      this.cleanupExpired(now);
      return next;
    }

    return current;
  }

  private getKey(request: Request): string {
    const apiKey = request.headers["x-api-key"];
    if (typeof apiKey === "string" && apiKey.trim()) {
      return `api-key:${apiKey}`;
    }

    const forwardedFor = request.headers["x-forwarded-for"];
    const ip =
      typeof forwardedFor === "string"
        ? forwardedFor.split(",")[0]?.trim()
        : request.ip || request.socket.remoteAddress || "unknown";

    return `ip:${ip}`;
  }

  private cleanupExpired(now: number): void {
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }
}
