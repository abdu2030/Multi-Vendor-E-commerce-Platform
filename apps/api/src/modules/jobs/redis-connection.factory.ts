import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ConnectionOptions } from "bullmq";

@Injectable()
export class RedisConnectionFactory {
  private readonly redisUrl?: string;

  constructor(private readonly config: ConfigService) {
    this.redisUrl = config.get<string>("REDIS_URL")?.trim();
  }

  isConfigured() {
    return Boolean(this.redisUrl);
  }

  createProducerConnection(): ConnectionOptions {
    return this.createConnection(1, false);
  }

  createWorkerConnection(): ConnectionOptions {
    return this.createConnection(null, true);
  }

  queuePrefix() {
    return this.config.get<string>("QUEUE_PREFIX")?.trim() || "marketo";
  }

  workerConcurrency() {
    return Number(this.config.get("QUEUE_WORKER_CONCURRENCY") ?? 5);
  }

  private createConnection(maxRetriesPerRequest: number | null, enableOfflineQueue: boolean) {
    if (!this.redisUrl) {
      throw new Error("REDIS_URL is not configured.");
    }

    const url = new URL(this.redisUrl);
    const database = url.pathname.length > 1 ? Number(url.pathname.slice(1)) : 0;
    const useTls = url.protocol === "rediss:" || isEnabled(this.config.get<string>("REDIS_TLS"));

    return {
      host: url.hostname,
      port: Number(url.port || 6379),
      username: decodeURIComponent(url.username || "default"),
      password: decodeURIComponent(url.password),
      db: Number.isInteger(database) ? database : 0,
      maxRetriesPerRequest,
      enableOfflineQueue,
      connectTimeout: 10_000,
      ...(useTls ? { tls: {} } : {})
    } satisfies ConnectionOptions;
  }
}

function isEnabled(value: string | undefined) {
  return ["1", "true", "yes"].includes((value ?? "").trim().toLowerCase());
}
