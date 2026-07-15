import { apiRequest } from "./api";
import { SellerApplicationStatus } from "./seller-applications";

export type StoreStatus = SellerApplicationStatus;

export type SellerStore = {
  id: string;
  sellerProfileId: string;
  name: string;
  slug: string;
  description: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  status: StoreStatus;
  createdAt: string;
  updatedAt: string;
};

export type SellerProfileSummary = {
  id: string;
  status: StoreStatus;
  bio?: string | null;
  phone?: string | null;
};

export type SellerDashboardOverview = {
  sellerProfile: SellerProfileSummary;
  store: SellerStore | null;
  metrics: {
    products: number;
    orderItems: number;
  };
};

export type SellerStoreSettings = {
  sellerProfile: SellerProfileSummary;
  store: SellerStore;
};

export type StoreSettingsInput = {
  name?: string;
  description?: string;
  phone?: string;
  bio?: string;
};

export function getSellerDashboard(accessToken: string) {
  return apiRequest<SellerDashboardOverview>("/seller/dashboard", {
    token: accessToken
  });
}

export function getStoreSettings(accessToken: string) {
  return apiRequest<SellerStoreSettings>("/seller/store/settings", {
    token: accessToken
  });
}

export function updateStoreSettings(input: StoreSettingsInput, accessToken: string) {
  return apiRequest<SellerStoreSettings>("/seller/store/settings", {
    method: "PATCH",
    token: accessToken,
    body: JSON.stringify(input)
  });
}
