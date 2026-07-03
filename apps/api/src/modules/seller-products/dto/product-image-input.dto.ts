import { IsInt, IsOptional, IsString, IsUrl, Min } from "class-validator";

export class ProductImageInputDto {
  @IsUrl({ require_protocol: true })
  url!: string;

  @IsOptional()
  @IsString()
  publicId?: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
