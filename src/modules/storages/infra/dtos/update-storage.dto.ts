import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class UpdateStorageDto {
  @ApiPropertyOptional({
    description:
      "New existing S3 bucket name. Get this in AWS S3 console; use only the bucket name.",
    example: "my-new-bucket",
  })
  @IsString()
  @IsOptional()
  bucket?: string;

  @ApiPropertyOptional({
    description:
      "New AWS region where the bucket exists. Get it in the S3 bucket properties.",
    example: "us-west-2",
  })
  @IsString()
  @IsOptional()
  region?: string;
}
