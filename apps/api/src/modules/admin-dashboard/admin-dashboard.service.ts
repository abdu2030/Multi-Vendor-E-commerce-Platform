import { Injectable } from "@nestjs/common";
import {
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  Role,
  SellerApplicationStatus,
  SellerStatus
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      usersByRole,
      sellersByStatus,
      productsByStatus,
      ordersByStatus,
      paidRevenueByCurrency,
      pendingSellerApplications
    ] = await Promise.all([
      this.prisma.user.groupBy({
        by: ["role"],
        _count: { _all: true }
      }),
      this.prisma.sellerProfile.groupBy({
        by: ["status"],
        _count: { _all: true }
      }),
      this.prisma.product.groupBy({
        by: ["status"],
        _count: { _all: true }
      }),
      this.prisma.order.groupBy({
        by: ["status"],
        _count: { _all: true }
      }),
      this.prisma.payment.groupBy({
        by: ["currency"],
        where: { status: PaymentStatus.PAID },
        _sum: { amountCents: true },
        _count: { _all: true },
        orderBy: { currency: "asc" }
      }),
      this.prisma.sellerApplication.count({
        where: { status: SellerApplicationStatus.PENDING }
      })
    ]);

    const userCounts = countBy(Object.values(Role), usersByRole, "role");
    const sellerCounts = countBy(Object.values(SellerStatus), sellersByStatus, "status");
    const productCounts = countBy(Object.values(ProductStatus), productsByStatus, "status");
    const orderCounts = countBy(Object.values(OrderStatus), ordersByStatus, "status");
    const revenueByCurrency = paidRevenueByCurrency.map((row) => ({
      currency: row.currency,
      totalCents: row._sum.amountCents ?? 0,
      paymentCount: row._count._all
    }));
    const primaryRevenue = revenueByCurrency.find((row) => row.currency === "USD")
      ?? revenueByCurrency[0]
      ?? { currency: "USD", totalCents: 0, paymentCount: 0 };

    return {
      generatedAt: new Date().toISOString(),
      users: {
        total: totalCount(userCounts),
        byRole: userCounts
      },
      sellers: {
        total: totalCount(sellerCounts),
        approved: sellerCounts.APPROVED,
        pending: sellerCounts.PENDING,
        rejected: sellerCounts.REJECTED,
        suspended: sellerCounts.SUSPENDED,
        byStatus: sellerCounts
      },
      products: {
        total: totalCount(productCounts),
        approved: productCounts.APPROVED,
        pendingReview: productCounts.PENDING_REVIEW,
        draft: productCounts.DRAFT,
        rejected: productCounts.REJECTED,
        archived: productCounts.ARCHIVED,
        byStatus: productCounts
      },
      orders: {
        total: totalCount(orderCounts),
        pending: orderCounts.PENDING,
        paid: orderCounts.PAID,
        processing: orderCounts.PROCESSING,
        shipped: orderCounts.SHIPPED,
        delivered: orderCounts.DELIVERED,
        cancelled: orderCounts.CANCELLED,
        refunded: orderCounts.REFUNDED,
        byStatus: orderCounts
      },
      revenue: {
        totalPaidCents: primaryRevenue.totalCents,
        currency: primaryRevenue.currency,
        paidPaymentCount: primaryRevenue.paymentCount,
        byCurrency: revenueByCurrency
      },
      pendingApprovals: {
        sellerApplications: pendingSellerApplications,
        products: productCounts.PENDING_REVIEW,
        total: pendingSellerApplications + productCounts.PENDING_REVIEW
      }
    };
  }
}

type GroupedCount<T extends string, K extends string> = {
  _count: { _all: number };
} & { [P in K]: T };

function countBy<T extends string, K extends string>(
  keys: T[],
  rows: Array<GroupedCount<T, K>>,
  field: K
) {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<T, number>;

  for (const row of rows) {
    counts[row[field]] = row._count._all;
  }

  return counts;
}

function totalCount(counts: Record<string, number>) {
  return Object.values(counts).reduce((total, count) => total + count, 0);
}
