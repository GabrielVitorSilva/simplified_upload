import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsMimeType } from 'class-validator';

export class GenerateUploadUrlDto {
  @ApiProperty({
    description: 'Name of the storage to upload to',
    example: 'default',
  })
  @IsString()
  @IsNotEmpty()
  storageName: string;

  @ApiPropertyOptional({
    description: 'Folder/prefix path within the bucket',
    example: 'avatars',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiProperty({
    description: 'Original file name',
    example: 'avatar.png',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/png',
  })
  @IsMimeType()
  @IsNotEmpty()
  mimeType: string;
}
