import { BadRequestException, NotFoundException, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SellerStatus } from "@prisma/client";
import { createValidationException } from "../../common/validation/validation-errors";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { CreateSellerApplicationDto } from "../seller-applications/dto/create-seller-application.dto";
import { SellerUploadsService } from "../seller-uploads/seller-uploads.service";

const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const validPngDataUri = `data:image/png;base64,${Buffer.concat([pngHeader, Buffer.from([0, 0, 0, 0])]).toString("base64")}`;

describe("File upload security", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("rejects oversized image data before Cloudinary receives it", async () => {
    const service = createCloudinaryService();
    const oversizedImage = Buffer.concat([pngHeader, Buffer.alloc(5 * 1024 * 1024)]);
    const fetchMock = jest.fn();

    global.fetch = fetchMock as never;

    await expect(service.uploadImage(`data:image/png;base64,${oversizedImage.toString("base64")}`, "stores/store_1/logo"))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects unsupported image types before Cloudinary receives them", async () => {
    const service = createCloudinaryService();
    const fetchMock = jest.fn();

    global.fetch = fetchMock as never;

    await expect(service.uploadImage("data:image/svg+xml;base64,PHN2Zy8+", "stores/store_1/logo"))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a renamed executable even when it claims an allowed image MIME type", async () => {
    const service = createCloudinaryService();
    const executableDataUri = `data:image/png;base64,${Buffer.from("MZ fake executable").toString("base64")}`;
    const fetchMock = jest.fn();

    global.fetch = fetchMock as never;

    await expect(service.uploadImage(executableDataUri, "stores/store_1/logo"))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("checks remote image bytes instead of trusting URL extension or response MIME type", async () => {
    const service = createCloudinaryService();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "image/png", "content-length": "18" }),
      arrayBuffer: async () => Buffer.from("MZ fake executable").buffer
    });

    global.fetch = fetchMock as never;

    await expect(service.uploadImage("https://cdn.example.test/logo.png", "stores/store_1/logo"))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("uses a server-generated Cloudinary public id and generated upload filename", async () => {
    const service = createCloudinaryService();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        public_id: "uploads/stores/store_1/logo/generated-id",
        secure_url: "https://res.cloudinary.com/cloud/image/upload/generated-id.png",
        resource_type: "image",
        format: "png",
        bytes: 12
      })
    });

    global.fetch = fetchMock as never;

    await service.uploadImage(validPngDataUri, "stores/store_1/logo");

    const body = fetchMock.mock.calls[0][1].body as FormData;
    const publicId = body.get("public_id");
    const uploadedFile = body.get("file") as File;

    expect(publicId).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/));
    expect(uploadedFile.name).toBe("upload.png");
  });

  it("prevents a seller from uploading onto another seller's product", async () => {
    const cloudinary = { uploadImage: jest.fn() };
    const prisma = {
      product: {
        findUnique: jest.fn().mockResolvedValue(buildSellerProduct({ sellerUserId: "seller_other" }))
      }
    };
    const service = new SellerUploadsService(cloudinary as never, prisma as never);

    await expect(service.uploadProductImage("seller_owner", "product_1", { file: validPngDataUri }))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(cloudinary.uploadImage).not.toHaveBeenCalled();
  });

  it("limits upload frequency for a seller account", async () => {
    const cloudinary = {
      uploadImage: jest.fn().mockResolvedValue({ publicId: "public_1", url: "https://cdn.example.test/logo.png" })
    };
    const prisma = createStoreUploadPrisma();
    const service = new SellerUploadsService(cloudinary as never, prisma as never);

    for (let index = 0; index < 20; index += 1) {
      await service.uploadStoreLogo("seller_owner", { file: validPngDataUri });
    }

    await expect(service.uploadStoreLogo("seller_owner", { file: validPngDataUri }))
      .rejects.toMatchObject({ status: 429 });
  });

  it("rejects file-like public document payloads for seller verification documents", async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: createValidationException
    });

    await expect(pipe.transform(
      {
        storeName: "Seller Store",
        storeDescription: "A reliable seller application.",
        phone: "1234567",
        address: "Market street",
        businessDocument: "data:application/pdf;base64,JVBERi0xLjQ="
      },
      { type: "body", metatype: CreateSellerApplicationDto }
    )).rejects.toMatchObject({
      response: {
        errors: expect.arrayContaining([expect.objectContaining({ field: "businessDocument" })])
      }
    });

    await expect(pipe.transform(
      {
        storeName: "Seller Store",
        storeDescription: "A reliable seller application.",
        phone: "1234567",
        address: "Market street",
        businessDocument: "http://files.example.test/document.pdf"
      },
      { type: "body", metatype: CreateSellerApplicationDto }
    )).rejects.toMatchObject({
      response: {
        errors: expect.arrayContaining([expect.objectContaining({ field: "businessDocument" })])
      }
    });
  });
});

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

function createStoreUploadPrisma() {
  return {
    sellerProfile: {
      findUnique: jest.fn().mockResolvedValue({
        status: SellerStatus.APPROVED,
        store: {
          id: "store_1",
          name: "Seller Store",
          slug: "seller-store",
          status: SellerStatus.APPROVED
        }
      })
    },
    store: {
      update: jest.fn().mockResolvedValue({
        id: "store_1",
        name: "Seller Store",
        slug: "seller-store",
        logoUrl: "https://cdn.example.test/logo.png",
        bannerUrl: null,
        updatedAt: new Date()
      })
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({})
    }
  };
}

function buildSellerProduct({ sellerUserId }: { sellerUserId: string }) {
  return {
    id: "product_1",
    storeId: "store_1",
    title: "Product",
    store: {
      status: SellerStatus.APPROVED,
      sellerProfile: {
        userId: sellerUserId,
        status: SellerStatus.APPROVED
      }
    }
  };
}
