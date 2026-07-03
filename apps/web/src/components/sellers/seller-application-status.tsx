"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  Clock,
  XCircle,
} from "@/components/imported/design-icons";
import {
  SellerApplication,
  SellerApplicationStatus as Status,
  getMySellerApplication,
} from "@/lib/seller-applications";

const statusLabels: Record<Status, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

export function SellerApplicationStatus() {
  const { accessToken, refreshCurrentSession, user } = useAuth();
  const [application, setApplication] = useState<SellerApplication | null>(null);
  const [didRefreshSellerSession, setDidRefreshSellerSession] = useState(false);
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
          caughtError instanceof Error
            ? caughtError.message
            : "Seller application status could not load.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  useEffect(() => {
    if (
      application?.status !== "APPROVED" ||
      user?.role === "SELLER" ||
      didRefreshSellerSession
    ) {
      return;
    }

    setDidRefreshSellerSession(true);
    refreshCurrentSession().catch(() => undefined);
  }, [
    application?.status,
    didRefreshSellerSession,
    refreshCurrentSession,
    user?.role,
  ]);

  if (isLoading) {
    return (
      <p className="rounded-2xl border border-stone-200 bg-white p-5 text-sm font-bold text-stone-500 shadow-sm">
        Loading seller application status...
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

  if (!application) {
    return (
      <section className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
          <BadgeCheck className="h-7 w-7 text-emerald-600" />
        </div>
        <p className="mt-5 text-xs font-extrabold uppercase tracking-widest text-emerald-600">
          No application
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-stone-900">
          Apply to become a seller
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-500">
          Submit your store details so the admin team can review your seller
          request.
        </p>
        <Link
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition-colors hover:bg-emerald-700"
          href="/dashboard/seller/apply"
        >
          Start application
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  const StatusIcon = statusIcon(application.status);

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${statusIconTone(application.status)}`}>
            <StatusIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              Seller application
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-stone-900">
              {application.storeName}
            </h2>
          </div>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <p className="mt-5 text-sm leading-relaxed text-stone-500">
        {statusMessage(application)}
      </p>

      {application.rejectionReason ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Reason: {application.rejectionReason}
        </p>
      ) : null}

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Submitted", new Date(application.createdAt).toLocaleString()],
          ["Phone", application.phone],
          ["Address", application.address],
        ].map(([label, value]) => (
          <div
            className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
            key={label}
          >
            <dt className="text-xs font-extrabold uppercase tracking-widest text-stone-400">
              {label}
            </dt>
            <dd className="mt-1 text-sm font-bold text-stone-800">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const tone = {
    APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
    SUSPENDED: "border-red-200 bg-red-50 text-red-700",
  }[status];

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-extrabold ${tone}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function statusIcon(status: Status) {
  if (status === "APPROVED") {
    return CheckCircle;
  }

  if (status === "PENDING") {
    return Clock;
  }

  if (status === "REJECTED") {
    return XCircle;
  }

  return AlertTriangle;
}

function statusIconTone(status: Status) {
  if (status === "APPROVED") {
    return "bg-emerald-50 text-emerald-600";
  }

  if (status === "PENDING") {
    return "bg-amber-50 text-amber-600";
  }

  return "bg-red-50 text-red-600";
}

function statusMessage(application: SellerApplication) {
  if (application.status === "PENDING") {
    return "Your application is pending admin review. You can keep using your buyer account while we review your store details.";
  }

  if (application.status === "APPROVED") {
    return "Your seller application has been approved. Seller tools are available from the seller dashboard.";
  }

  if (application.status === "REJECTED") {
    return "Your application was rejected. Review the reason below before submitting a future application.";
  }

  return "Your seller access is currently suspended.";
}
