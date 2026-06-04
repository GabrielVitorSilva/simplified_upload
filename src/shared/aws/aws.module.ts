import { Global, Module } from "@nestjs/common";
import { S3ClientProvider } from "./s3-client.provider";

@Global()
@Module({
  providers: [S3ClientProvider],
  exports: [S3ClientProvider],
})
export class AwsModule {}
