import { apiRequest } from "./api";

export type ProductStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

export type ProductImage = {
  id: string;
  productId?: string;
  url: string;
  publicId?: string | null;
  altText?: string | null;
  sortOrder: number;
  createdAt?: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  value: string;
  sku?: string | null;
  priceDeltaCents: number;
  stockQuantity: number;
};

export type SellerProduct = {
  id: string;
  categoryId: string;
  title: string;
  slug: string;
  description?: string;
  priceCents: number;
  currency: string;
  stockQuantity: number;
  status: ProductStatus;
  tags?: string[];
  images: ProductImage[];
  variants?: ProductVariant[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type SellerProductInput = {
  categoryId: string;
  title: string;
  description: string;
  priceCents: number;
  currency?: string;
  stockQuantity: number;
  status?: ProductStatus;
  tags?: string[];
};

export type ProductImageUploadInput = {
  file: string;
  altText?: string;
  sortOrder?: number;
};

export function getSellerProducts(accessToken: string) {
  return apiRequest<SellerProduct[]>("/seller/products", {
    token: accessToken
  });
}

export function getSellerProduct(productId: string, accessToken: string) {
  return apiRequest<SellerProduct>(`/seller/products/${productId}`, {
    token: accessToken
  });
}

export function createSellerProduct(input: SellerProductInput, accessToken: string) {
  return apiRequest<SellerProduct>("/seller/products", {
    method: "POST",
    token: accessToken,
    body: JSON.stringify(input)
  });
}

export function updateSellerProduct(
  productId: string,
  input: Partial<SellerProductInput>,
  accessToken: string
) {
  return apiRequest<SellerProduct>(`/seller/products/${productId}`, {
    method: "PATCH",
    token: accessToken,
    body: JSON.stringify(input)
  });
}

export function archiveSellerProduct(productId: string, accessToken: string) {
  return apiRequest<SellerProduct>(`/seller/products/${productId}/archive`, {
    method: "PATCH",
    token: accessToken
  });
}

export function uploadSellerProductImage(
  productId: string,
  input: ProductImageUploadInput,
  accessToken: string
) {
  return apiRequest<{ image: ProductImage; upload: { url: string; publicId: string } }>(
    `/seller/uploads/products/${productId}/images`,
    {
      method: "POST",
      token: accessToken,
      body: JSON.stringify(input)
    }
  );
}
