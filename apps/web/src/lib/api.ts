export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export type SellerApplicationPayload = {
  storeName: string;
  storeDescription: string;
  phone: string;
  address: string;
  businessDocument?: string;
};

export type SellerApplicationStatus = "pending" | "approved" | "rejected" | "suspended";

export type SellerApplication = SellerApplicationPayload & {
  id: string;
  status: SellerApplicationStatus;
  rejectionReason?: string;
  suspensionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
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

export async function getPendingSellerApplications() {
  const response = await fetch(`${apiUrl}/admin/sellers/pending`, {
    headers: {
      "x-user-role": "admin"
    },
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? "Pending seller applications could not be loaded.");
  }

  return data as { items: SellerApplication[]; total: number };
}

export async function decideSellerApplication(
  applicationId: string,
  action: "approve" | "reject" | "suspend",
  reason?: string
) {
  const response = await fetch(`${apiUrl}/admin/sellers/${applicationId}/${action}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-user-role": "admin",
      "x-user-id": "local-admin"
    },
    body: JSON.stringify(reason ? { reason } : {})
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? `Seller application could not be ${action}d.`);
  }

  return data as { message: string; application: SellerApplication };
}
