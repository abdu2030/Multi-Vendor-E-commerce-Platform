import { OrderStatus, PaymentStatus, ProductStatus, Role, SellerApplicationStatus, SellerStatus } from "@prisma/client";
import { AdminDashboardService } from "./admin-dashboard.service";

describe("AdminDashboardService", () => {
  it("returns admin dashboard totals, breakdowns, revenue, and pending approvals", async () => {
    const prisma = {
      user: {
        groupBy: jest.fn().mockResolvedValue([
          { role: Role.BUYER, _count: { _all: 10 } },
          { role: Role.SELLER, _count: { _all: 3 } },
          { role: Role.ADMIN, _count: { _all: 1 } }
        ])
      },
      sellerProfile: {
        groupBy: jest.fn().mockResolvedValue([
          { status: SellerStatus.APPROVED, _count: { _all: 2 } },
          { status: SellerStatus.PENDING, _count: { _all: 1 } }
        ])
      },
      product: {
        groupBy: jest.fn().mockResolvedValue([
          { status: ProductStatus.APPROVED, _count: { _all: 12 } },
          { status: ProductStatus.PENDING_REVIEW, _count: { _all: 4 } },
          { status: ProductStatus.DRAFT, _count: { _all: 5 } }
        ])
      },
      order: {
        groupBy: jest.fn().mockResolvedValue([
          { status: OrderStatus.PAID, _count: { _all: 8 } },
          { status: OrderStatus.SHIPPED, _count: { _all: 2 } },
          { status: OrderStatus.REFUNDED, _count: { _all: 1 } }
        ])
      },
      payment: {
        groupBy: jest.fn().mockResolvedValue([
          { currency: "USD", _sum: { amountCents: 125000 }, _count: { _all: 10 } }
        ])
      },
      sellerApplication: {
        count: jest.fn().mockResolvedValue(6)
      }
    };
    const service = new AdminDashboardService(prisma as never);

    const result = await service.getStats();

    expect(prisma.payment.groupBy).toHaveBeenCalledWith({
      by: ["currency"],
      where: { status: PaymentStatus.PAID },
      _sum: { amountCents: true },
      _count: { _all: true },
      orderBy: { currency: "asc" }
    });
    expect(prisma.sellerApplication.count).toHaveBeenCalledWith({
      where: { status: SellerApplicationStatus.PENDING }
    });
    expect(result).toMatchObject({
      users: {
        total: 14,
        byRole: {
          BUYER: 10,
          PENDING_SELLER: 0,
          SELLER: 3,
          ADMIN: 1,
          SUPPORT: 0
        }
      },
      sellers: {
        total: 3,
        approved: 2,
        pending: 1,
        rejected: 0,
        suspended: 0
      },
      products: {
        total: 21,
        approved: 12,
        pendingReview: 4,
        draft: 5,
        rejected: 0,
        archived: 0
      },
      orders: {
        total: 11,
        pending: 0,
        paid: 8,
        processing: 0,
        shipped: 2,
        delivered: 0,
        cancelled: 0,
        refunded: 1
      },
      revenue: {
        totalPaidCents: 125000,
        currency: "USD",
        paidPaymentCount: 10,
        byCurrency: [{ currency: "USD", totalCents: 125000, paymentCount: 10 }]
      },
      pendingApprovals: {
        sellerApplications: 6,
        products: 4,
        total: 10
      }
    });
    expect(result.generatedAt).toEqual(expect.any(String));
  });

  it("returns zero-filled stats when there is no marketplace activity", async () => {
    const prisma = {
      user: { groupBy: jest.fn().mockResolvedValue([]) },
      sellerProfile: { groupBy: jest.fn().mockResolvedValue([]) },
      product: { groupBy: jest.fn().mockResolvedValue([]) },
      order: { groupBy: jest.fn().mockResolvedValue([]) },
      payment: { groupBy: jest.fn().mockResolvedValue([]) },
      sellerApplication: { count: jest.fn().mockResolvedValue(0) }
    };
    const service = new AdminDashboardService(prisma as never);

    const result = await service.getStats();

    expect(result).toMatchObject({
      users: { total: 0, byRole: { BUYER: 0, PENDING_SELLER: 0, SELLER: 0, ADMIN: 0, SUPPORT: 0 } },
      sellers: { total: 0, approved: 0, pending: 0, rejected: 0, suspended: 0 },
      products: { total: 0, approved: 0, pendingReview: 0, draft: 0, rejected: 0, archived: 0 },
      orders: { total: 0, pending: 0, paid: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, refunded: 0 },
      revenue: { totalPaidCents: 0, currency: "USD", paidPaymentCount: 0, byCurrency: [] },
      pendingApprovals: { sellerApplications: 0, products: 0, total: 0 }
    });
  });
});
