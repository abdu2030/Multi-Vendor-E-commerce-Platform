import { apiRequest } from "./api";

export type UserRole = "BUYER" | "PENDING_SELLER" | "SELLER" | "ADMIN" | "SUPPORT";
export type SellerStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type ProductStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ARCHIVED";
export type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";

export type AdminDashboardStats = {
  generatedAt: string;
  users: {
    total: number;
    byRole: Record<UserRole, number>;
  };
  sellers: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    suspended: number;
    byStatus: Record<SellerStatus, number>;
  };
  products: {
    total: number;
    approved: number;
    pendingReview: number;
    draft: number;
    rejected: number;
    archived: number;
    byStatus: Record<ProductStatus, number>;
  };
  orders: {
    total: number;
    pending: number;
    paid: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    refunded: number;
    byStatus: Record<OrderStatus, number>;
  };
  revenue: {
    totalPaidCents: number;
    currency: string;
    paidPaymentCount: number;
    byCurrency: Array<{
      currency: string;
      totalCents: number;
      paymentCount: number;
    }>;
  };
  pendingApprovals: {
    sellerApplications: number;
    products: number;
    total: number;
  };
};

export function getAdminDashboardStats(accessToken: string) {
  return apiRequest<AdminDashboardStats>("/admin/dashboard/stats", {
    token: accessToken
  });
}
