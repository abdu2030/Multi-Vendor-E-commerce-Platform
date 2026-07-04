import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { SellerStatus } from "@prisma/client";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { PrismaService } from "../prisma/prisma.service";
import { UploadImageDto } from "./dto/upload-image.dto";

@Injectable()
export class SellerUploadsService {
  constructor(
    private readonly cloudinary: CloudinaryService,
    private readonly prisma: PrismaService
  ) {}

  async uploadStoreLogo(userId: string, dto: UploadImageDto) {
    const store = await this.findApprovedStore(userId);
    const uploaded = await this.cloudinary.uploadImage(dto.file, `stores/${store.id}/logo`);
    const updatedStore = await this.prisma.store.update({
      where: { id: store.id },
      data: { logoUrl: uploaded.url },
      select: storeUploadSelect
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: "STORE_LOGO_UPLOADED",
        entity: "Store",
        entityId: store.id,
        metadata: {
          publicId: uploaded.publicId,
          url: uploaded.url
        }
      }
    });

    return {
      upload: uploaded,
      store: updatedStore
    };
  }

  async uploadStoreBanner(userId: string, dto: UploadImageDto) {
    const store = await this.findApprovedStore(userId);
    const uploaded = await this.cloudinary.uploadImage(dto.file, `stores/${store.id}/banner`);
    const updatedStore = await this.prisma.store.update({
      where: { id: store.id },
      data: { bannerUrl: uploaded.url },
      select: storeUploadSelect
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: "STORE_BANNER_UPLOADED",
        entity: "Store",
        entityId: store.id,
        metadata: {
          publicId: uploaded.publicId,
          url: uploaded.url
        }
      }
    });

    return {
      upload: uploaded,
      store: updatedStore
    };
  }

  async uploadProductImage(userId: string, productId: string, dto: UploadImageDto) {
    const product = await this.findOwnedProduct(userId, productId);
    const uploaded = await this.cloudinary.uploadImage(
      dto.file,
      `stores/${product.storeId}/products/${product.id}`
    );
    const sortOrder = dto.sortOrder ?? (await this.getNextProductImageSortOrder(product.id));
    const image = await this.prisma.productImage.create({
      data: {
        productId: product.id,
        url: uploaded.url,
        publicId: uploaded.publicId,
        altText: dto.altText?.trim() || product.title,
        sortOrder
      },
      select: productImageSelect
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: "PRODUCT_IMAGE_UPLOADED",
        entity: "Product",
        entityId: product.id,
        metadata: {
          imageId: image.id,
          publicId: uploaded.publicId,
          url: uploaded.url
        }
      }
    });

    return {
      upload: uploaded,
      image
    };
  }

  private async findApprovedStore(userId: string) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: { store: true }
    });

    if (!sellerProfile || !sellerProfile.store) {
      throw new NotFoundException("Store was not found for this seller account.");
    }

    if (
      sellerProfile.status !== SellerStatus.APPROVED ||
      sellerProfile.store.status !== SellerStatus.APPROVED
    ) {
      throw new ForbiddenException("Seller store must be approved before uploading media.");
    }

    return sellerProfile.store;
  }

  private async findOwnedProduct(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        storeId: true,
        title: true,
        store: {
          select: {
            sellerProfile: {
              select: {
                userId: true,
                status: true
              }
            },
            status: true
          }
        }
      }
    });

    if (!product || product.store.sellerProfile.userId !== userId) {
      throw new NotFoundException("Product was not found.");
    }

    if (
      product.store.sellerProfile.status !== SellerStatus.APPROVED ||
      product.store.status !== SellerStatus.APPROVED
    ) {
      throw new ForbiddenException("Seller store must be approved before uploading media.");
    }

    return product;
  }

  private async getNextProductImageSortOrder(productId: string) {
    const latestImage = await this.prisma.productImage.findFirst({
      where: { productId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true }
    });

    return (latestImage?.sortOrder ?? -1) + 1;
  }
}

const storeUploadSelect = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
  bannerUrl: true,
  updatedAt: true
} as const;

const productImageSelect = {
  id: true,
  productId: true,
  url: true,
  publicId: true,
  altText: true,
  sortOrder: true,
  createdAt: true
} as const;
