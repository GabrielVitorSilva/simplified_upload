import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsNumberString, IsUUID } from "class-validator";

export class ListFilesDto {
  @ApiPropertyOptional({
    description: "Page number for pagination. Start with 1.",
    example: 1,
    default: 1,
  })
  @IsNumberString()
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({
    description: "Items per page. The API limits this value to 100.",
    example: 10,
    default: 10,
  })
  @IsNumberString()
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional({
    description:
      "Optional storage UUID to filter files. Get this value from GET /storages or from the response of POST /storages.",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID()
  @IsOptional()
  storageId?: string;
}
