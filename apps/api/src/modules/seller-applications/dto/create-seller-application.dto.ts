import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from "class-validator";

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
  @IsUrl({ require_protocol: true, protocols: ["https"] })
  @MaxLength(2_048)
  businessDocument?: string;
}
