import { IsInt, IsOptional, IsString, IsUrl, Min, MinLength } from "class-validator";

export class UploadImageDto {
  @IsString()
  @MinLength(20)
  file!: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UploadRemoteImageDto {
  @IsUrl({ require_protocol: true })
  file!: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
