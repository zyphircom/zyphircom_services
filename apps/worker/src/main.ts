import { NestFactory } from "@nestjs/core";
import { AppModule } from "@worker/app.module";

async function bootstrap() {
  await NestFactory.createApplicationContext(AppModule);
  console.log("Worker service running...");
}
bootstrap();
