import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateStoreSettingsDto } from "./dto/update-store-settings.dto";

@Injectable()
export class SellerDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const sellerProfile = await this.findSellerProfile(userId);
    const store = sellerProfile.store;
    const [productCount, orderItemCount] = store
      ? await Promise.all([
          this.prisma.product.count({ where: { storeId: store.id } }),
          this.prisma.orderItem.count({ where: { storeId: store.id } })
        ])
      : [0, 0];

    return {
      sellerProfile: {
        id: sellerProfile.id,
        status: sellerProfile.status,
        bio: sellerProfile.bio,
        phone: sellerProfile.phone
      },
      store,
      metrics: {
        products: productCount,
        orderItems: orderItemCount
      }
    };
  }

  async getStoreSettings(userId: string) {
    const sellerProfile = await this.findSellerProfile(userId);

    if (!sellerProfile.store) {
      throw new NotFoundException("Store was not found for this seller account.");
    }

    return {
      sellerProfile: {
        id: sellerProfile.id,
        status: sellerProfile.status,
        bio: sellerProfile.bio,
        phone: sellerProfile.phone
      },
      store: sellerProfile.store
    };
  }

  async updateStoreSettings(userId: string, dto: UpdateStoreSettingsDto) {
    const sellerProfile = await this.findSellerProfile(userId);

    if (!sellerProfile.store) {
      throw new NotFoundException("Store was not found for this seller account.");
    }

    const sellerProfileUpdates = {
      bio: dto.bio?.trim(),
      phone: dto.phone?.trim()
    };
    const storeUpdates = {
      name: dto.name?.trim(),
      description: dto.description?.trim(),
      logoUrl: this.normalizeOptionalUrl(dto.logoUrl),
      bannerUrl: this.normalizeOptionalUrl(dto.bannerUrl)
    };

    await this.prisma.$transaction([
      this.prisma.sellerProfile.update({
        where: { id: sellerProfile.id },
        data: sellerProfileUpdates
      }),
      this.prisma.store.update({
        where: { id: sellerProfile.store.id },
        data: storeUpdates
      })
    ]);

    return this.getStoreSettings(userId);
  }

  private normalizeOptionalUrl(value?: string) {
    if (typeof value === "undefined") {
      return undefined;
    }

    return value.trim() || null;
  }

  private async findSellerProfile(userId: string) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: { store: true }
    });

    if (!sellerProfile) {
      throw new NotFoundException("Seller profile was not found.");
    }

    return sellerProfile;
  }
}
