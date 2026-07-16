import { Injectable, Logger, Optional } from "@nestjs/common";
import { safeStringifyLog } from "./redaction";

export type SecurityLogLevel = "log" | "warn" | "error";

@Injectable()
export class SecurityLoggerService {
  private readonly logger: Pick<Logger, "error" | "log" | "warn">;

  constructor(@Optional() logger?: Pick<Logger, "error" | "log" | "warn">) {
    this.logger = logger ?? new Logger("Security");
  }

  log(event: string, fields: Record<string, unknown> = {}, level: SecurityLogLevel = "warn") {
    const payload = safeStringifyLog({
      event,
      timestamp: new Date().toISOString(),
      ...fields
    });

    if (level === "error") {
      this.logger.error(payload);
      return;
    }

    if (level === "warn") {
      this.logger.warn(payload);
      return;
    }

    this.logger.log(payload);
  }
}
