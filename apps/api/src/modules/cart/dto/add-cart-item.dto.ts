import { Type } from "class-transformer";
import { IsInt, IsString, Max, Min } from "class-validator";

export class AddCartItemDto {
  @IsString()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}