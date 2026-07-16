import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { SecurityLoggerService, SecurityLogLevel } from "../../common/logging/security-logger.service";
import { PrismaService } from "../prisma/prisma.service";

type AuditLogClient = PrismaService | Prisma.TransactionClient;

type CreateAuditLogInput = {
  actorUserId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly securityLogger: SecurityLoggerService = new SecurityLoggerService()
  ) {}

  create(input: CreateAuditLogInput, client: AuditLogClient = this.prisma) {
    this.securityLogger.log(classifySecurityAuditEvent(input.action), {
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? null
    }, securityLogLevelForAction(input.action));

    return client.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        metadata: input.metadata
      }
    });
  }
}

function classifySecurityAuditEvent(action: string) {
  if (/ROLE|SELLER_ACCESS|APPLICATION_(APPROVED|REJECTED|SUSPENDED)/i.test(action)) {
    return "ROLE_CHANGE";
  }

  if (/REFUND/i.test(action)) {
    return "REFUND_ACTION";
  }

  if (/PAYOUT/i.test(action)) {
    return "PAYOUT_CHANGE";
  }

  return "ADMIN_ACTION";
}

function securityLogLevelForAction(action: string): SecurityLogLevel {
  return /REFUND|PAYOUT|ROLE|SUSPENDED/i.test(action) ? "warn" : "log";
}
