import { IsEmail, MaxLength } from "class-validator";

export class RequestEmailVerificationDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
