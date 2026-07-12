import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header";
import {
  ArrowRight,
  BadgeCheck,
  Package,
  Search,
  Shield,
  ShoppingBag,
  Star,
  Tag,
  Truck,
} from "@/components/imported/design-icons";
import { getCategories } from "@/lib/categories";
import { PublicProduct, getPublicProducts } from "@/lib/public-products";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type ProductResult = Awaited<ReturnType<typeof getPublicProducts>>;

export default async function HomePage() {
  noStore();

  const [featuredResult, newestResult, categoriesResult] = await Promise.allSettled([
    getPublicProducts({ sort: "rating_desc", limit: 8 }),
    getPublicProducts({ sort: "newest", limit: 4 }),
    getCategories(),
  ]);
  const featured = featuredResult.status === "fulfilled" ? featuredResult.value : emptyProductsResponse("rating_desc", 8);
  const newest = newestResult.status === "fulfilled" ? newestResult.value : emptyProductsResponse("newest", 4);
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const uniqueStores = getUniqueStores([...featured.items, ...newest.items]);
  const hasLoadError = featuredResult.status === "rejected" || newestResult.status === "rejected" || categoriesResult.status === "rejected";

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <MarketplaceHeader active="home" />

      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:py-20">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">Live marketplace</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-tight text-stone-950 sm:text-6xl">
              Shop only real products from approved sellers.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-500 sm:text-lg">
              This page is powered by the production catalog API. If a product, category, or seller appears here, it came from the database.
            </p>

            <form action="/products" className="mt-8 flex max-w-2xl flex-col gap-3 rounded-3xl border border-stone-200 bg-stone-50 p-3 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                <input
                  className="h-14 w-full rounded-2xl border border-stone-200 bg-white pl-12 pr-4 text-sm font-bold text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  name="q"
                  placeholder="Search live products"
                />
              </label>
              <button className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-sm font-extrabold text-white transition hover:bg-emerald-700" type="submit">
                Search
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <LiveMetric Icon={ShoppingBag} label="Approved products" value={featured.meta.total} />
              <LiveMetric Icon={Tag} label="Live categories" value={categories.length} />
              <LiveMetric Icon={BadgeCheck} label="Stores represented" value={uniqueStores.length} />
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-950 p-4 text-white shadow-sm">
            <img
              alt="Decorative marketplace packaging, seller studio, and fulfillment scenes without people"
              className="aspect-[4/3] w-full rounded-[1.5rem] object-cover"
              src="/images/landing/marketplace-collage.png"
            />
            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-extrabold">Database-backed storefront</p>
                  <p className="text-xs font-semibold text-stone-300">Decorative photo, real product data below.</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {featured.items.slice(0, 3).map((product) => (
                  <Link key={product.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 text-stone-950 transition hover:bg-emerald-50" href={`/products/${product.slug}`}>
                    <ProductThumb product={product} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">{product.title}</p>
                      <p className="truncate text-xs font-bold text-stone-500">{product.store.name}</p>
                    </div>
                    <p className="text-sm font-black text-emerald-700">{formatMoney(product.priceCents, product.currency)}</p>
                  </Link>
                ))}

                {!featured.items.length ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm font-semibold leading-relaxed text-stone-300">
                    No approved products are available yet. Approve seller products from the admin workflow and they will appear here automatically.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {hasLoadError ? (
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-800">
            Some live marketplace data could not be loaded. The page is intentionally not showing fallback products.
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Live catalog"
          title="Featured approved products"
          body="These products come from the public product API and are filtered to approved, buyer-visible listings."
          actionHref="/products?sort=rating_desc"
          actionLabel="Browse all products"
        />

        {featured.items.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.items.map((product) => (
              <LiveProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState title="No featured products yet" body="Approved products will appear here as soon as sellers publish real listings." />
        )}
      </section>

      <section className="border-y border-stone-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Categories"
            title="Shop by real categories"
            body="This category list is loaded from the API. Empty categories are not replaced by mock data."
            actionHref="/products"
            actionLabel="Open catalog"
          />

          {categories.length ? (
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categories.slice(0, 8).map((category) => (
                <Link key={category.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50" href={`/products?categorySlug=${category.slug}`}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                    <Tag className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-extrabold text-stone-950">{category.name}</h3>
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-relaxed text-stone-500">
                    {category.description ?? "Browse approved products in this live category."}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No categories loaded" body="Seed or create categories from the admin dashboard to populate this section." />
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
        <div>
          <SectionHeading
            eyebrow="New in"
            title="Latest approved products"
            body="New arrivals are pulled from the same product API used by the catalog page."
            actionHref="/products?sort=newest"
            actionLabel="See newest"
          />
          {newest.items.length ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {newest.items.map((product) => (
                <LiveProductCard key={product.id} product={product} compact />
              ))}
            </div>
          ) : (
            <EmptyState title="No new arrivals yet" body="Approved products will appear here after sellers publish listings." />
          )}
        </div>

        <aside className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <BadgeCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">Live sellers</p>
              <h2 className="text-xl font-extrabold text-stone-950">Stores with visible products</h2>
            </div>
          </div>

          {uniqueStores.length ? (
            <div className="mt-6 space-y-3">
              {uniqueStores.slice(0, 6).map((store) => (
                <Link key={store.slug} className="flex items-center justify-between gap-3 rounded-2xl border border-stone-100 bg-stone-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50" href={`/products?storeSlug=${store.slug}`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-stone-950">{store.name}</p>
                    <p className="text-xs font-semibold text-stone-500">{store.productCount} visible product{store.productCount === 1 ? "" : "s"}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-stone-400" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm font-semibold leading-relaxed text-stone-500">
              Seller spotlights will appear after approved products exist in the catalog.
            </div>
          )}
        </aside>
      </section>

      <section className="bg-stone-950 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <TrustCard Icon={Shield} title="Approved listings only" body="Public products must pass admin moderation before buyers can see them." />
          <TrustCard Icon={Truck} title="Order tracking" body="Buyer and seller dashboards read real order state from the API." />
          <TrustCard Icon={BadgeCheck} title="Verified sellers" body="Sellers must be approved before creating public marketplace listings." />
        </div>
      </section>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
  actionHref,
  actionLabel,
}: {
  eyebrow: string;
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-stone-950">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-500">{body}</p>
      </div>
      <Link className="inline-flex items-center gap-2 text-sm font-extrabold text-stone-500 transition hover:text-stone-950" href={actionHref}>
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function LiveProductCard({ product, compact = false }: { product: PublicProduct; compact?: boolean }) {
  return (
    <Link className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md" href={`/products/${product.slug}`}>
      <div className={`relative bg-stone-100 ${compact ? "aspect-[5/3]" : "aspect-square"}`}>
        <ProductThumb product={product} />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-emerald-700 shadow-sm">{product.category.name}</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400">
          <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
          {product.store.name}
        </div>
        <h3 className="mt-2 line-clamp-2 min-h-11 text-base font-extrabold leading-snug text-stone-950">{product.title}</h3>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-lg font-extrabold text-emerald-700">{formatMoney(product.priceCents, product.currency)}</span>
          <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
            <Star className="h-3.5 w-3.5" />
            {product.averageRating.toFixed(1)}
          </span>
        </div>
        <p className="mt-2 text-xs font-bold text-stone-400">
          {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"} · {product.reviewCount} review{product.reviewCount === 1 ? "" : "s"}
        </p>
      </div>
    </Link>
  );
}

function ProductThumb({ product, size = "full" }: { product: PublicProduct; size?: "full" | "sm" }) {
  const className = size === "sm" ? "h-14 w-14 rounded-2xl" : "absolute inset-0 h-full w-full";

  if (!product.image) {
    return (
      <div className={`${className} flex items-center justify-center bg-stone-100 text-stone-300`}>
        <Package className={size === "sm" ? "h-6 w-6" : "h-10 w-10"} />
      </div>
    );
  }

  return <img alt={product.image.altText ?? product.title} className={`${className} object-cover transition duration-300 group-hover:scale-105`} src={product.image.url} />;
}

function LiveMetric({ Icon, label, value }: { Icon: typeof ShoppingBag; label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
      <Icon className="h-5 w-5 text-emerald-600" />
      <p className="mt-3 text-2xl font-black text-stone-950">{value}</p>
      <p className="text-xs font-bold uppercase tracking-wide text-stone-400">{label}</p>
    </div>
  );
}

function TrustCard({ Icon, title, body }: { Icon: typeof Shield; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-400">{body}</p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
        <Package className="h-7 w-7 text-stone-400" />
      </div>
      <h3 className="mt-4 text-lg font-extrabold text-stone-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500">{body}</p>
    </div>
  );
}

function getUniqueStores(products: PublicProduct[]) {
  const stores = new Map<string, { name: string; slug: string; productCount: number }>();

  for (const product of products) {
    const existing = stores.get(product.store.slug);

    if (existing) {
      existing.productCount += 1;
      continue;
    }

    stores.set(product.store.slug, {
      name: product.store.name,
      slug: product.store.slug,
      productCount: 1,
    });
  }

  return [...stores.values()];
}

function emptyProductsResponse(sort: string, limit: number): ProductResult {
  return {
    items: [],
    meta: {
      page: 1,
      limit,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      sort,
    },
  };
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}
