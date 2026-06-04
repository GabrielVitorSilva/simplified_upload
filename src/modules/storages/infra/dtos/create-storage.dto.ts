import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class CreateStorageDto {
  @ApiProperty({
    description:
      "Unique name used by upload endpoints as storageName. Choose a short label like default, avatars, invoices, or Teste.",
    example: "default",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description:
      "Existing S3 bucket name. Get this in AWS S3 console; it is not the bucket ARN, only the bucket name.",
    example: "my-app-bucket",
  })
  @IsString()
  @IsNotEmpty()
  bucket: string;

  @ApiProperty({
    description:
      "AWS region where the bucket exists. Get it in the S3 bucket properties, for example us-east-1 or sa-east-1.",
    example: "us-east-1",
  })
  @IsString()
  @IsNotEmpty()
  region: string;
}
