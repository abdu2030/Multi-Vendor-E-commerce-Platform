import { IsString, MinLength } from "class-validator";

export class RejectSellerApplicationDto {
  @IsString()
  @MinLength(5)
  reason!: string;
}
