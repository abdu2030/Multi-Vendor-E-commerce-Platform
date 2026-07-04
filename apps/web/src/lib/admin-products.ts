import { apiRequest } from "./api";
import { ProductStatus } from "./seller-products";

export type AdminProduct = {
  id: string;
  title: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  stockQuantity: number;
  status: ProductStatus;
  tags: string[];
  averageRating: number | string;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  store: {
    id: string;
    name: string;
    slug: string;
    sellerProfile: {
      user: {
        id: string;
        fullName: string;
        email: string;
      };
    };
  };
  images: Array<{
    id: string;
    url: string;
    publicId?: string | null;
    altText: string | null;
    sortOrder: number;
    createdAt?: string;
  }>;
  variants?: Array<{
    id: string;
    name: string;
    value: string;
    sku: string | null;
    priceDeltaCents: number;
    stockQuantity: number;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type ProductDecision = "approve" | "reject";

export function getPendingAdminProducts(accessToken: string) {
  return apiRequest<AdminProduct[]>("/admin/products/pending", {
    token: accessToken
  });
}

export function getAdminProduct(productId: string, accessToken: string) {
  return apiRequest<AdminProduct>(`/admin/products/${productId}`, {
    token: accessToken
  });
}

export function decideAdminProduct(
  productId: string,
  decision: ProductDecision,
  accessToken: string,
  reason?: string
) {
  return apiRequest<AdminProduct>(`/admin/products/${productId}/${decision}`, {
    method: "PATCH",
    token: accessToken,
    body: decision === "reject" ? JSON.stringify({ reason }) : undefined
  });
}