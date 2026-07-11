import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { OrderStatus } from "@prisma/client";

export class UpdateAdminOrderStatusDto {
  @IsEnum(OrderStatus, { message: "status must be a valid order status." })
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
