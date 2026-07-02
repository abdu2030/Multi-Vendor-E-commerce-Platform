"use client";

import Link from "next/link";
import { ArrowRight } from "@/components/imported/design-icons";
import { SellerApplicationStatus } from "@/components/sellers/seller-application-status";

export default function SellerStatusPage() {
  return (
    <section className="grid max-w-5xl gap-5">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              Application status
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-stone-900">
              Seller review
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
              Follow the application state returned by the seller onboarding
              API.
            </p>
          </div>
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-extrabold text-stone-700 transition-colors hover:border-stone-300"
            href="/dashboard/seller/apply"
          >
            Apply
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <SellerApplicationStatus />
    </section>
  );
}
