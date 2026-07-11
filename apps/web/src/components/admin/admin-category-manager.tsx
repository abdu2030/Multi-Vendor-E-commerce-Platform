"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Package,
  RefreshCw,
  Save,
  Search,
  Tag,
  X,
  XCircle
} from "@/components/imported/design-icons";
import {
  AdminCategory,
  CategoryPayload,
  createAdminCategory,
  getAdminCategories,
  setAdminCategoryActive,
  updateAdminCategory
} from "@/lib/admin-categories";

type CategoryFormState = {
  id?: string;
  name: string;
  slug: string;
  parentId: string;
  description: string;
  isActive: boolean;
};

const blankForm: CategoryFormState = {
  name: "",
  slug: "",
  parentId: "",
  description: "",
  isActive: true
};

const inputClass = "rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";

export function AdminCategoryManager() {
  const { accessToken, user } = useAuth();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState<CategoryFormState>(blankForm);
  const [includeInactive, setIncludeInactive] = useState(true);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isAdmin = user?.role === "ADMIN";

  const loadCategories = useCallback(async () => {
    if (!accessToken || !isAdmin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      setCategories(await getAdminCategories(accessToken, includeInactive));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Categories could not load.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, includeInactive, isAdmin]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter((category) =>
      [category.name, category.slug, category.description ?? "", category.parent?.name ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [categories, search]);

  const rootCount = categories.filter((category) => !category.parentId).length;
  const activeCount = categories.filter((category) => category.isActive).length;
  const productLinks = categories.reduce((total, category) => total + category._count.products, 0);
  const editMode = Boolean(form.id);

  function startEdit(category: AdminCategory) {
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId ?? "",
      description: category.description ?? "",
      isActive: category.isActive
    });
    setError("");
    setNotice("");
  }

  function resetForm() {
    setForm(blankForm);
    setError("");
  }

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    if (form.name.trim().length < 2) {
      setError("Category name must be at least 2 characters.");
      return;
    }

    const payload: CategoryPayload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      parentId: form.parentId || null,
      description: form.description.trim() || null,
      isActive: form.isActive
    };

    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      if (form.id) {
        await updateAdminCategory(accessToken, form.id, payload);
        setNotice("Category updated.");
      } else {
        await createAdminCategory(accessToken, payload);
        setNotice("Category created.");
      }

      setForm(blankForm);
      await loadCategories();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Category could not be saved.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(category: AdminCategory) {
    if (!accessToken) {
      return;
    }

    setBusyId(category.id);
    setError("");
    setNotice("");

    try {
      await setAdminCategoryActive(accessToken, category.id, !category.isActive);
      setNotice(category.isActive ? "Category deactivated." : "Category activated.");
      await loadCategories();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Category status could not be changed.");
    } finally {
      setBusyId(null);
    }
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">Admin only</p>
        <h2 className="mt-2 text-2xl font-extrabold text-stone-900">Category management is restricted</h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">Use an admin account to manage marketplace categories.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">Category management</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-950">Marketplace taxonomy</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-500">
              Create, edit, nest, activate, and deactivate product categories used across seller listings and buyer discovery.
            </p>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 text-sm font-extrabold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
            onClick={() => void loadCategories()}
            type="button"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard Icon={Tag} label="Categories" value={categories.length} helper="All loaded" />
        <MetricCard Icon={CheckCircle} label="Active" value={activeCount} helper="Visible to sellers" />
        <MetricCard Icon={ChevronDown} label="Root groups" value={rootCount} helper="Top level" />
        <MetricCard Icon={Package} label="Product links" value={productLinks} helper="Assigned listings" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" onSubmit={submitCategory}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">{editMode ? "Edit category" : "New category"}</p>
              <h3 className="mt-1 text-xl font-extrabold text-stone-950">{editMode ? form.name : "Create category"}</h3>
            </div>
            {editMode ? (
              <button className="rounded-xl p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700" onClick={resetForm} type="button" aria-label="Cancel edit">
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4">
            <Field label="Name">
              <input
                className={inputClass}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Home decor"
                value={form.name}
              />
            </Field>
            <Field label="Slug">
              <input
                className={inputClass}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                placeholder="Generated if empty"
                value={form.slug}
              />
            </Field>
            <Field label="Parent category">
              <select
                className={inputClass}
                onChange={(event) => setForm((current) => ({ ...current, parentId: event.target.value }))}
                value={form.parentId}
              >
                <option value="">No parent</option>
                {categories
                  .filter((category) => category.id !== form.id)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.parent ? `${category.parent.name} / ` : ""}{category.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Description">
              <textarea
                className={`${inputClass} min-h-28 resize-y`}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Short internal or storefront description"
                rows={4}
                value={form.description}
              />
            </Field>
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <span>
                <span className="block text-sm font-extrabold text-stone-800">Active</span>
                <span className="mt-0.5 block text-xs font-semibold text-stone-500">Active categories can be used by seller products.</span>
              </span>
              <input
                checked={form.isActive}
                className="h-5 w-5 accent-emerald-600"
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                type="checkbox"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {notice}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : editMode ? "Save changes" : "Create category"}
            </button>
            {editMode ? (
              <button className="h-11 rounded-xl border border-stone-200 px-4 text-sm font-extrabold text-stone-700 transition hover:border-stone-300" onClick={resetForm} type="button">
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-stone-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">Category list</p>
              <h3 className="mt-1 text-xl font-extrabold text-stone-950">{filteredCategories.length} category{filteredCategories.length === 1 ? "" : "ies"}</h3>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  className="h-10 rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm font-semibold text-stone-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search categories"
                  value={search}
                />
              </label>
              <label className="flex h-10 items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs font-extrabold text-stone-600">
                <input
                  checked={includeInactive}
                  className="accent-emerald-600"
                  onChange={(event) => setIncludeInactive(event.target.checked)}
                  type="checkbox"
                />
                Include inactive
              </label>
            </div>
          </div>

          {isLoading ? (
            <div className="p-5 text-sm font-bold text-stone-500">Loading categories...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                <Tag className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-stone-900">No categories found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500">Create a category or clear the current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50 text-left">
                    <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">Category</th>
                    <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">Parent</th>
                    <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">Usage</th>
                    <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">Status</th>
                    <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => (
                    <tr className="border-b border-stone-100 transition hover:bg-stone-50/70" key={category.id}>
                      <td className="px-5 py-4 align-top">
                        <p className="font-extrabold text-stone-900">{category.name}</p>
                        <p className="mt-1 text-xs font-semibold text-stone-400">/{category.slug}</p>
                        {category.description ? (
                          <p className="mt-2 line-clamp-2 max-w-md text-xs leading-relaxed text-stone-500">{category.description}</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 align-top text-sm font-bold text-stone-600">{category.parent?.name ?? "Root"}</td>
                      <td className="px-5 py-4 align-top text-sm font-semibold text-stone-500">
                        <p>{category._count.products} product{category._count.products === 1 ? "" : "s"}</p>
                        <p className="mt-1 text-xs text-stone-400">{category._count.children} child categor{category._count.children === 1 ? "y" : "ies"}</p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <StatusBadge active={category.isActive} />
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-extrabold text-stone-600 transition hover:border-stone-300 hover:text-stone-950"
                            onClick={() => startEdit(category)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${category.isActive ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                            disabled={busyId === category.id}
                            onClick={() => void toggleActive(category)}
                            type="button"
                          >
                            {category.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                            {busyId === category.id ? "Updating..." : category.isActive ? "Deactivate" : "Activate"}
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
      </section>
    </div>
  );
}

function MetricCard({ Icon, label, value, helper }: { Icon: React.FC<{ className?: string }>; label: string; value: number; helper: string }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-stone-950">{value}</p>
          <p className="mt-1 text-xs font-bold text-stone-500">{helper}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-stone-700">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-stone-100 text-stone-500"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}
