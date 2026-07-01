import { Module } from "@nestjs/common";
import { AdminSellerApplicationsController } from "./admin-seller-applications.controller";
import { SellerApplicationsController } from "./seller-applications.controller";
import { SellerApplicationsService } from "./seller-applications.service";

@Module({
  controllers: [SellerApplicationsController, AdminSellerApplicationsController],
  providers: [SellerApplicationsService],
  exports: [SellerApplicationsService]
})
export class SellerApplicationsModule {}
