import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AdminCategoriesService } from "./admin-categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Controller("admin/categories")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminCategoriesController {
  constructor(private readonly adminCategoriesService: AdminCategoriesService) {}

  @Get()
  getAll(@Query("includeInactive") includeInactive?: string) {
    return this.adminCategoriesService.getAll(includeInactive === "true");
  }

  @Get("tree")
  getTree(@Query("includeInactive") includeInactive?: string) {
    return this.adminCategoriesService.getTree(includeInactive === "true");
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.adminCategoriesService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.adminCategoriesService.update(id, dto);
  }

  @Patch(":id/activate")
  activate(@Param("id") id: string) {
    return this.adminCategoriesService.setActive(id, true);
  }

  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string) {
    return this.adminCategoriesService.setActive(id, false);
  }
}
