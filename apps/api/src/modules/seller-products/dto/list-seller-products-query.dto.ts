import { ProductStatus } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";
import { IsCuid } from "../../../common/validation/cuid";

export class ListSellerProductsQueryDto {
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsCuid()
  categoryId?: string;
}