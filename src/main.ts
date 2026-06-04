import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./shared/exceptions/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix("api/v1");

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS
  app.enableCors();

  // Swagger
  const config = new DocumentBuilder()
    .setTitle("File Service API")
    .setDescription(
      "Centralized file management service. Start by running the seed and copying the generated API key. Click Authorize and paste that key as x-api-key. Admin keys can create clients and storages. File endpoints use storageName from GET /storages and fileId from upload/list responses.",
    )
    .setVersion("1.0")
    .addApiKey({ type: "apiKey", name: "x-api-key", in: "header" }, "x-api-key")
    .addTag("Files", "File management operations")
    .addTag("Storages", "Storage configuration management")
    .addTag("Clients", "API client management")
    .addTag("Health", "Service health checks")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application running on: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
