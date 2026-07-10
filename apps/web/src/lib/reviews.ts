import { apiRequest } from "./api";

export type ProductReview = {
  id: string;
  productId: string;
  buyerId: string;
  rating: number;
  comment: string;
  images: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    fullName: string;
  };
  verifiedPurchase: boolean;
};

export type ProductReviewsResponse = {
  product: {
    id: string;
    title: string;
    slug: string;
    averageRating: number;
    reviewCount: number;
  };
  reviews: ProductReview[];
  total: number;
};

export type CreateReviewInput = {
  rating: number;
  comment: string;
  images?: string[];
};

export function getProductReviews(productId: string) {
  return apiRequest<ProductReviewsResponse>(`/products/${encodeURIComponent(productId)}/reviews`);
}

export function createProductReview(accessToken: string, productId: string, input: CreateReviewInput) {
  return apiRequest<ProductReview>(`/products/${encodeURIComponent(productId)}/reviews`, {
    method: "POST",
    token: accessToken,
    body: JSON.stringify(input)
  });
}
