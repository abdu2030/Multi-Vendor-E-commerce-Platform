"use client";

import Link from "next/link";
import { SellerApplicationForm } from "@/components/sellers/seller-application-form";

export default function SellerApplyPage() {
  return (
    <section className="workflow-panel">
      <div className="workflow-heading">
        <div>
          <p className="eyebrow">Seller application</p>
          <h2>Apply to sell on MultiVendor</h2>
        </div>
        <Link className="secondary-button" href="/dashboard/seller/status">
          View status
        </Link>
      </div>
      <p className="muted-text">
        Share accurate store and business details. Admin approval is required before seller
        tools are enabled.
      </p>
      <SellerApplicationForm />
    </section>
  );
}
