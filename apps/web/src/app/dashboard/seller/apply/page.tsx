"use client";

import Link from "next/link";
import { ArrowRight } from "@/components/imported/design-icons";
import { SellerApplicationForm } from "@/components/sellers/seller-application-form";

export default function SellerApplyPage() {
  return (
    <section className="max-w-4xl rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
            Seller application
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-stone-900">
            Apply to sell on Marketo
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
            Share accurate store and business details. Admin approval is
            required before seller tools are enabled.
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-extrabold text-stone-700 transition-colors hover:border-stone-300"
          href="/dashboard/seller/status"
        >
          View status
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <SellerApplicationForm />
    </section>
  );
}
