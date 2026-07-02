import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { AdminSellerApplicationsService } from "./admin-seller-applications.service";
import { RejectSellerApplicationDto } from "./dto/reject-seller-application.dto";
import { SuspendSellerApplicationDto } from "./dto/suspend-seller-application.dto";

@Controller("admin/seller-applications")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminSellerApplicationsController {
  constructor(private readonly adminSellerApplicationsService: AdminSellerApplicationsService) {}

  @Get("pending")
  getPending() {
    return this.adminSellerApplicationsService.getPending();
  }

  @Patch(":id/approve")
  approve(@CurrentUser() admin: AuthenticatedUser, @Param("id") id: string) {
    return this.adminSellerApplicationsService.approve(id, admin.id);
  }

  @Patch(":id/reject")
  reject(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: RejectSellerApplicationDto
  ) {
    return this.adminSellerApplicationsService.reject(id, admin.id, dto.reason);
  }

  @Patch(":id/suspend")
  suspend(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: SuspendSellerApplicationDto
  ) {
    return this.adminSellerApplicationsService.suspend(id, admin.id, dto.reason);
  }
}
