import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { AllExceptionsFilter } from "./logger/http-exception.filter";
import { LoggerService } from "./logger/logger.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix("api");

  const loggerService = app.get(LoggerService);
  app.useGlobalFilters(new AllExceptionsFilter(loggerService));

  await app.listen(process.env.PORT ?? 3333);
}
bootstrap();
