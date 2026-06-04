import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMimeType,
  IsInt,
  Min,
} from "class-validator";

export class GenerateUploadUrlDto {
  @ApiProperty({
    description:
      "Storage name configured in POST /storages. You can list available names with GET /storages using an admin API key.",
    example: "default",
  })
  @IsString()
  @IsNotEmpty()
  storageName: string;

  @ApiPropertyOptional({
    description:
      "Optional S3 folder/prefix. Use any logical path you want, for example avatars, invoices/2026, or user-uploads.",
    example: "avatars",
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiProperty({
    description:
      "Original file name shown in metadata. Use the name from the file selected by the user, for example avatar.png.",
    example: "avatar.png",
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description:
      "File MIME type. Browsers usually provide this as file.type, for example image/png or application/pdf.",
    example: "image/png",
  })
  @IsMimeType()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({
    description:
      "File size in bytes. The API validates this value before generating the upload URL.",
    example: 12345,
  })
  @IsInt()
  @Min(1)
  size: number;
}
