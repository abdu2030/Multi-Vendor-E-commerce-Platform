import { Module } from "@nestjs/common";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { AdminCategoriesController } from "./admin-categories.controller";
import { AdminCategoriesService } from "./admin-categories.service";

@Module({
  imports: [AuditLogsModule],
  controllers: [AdminCategoriesController],
  providers: [AdminCategoriesService]
})
export class AdminCategoriesModule {}
