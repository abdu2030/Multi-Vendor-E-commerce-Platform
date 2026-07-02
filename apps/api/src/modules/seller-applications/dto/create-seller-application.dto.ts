import { IsOptional, IsString, IsUrl, MinLength } from "class-validator";

export class CreateSellerApplicationDto {
  @IsString()
  @MinLength(3)
  storeName!: string;

  @IsString()
  @MinLength(20)
  storeDescription!: string;

  @IsString()
  @MinLength(7)
  phone!: string;

  @IsString()
  @MinLength(5)
  address!: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  businessDocument?: string;
}
