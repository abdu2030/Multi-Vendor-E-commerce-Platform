"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  SellerApplication,
  SellerApplicationStatus as Status,
  getMySellerApplication
} from "@/lib/seller-applications";

const statusLabels: Record<Status, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended"
};

export function SellerApplicationStatus() {
  const { accessToken } = useAuth();
  const [application, setApplication] = useState<SellerApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    getMySellerApplication(accessToken)
      .then(setApplication)
      .catch((caughtError) => {
        setError(
          caughtError instanceof Error ? caughtError.message : "Seller application status could not load."
        );
      })
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  if (isLoading) {
    return <p className="muted-text">Loading seller application status...</p>;
  }

  if (error) {
    return <p className="form-error">{error}</p>;
  }

  if (!application) {
    return (
      <section className="empty-state">
        <p className="eyebrow">No application</p>
        <h2>Apply to become a seller</h2>
        <p>Submit your store details so the admin team can review your seller request.</p>
        <Link className="primary-button" href="/dashboard/seller/apply">
          Start application
        </Link>
      </section>
    );
  }

  return (
    <section className="status-panel">
      <div className="status-heading">
        <div>
          <p className="eyebrow">Seller application</p>
          <h2>{application.storeName}</h2>
        </div>
        <span className={`status-badge status-${application.status.toLowerCase()}`}>
          {statusLabels[application.status]}
        </span>
      </div>
      <p>{statusMessage(application)}</p>
      {application.rejectionReason ? (
        <p className="form-error">Reason: {application.rejectionReason}</p>
      ) : null}
      <dl className="profile-list">
        <div>
          <dt>Submitted</dt>
          <dd>{new Date(application.createdAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{application.phone}</dd>
        </div>
        <div>
          <dt>Address</dt>
          <dd>{application.address}</dd>
        </div>
      </dl>
    </section>
  );
}

function statusMessage(application: SellerApplication) {
  if (application.status === "PENDING") {
    return "Your application is pending admin review. You can keep using your buyer account while we review your store details.";
  }

  if (application.status === "APPROVED") {
    return "Your seller application has been approved. Seller tools will become available as the seller dashboard is built.";
  }

  if (application.status === "REJECTED") {
    return "Your application was rejected. Review the reason below before submitting a future application.";
  }

  return "Your seller access is currently suspended.";
}
