"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  BadgeCheck,
  Package,
  ShoppingBag,
  Truck,
} from "@/components/imported/design-icons";
import {
  SellerDashboardOverview,
  getSellerDashboard,
} from "@/lib/seller-dashboard";

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
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Seller overview could not load.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  if (isLoading) {
    return (
      <p className="rounded-2xl border border-stone-200 bg-white p-5 text-sm font-bold text-stone-500 shadow-sm">
        Loading seller dashboard...
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {error}
      </p>
    );
  }

  const storeStatus =
    overview?.store?.status ?? overview?.sellerProfile.status ?? "PENDING";

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          Icon={BadgeCheck}
          label="Store status"
          tone="emerald"
          value={storeStatus}
        />
        <MetricCard
          Icon={ShoppingBag}
          label="Products"
          tone="purple"
          value={overview?.metrics.products ?? 0}
        />
        <MetricCard
          Icon={Truck}
          label="Order items"
          tone="amber"
          value={overview?.metrics.orderItems ?? 0}
        />
      </div>

      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="h-32 bg-gradient-to-r from-stone-900 via-emerald-900 to-emerald-600">
          {overview?.store?.bannerUrl ? (
            <img
              alt=""
              className="h-full w-full object-cover"
              src={overview.store.bannerUrl}
            />
          ) : null}
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white bg-emerald-600 text-white shadow-sm">
                {overview?.store?.logoUrl ? (
                  <img
                    alt=""
                    className="h-full w-full rounded-xl object-cover"
                    src={overview.store.logoUrl}
                  />
                ) : (
                  <Package className="h-6 w-6" />
                )}
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
                  Store profile
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-stone-900">
                  {overview?.store?.name ?? "Store profile"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
                  {overview?.store?.description ??
                    "Store details will appear after the application is approved."}
                </p>
              </div>
            </div>
            <StatusBadge status={storeStatus} />
          </div>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <InfoCell label="Slug" value={overview?.store?.slug ?? "Not assigned"} />
            <InfoCell
              label="Phone"
              value={overview?.sellerProfile.phone || "Not added"}
            />
          </dl>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  Icon,
  label,
  tone,
  value,
}: {
  Icon: React.FC<{ className?: string }>;
  label: string;
  tone: "emerald" | "purple" | "amber";
  value: string | number;
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">
            {label}
          </p>
          <h3 className="mt-2 text-3xl font-extrabold text-stone-900">
            {value}
          </h3>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </section>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <dt className="text-xs font-extrabold uppercase tracking-widest text-stone-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-bold text-stone-800">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isApproved = status === "APPROVED";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-extrabold ${
        isApproved
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {status}
    </span>
  );
}
