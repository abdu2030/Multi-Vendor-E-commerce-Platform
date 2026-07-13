import { IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from "class-validator";

const allowedImageSourcePattern = /^(data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+|https:\/\/[^\s]+)$/i;
const imageSourceMessage = "file must be an HTTPS image URL or a base64 data URI for png, jpg, jpeg, webp, or gif.";

export class UploadImageDto {
  @IsString()
  @MinLength(20)
  @MaxLength(8_000_000)
  @Matches(allowedImageSourcePattern, { message: imageSourceMessage })
  file!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  altText?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UploadRemoteImageDto {
  @IsString()
  @MinLength(20)
  @MaxLength(2_048)
  @Matches(/^https:\/\/[^\s]+$/i, { message: "file must be an HTTPS image URL." })
  file!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  altText?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
