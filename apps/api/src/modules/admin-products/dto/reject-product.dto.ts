import { IsString, MinLength } from "class-validator";

export class RejectProductDto {
  @IsString()
  @MinLength(5)
  reason!: string;
}