export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export type SellerApplicationPayload = {
  storeName: string;
  storeDescription: string;
  phone: string;
  address: string;
  businessDocument?: string;
};

export async function submitSellerApplication(payload: SellerApplicationPayload) {
  const response = await fetch(`${apiUrl}/sellers/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? "Seller application could not be submitted.");
  }

  return data;
}
