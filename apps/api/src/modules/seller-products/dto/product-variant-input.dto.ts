import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class ProductVariantInputDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  value!: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsInt()
  priceDeltaCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;
}
