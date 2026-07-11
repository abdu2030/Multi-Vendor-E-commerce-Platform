import { BadRequestException, ValidationError } from "@nestjs/common";

export type FormattedValidationError = {
  field: string;
  messages: string[];
};

export function createValidationException(errors: ValidationError[]) {
  return new BadRequestException({
    message: "Validation failed. Please check the highlighted fields.",
    errors: formatValidationErrors(errors)
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

function buildFieldPath(parentPath: string, property: string) {
  if (!parentPath) {
    return property;
  }

  return `${parentPath}.${property}`;
}
