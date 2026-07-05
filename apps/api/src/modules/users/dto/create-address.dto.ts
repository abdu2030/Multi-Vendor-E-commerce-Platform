import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateAddressDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  label!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(120)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  line2?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  country!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
