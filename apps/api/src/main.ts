import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import { json, Request, Response, urlencoded } from "express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { createRateLimitMiddleware } from "./common/middleware/rate-limit.middleware";
import { createRequestLoggingMiddleware } from "./common/middleware/request-logging.middleware";
import { createValidationException } from "./common/validation/validation-errors";
import { createCorsOriginHandler, parseCsvList } from "./config/cors.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
    bodyParser: false
  });
  const config = app.get(ConfigService);
  const corsOrigins = parseCsvList(
    config.get<string>("CORS_ORIGIN") ?? "http://localhost:3000,http://127.0.0.1:3000"
  );
  const express = app.getHttpAdapter().getInstance();

  express.disable("x-powered-by");
  express.set("trust proxy", 1);
  app.setGlobalPrefix("api");
  app.use(helmet());
  app.use(createRequestLoggingMiddleware());
  app.use(
    createRateLimitMiddleware({
      windowMs: config.get<number>("RATE_LIMIT_WINDOW_MS") ?? 60_000,
      max: config.get<number>("RATE_LIMIT_MAX") ?? 120,
      skipPaths: parseCsvList(
        config.get<string>("RATE_LIMIT_SKIP_PATHS") ?? "/api/checkout/webhooks/stripe"
      )
    })
  );
  app.use(json({ limit: "10mb", verify: captureRawBody }));
  app.use(urlencoded({ extended: true, limit: "10mb" }));
  app.enableCors({
    origin: createCorsOriginHandler(corsOrigins),
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
    maxAge: 86_400
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: createValidationException
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter(config.get<string>("NODE_ENV") === "production"));
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
