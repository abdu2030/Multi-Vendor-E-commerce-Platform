"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  ArrowRight,
  BadgeCheck,
  Package,
  Save,
  ShoppingBag,
  X,
} from "@/components/imported/design-icons";
import { Category, getCategories } from "@/lib/categories";
import {
  SellerProduct,
  archiveSellerProduct,
  createSellerProduct,
  getSellerProduct,
  getSellerProducts,
  updateSellerProduct,
  uploadSellerProductImage,
} from "@/lib/seller-products";

type ProductFormState = {
  categoryId: string;
  title: string;
  description: string;
  price: string;
  stockQuantity: string;
  tags: string;
  status: "DRAFT" | "PENDING_REVIEW";
};

const emptyForm: ProductFormState = {
  categoryId: "",
  title: "",
  description: "",
  price: "",
  stockQuantity: "0",
  tags: "",
  status: "DRAFT",
};

const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const maxImageFileBytes = 5 * 1024 * 1024;

export function SellerProductManager() {
  const { accessToken } = useAuth();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SellerProduct | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!accessToken) {
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const [nextProducts, nextCategories] = await Promise.all([
          getSellerProducts(accessToken),
          getCategories(),
        ]);

        if (!mounted) {
          return;
        }

        setProducts(nextProducts);
        setCategories(nextCategories);
        setForm((current) => ({
          ...current,
          categoryId: current.categoryId || nextCategories[0]?.id || "",
        }));
      } catch (caughtError) {
        if (mounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Products could not load.",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [accessToken]);

  const activeProducts = useMemo(
    () => products.filter((product) => product.status !== "ARCHIVED"),
    [products],
  );

  async function refreshProducts() {
    if (!accessToken) {
      return;
    }

    setProducts(await getSellerProducts(accessToken));
  }

  function updateField(field: keyof ProductFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function beginEdit(productId: string) {
    if (!accessToken) {
      return;
    }

    setError("");
    setSuccess("");
    const product = await getSellerProduct(productId, accessToken);

    setSelectedProduct(product);
    setImageFiles([]);
    setForm({
      categoryId: product.categoryId,
      title: product.title,
      description: product.description ?? "",
      price: centsToPrice(product.priceCents),
      stockQuantity: String(product.stockQuantity),
      tags: product.tags?.join(", ") ?? "",
      status: product.status === "PENDING_REVIEW" ? "PENDING_REVIEW" : "DRAFT",
    });
  }

  function resetForm() {
    setSelectedProduct(null);
    setImageFiles([]);
    setError("");
    setSuccess("");
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id || "",
    });
  }
  function handleImageSelection(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []);
    const invalidFile = selectedFiles.find(
      (file) => !allowedImageTypes.has(file.type) || file.size > maxImageFileBytes,
    );

    if (invalidFile) {
      setImageFiles([]);
      setError("Product images must be PNG, JPG, WEBP, or GIF files up to 5 MB.");
      return;
    }

    setError("");
    setImageFiles(selectedFiles);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateProductForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!accessToken) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        categoryId: form.categoryId,
        title: form.title.trim(),
        description: form.description.trim(),
        priceCents: priceToCents(form.price),
        stockQuantity: Number(form.stockQuantity),
        status: form.status,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      const savedProduct = selectedProduct
        ? await updateSellerProduct(selectedProduct.id, payload, accessToken)
        : await createSellerProduct(payload, accessToken);

      for (let index = 0; index < imageFiles.length; index += 1) {
        const file = imageFiles[index];

        await uploadSellerProductImage(
          savedProduct.id,
          {
            file: await fileToDataUri(file),
            altText: `${savedProduct.title} image`,
            sortOrder: (savedProduct.images?.length ?? 0) + index,
          },
          accessToken,
        );
      }

      await refreshProducts();
      setSuccess(selectedProduct ? "Product updated." : "Product created.");
      resetForm();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Product could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive(productId: string) {
    if (!accessToken) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await archiveSellerProduct(productId, accessToken);
      await refreshProducts();
      if (selectedProduct?.id === productId) {
        resetForm();
      }
      setSuccess("Product archived.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Product could not be archived.",
      );
    }
  }

  if (isLoading) {
    return (
      <p className="rounded-2xl border border-stone-200 bg-white p-5 text-sm font-bold text-stone-500 shadow-sm">
        Loading products...
      </p>
    );
  }

  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              Product catalog
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-stone-900">
              {activeProducts.length} active product{activeProducts.length === 1 ? "" : "s"}
            </h2>
          </div>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-extrabold text-white transition-colors hover:bg-emerald-700"
            onClick={resetForm}
            type="button"
          >
            New product
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {error ? (
          <p className="m-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="m-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <BadgeCheck className="h-4 w-4" />
            {success}
          </p>
        ) : null}

        {products.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
              <ShoppingBag className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="mt-4 text-lg font-extrabold text-stone-900">
              No products yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500">
              Create your first draft product, upload images, and submit it for review when ready.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {products.map((product) => (
              <article
                className="grid gap-4 p-5 transition-colors hover:bg-stone-50/70 md:grid-cols-[72px_minmax(0,1fr)_auto]"
                key={product.id}
              >
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-stone-100">
                  {product.images?.[0]?.url ? (
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
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-stone-900">{product.title}</h3>
                    <StatusBadge status={product.status} />
                  </div>
                  <p className="mt-1 text-xs font-bold text-stone-400">
                    {product.category.name} / {formatMoney(product.priceCents, product.currency)} / {product.stockQuantity} in stock
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-500">
                    {product.description || "No description loaded in list view."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <button
                    className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs font-extrabold text-stone-700 transition-colors hover:border-stone-300"
                    onClick={() => void beginEdit(product.id)}
                    type="button"
                  >
                    Edit
                  </button>
                  {product.status !== "ARCHIVED" ? (
                    <button
                      className="h-10 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-extrabold text-red-700 transition-colors hover:bg-red-100"
                      onClick={() => void handleArchive(product.id)}
                      type="button"
                    >
                      Archive
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              {selectedProduct ? "Edit product" : "Create product"}
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-stone-900">
              {selectedProduct ? selectedProduct.title : "New catalog item"}
            </h2>
          </div>
          {selectedProduct ? (
            <button
              aria-label="Cancel edit"
              className="rounded-xl p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
              onClick={resetForm}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Field label="Category">
            <select
              className={inputClass}
              onChange={(event) => updateField("categoryId", event.target.value)}
              value={form.categoryId}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Product title">
            <input
              className={inputClass}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Handmade ceramic mug"
              value={form.title}
            />
          </Field>

          <Field label="Description">
            <textarea
              className={`${inputClass} min-h-32 py-3 leading-relaxed`}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Describe materials, size, use case, care instructions, and shipping notes."
              value={form.description}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price">
              <input
                className={inputClass}
                inputMode="decimal"
                onChange={(event) => updateField("price", event.target.value)}
                placeholder="19.99"
                value={form.price}
              />
            </Field>
            <Field label="Stock">
              <input
                className={inputClass}
                inputMode="numeric"
                onChange={(event) => updateField("stockQuantity", event.target.value)}
                placeholder="12"
                value={form.stockQuantity}
              />
            </Field>
          </div>

          <Field label="Tags">
            <input
              className={inputClass}
              onChange={(event) => updateField("tags", event.target.value)}
              placeholder="handmade, ceramic, gift"
              value={form.tags}
            />
          </Field>

          <Field label="Save mode">
            <select
              className={inputClass}
              onChange={(event) =>
                updateField("status", event.target.value as ProductFormState["status"])
              }
              value={form.status}
            >
              <option value="DRAFT">Save as draft</option>
              <option value="PENDING_REVIEW">Submit for review</option>
            </select>
          </Field>

          <Field label="Product images">
            <input
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="block w-full rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-stone-500 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-extrabold file:text-white"
              multiple
              onChange={(event) => handleImageSelection(event.target.files)}
              type="file"
            />
          </Field>

          {imageFiles.length ? (
            <p className="text-xs font-bold text-stone-400">
              {imageFiles.length} image{imageFiles.length === 1 ? "" : "s"} selected for upload after save.
            </p>
          ) : null}

          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : selectedProduct ? "Save changes" : "Create product"}
          </button>
        </form>
      </section>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-stone-700">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: SellerProduct["status"] }) {
  const tone = {
    APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    ARCHIVED: "border-stone-200 bg-stone-100 text-stone-500",
    DRAFT: "border-stone-200 bg-stone-50 text-stone-600",
    PENDING_REVIEW: "border-amber-200 bg-amber-50 text-amber-700",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
  }[status];

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${tone}`}>
      {status.replace("_", " ")}
    </span>
  );
}

const inputClass =
  "min-h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";

function validateProductForm(form: ProductFormState) {
  if (!form.categoryId) {
    return "Choose a category.";
  }

  if (form.title.trim().length < 3) {
    return "Product title must be at least 3 characters.";
  }

  if (form.description.trim().length < 20) {
    return "Description must be at least 20 characters.";
  }

  if (!Number.isFinite(priceToCents(form.price)) || priceToCents(form.price) < 1) {
    return "Price must be greater than zero.";
  }

  if (!/^\d+$/.test(form.stockQuantity) || Number(form.stockQuantity) < 0) {
    return "Stock must be zero or a positive whole number.";
  }

  return "";
}

function priceToCents(price: string) {
  return Math.round(Number(price) * 100);
}

function centsToPrice(cents: number) {
  return (cents / 100).toFixed(2);
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function fileToDataUri(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Image could not be read."));
    reader.readAsDataURL(file);
  });
}


