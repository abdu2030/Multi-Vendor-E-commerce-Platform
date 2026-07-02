"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  X,
  XCircle,
} from "@/components/imported/design-icons";
import {
  AdminSellerApplication,
  SellerDecision,
  decideSellerApplication,
  getPendingSellerApplications,
} from "@/lib/admin-seller-applications";

type DecisionState = {
  application: AdminSellerApplication;
  decision: SellerDecision;
};

const decisionLabels: Record<SellerDecision, string> = {
  approve: "Approve",
  reject: "Reject",
  suspend: "Suspend",
};

export function AdminSellerApprovalTable() {
  const { accessToken, user } = useAuth();
  const [applications, setApplications] = useState<AdminSellerApplication[]>([]);
  const [decisionState, setDecisionState] = useState<DecisionState | null>(null);
  const [previewApplication, setPreviewApplication] =
    useState<AdminSellerApplication | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!accessToken || !isAdmin) {
      setIsLoading(false);
      return;
    }

    getPendingSellerApplications(accessToken)
      .then(setApplications)
      .catch((caughtError) => {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Pending applications could not load.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [accessToken, isAdmin]);

  const selectedStoreName = useMemo(
    () => decisionState?.application.storeName ?? "this application",
    [decisionState],
  );

  function openDecision(
    application: AdminSellerApplication,
    decision: SellerDecision,
  ) {
    setDecisionState({ application, decision });
    setPreviewApplication(null);
    setReason("");
    setError("");
  }

  async function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!decisionState || !accessToken) {
      return;
    }

    if (decisionState.decision !== "approve" && reason.trim().length < 5) {
      setError("A reason of at least 5 characters is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await decideSellerApplication(
        decisionState.application.id,
        decisionState.decision,
        accessToken,
        reason.trim() || undefined,
      );
      setApplications((current) =>
        current.filter(
          (application) => application.id !== decisionState.application.id,
        ),
      );
      setDecisionState(null);
      setReason("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Decision could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
          Admin only
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-stone-900">
          Seller approvals are restricted
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          Use an admin account to review and decide seller applications.
        </p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 text-sm font-bold text-stone-500 shadow-sm">
        Loading pending seller applications...
      </div>
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              Pending sellers
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-stone-900">
              {applications.length} application
              {applications.length === 1 ? "" : "s"}
            </h2>
            <p className="mt-1 text-sm text-stone-400">
              Review submitted stores, approve qualified sellers, or send clear
              rejection notes.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-700">
            <Clock className="h-4 w-4" />
            Live API queue
          </div>
        </div>

        {error && !decisionState ? (
          <p className="m-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        {applications.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
              <CheckCircle className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="mt-4 text-lg font-extrabold text-stone-900">
              No pending applications
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500">
              New seller applications will appear here as soon as buyers submit
              them.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-left">
                  <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
                    Store
                  </th>
                  <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
                    Applicant
                  </th>
                  <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
                    Submitted
                  </th>
                  <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
                    Status
                  </th>
                  <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
                    Decision
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr
                    className="border-b border-stone-100 transition-colors hover:bg-stone-50/70"
                    key={application.id}
                  >
                    <td className="px-5 py-4 align-top">
                      <p className="font-extrabold text-stone-900">
                        {application.storeName}
                      </p>
                      <p className="mt-1 line-clamp-2 max-w-sm text-xs leading-relaxed text-stone-500">
                        {application.storeDescription}
                      </p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="font-bold text-stone-800">
                        {application.user.fullName}
                      </p>
                      <p className="mt-1 text-xs text-stone-400">
                        {application.user.email}
                      </p>
                    </td>
                    <td className="px-5 py-4 align-top text-sm font-semibold text-stone-500">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <StatusBadge status={application.status} />
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-xs font-extrabold text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
                          onClick={() => setPreviewApplication(application)}
                          type="button"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        <button
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-extrabold text-white transition-colors hover:bg-emerald-700"
                          onClick={() => openDecision(application, "approve")}
                          type="button"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-extrabold text-red-700 transition-colors hover:bg-red-100"
                          onClick={() => openDecision(application, "reject")}
                          type="button"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                        <button
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-extrabold text-amber-700 transition-colors hover:bg-amber-100"
                          onClick={() => openDecision(application, "suspend")}
                          type="button"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Suspend
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {previewApplication ? (
        <ApplicationPreview
          application={previewApplication}
          onClose={() => setPreviewApplication(null)}
        />
      ) : null}

      {decisionState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 px-4 py-8">
          <section
            aria-labelledby="decision-title"
            className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl"
            role="dialog"
          >
            <form onSubmit={submitDecision}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
                    {decisionLabels[decisionState.decision]} seller
                  </p>
                  <h2
                    className="mt-1 text-2xl font-extrabold text-stone-900"
                    id="decision-title"
                  >
                    {selectedStoreName}
                  </h2>
                </div>
                <button
                  aria-label="Close modal"
                  className="rounded-xl p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                  onClick={() => setDecisionState(null)}
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-stone-500">
                {decisionCopy(decisionState.decision)}
              </p>

              {decisionState.decision !== "approve" ? (
                <label className="mt-5 grid gap-2">
                  <span className="text-sm font-bold text-stone-700">
                    Reason
                  </span>
                  <textarea
                    className="min-h-32 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Explain the decision for the applicant and audit trail."
                    rows={4}
                    value={reason}
                  />
                </label>
              ) : null}

              {error ? (
                <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  className="h-11 rounded-xl border border-stone-200 bg-white px-4 text-sm font-extrabold text-stone-700 transition-colors hover:border-stone-300"
                  onClick={() => setDecisionState(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="h-11 rounded-xl bg-emerald-600 px-4 text-sm font-extrabold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting
                    ? "Saving..."
                    : decisionLabels[decisionState.decision]}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function ApplicationPreview({
  application,
  onClose,
}: {
  application: AdminSellerApplication;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 px-4 py-8">
      <section className="w-full max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              Application detail
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-stone-900">
              {application.storeName}
            </h2>
          </div>
          <button
            aria-label="Close application preview"
            className="rounded-xl p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-stone-500">
          {application.storeDescription}
        </p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            ["Applicant", application.user.fullName],
            ["Email", application.user.email],
            ["Phone", application.phone],
            ["Address", application.address],
            ["Document", application.businessDocument || "Not provided"],
            ["Submitted", new Date(application.createdAt).toLocaleString()],
          ].map(([label, value]) => (
            <div
              className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
              key={label}
            >
              <dt className="text-xs font-extrabold uppercase tracking-widest text-stone-400">
                {label}
              </dt>
              <dd className="mt-1 overflow-wrap-anywhere text-sm font-bold text-stone-800">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: AdminSellerApplication["status"] }) {
  const tone = {
    APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
    SUSPENDED: "border-red-200 bg-red-50 text-red-700",
  }[status];

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${tone}`}
    >
      {status}
    </span>
  );
}

function decisionCopy(decision: SellerDecision) {
  if (decision === "approve") {
    return "Approval creates the seller profile and store, then grants seller access.";
  }

  if (decision === "reject") {
    return "Rejection sends the application back with a reason and returns the account to buyer status.";
  }

  return "Suspension disables seller access and marks related seller records as suspended.";
}
