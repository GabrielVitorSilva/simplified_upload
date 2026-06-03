import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ description: 'Client application name', example: 'My App' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
