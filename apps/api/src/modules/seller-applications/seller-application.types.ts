export type SellerApplicationStatus = "pending" | "approved" | "rejected" | "suspended";

export type SellerApplication = {
  id: string;
  storeName: string;
  storeDescription: string;
  phone: string;
  address: string;
  businessDocument?: string;
  status: SellerApplicationStatus;
  rejectionReason?: string;
  suspensionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateSellerApplicationInput = {
  storeName?: unknown;
  storeDescription?: unknown;
  phone?: unknown;
  address?: unknown;
  businessDocument?: unknown;
};

export type SellerDecisionInput = {
  reason?: unknown;
};
