import { apiRequest } from "./api";

export type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";

export type OrderTotals = {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
};

export type OrderPayment = {
  id: string;
  provider: string;
  providerRef?: string;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
} | null;

export type OrderPreviewItem = {
  id: string;
  productTitle: string;
  productImage: string | null;
  quantity: number;
  totalCents: number;
  store: {
    id: string;
    name: string;
    slug: string;
  };
};

export type BuyerOrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totals: OrderTotals;
  placedAt: string;
  createdAt: string;
  itemCount: number;
  previewItems: OrderPreviewItem[];
  payment: OrderPayment;
};

export type BuyerOrderDetail = Omit<BuyerOrderSummary, "previewItems"> & {
  shippingAddress: unknown;
  updatedAt: string;
  items: Array<{
    id: string;
    productId: string;
    productTitle: string;
    productImage: string | null;
    unitPriceCents: number;
    quantity: number;
    totalCents: number;
    sellerFulfillmentStatus: OrderStatus;
    trackingNumber: string | null;
    product: {
      id: string;
      slug: string;
      status: string;
    };
    store: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
};

export type BuyerOrdersResponse = {
  orders: BuyerOrderSummary[];
  total: number;
};

export function getBuyerOrders(accessToken: string) {
  return apiRequest<BuyerOrdersResponse>("/orders", {
    token: accessToken,
  });
}

export function getBuyerOrder(accessToken: string, orderId: string) {
  return apiRequest<BuyerOrderDetail>(`/orders/${orderId}`, {
    token: accessToken,
  });
}
