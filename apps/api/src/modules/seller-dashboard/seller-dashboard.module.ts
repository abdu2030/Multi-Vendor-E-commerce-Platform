import { Module } from "@nestjs/common";
import { SellerDashboardController } from "./seller-dashboard.controller";
import { SellerDashboardService } from "./seller-dashboard.service";

@Module({
  controllers: [SellerDashboardController],
  providers: [SellerDashboardService]
})
export class SellerDashboardModule {}
