import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const corsOrigin = config.get<string>("CORS_ORIGIN") ?? "http://localhost:3000";

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: corsOrigin,
    credentials: true
  });

  const port = config.get<number>("PORT") ?? 5000;
  await app.listen(port);
}

void bootstrap();
