import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ParseCuidPipe } from "../../common/validation/cuid";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { CreateSellerProductDto } from "./dto/create-seller-product.dto";
import { ListSellerProductsQueryDto } from "./dto/list-seller-products-query.dto";
import { UpdateSellerProductDto } from "./dto/update-seller-product.dto";
import { SellerProductsService } from "./seller-products.service";

@Controller("seller/products")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER)
export class SellerProductsController {
  constructor(private readonly sellerProductsService: SellerProductsService) {}

  @Get()
  getAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListSellerProductsQueryDto
  ) {
    return this.sellerProductsService.getAll(user.id, query);
  }

  @Get(":id")
  getOne(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseCuidPipe) id: string) {
    return this.sellerProductsService.getOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSellerProductDto) {
    return this.sellerProductsService.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseCuidPipe) id: string,
    @Body() dto: UpdateSellerProductDto
  ) {
    return this.sellerProductsService.update(user.id, id, dto);
  }

  @Patch(":id/archive")
  archive(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseCuidPipe) id: string) {
    return this.sellerProductsService.archive(user.id, id);
  }

  @Delete(":id")
  delete(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseCuidPipe) id: string) {
    return this.sellerProductsService.archive(user.id, id);
  }
}
