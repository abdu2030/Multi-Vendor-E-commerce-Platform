import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";
import { IsCuid } from "../../../common/validation/cuid";

export class AddCartItemDto {
  @IsCuid()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}