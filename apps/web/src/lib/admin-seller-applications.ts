import { apiRequest } from "./api";
import { SellerApplication, SellerApplicationStatus } from "./seller-applications";

export type AdminSellerApplication = SellerApplication & {
  reviewedById?: string | null;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: "BUYER" | "PENDING_SELLER" | "SELLER" | "ADMIN" | "SUPPORT";
  };
};

export type SellerDecision = "approve" | "reject" | "suspend";

export function getPendingSellerApplications(accessToken: string) {
  return apiRequest<AdminSellerApplication[]>("/admin/seller-applications/pending", {
    token: accessToken
  });
}

export function decideSellerApplication(
  applicationId: string,
  decision: SellerDecision,
  accessToken: string,
  reason?: string
) {
  const body =
    decision === "approve"
      ? undefined
      : JSON.stringify({
          reason
        });

  return apiRequest<AdminSellerApplication>(`/admin/seller-applications/${applicationId}/${decision}`, {
    method: "PATCH",
    token: accessToken,
    body
  });
}

export function statusTone(status: SellerApplicationStatus) {
  return `status-${status.toLowerCase()}`;
}
