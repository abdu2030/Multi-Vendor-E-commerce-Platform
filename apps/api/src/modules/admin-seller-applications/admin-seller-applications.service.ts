import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Role, SellerApplicationStatus, SellerStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminSellerApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  getPending() {
    return this.prisma.sellerApplication.findMany({
      where: { status: SellerApplicationStatus.PENDING },
      orderBy: { createdAt: "asc" },
      select: adminSellerApplicationSelect,
    });
  }

  async approve(applicationId: string, adminUserId: string) {
    const application = await this.findApplicationOrThrow(applicationId);

    if (application.status !== SellerApplicationStatus.PENDING) {
      throw new ConflictException(
        "Only pending seller applications can be approved.",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const existingSellerProfile = await tx.sellerProfile.findUnique({
        where: { userId: application.userId },
        select: {
          id: true,
          status: true,
          bio: true,
          phone: true,
        },
      });
      const sellerProfile = await tx.sellerProfile.upsert({
        where: { userId: application.userId },
        create: {
          userId: application.userId,
          status: SellerStatus.APPROVED,
          bio: application.storeDescription,
          phone: application.phone,
        },
        update: {
          status: SellerStatus.APPROVED,
          bio: application.storeDescription,
          phone: application.phone,
        },
      });
      const sellerProfileChanges = buildChanges(existingSellerProfile, {
        status: SellerStatus.APPROVED,
        bio: application.storeDescription,
        phone: application.phone,
      });
      const slug = await this.createUniqueStoreSlug(
        tx,
        application.storeName,
        sellerProfile.id,
      );
      const existingStore = await tx.store.findUnique({
        where: { sellerProfileId: sellerProfile.id },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
        },
      });

      const store = await tx.store.upsert({
        where: { sellerProfileId: sellerProfile.id },
        create: {
          sellerProfileId: sellerProfile.id,
          name: application.storeName,
          slug,
          description: application.storeDescription,
          status: SellerStatus.APPROVED,
        },
        update: {
          name: application.storeName,
          description: application.storeDescription,
          status: SellerStatus.APPROVED,
        },
      });
      const storeChanges = buildChanges(existingStore, {
        name: application.storeName,
        description: application.storeDescription,
        status: SellerStatus.APPROVED,
      });
      await tx.user.update({
        where: { id: application.userId },
        data: { role: Role.SELLER },
      });
      await tx.sellerApplication.update({
        where: { id: application.id },
        data: {
          status: SellerApplicationStatus.APPROVED,
          rejectionReason: null,
          reviewedById: adminUserId,
          reviewedAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "SELLER_APPLICATION_APPROVED",
          entity: "SellerApplication",
          entityId: application.id,
          metadata: {
            sellerUserId: application.userId,
            previousStatus: application.status,
            newStatus: SellerApplicationStatus.APPROVED,
            sellerProfileId: sellerProfile.id,
            storeId: store.id,
          },
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "SELLER_PROFILE_APPROVED",
          entity: "SellerProfile",
          entityId: sellerProfile.id,
          metadata: {
            sellerUserId: application.userId,
            applicationId: application.id,
            changes: sellerProfileChanges,
          },
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "STORE_PROFILE_APPROVED",
          entity: "Store",
          entityId: store.id,
          metadata: {
            sellerUserId: application.userId,
            sellerProfileId: sellerProfile.id,
            applicationId: application.id,
            changes: storeChanges,
          },
        },
      });

      return tx.sellerApplication.findUniqueOrThrow({
        where: { id: application.id },
        select: adminSellerApplicationSelect,
      });
    });
  }

  async reject(applicationId: string, adminUserId: string, reason: string) {
    const application = await this.findApplicationOrThrow(applicationId);

    if (application.status !== SellerApplicationStatus.PENDING) {
      throw new ConflictException(
        "Only pending seller applications can be rejected.",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.sellerApplication.update({
        where: { id: application.id },
        data: {
          status: SellerApplicationStatus.REJECTED,
          rejectionReason: reason.trim(),
          reviewedById: adminUserId,
          reviewedAt: new Date(),
        },
      });
      await tx.user.updateMany({
        where: {
          id: application.userId,
          role: Role.PENDING_SELLER,
        },
        data: { role: Role.BUYER },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "SELLER_APPLICATION_REJECTED",
          entity: "SellerApplication",
          entityId: application.id,
          metadata: {
            sellerUserId: application.userId,
            previousStatus: application.status,
            newStatus: SellerApplicationStatus.REJECTED,
            reason: reason.trim(),
          },
        },
      });

      return tx.sellerApplication.findUniqueOrThrow({
        where: { id: application.id },
        select: adminSellerApplicationSelect,
      });
    });
  }

  async suspend(applicationId: string, adminUserId: string, reason?: string) {
    const application = await this.findApplicationOrThrow(applicationId);

    return this.prisma.$transaction(async (tx) => {
      const sellerProfile = await tx.sellerProfile.findUnique({
        where: { userId: application.userId },
        include: { store: true },
      });
      await tx.sellerApplication.update({
        where: { id: application.id },
        data: {
          status: SellerApplicationStatus.SUSPENDED,
          rejectionReason: reason?.trim() || null,
          reviewedById: adminUserId,
          reviewedAt: new Date(),
        },
      });
      await tx.sellerProfile.updateMany({
        where: { userId: application.userId },
        data: { status: SellerStatus.SUSPENDED },
      });
      await tx.store.updateMany({
        where: { sellerProfile: { userId: application.userId } },
        data: { status: SellerStatus.SUSPENDED },
      });
      await tx.user.updateMany({
        where: {
          id: application.userId,
          role: { in: [Role.PENDING_SELLER, Role.SELLER] },
        },
        data: { role: Role.BUYER },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "SELLER_APPLICATION_SUSPENDED",
          entity: "SellerApplication",
          entityId: application.id,
          metadata: {
            sellerUserId: application.userId,
            previousStatus: application.status,
            newStatus: SellerApplicationStatus.SUSPENDED,
            reason: reason?.trim() || null,
          },
        },
      });

      if (sellerProfile) {
        await tx.auditLog.create({
          data: {
            actorUserId: adminUserId,
            action: "SELLER_PROFILE_SUSPENDED",
            entity: "SellerProfile",
            entityId: sellerProfile.id,
            metadata: {
              sellerUserId: application.userId,
              applicationId: application.id,
              changes: buildChanges(
                { status: sellerProfile.status },
                { status: SellerStatus.SUSPENDED },
              ),
            },
          },
        });
      }

      if (sellerProfile?.store) {
        await tx.auditLog.create({
          data: {
            actorUserId: adminUserId,
            action: "STORE_PROFILE_SUSPENDED",
            entity: "Store",
            entityId: sellerProfile.store.id,
            metadata: {
              sellerUserId: application.userId,
              sellerProfileId: sellerProfile.id,
              applicationId: application.id,
              changes: buildChanges(
                { status: sellerProfile.store.status },
                { status: SellerStatus.SUSPENDED },
              ),
            },
          },
        });
      }

      return tx.sellerApplication.findUniqueOrThrow({
        where: { id: application.id },
        select: adminSellerApplicationSelect,
      });
    });
  }

  private async findApplicationOrThrow(applicationId: string) {
    const application = await this.prisma.sellerApplication.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        userId: true,
        storeName: true,
        storeDescription: true,
        phone: true,
        status: true,
      },
    });

    if (!application) {
      throw new NotFoundException("Seller application was not found.");
    }

    return application;
  }

  private async createUniqueStoreSlug(
    tx: Parameters<Parameters<PrismaService["$transaction"]>[0]>[0],
    storeName: string,
    sellerProfileId: string,
  ) {
    const baseSlug = slugify(storeName);
    let slug = baseSlug;
    let suffix = 2;

    while (
      await tx.store.findFirst({
        where: {
          slug,
          sellerProfileId: { not: sellerProfileId },
        },
        select: { id: true },
      })
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }
}

const adminSellerApplicationSelect = {
  id: true,
  storeName: true,
  storeDescription: true,
  phone: true,
  address: true,
  businessDocument: true,
  status: true,
  rejectionReason: true,
  reviewedById: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
  },
} as const;

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "store";
}

type AuditFieldValue = string | null | undefined;
type AuditRecord = Record<string, AuditFieldValue>;
type AuditChangeSet = Record<
  string,
  { from: string | null; to: string | null }
>;

function buildChanges(before: AuditRecord | null, after: AuditRecord) {
  const changes: AuditChangeSet = {};

  for (const [field, value] of Object.entries(after)) {
    if (typeof value === "undefined") {
      continue;
    }

    const previous = before?.[field] ?? null;
    const next = value ?? null;

    if (previous !== next) {
      changes[field] = { from: previous, to: next };
    }
  }

  return changes;
}
