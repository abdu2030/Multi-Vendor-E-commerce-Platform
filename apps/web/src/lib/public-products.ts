import { apiRequest } from "./api";

export type PublicProductImage = {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
};

export type PublicProductVariant = {
  id: string;
  name: string;
  value: string;
  sku: string | null;
  priceDeltaCents: number;
  stockQuantity: number;
};

export type PublicProduct = {
  id: string;
  title: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  stockQuantity: number;
  tags: string[];
  averageRating: number;
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
    logoUrl: string | null;
  };
  image: PublicProductImage | null;
  counts: {
    variants: number;
    reviews: number;
  };
};

export type PublicProductDetail = PublicProduct & {
  images: PublicProductImage[];
  variants: PublicProductVariant[];
};

export type PublicProductsResponse = {
  items: PublicProduct[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    sort: string;
  };
};

export type PublicProductQuery = {
  q?: string;
  categorySlug?: string;
  storeSlug?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  inStock?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
};

export function getPublicProducts(query: PublicProductQuery = {}) {
  return apiRequest<PublicProductsResponse>(`/products${toQueryString(query)}`);
}

export function getPublicProduct(slug: string) {
  return apiRequest<PublicProductDetail>(`/products/${encodeURIComponent(slug)}`);
}

function toQueryString(query: PublicProductQuery) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    params.set(key, String(value));
  }

  const text = params.toString();

  return text ? `?${text}` : "";
}
