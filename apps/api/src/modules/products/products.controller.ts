import { Controller, Get, Param, Query } from "@nestjs/common";
import { ListProductsQueryDto } from "./dto/list-products-query.dto";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  getAll(@Query() query: ListProductsQueryDto) {
    return this.productsService.getAll(query);
  }

  @Get(":slug")
  getOne(@Param("slug") slug: string) {
    return this.productsService.getOneBySlug(slug);
  }
}