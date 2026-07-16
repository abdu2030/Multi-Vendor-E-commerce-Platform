import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis, { RedisOptions } from "ioredis";

@Injectable()
export class CartCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CartCacheService.name);
  private readonly client?: Redis;
  private readonly summaryTtlSeconds: number;
  private readonly countTtlSeconds: number;

  constructor(config: ConfigService) {
    const redisUrl = config.get<string>("REDIS_URL");
    this.summaryTtlSeconds = Number(config.get("CART_SUMMARY_CACHE_TTL_SECONDS") ?? 60);
    this.countTtlSeconds = Number(config.get("CART_COUNT_CACHE_TTL_SECONDS") ?? 60);

    if (!redisUrl) {
      return;
    }

    const useTls = isEnabled(config.get<string>("REDIS_TLS")) || redisUrl.startsWith("rediss://");
    const options: RedisOptions = {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
      retryStrategy: (attempt) => (attempt > 2 ? null : Math.min(attempt * 100, 500)),
      ...(useTls ? { tls: {} } : {})
    };

    this.client = new Redis(redisUrl, options);
    this.client.on("error", () => {
      this.logger.warn("Redis cart cache unavailable.");
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
  }

  async getSummary<T>(userId: string): Promise<T | null> {
    const raw = await this.read(this.summaryKey(userId));

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      await this.invalidate(userId);
      return null;
    }
  }

  async setSummary(userId: string, summary: unknown) {
    await this.write(this.summaryKey(userId), JSON.stringify(summary), this.summaryTtlSeconds);
  }

  async getCount(userId: string): Promise<number | null> {
    const raw = await this.read(this.countKey(userId));

    if (raw === null) {
      return null;
    }

    const count = Number(raw);
    return Number.isInteger(count) ? count : null;
  }

  async setCount(userId: string, count: number) {
    await this.write(this.countKey(userId), String(count), this.countTtlSeconds);
  }

  async invalidate(userId: string) {
    await this.withRedis((client) => client.del(this.summaryKey(userId), this.countKey(userId)));
  }

  private async read(key: string) {
    return this.withRedis((client) => client.get(key));
  }

  private async write(key: string, value: string, ttlSeconds: number) {
    const ttl = Number.isInteger(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : 60;
    await this.withRedis((client) => client.set(key, value, "EX", ttl));
  }

  private async withRedis<T>(operation: (client: Redis) => Promise<T>): Promise<T | null> {
    if (!this.client) {
      return null;
    }

    try {
      if (this.client.status === "wait") {
        await this.client.connect();
      }

      if (this.client.status !== "ready") {
        return null;
      }

      return await operation(this.client);
    } catch {
      this.logger.warn("Redis cart cache skipped.");
      return null;
    }
  }

  private summaryKey(userId: string) {
    return `cart:${userId}:summary`;
  }

  private countKey(userId: string) {
    return `cart:${userId}:count`;
  }
}

function isEnabled(value: string | undefined) {
  return ["1", "true", "yes"].includes((value ?? "").trim().toLowerCase());
}
