import { apiRequest } from "./api";

export type CheckoutSession = {
  sessionId: string;
  url: string | null;
  amountCents: number;
  currency: string;
  addressId: string;
};

export function createCheckoutSession(accessToken: string, addressId: string) {
  return apiRequest<CheckoutSession>("/checkout/sessions", {
    method: "POST",
    token: accessToken,
    body: JSON.stringify({ addressId })
  });
}
