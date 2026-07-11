import { Controller, Get, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AdminDashboardService } from "./admin-dashboard.service";

@Controller("admin/dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get("stats")
  getStats() {
    return this.adminDashboardService.getStats();
  }
}
