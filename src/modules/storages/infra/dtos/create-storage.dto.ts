import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateStorageDto {
  @ApiProperty({ description: 'Unique storage name', example: 'default' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'S3 bucket name', example: 'my-app-bucket' })
  @IsString()
  @IsNotEmpty()
  bucket: string;

  @ApiProperty({ description: 'AWS region', example: 'us-east-1' })
  @IsString()
  @IsNotEmpty()
  region: string;
}
