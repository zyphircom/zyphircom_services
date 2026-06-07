import "dotenv/config";

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";

import { AppModule } from "@api/app.module";

import { AllExceptionsFilter } from "@lib/logger/http-exception.filter";
import { LoggerService } from "@lib/logger/logger.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix("api");

  const loggerService = app.get(LoggerService);
  app.useGlobalFilters(new AllExceptionsFilter(loggerService));

  await app.listen(process.env.PORT ?? 3333);
}
bootstrap();
