import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ProductStatus } from "@prisma/client";
import { createValidationException } from "../../common/validation/validation-errors";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { ListProductsQueryDto } from "../products/dto/list-products-query.dto";
import { ProductsService } from "../products/products.service";

describe("Injection and unsafe input handling", () => {
  it("treats SQL injection search strings as Prisma filter data", async () => {
    const search = "'; DROP TABLE products; --";
    const prisma = createProductPrisma();
    const service = new ProductsService(prisma as never);

    await service.getAll({ q: search, sort: "newest", page: 1, limit: 12 });

    expect(prisma.product.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: ProductStatus.APPROVED,
        OR: expect.arrayContaining([
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { tags: { has: search.toLowerCase() } }
        ])
      })
    });
    expect((prisma as Record<string, unknown>).$queryRawUnsafe).toBeUndefined();
    expect((prisma as Record<string, unknown>).$executeRawUnsafe).toBeUndefined();
  });

  it("rejects invalid dynamic sort fields before product queries run", async () => {
    const pipe = createSecurityValidationPipe();

    await expect(pipe.transform(
      { sort: "priceCents;DROP TABLE products", page: "1", limit: "12" },
      { type: "query", metatype: ListProductsQueryDto }
    )).rejects.toMatchObject({
      response: {
        errors: expect.arrayContaining([expect.objectContaining({ field: "sort" })])
      }
    });
  });

  it("rejects remote image URL path traversal attempts before Cloudinary receives them", async () => {
    const service = createCloudinaryService();
    const fetchSpy = jest.spyOn(global, "fetch");

    await expect(service.uploadImage("https://cdn.example.com/products/../secret.png", "seller/uploads"))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("keeps command-style product search input as inert query data", async () => {
    const search = "$(touch /tmp/stage8); rm -rf /";
    const prisma = createProductPrisma();
    const service = new ProductsService(prisma as never);

    await service.getAll({ q: search, sort: "newest", page: 1, limit: 12 });

    expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        OR: expect.arrayContaining([
          { title: { contains: search, mode: "insensitive" } },
          { tags: { has: search.toLowerCase() } }
        ])
      })
    }));
  });
});

function createProductPrisma() {
  return {
    product: {
      count: jest.fn().mockReturnValue("count-query"),
      findMany: jest.fn().mockReturnValue("find-many-query")
    },
    $transaction: jest.fn().mockResolvedValue([0, []])
  };
}

function createSecurityValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: createValidationException
  });
}

function createCloudinaryService() {
  return new CloudinaryService({
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        CLOUDINARY_CLOUD_NAME: "cloud",
        CLOUDINARY_API_KEY: "api-key",
        CLOUDINARY_API_SECRET: "api-secret",
        CLOUDINARY_UPLOAD_FOLDER: "uploads"
      };

      return values[key];
    })
  } as unknown as ConfigService);
}
