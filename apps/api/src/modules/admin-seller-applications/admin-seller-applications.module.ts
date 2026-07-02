import { Module } from "@nestjs/common";
import { AdminSellerApplicationsController } from "./admin-seller-applications.controller";
import { AdminSellerApplicationsService } from "./admin-seller-applications.service";

@Module({
  controllers: [AdminSellerApplicationsController],
  providers: [AdminSellerApplicationsService]
})
export class AdminSellerApplicationsModule {}
