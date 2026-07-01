import { BadRequestException } from "@nestjs/common";
import {
  CreateSellerApplicationInput,
  SellerDecisionInput
} from "./seller-application.types";

export function validateSellerApplicationInput(input: CreateSellerApplicationInput) {
  const storeName = stringValue(input.storeName);
  const storeDescription = stringValue(input.storeDescription);
  const phone = stringValue(input.phone);
  const address = stringValue(input.address);
  const businessDocument = optionalStringValue(input.businessDocument);
  const errors: string[] = [];

  if (storeName.length < 3) errors.push("Store name must be at least 3 characters.");
  if (storeDescription.length < 20) errors.push("Store description must be at least 20 characters.");
  if (phone.length < 7) errors.push("Phone must be a reachable contact number.");
  if (address.length < 8) errors.push("Address must include the store operating location.");
  if (businessDocument && !businessDocument.startsWith("http")) {
    errors.push("Business document must be a valid URL.");
  }

  if (errors.length > 0) {
    throw new BadRequestException({ message: "Seller application validation failed.", errors });
  }

  return {
    storeName,
    storeDescription,
    phone,
    address,
    businessDocument
  };
}

export function validateDecisionReason(input: SellerDecisionInput, action: "reject" | "suspend") {
  const reason = optionalStringValue(input.reason);

  if (!reason || reason.length < 5) {
    throw new BadRequestException({
      message: `A clear reason is required to ${action} a seller application.`
    });
  }

  return reason;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalStringValue(value: unknown) {
  const text = stringValue(value);
  return text.length > 0 ? text : undefined;
}
