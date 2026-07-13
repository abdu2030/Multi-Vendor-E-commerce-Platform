import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ParseCuidPipe } from "../../common/validation/cuid";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { AdminCategoriesService } from "./admin-categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { ListAdminCategoriesQueryDto } from "./dto/list-admin-categories-query.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Controller("admin/categories")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminCategoriesController {
  constructor(private readonly adminCategoriesService: AdminCategoriesService) {}

  @Get()
  getAll(@Query() query: ListAdminCategoriesQueryDto) {
    return this.adminCategoriesService.getAll(query.includeInactive);
  }

  @Get("tree")
  getTree(@Query() query: ListAdminCategoriesQueryDto) {
    return this.adminCategoriesService.getTree(query.includeInactive);
  }

  @Post()
  create(@CurrentUser() admin: AuthenticatedUser, @Body() dto: CreateCategoryDto) {
    return this.adminCategoriesService.create(dto, admin.id);
  }

  @Patch(":id")
  update(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id", ParseCuidPipe) id: string,
    @Body() dto: UpdateCategoryDto
  ) {
    return this.adminCategoriesService.update(id, dto, admin.id);
  }

  @Patch(":id/activate")
  activate(@CurrentUser() admin: AuthenticatedUser, @Param("id", ParseCuidPipe) id: string) {
    return this.adminCategoriesService.setActive(id, true, admin.id);
  }

  @Patch(":id/deactivate")
  deactivate(@CurrentUser() admin: AuthenticatedUser, @Param("id", ParseCuidPipe) id: string) {
    return this.adminCategoriesService.setActive(id, false, admin.id);
  }
}
