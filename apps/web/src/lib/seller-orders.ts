import { apiRequest } from "./api";

export type SellerFulfillmentStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";

export type SellerOrderItem = {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  unitPriceCents: number;
  quantity: number;
  totalCents: number;
  sellerFulfillmentStatus: SellerFulfillmentStatus;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    slug: string;
    status: string;
  };
  order: {
    id: string;
    orderNumber: string;
    status: string;
    placedAt: string;
  };
  buyer: {
    id: string;
    fullName: string;
    email: string;
  };
  payment: {
    id: string;
    status: string;
    amountCents: number;
    currency: string;
    provider: string;
  } | null;
};

export type SellerOrdersResponse = {
  store: {
    id: string;
    name: string;
    slug: string;
  };
  items: SellerOrderItem[];
  metrics: {
    orderItems: number;
    orders: number;
    totalQuantity: number;
    totalCents: number;
    currency: string;
  };
};

export function getSellerOrders(accessToken: string, status?: SellerFulfillmentStatus) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";

  return apiRequest<SellerOrdersResponse>(`/seller/orders${query}`, {
    token: accessToken
  });
}

export type SellerOrderFulfillmentInput = {
  status: SellerFulfillmentStatus;
  trackingNumber?: string;
};

export function updateSellerOrderFulfillment(
  accessToken: string,
  itemId: string,
  input: SellerOrderFulfillmentInput,
) {
  return apiRequest<SellerOrderItem>(`/seller/orders/${itemId}/fulfillment`, {
    method: "PATCH",
    token: accessToken,
    body: JSON.stringify(input),
  });
}
