import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import { json, Request, Response, urlencoded } from "express";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
    bodyParser: false
  });
  const config = app.get(ConfigService);
  const corsOrigin = (
    config.get<string>("CORS_ORIGIN") ?? "http://localhost:3000,http://127.0.0.1:3000"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix("api");
  app.use(json({ limit: "10mb", verify: captureRawBody }));
  app.use(urlencoded({ extended: true, limit: "10mb" }));
  app.enableCors({
    origin: corsOrigin,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const port = Number(config.get<string>("PORT") ?? 5000);
  await app.listen(port);
}

function captureRawBody(req: Request & { rawBody?: Buffer }, _res: Response, buffer: Buffer) {
  const route = req.originalUrl.split("?")[0];

  if (route === "/api/checkout/webhooks/stripe") {
    req.rawBody = Buffer.from(buffer);
  }
}

void bootstrap();
