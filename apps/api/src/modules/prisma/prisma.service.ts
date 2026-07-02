import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    super({
      adapter: new PrismaPg(buildPostgresConfig(config))
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

function buildPostgresConfig(config: ConfigService) {
  const databaseUrl = config.get<string>("DATABASE_URL");

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const url = new URL(databaseUrl);

  url.hostname = url.hostname.replace("-pooler.", ".");
  url.searchParams.delete("channel_binding");

  return {
    connectionString: url.toString(),
    ssl: {
      rejectUnauthorized: false
    }
  };
}
