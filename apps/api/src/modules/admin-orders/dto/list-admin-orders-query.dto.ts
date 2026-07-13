import { OrderStatus } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class ListAdminOrdersQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}