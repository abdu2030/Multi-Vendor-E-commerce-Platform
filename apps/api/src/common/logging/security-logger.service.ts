import { Injectable, Logger } from "@nestjs/common";
import { safeStringifyLog } from "./redaction";

export type SecurityLogLevel = "log" | "warn" | "error";

@Injectable()
export class SecurityLoggerService {
  constructor(private readonly logger = new Logger("Security")) {}

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
