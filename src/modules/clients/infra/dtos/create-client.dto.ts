import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class CreateClientDto {
  @ApiProperty({
    description:
      "Human-readable name for the application or integration that will use this API key.",
    example: "My App",
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
