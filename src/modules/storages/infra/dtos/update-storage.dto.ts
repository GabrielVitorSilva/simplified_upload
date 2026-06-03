import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateStorageDto {
  @ApiPropertyOptional({ description: 'S3 bucket name', example: 'my-new-bucket' })
  @IsString()
  @IsOptional()
  bucket?: string;

  @ApiPropertyOptional({ description: 'AWS region', example: 'us-west-2' })
  @IsString()
  @IsOptional()
  region?: string;
}
