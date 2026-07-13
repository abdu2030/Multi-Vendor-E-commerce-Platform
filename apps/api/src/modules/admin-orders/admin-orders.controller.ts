import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ParseCuidPipe } from "../../common/validation/cuid";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { AdminOrdersService } from "./admin-orders.service";
import { ListAdminOrdersQueryDto } from "./dto/list-admin-orders-query.dto";
import { UpdateAdminOrderStatusDto } from "./dto/update-admin-order-status.dto";

@Controller("admin/orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get()
  getAll(@Query() query: ListAdminOrdersQueryDto) {
    return this.adminOrdersService.getAll(query);
  }

  @Get(":id")
  getOne(@Param("id", ParseCuidPipe) id: string) {
    return this.adminOrdersService.getOne(id);
  }

  @Patch(":id/status")
  updateStatus(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id", ParseCuidPipe) id: string,
    @Body() dto: UpdateAdminOrderStatusDto
  ) {
    return this.adminOrdersService.updateStatus(id, admin.id, dto);
  }
}
