import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { UpdateStoreSettingsDto } from "./dto/update-store-settings.dto";
import { SellerDashboardService } from "./seller-dashboard.service";

@Controller("seller")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER)
export class SellerDashboardController {
  constructor(private readonly sellerDashboardService: SellerDashboardService) {}

  @Get("dashboard")
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.sellerDashboardService.getDashboard(user.id);
  }

  @Get("store/settings")
  getStoreSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.sellerDashboardService.getStoreSettings(user.id);
  }

  @Patch("store/settings")
  updateStoreSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateStoreSettingsDto
  ) {
    return this.sellerDashboardService.updateStoreSettings(user.id, dto);
  }
}
