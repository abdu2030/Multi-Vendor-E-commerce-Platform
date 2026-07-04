import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { AdminProductsService } from "./admin-products.service";
import { RejectProductDto } from "./dto/reject-product.dto";

@Controller("admin/products")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get("pending")
  getPending() {
    return this.adminProductsService.getPending();
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.adminProductsService.getOne(id);
  }

  @Patch(":id/approve")
  approve(@CurrentUser() admin: AuthenticatedUser, @Param("id") id: string) {
    return this.adminProductsService.approve(id, admin.id);
  }

  @Patch(":id/reject")
  reject(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: RejectProductDto
  ) {
    return this.adminProductsService.reject(id, admin.id, dto.reason);
  }
}