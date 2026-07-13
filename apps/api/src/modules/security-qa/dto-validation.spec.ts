import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { ProductStatus, Role } from "@prisma/client";
import { ParseCuidPipe } from "../../common/validation/cuid";
import { createValidationException } from "../../common/validation/validation-errors";
import { RegisterDto } from "../auth/dto/register.dto";
import { AddCartItemDto } from "../cart/dto/add-cart-item.dto";
import { CreateSellerProductDto } from "../seller-products/dto/create-seller-product.dto";
import { UpdateSellerProductDto } from "../seller-products/dto/update-seller-product.dto";
import { UpdateStoreSettingsDto } from "../seller-dashboard/dto/update-store-settings.dto";

describe("DTO validation and mass-assignment protection", () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: createValidationException
  });

  it("rejects unknown protected properties on registration", async () => {
    await expect(validate(RegisterDto, {
      fullName: "Buyer One",
      email: "buyer@example.com",
      password: "StrongPass123",
      role: Role.ADMIN,
      isAdmin: true,
      passwordHash: "hash"
    })).rejects.toMatchObject({
      response: {
        errors: expect.arrayContaining([
          expect.objectContaining({ field: "role" }),
          expect.objectContaining({ field: "isAdmin" }),
          expect.objectContaining({ field: "passwordHash" })
        ])
      }
    });
  });

  it("rejects malformed UUID/CUID route identifiers", () => {
    const parseCuidPipe = new ParseCuidPipe();

    expect(() => parseCuidPipe.transform("not-a-uuid")).toThrow(BadRequestException);
    expect(() => parseCuidPipe.transform("550e8400-e29b-41d4-a716-446655440000")).toThrow(BadRequestException);
  });

  it("rejects a negative cart quantity", async () => {
    await expect(validate(AddCartItemDto, {
      productId: "clx1234567890abcdef123456",
      quantity: -1
    })).rejects.toMatchObject({
      response: {
        errors: expect.arrayContaining([expect.objectContaining({ field: "quantity" })])
      }
    });
  });

  it("rejects an invalid product price", async () => {
    await expect(validate(CreateSellerProductDto, {
      categoryId: "clx1234567890abcdef123456",
      title: "Valid Product",
      description: "This product description is long enough.",
      priceCents: 0,
      stockQuantity: 5
    })).rejects.toMatchObject({
      response: {
        errors: expect.arrayContaining([expect.objectContaining({ field: "priceCents" })])
      }
    });
  });

  it("rejects invalid role and status enum values", async () => {
    await expect(validate(RegisterDto, {
      fullName: "Buyer One",
      email: "buyer@example.com",
      password: "StrongPass123",
      role: "SUPER_ADMIN"
    })).rejects.toMatchObject({
      response: {
        errors: expect.arrayContaining([expect.objectContaining({ field: "role" })])
      }
    });

    await expect(validate(UpdateSellerProductDto, {
      status: "PAID"
    })).rejects.toMatchObject({
      response: {
        errors: expect.arrayContaining([expect.objectContaining({ field: "status" })])
      }
    });
  });

  it("prevents users from updating protected fields", async () => {
    await expect(validate(UpdateStoreSettingsDto, {
      name: "Updated Store",
      ownerId: "clx1234567890abcdef123456",
      vendorId: "clx1234567890abcdef123456",
      commissionRate: 1,
      paymentStatus: "PAID",
      createdAt: "2026-07-13T00:00:00.000Z",
      updatedAt: "2026-07-13T00:00:00.000Z"
    })).rejects.toMatchObject({
      response: {
        errors: expect.arrayContaining([
          expect.objectContaining({ field: "ownerId" }),
          expect.objectContaining({ field: "vendorId" }),
          expect.objectContaining({ field: "commissionRate" }),
          expect.objectContaining({ field: "paymentStatus" }),
          expect.objectContaining({ field: "createdAt" }),
          expect.objectContaining({ field: "updatedAt" })
        ])
      }
    });
  });

  it("accepts explicitly allowed seller product fields only", async () => {
    await expect(validate(UpdateSellerProductDto, {
      title: "Updated Product",
      description: "This updated product description is long enough.",
      status: ProductStatus.DRAFT,
      priceCents: 2500,
      stockQuantity: 2
    })).resolves.toMatchObject({
      title: "Updated Product",
      status: ProductStatus.DRAFT,
      priceCents: 2500,
      stockQuantity: 2
    });
  });

  function validate<T extends object>(metatype: new () => T, value: Record<string, unknown>) {
    return pipe.transform(value, { type: "body", metatype });
  }
});