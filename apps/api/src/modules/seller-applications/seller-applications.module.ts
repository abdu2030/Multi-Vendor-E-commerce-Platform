import { Module } from "@nestjs/common";
import { SellerApplicationsController } from "./seller-applications.controller";
import { SellerApplicationsService } from "./seller-applications.service";

@Module({
  controllers: [SellerApplicationsController],
  providers: [SellerApplicationsService]
})
export class SellerApplicationsModule {}
