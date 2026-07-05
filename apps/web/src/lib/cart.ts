import { apiRequest } from "./api";

export type CartImage = {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
};

export type CartItemValidationIssue = {
  code: string;
  message: string;
};

export type CartItem = {
  id: string;
  quantity: number;
  lineTotalCents: number;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    title: string;
    slug: string;
    priceCents: number;
    currency: string;
    stockQuantity: number;
    status: string;
    category: {
      id: string;
      name: string;
      slug: string;
    };
    store: {
      id: string;
      name: string;
      slug: string;
    };
    image: CartImage | null;
  };
  pricing: {
    unitPriceCents: number;
    lineTotalCents: number;
    currency: string;
    recalculatedAt: string;
  };
  stock: {
    requestedQuantity: number;
    availableQuantity: number;
    isInStock: boolean;
    hasEnoughStock: boolean;
  };
  validation: {
    isPurchasable: boolean;
    issues: CartItemValidationIssue[];
  };
};

export type CartSummary = {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
  totals: {
    subtotalCents: number;
    itemCount: number;
    totalQuantity: number;
    invalidItemCount: number;
    hasStockIssues: boolean;
    currency: string | null;
    recalculatedAt: string;
  };
};

export function getCartSummary(accessToken: string) {
  return apiRequest<CartSummary>("/cart/summary", {
    token: accessToken
  });
}

export function updateCartItem(accessToken: string, itemId: string, quantity: number) {
  return apiRequest<CartSummary>(`/cart/items/${itemId}`, {
    method: "PATCH",
    token: accessToken,
    body: JSON.stringify({ quantity })
  });
}

export function removeCartItem(accessToken: string, itemId: string) {
  return apiRequest<CartSummary>(`/cart/items/${itemId}`, {
    method: "DELETE",
    token: accessToken
  });
}
