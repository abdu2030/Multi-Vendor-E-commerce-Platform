import { IsCuid } from "../../../common/validation/cuid";

export class CreateCheckoutSessionDto {
  @IsCuid()
  addressId!: string;
}