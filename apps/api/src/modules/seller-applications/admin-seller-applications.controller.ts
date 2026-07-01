import { Body, Controller, Get, Headers, Param, Patch, UseGuards } from "@nestjs/common";
import { AdminHeaderGuard } from "../../common/guards/admin-header.guard";
import { SellerDecisionInput } from "./seller-application.types";
import { SellerApplicationsService } from "./seller-applications.service";

@UseGuards(AdminHeaderGuard)
@Controller("admin/sellers")
export class AdminSellerApplicationsController {
  constructor(private readonly sellerApplications: SellerApplicationsService) {}

  @Get("pending")
  pending() {
    return this.sellerApplications.pending();
  }

  @Patch(":id/approve")
  approve(@Param("id") id: string, @Headers("x-user-id") adminId = "local-admin") {
    return this.sellerApplications.approve(id, adminId);
  }

  @Patch(":id/reject")
  reject(
    @Param("id") id: string,
    @Body() body: SellerDecisionInput,
    @Headers("x-user-id") adminId = "local-admin"
  ) {
    return this.sellerApplications.reject(id, body, adminId);
  }

  @Patch(":id/suspend")
  suspend(
    @Param("id") id: string,
    @Body() body: SellerDecisionInput,
    @Headers("x-user-id") adminId = "local-admin"
  ) {
    return this.sellerApplications.suspend(id, body, adminId);
  }
}
