import { apiRequest } from "./api";

export type Address = {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAddressInput = {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  isDefault?: boolean;
};

export function getAddresses(accessToken: string) {
  return apiRequest<Address[]>("/users/addresses", {
    token: accessToken
  });
}

export function createAddress(accessToken: string, input: CreateAddressInput) {
  return apiRequest<Address>("/users/addresses", {
    method: "POST",
    token: accessToken,
    body: JSON.stringify(input)
  });
}

export function setDefaultAddress(accessToken: string, addressId: string) {
  return apiRequest<Address>(`/users/addresses/${addressId}/default`, {
    method: "PATCH",
    token: accessToken
  });
}
