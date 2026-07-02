import { IsOptional, IsString, MinLength } from "class-validator";

export class SuspendSellerApplicationDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  reason?: string;
}
