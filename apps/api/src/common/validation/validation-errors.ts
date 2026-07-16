import { BadRequestException, ValidationError } from "@nestjs/common";
import { SecurityLoggerService } from "../logging/security-logger.service";

export type FormattedValidationError = {
  field: string;
  messages: string[];
};

const securityLogger = new SecurityLoggerService();

export function createValidationException(errors: ValidationError[]) {
  const formattedErrors = formatValidationErrors(errors);
  logSuspiciousCouponAttempts(formattedErrors);

  return new BadRequestException({
    message: "Validation failed. Please check the highlighted fields.",
    errors: formattedErrors
  });
}

export function formatValidationErrors(
  errors: ValidationError[],
  parentPath = ""
): FormattedValidationError[] {
  return errors.flatMap((error) => {
    const field = buildFieldPath(parentPath, error.property);
    const messages = error.constraints ? Object.values(error.constraints) : [];
    const nestedErrors = formatValidationErrors(error.children ?? [], field);

    if (messages.length === 0) {
      return nestedErrors;
    }

    return [
      {
        field,
        messages
      },
      ...nestedErrors
    ];
  });
}

function logSuspiciousCouponAttempts(errors: FormattedValidationError[]) {
  const couponFields = errors
    .map((error) => error.field)
    .filter((field) => /(^|\.)coupon(Code|Codes)?$/i.test(field));

  if (couponFields.length === 0) {
    return;
  }

  securityLogger.log("SUSPICIOUS_COUPON_ATTEMPT", {
    fields: couponFields
  });
}

function buildFieldPath(parentPath: string, property: string) {
  if (!parentPath) {
    return property;
  }

  return `${parentPath}.${property}`;
}
