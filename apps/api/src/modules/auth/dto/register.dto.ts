import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
const strongPasswordMessage = "password must include uppercase, lowercase, and number characters.";

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  fullName!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(strongPasswordPattern, { message: strongPasswordMessage })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}