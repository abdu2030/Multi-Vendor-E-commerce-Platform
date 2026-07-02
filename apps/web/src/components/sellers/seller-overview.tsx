"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSellerDashboard, SellerDashboardOverview } from "@/lib/seller-dashboard";

export function SellerOverview() {
  const { accessToken } = useAuth();
  const [overview, setOverview] = useState<SellerDashboardOverview | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    getSellerDashboard(accessToken)
      .then(setOverview)
      .catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : "Seller overview could not load.");
      })
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  if (isLoading) {
    return <p className="muted-text">Loading seller dashboard...</p>;
  }

  if (error) {
    return <p className="form-error">{error}</p>;
  }

  const storeStatus = overview?.store?.status ?? overview?.sellerProfile.status ?? "PENDING";

  return (
    <div className="seller-overview">
      <section className="metric-card">
        <p className="eyebrow">Store status</p>
        <h2>{overview?.store?.status ?? overview?.sellerProfile.status}</h2>
        <p>{overview?.store?.name ?? "Store setup is waiting for approval."}</p>
      </section>
      <section className="metric-card">
        <p className="eyebrow">Products</p>
        <h2>{overview?.metrics.products ?? 0}</h2>
        <p>Product management will be added in the product catalog module.</p>
      </section>
      <section className="metric-card">
        <p className="eyebrow">Order items</p>
        <h2>{overview?.metrics.orderItems ?? 0}</h2>
        <p>Fulfillment metrics will expand when order workflows are built.</p>
      </section>
      <section className="status-panel store-status-panel">
        <div className="status-heading">
          <div>
            <p className="eyebrow">Store profile</p>
          <h2>{overview?.store?.name ?? "Store profile"}</h2>
        </div>
          <span className={`status-badge status-${storeStatus.toLowerCase()}`}>
            {storeStatus}
          </span>
        </div>
        <p>{overview?.store?.description ?? "Store details will appear after the application is approved."}</p>
        <dl className="profile-list">
          <div>
            <dt>Slug</dt>
            <dd>{overview?.store?.slug ?? "Not assigned"}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{overview?.sellerProfile.phone || "Not added"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
