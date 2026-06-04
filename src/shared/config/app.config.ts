import { registerAs } from "@nestjs/config";

function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const appConfig = registerAs("app", () => ({
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseNumber(process.env.PORT, 3000),
  rateLimitTtlSeconds: parseNumber(process.env.RATE_LIMIT_TTL_SECONDS, 60),
  rateLimitMaxRequests: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  uploadMaxFileSizeBytes: parseNumber(
    process.env.UPLOAD_MAX_FILE_SIZE_BYTES,
    10 * 1024 * 1024,
  ),
  uploadAllowedMimeTypes:
    process.env.UPLOAD_ALLOWED_MIME_TYPES ||
    "image/jpeg,image/png,image/webp,application/pdf",
}));
