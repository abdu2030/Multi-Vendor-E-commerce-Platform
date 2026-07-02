import { apiRequest } from "./api";

export type SellerApplicationStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export type SellerApplication = {
  id: string;
  storeName: string;
  storeDescription: string;
  phone: string;
  address: string;
  businessDocument?: string | null;
  status: SellerApplicationStatus;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SellerApplicationInput = {
  storeName: string;
  storeDescription: string;
  phone: string;
  address: string;
  businessDocument?: string;
};

export function createSellerApplication(input: SellerApplicationInput, accessToken: string) {
  return apiRequest<SellerApplication>("/seller-applications", {
    method: "POST",
    token: accessToken,
    body: JSON.stringify(input)
  });
}

export function getMySellerApplication(accessToken: string) {
  return apiRequest<SellerApplication | null>("/seller-applications/me", {
    token: accessToken
  });
}
