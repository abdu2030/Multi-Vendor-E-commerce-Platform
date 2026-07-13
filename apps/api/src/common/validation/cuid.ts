import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { ValidationOptions, registerDecorator } from "class-validator";

const cuidPattern = /^c[a-z0-9]{8,}$/;

export function isCuid(value: unknown): value is string {
  return typeof value === "string" && cuidPattern.test(value);
}

export function IsCuid(validationOptions?: ValidationOptions) {
  return function validateCuid(target: object, propertyName: string) {
    registerDecorator({
      name: "isCuid",
      target: target.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid cuid identifier.`,
        ...validationOptions
      },
      validator: {
        validate(value: unknown) {
          return isCuid(value);
        }
      }
    });
  };
}

@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  transform(value: string) {
    if (!isCuid(value)) {
      throw new BadRequestException("Invalid resource identifier.");
    }

    return value;
  }
}