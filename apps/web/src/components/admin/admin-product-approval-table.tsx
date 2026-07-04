"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  BadgeCheck,
  CheckCircle,
  Clock,
  Eye,
  Package,
  X,
  XCircle,
} from "@/components/imported/design-icons";
import {
  AdminProduct,
  ProductDecision,
  decideAdminProduct,
  getAdminProduct,
  getPendingAdminProducts,
} from "@/lib/admin-products";

type DecisionState = {
  product: AdminProduct;
  decision: ProductDecision;
};

const decisionLabels: Record<ProductDecision, string> = {
  approve: "Approve",
  reject: "Reject",
};

export function AdminProductApprovalTable() {
  const { accessToken, user } = useAuth();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [previewProduct, setPreviewProduct] = useState<AdminProduct | null>(null);
  const [decisionState, setDecisionState] = useState<DecisionState | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const selectedProductTitle = useMemo(
    () => decisionState?.product.title ?? "this product",
    [decisionState],
  );

  useEffect(() => {
    if (!accessToken || !isAdmin) {
      setIsLoading(false);
      return;
    }

    getPendingAdminProducts(accessToken)
      .then(setProducts)
      .catch((caughtError) => {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Pending products could not load.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [accessToken, isAdmin]);

  async function openPreview(product: AdminProduct) {
    if (!accessToken) {
      return;
    }

    setError("");

    try {
      setPreviewProduct(await getAdminProduct(product.id, accessToken));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Product detail could not load.",
      );
    }
  }

  function openDecision(product: AdminProduct, decision: ProductDecision) {
    setPreviewProduct(null);
    setDecisionState({ product, decision });
    setReason("");
    setError("");
  }

  async function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!decisionState || !accessToken) {
      return;
    }

    if (decisionState.decision === "reject" && reason.trim().length < 5) {
      setError("A rejection reason of at least 5 characters is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await decideAdminProduct(
        decisionState.product.id,
        decisionState.decision,
        accessToken,
        reason.trim() || undefined,
      );
      setProducts((current) =>
        current.filter((product) => product.id !== decisionState.product.id),
      );
      setDecisionState(null);
      setReason("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Product decision could not be saved.",
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
          Product approvals are restricted
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          Use an admin account to review pending seller products.
        </p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 text-sm font-bold text-stone-500 shadow-sm">
        Loading pending products...
      </div>
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              Pending products
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-stone-900">
              {products.length} product{products.length === 1 ? "" : "s"}
            </h2>
            <p className="mt-1 text-sm text-stone-400">
              Review seller-submitted products before they become visible to buyers.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-700">
            <Clock className="h-4 w-4" />
            Public visibility queue
          </div>
        </div>

        {error && !decisionState ? (
          <p className="m-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        {products.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
              <CheckCircle className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="mt-4 text-lg font-extrabold text-stone-900">
              No pending products
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500">
              Products submitted for review will appear here before they go public.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-left">
                  <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
                    Product
                  </th>
                  <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
                    Store
                  </th>
                  <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
                    Price / Stock
                  </th>
                  <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
                    Submitted
                  </th>
                  <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
                    Decision
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr className="border-b border-stone-100 transition-colors hover:bg-stone-50/70" key={product.id}>
                    <td className="px-5 py-4 align-top">
                      <div className="flex gap-3">
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-stone-100">
                          {product.images[0]?.url ? (
                            <img
                              alt={product.images[0].altText ?? product.title}
                              className="h-full w-full object-cover"
                              src={product.images[0].url}
                            />
                          ) : (
                            <Package className="h-6 w-6 text-stone-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-stone-900">{product.title}</p>
                          <p className="mt-1 line-clamp-2 max-w-sm text-xs leading-relaxed text-stone-500">
                            {product.description}
                          </p>
                          <p className="mt-2 text-[11px] font-extrabold uppercase tracking-wide text-emerald-600">
                            {product.category.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="font-bold text-stone-800">{product.store.name}</p>
                      <p className="mt-1 text-xs text-stone-400">
                        {product.store.sellerProfile.user.fullName}
                      </p>
                      <p className="mt-1 text-xs text-stone-400">
                        {product.store.sellerProfile.user.email}
                      </p>
                    </td>
                    <td className="px-5 py-4 align-top text-sm font-semibold text-stone-500">
                      <p className="font-extrabold text-stone-900">
                        {formatMoney(product.priceCents, product.currency)}
                      </p>
                      <p className="mt-1 text-xs text-stone-400">
                        {product.stockQuantity} in stock
                      </p>
                    </td>
                    <td className="px-5 py-4 align-top text-sm font-semibold text-stone-500">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-xs font-extrabold text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
                          onClick={() => void openPreview(product)}
                          type="button"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        <button
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-extrabold text-white transition-colors hover:bg-emerald-700"
                          onClick={() => openDecision(product, "approve")}
                          type="button"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-extrabold text-red-700 transition-colors hover:bg-red-100"
                          onClick={() => openDecision(product, "reject")}
                          type="button"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
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

      {previewProduct ? (
        <ProductPreview product={previewProduct} onClose={() => setPreviewProduct(null)} />
      ) : null}

      {decisionState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 px-4 py-8">
          <section className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl" role="dialog">
            <form onSubmit={submitDecision}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
                    {decisionLabels[decisionState.decision]} product
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-stone-900">
                    {selectedProductTitle}
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
                {decisionState.decision === "approve"
                  ? "Approval makes this product visible on the public product grid and detail page."
                  : "Rejection keeps this product hidden and records the reason in the audit trail."}
              </p>

              {decisionState.decision === "reject" ? (
                <label className="mt-5 grid gap-2">
                  <span className="text-sm font-bold text-stone-700">Reason</span>
                  <textarea
                    className="min-h-32 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Explain why this product cannot be published yet."
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
                  {isSubmitting ? "Saving..." : decisionLabels[decisionState.decision]}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function ProductPreview({ product, onClose }: { product: AdminProduct; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 px-4 py-8">
      <section className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              Product review
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-stone-900">{product.title}</h2>
          </div>
          <button
            aria-label="Close product preview"
            className="rounded-xl p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-3xl bg-stone-100">
            {product.images[0]?.url ? (
              <img
                alt={product.images[0].altText ?? product.title}
                className="aspect-square h-full w-full object-cover"
                src={product.images[0].url}
              />
            ) : (
              <div className="flex aspect-square items-center justify-center">
                <Package className="h-12 w-12 text-stone-300" />
              </div>
            )}
          </div>
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={product.status} />
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                {product.category.name}
              </span>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-extrabold text-stone-500">
                {formatMoney(product.priceCents, product.currency)}
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-stone-500">{product.description}</p>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Store", product.store.name],
                ["Seller", product.store.sellerProfile.user.fullName],
                ["Email", product.store.sellerProfile.user.email],
                ["Stock", `${product.stockQuantity}`],
                ["Images", `${product.images.length}`],
                ["Variants", `${product.variants?.length ?? 0}`],
              ].map(([label, value]) => (
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4" key={label}>
                  <dt className="text-xs font-extrabold uppercase tracking-widest text-stone-400">{label}</dt>
                  <dd className="mt-1 text-sm font-bold text-stone-800">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: AdminProduct["status"] }) {
  const tone = {
    APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    ARCHIVED: "border-stone-200 bg-stone-100 text-stone-500",
    DRAFT: "border-stone-200 bg-stone-50 text-stone-600",
    PENDING_REVIEW: "border-amber-200 bg-amber-50 text-amber-700",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
  }[status];

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${tone}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}