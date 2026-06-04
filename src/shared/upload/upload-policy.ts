import {
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const DEFAULT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseMimeTypes(value: string | undefined): string[] {
  if (!value) return DEFAULT_ALLOWED_MIME_TYPES;

  return value
    .split(",")
    .map((mimeType) => mimeType.trim())
    .filter(Boolean);
}

export function getUploadPolicy() {
  return {
    maxFileSizeBytes: parseNumber(
      process.env.UPLOAD_MAX_FILE_SIZE_BYTES,
      DEFAULT_MAX_FILE_SIZE_BYTES,
    ),
    allowedMimeTypes: parseMimeTypes(process.env.UPLOAD_ALLOWED_MIME_TYPES),
  };
}

export function assertAllowedMimeType(mimeType: string): void {
  const { allowedMimeTypes } = getUploadPolicy();

  if (!allowedMimeTypes.includes(mimeType)) {
    throw new UnsupportedMediaTypeException(
      `File type "${mimeType}" is not allowed. Allowed types: ${allowedMimeTypes.join(", ")}.`,
    );
  }
}

export function assertAllowedFileSize(size: number): void {
  const { maxFileSizeBytes } = getUploadPolicy();

  if (size > maxFileSizeBytes) {
    throw new PayloadTooLargeException(
      `File size exceeds the ${maxFileSizeBytes} bytes limit.`,
    );
  }
}

export function assertAllowedUpload(input: {
  mimeType: string;
  size: number;
}): void {
  assertAllowedMimeType(input.mimeType);
  assertAllowedFileSize(input.size);
}
