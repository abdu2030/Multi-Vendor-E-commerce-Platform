import { ConflictException, Injectable } from "@nestjs/common";
import { Role, SellerApplicationStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSellerApplicationDto } from "./dto/create-seller-application.dto";

@Injectable()
export class SellerApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSellerApplicationDto) {
    const [pendingApplication, sellerProfile] = await Promise.all([
      this.prisma.sellerApplication.findFirst({
        where: {
          userId,
          status: SellerApplicationStatus.PENDING
        },
        select: { id: true }
      }),
      this.prisma.sellerProfile.findUnique({
        where: { userId },
        select: { id: true }
      })
    ]);

    if (sellerProfile) {
      throw new ConflictException("A seller profile already exists for this account.");
    }

    if (pendingApplication) {
      throw new ConflictException("You already have a pending seller application.");
    }

    return this.prisma.$transaction(async (tx) => {
      const application = await tx.sellerApplication.create({
        data: {
          userId,
          storeName: dto.storeName.trim(),
          storeDescription: dto.storeDescription.trim(),
          phone: dto.phone.trim(),
          address: dto.address.trim(),
          businessDocument: dto.businessDocument?.trim()
        },
        select: sellerApplicationSelect
      });

      await tx.user.updateMany({
        where: {
          id: userId,
          role: Role.BUYER
        },
        data: {
          role: Role.PENDING_SELLER
        }
      });

      return application;
    });
  }

  getMine(userId: string) {
    return this.prisma.sellerApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: sellerApplicationSelect
    });
  }
}

const sellerApplicationSelect = {
  id: true,
  storeName: true,
  storeDescription: true,
  phone: true,
  address: true,
  businessDocument: true,
  status: true,
  rejectionReason: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true
} as const;
