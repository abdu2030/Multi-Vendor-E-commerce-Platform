import { IsString, Matches, MaxLength, MinLength } from "class-validator";

const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
const strongPasswordMessage = "newPassword must include uppercase, lowercase, and number characters.";

export class ResetPasswordDto {
  @IsString()
  @MinLength(32)
  token!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(strongPasswordPattern, { message: strongPasswordMessage })
  newPassword!: string;
}