import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateStoreSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  bio?: string;
}
