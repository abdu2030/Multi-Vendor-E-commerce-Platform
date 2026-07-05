import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAddressDto } from "./dto/create-address.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        phone: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new NotFoundException("User profile was not found.");
    }

    return user;
  }

  getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      select: addressSelect
    });
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    const existingCount = await this.prisma.address.count({ where: { userId } });
    const shouldSetDefault = dto.isDefault === true || existingCount === 0;

    if (!shouldSetDefault) {
      return this.prisma.address.create({
        data: toAddressData(userId, dto, false),
        select: addressSelect
      });
    }

    const [, address] = await this.prisma.$transaction([
      this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      }),
      this.prisma.address.create({
        data: toAddressData(userId, dto, true),
        select: addressSelect
      })
    ]);

    return address;
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
      select: { id: true }
    });

    if (!address) {
      throw new NotFoundException("Address was not found.");
    }

    const [, defaultAddress] = await this.prisma.$transaction([
      this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      }),
      this.prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true },
        select: addressSelect
      })
    ]);

    return defaultAddress;
  }
}

const addressSelect = {
  id: true,
  label: true,
  line1: true,
  line2: true,
  city: true,
  state: true,
  country: true,
  postalCode: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true
} as const;

function toAddressData(userId: string, dto: CreateAddressDto, isDefault: boolean) {
  return {
    userId,
    label: dto.label.trim(),
    line1: dto.line1.trim(),
    line2: dto.line2?.trim() || null,
    city: dto.city.trim(),
    state: dto.state?.trim() || null,
    country: dto.country.trim(),
    postalCode: dto.postalCode?.trim() || null,
    isDefault
  };
}
