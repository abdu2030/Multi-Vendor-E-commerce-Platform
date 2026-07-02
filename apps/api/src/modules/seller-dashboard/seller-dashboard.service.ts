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
          this.prisma.orderItem.count({ where: { storeId: store.id } }),
        ])
      : [0, 0];

    return {
      sellerProfile: {
        id: sellerProfile.id,
        status: sellerProfile.status,
        bio: sellerProfile.bio,
        phone: sellerProfile.phone,
      },
      store,
      metrics: {
        products: productCount,
        orderItems: orderItemCount,
      },
    };
  }

  async getStoreSettings(userId: string) {
    const sellerProfile = await this.findSellerProfile(userId);

    if (!sellerProfile.store) {
      throw new NotFoundException(
        "Store was not found for this seller account.",
      );
    }

    return {
      sellerProfile: {
        id: sellerProfile.id,
        status: sellerProfile.status,
        bio: sellerProfile.bio,
        phone: sellerProfile.phone,
      },
      store: sellerProfile.store,
    };
  }

  async updateStoreSettings(userId: string, dto: UpdateStoreSettingsDto) {
    const sellerProfile = await this.findSellerProfile(userId);

    if (!sellerProfile.store) {
      throw new NotFoundException(
        "Store was not found for this seller account.",
      );
    }

    const store = sellerProfile.store;
    const sellerProfileUpdates = {
      bio: dto.bio?.trim(),
      phone: dto.phone?.trim(),
    };
    const storeUpdates = {
      name: dto.name?.trim(),
      description: dto.description?.trim(),
      logoUrl: this.normalizeOptionalUrl(dto.logoUrl),
      bannerUrl: this.normalizeOptionalUrl(dto.bannerUrl),
    };
    const sellerProfileChanges = buildChanges(
      {
        bio: sellerProfile.bio,
        phone: sellerProfile.phone,
      },
      sellerProfileUpdates,
    );
    const storeChanges = buildChanges(
      {
        name: store.name,
        description: store.description,
        logoUrl: store.logoUrl,
        bannerUrl: store.bannerUrl,
      },
      storeUpdates,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.sellerProfile.update({
        where: { id: sellerProfile.id },
        data: sellerProfileUpdates,
      });
      await tx.store.update({
        where: { id: store.id },
        data: storeUpdates,
      });

      if (Object.keys(sellerProfileChanges).length > 0) {
        await tx.auditLog.create({
          data: {
            actorUserId: userId,
            action: "SELLER_PROFILE_UPDATED",
            entity: "SellerProfile",
            entityId: sellerProfile.id,
            metadata: {
              changes: sellerProfileChanges,
            },
          },
        });
      }

      if (Object.keys(storeChanges).length > 0) {
        await tx.auditLog.create({
          data: {
            actorUserId: userId,
            action: "STORE_PROFILE_UPDATED",
            entity: "Store",
            entityId: store.id,
            metadata: {
              sellerProfileId: sellerProfile.id,
              changes: storeChanges,
            },
          },
        });
      }
    });

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
      include: { store: true },
    });

    if (!sellerProfile) {
      throw new NotFoundException("Seller profile was not found.");
    }

    return sellerProfile;
  }
}

type AuditFieldValue = string | null | undefined;
type AuditRecord = Record<string, AuditFieldValue>;
type AuditChangeSet = Record<
  string,
  { from: string | null; to: string | null }
>;

function buildChanges(before: AuditRecord, after: AuditRecord) {
  const changes: AuditChangeSet = {};

  for (const [field, value] of Object.entries(after)) {
    if (typeof value === "undefined") {
      continue;
    }

    const previous = before[field] ?? null;
    const next = value ?? null;

    if (previous !== next) {
      changes[field] = { from: previous, to: next };
    }
  }

  return changes;
}
