import { Module } from "@nestjs/common";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminProductsController } from "./admin-products.controller";
import { AdminProductsService } from "./admin-products.service";

@Module({
  imports: [PrismaModule, AuditLogsModule],
  controllers: [AdminProductsController],
  providers: [AdminProductsService]
})
export class AdminProductsModule {}
