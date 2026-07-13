import { OrderStatus } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class ListSellerOrdersQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}