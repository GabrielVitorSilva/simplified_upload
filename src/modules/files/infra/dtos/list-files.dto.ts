import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumberString, IsUUID } from 'class-validator';

export class ListFilesDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsNumberString()
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ description: 'Items per page', example: 10, default: 10 })
  @IsNumberString()
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional({ description: 'Filter by storage ID', example: 'uuid-here' })
  @IsUUID()
  @IsOptional()
  storageId?: string;
}
