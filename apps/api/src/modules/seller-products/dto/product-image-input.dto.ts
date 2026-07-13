import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUrl, MaxLength, Min } from "class-validator";

export class ProductImageInputDto {
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  publicId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  altText?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}