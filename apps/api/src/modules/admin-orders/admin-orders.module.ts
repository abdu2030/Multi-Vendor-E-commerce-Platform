import { Module } from "@nestjs/common";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { AdminOrdersController } from "./admin-orders.controller";
import { AdminOrdersService } from "./admin-orders.service";

@Module({
  imports: [AuditLogsModule],
  controllers: [AdminOrdersController],
  providers: [AdminOrdersService]
})
export class AdminOrdersModule {}
