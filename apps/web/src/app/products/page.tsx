import Link from "next/link";
import { ArrowRight, BadgeCheck, Package, Search, Shield, Star, Tag } from "@/components/imported/design-icons";
import { getCategories } from "@/lib/categories";
import { PublicProduct, getPublicProducts } from "@/lib/public-products";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price low to high" },
  { value: "price_desc", label: "Price high to low" },
  { value: "rating_desc", label: "Top rated" }
];

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const query = toProductQuery(params);
  const [productsResult, categoriesResult] = await Promise.allSettled([
    getPublicProducts(query),
    getCategories()
  ]);
  const products = productsResult.status === "fulfilled"
    ? productsResult.value
    : emptyProductsResponse(query.page ?? 1, query.limit ?? 12, query.sort ?? "newest");
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const loadError = productsResult.status === "rejected" ? productsResult.reason : null;

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <Header />

      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-14">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              Public marketplace
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-stone-950 sm:text-5xl">
              Browse products from verified Marketo sellers.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone-500">
              Every public product here is approved, attached to an active category, and sold by an approved store.
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-stone-900">Approved listings only</p>
                <p className="text-xs font-semibold leading-relaxed text-emerald-800">
                  Draft, pending, rejected, archived, inactive-category, and suspended-store products stay hidden.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <form className="grid gap-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1.3fr)_220px_180px_140px_140px_auto]" action="/products">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
            <input
              className="h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 pl-12 pr-4 text-sm font-semibold text-stone-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              defaultValue={getString(params.q)}
              name="q"
              placeholder="Search products, stores, categories"
            />
          </label>

          <select className={filterClassName} defaultValue={getString(params.categorySlug)} name="categorySlug">
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>{category.name}</option>
            ))}
          </select>

          <select className={filterClassName} defaultValue={query.sort ?? "newest"} name="sort">
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <input
            className={filterClassName}
            defaultValue={getString(params.minPrice)}
            inputMode="decimal"
            name="minPrice"
            placeholder="Min $"
          />
          <input
            className={filterClassName}
            defaultValue={getString(params.maxPrice)}
            inputMode="decimal"
            name="maxPrice"
            placeholder="Max $"
          />

          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4">
            <input className="h-4 w-4 accent-emerald-600" defaultChecked={query.inStock} id="inStock" name="inStock" type="checkbox" value="true" />
            <label className="text-sm font-bold text-stone-700" htmlFor="inStock">In stock</label>
          </div>

          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700 lg:col-start-6" type="submit">
            Search
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              {products.meta.total} approved listing{products.meta.total === 1 ? "" : "s"}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-stone-950">Product catalog</h2>
          </div>
          <Link className="text-sm font-extrabold text-stone-500 transition hover:text-stone-900" href="/products">
            Reset filters
          </Link>
        </div>

        {loadError ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
            Products could not load. Start the API server on port 5000 and refresh this page.
          </div>
        ) : null}

        {products.items.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
              <Package className="h-7 w-7 text-stone-400" />
            </div>
            <h3 className="mt-4 text-lg font-extrabold text-stone-950">No approved products found</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500">
              Try clearing filters, or approve a seller product from the admin workflow before testing public visibility.
            </p>
          </div>
        )}

        <Pagination params={params} page={products.meta.page} totalPages={products.meta.totalPages} />
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-2.5" href="/">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Package className="h-4 w-4" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-stone-950">Marketo</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-bold">
          <Link className="text-stone-500 transition hover:text-stone-950" href="/">Home</Link>
          <Link className="text-emerald-700" href="/products">Products</Link>
          <Link className="text-stone-500 transition hover:text-stone-950" href="/cart">Cart</Link>
          <Link className="rounded-xl bg-stone-950 px-4 py-2 text-white transition hover:bg-stone-700" href="/login">Sign in</Link>
        </nav>
      </div>
    </header>
  );
}

function ProductCard({ product }: { product: PublicProduct }) {
  return (
    <Link className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md" href={`/products/${product.slug}`}>
      <div className="relative aspect-[4/3] bg-stone-100">
        {product.image ? (
          <img alt={product.image.altText ?? product.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" src={product.image.url} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-10 w-10 text-stone-300" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-emerald-700 shadow-sm">
          {product.category.name}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400">
          <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
          {product.store.name}
        </div>
        <h3 className="mt-2 line-clamp-2 min-h-11 text-base font-extrabold leading-snug text-stone-950">
          {product.title}
        </h3>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-lg font-extrabold text-emerald-700">{formatMoney(product.priceCents, product.currency)}</span>
          <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
            <Star className="h-3.5 w-3.5" />
            {product.averageRating.toFixed(1)}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-bold text-stone-400">
          <span>{product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"}</span>
          <span>{product.counts.variants} variant{product.counts.variants === 1 ? "" : "s"}</span>
        </div>
      </div>
    </Link>
  );
}

function Pagination({ params, page, totalPages }: { params: Record<string, string | string[] | undefined>; page: number; totalPages: number }) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-8 flex items-center justify-between rounded-3xl border border-stone-200 bg-white p-3 shadow-sm">
      <Link className={`rounded-2xl px-4 py-2 text-sm font-extrabold ${page <= 1 ? "pointer-events-none text-stone-300" : "text-stone-700 hover:bg-stone-100"}`} href={withPage(params, page - 1)}>
        Previous
      </Link>
      <span className="text-sm font-bold text-stone-500">Page {page} of {totalPages}</span>
      <Link className={`rounded-2xl px-4 py-2 text-sm font-extrabold ${page >= totalPages ? "pointer-events-none text-stone-300" : "text-stone-700 hover:bg-stone-100"}`} href={withPage(params, page + 1)}>
        Next
      </Link>
    </div>
  );
}

const filterClassName = "h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold text-stone-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";

function toProductQuery(params: Record<string, string | string[] | undefined>) {
  const minPrice = dollarsToCents(getString(params.minPrice));
  const maxPrice = dollarsToCents(getString(params.maxPrice));

  return {
    q: getString(params.q) || undefined,
    categorySlug: getString(params.categorySlug) || undefined,
    minPriceCents: minPrice,
    maxPriceCents: maxPrice,
    inStock: getString(params.inStock) === "true",
    sort: getString(params.sort) || "newest",
    page: Math.max(1, Number(getString(params.page) || 1)),
    limit: 12
  };
}

function emptyProductsResponse(page: number, limit: number, sort: string) {
  return {
    items: [],
    meta: {
      page,
      limit,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      sort
    }
  };
}

function getString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function dollarsToCents(value: string) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? Math.round(number * 100) : undefined;
}

function withPage(params: Record<string, string | string[] | undefined>, page: number) {
  const next = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    const text = getString(value);

    if (text && key !== "page") {
      next.set(key, text);
    }
  }

  next.set("page", String(page));

  return `/products?${next.toString()}`;
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(cents / 100);
}