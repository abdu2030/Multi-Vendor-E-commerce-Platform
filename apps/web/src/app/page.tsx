import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { CommerceOrbitScene } from "@/components/marketplace/commerce-orbit-scene";
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
    <main className="min-h-screen bg-[#f6f3ff] text-slate-950">
      <MarketplaceHeader active="home" />

      <section className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 text-white">
        <img
          alt="Premium marketplace packaging and fulfillment scene"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.46] saturate-150"
          src="/images/marketplace-hero.webp"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.42),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(251,113,133,0.42),transparent_31%),linear-gradient(115deg,rgba(2,6,23,0.94)_0%,rgba(15,23,42,0.74)_48%,rgba(17,24,39,0.48)_100%)]" />
        <CommerceOrbitScene className="pointer-events-none absolute inset-y-12 right-[-22%] z-0 h-[58vh] min-h-[360px] w-[82vw] opacity-90 sm:right-[-12%] lg:right-[-4%] lg:h-[76vh] lg:w-[56vw]" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center px-4 pb-16 pt-16 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-cyan-200 shadow-2xl backdrop-blur">
              Live marketplace
            </p>
            <h1 className="mt-6 max-w-5xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Real products. Approved sellers. A sharper marketplace.
            </h1>
            <p className="mt-6 max-w-2xl text-base font-semibold leading-relaxed text-slate-200 sm:text-lg">
              Explore approved products, seller storefronts, and categories through a richer marketplace experience built around real catalog data.
            </p>

            <form action="/products" className="mt-9 flex max-w-2xl flex-col gap-3 rounded-[1.75rem] border border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur-xl sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-200" />
                <input
                  className="h-14 w-full rounded-[1.25rem] border border-white/10 bg-white/95 pl-12 pr-4 text-sm font-black text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/30"
                  name="q"
                  placeholder="Search live products"
                />
              </label>
              <button className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.25rem] bg-cyan-400 px-6 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-amber-300" type="submit">
                Search
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
              <LiveMetric Icon={ShoppingBag} label="Approved products" value={featured.meta.total} tone="cyan" />
              <LiveMetric Icon={Tag} label="Live categories" value={categories.length} tone="rose" />
              <LiveMetric Icon={BadgeCheck} label="Stores represented" value={uniqueStores.length} tone="amber" />
            </div>
          </div>
        </div>
      </section>

      {hasLoadError ? (
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-amber-300 bg-amber-100 p-5 text-sm font-bold text-amber-950">
            Some marketplace data could not be loaded. Refresh the page or try again shortly.
          </div>
        </section>
      ) : null}

      <section className="relative overflow-hidden border-b border-slate-200 bg-white py-14 sm:py-20">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-cyan-100/55" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.88fr)_minmax(360px,1fr)] lg:px-8">
          <div className="self-center">
            <SectionHeading
              eyebrow="Live catalog"
              title="Featured approved products"
              body="A curated view of approved buyer-visible listings from active sellers."
              actionHref="/products?sort=rating_desc"
              actionLabel="Browse all products"
            />
          </div>

          {featured.items.length ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {featured.items.slice(0, 4).map((product) => (
                <LiveProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState title="No featured products yet" body="Approved products will appear here as soon as sellers publish real listings." />
          )}
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20">
        <img
          alt="Curated marketplace product collection"
          className="absolute inset-0 h-full w-full object-cover opacity-28 saturate-150"
          src="/images/catalog-collection.webp"
        />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(2,6,23,0.94),rgba(30,41,59,0.72)),radial-gradient(circle_at_80%_20%,rgba(250,204,21,0.34),transparent_32%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Categories"
            title="Shop by real categories"
            body="Browse the categories currently available across the marketplace."
            actionHref="/products"
            actionLabel="Open catalog"
            inverted
          />

          {categories.length ? (
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categories.slice(0, 8).map((category, index) => (
                <Link key={category.id} className="group rounded-[1.5rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/60 hover:bg-white/15" href={`/products?categorySlug=${category.slug}`}>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-slate-950 shadow-lg ${index % 3 === 0 ? "bg-cyan-300" : index % 3 === 1 ? "bg-rose-300" : "bg-amber-300"}`}>
                    <Tag className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-black text-white">{category.name}</h3>
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold leading-relaxed text-slate-300">
                    {category.description ?? "Browse approved products in this live category."}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No categories loaded" body="Seed or create categories from the admin dashboard to populate this section." dark />
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-8">
        <div>
          <SectionHeading
            eyebrow="New in"
            title="Latest approved products"
            body="Fresh listings from approved sellers across the marketplace."
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

        <aside className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
          <img
            alt="Seller studio workspace"
            className="h-48 w-full object-cover saturate-125"
            src="/images/seller-studio.webp"
          />
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-rose-600">Live sellers</p>
                <h2 className="text-xl font-black text-slate-950">Stores with visible products</h2>
              </div>
            </div>

            {uniqueStores.length ? (
              <div className="mt-6 space-y-3">
                {uniqueStores.slice(0, 6).map((store) => (
                  <Link key={store.slug} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-cyan-300 hover:bg-cyan-50" href={`/products?storeSlug=${store.slug}`}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{store.name}</p>
                      <p className="text-xs font-bold text-slate-500">{store.productCount} visible product{store.productCount === 1 ? "" : "s"}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-bold leading-relaxed text-slate-500">
                Seller spotlights will appear after approved products exist in the catalog.
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="bg-white py-16 text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <TrustCard Icon={Shield} title="Approved listings only" body="Public products must pass admin moderation before buyers can see them." tone="cyan" />
          <TrustCard Icon={Truck} title="Order tracking" body="Buyer and seller dashboards read real order state from the API." tone="amber" />
          <TrustCard Icon={BadgeCheck} title="Verified sellers" body="Sellers must be approved before creating public marketplace listings." tone="rose" />
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
  inverted = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
  inverted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className={inverted ? "text-xs font-black uppercase tracking-widest text-cyan-200" : "text-xs font-black uppercase tracking-widest text-rose-600"}>{eyebrow}</p>
        <h2 className={inverted ? "mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl" : "mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl"}>{title}</h2>
        <p className={inverted ? "mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-slate-300" : "mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-slate-500"}>{body}</p>
      </div>
      <Link className={inverted ? "inline-flex items-center gap-2 text-sm font-black text-cyan-200 transition hover:text-white" : "inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-slate-950"} href={actionHref}>
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function LiveProductCard({ product, compact = false }: { product: PublicProduct; compact?: boolean }) {
  return (
    <Link className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-lg shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-2xl" href={`/products/${product.slug}`}>
      <div className={`relative bg-slate-100 ${compact ? "aspect-[5/3]" : "aspect-square"}`}>
        <ProductThumb product={product} />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black text-rose-700 shadow-sm">{product.category.name}</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
          <BadgeCheck className="h-3.5 w-3.5 text-cyan-500" />
          {product.store.name}
        </div>
        <h3 className="mt-2 line-clamp-2 min-h-11 text-base font-black leading-snug text-slate-950">{product.title}</h3>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-lg font-black text-fuchsia-700">{formatMoney(product.priceCents, product.currency)}</span>
          <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
            <Star className="h-3.5 w-3.5" />
            {product.averageRating.toFixed(1)}
          </span>
        </div>
        <p className="mt-2 text-xs font-bold text-slate-400">
          {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"} | {product.reviewCount} review{product.reviewCount === 1 ? "" : "s"}
        </p>
      </div>
    </Link>
  );
}

function ProductThumb({ product, size = "full" }: { product: PublicProduct; size?: "full" | "sm" }) {
  const className = size === "sm" ? "h-14 w-14 rounded-2xl" : "absolute inset-0 h-full w-full";

  if (!product.image) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-100 text-slate-300`}>
        <Package className={size === "sm" ? "h-6 w-6" : "h-10 w-10"} />
      </div>
    );
  }

  return <img alt={product.image.altText ?? product.title} className={`${className} object-cover transition duration-300 group-hover:scale-105`} src={product.image.url} />;
}

function LiveMetric({ Icon, label, value, tone }: { Icon: typeof ShoppingBag; label: string; value: number; tone: "cyan" | "rose" | "amber" }) {
  const toneClass = tone === "cyan" ? "bg-cyan-300 text-slate-950" : tone === "rose" ? "bg-rose-300 text-slate-950" : "bg-amber-300 text-slate-950";

  return (
    <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
      <p className="text-xs font-black uppercase tracking-wide text-slate-300">{label}</p>
    </div>
  );
}

function TrustCard({ Icon, title, body, tone }: { Icon: typeof Shield; title: string; body: string; tone: "cyan" | "rose" | "amber" }) {
  const toneClass = tone === "cyan" ? "bg-cyan-100 text-cyan-700" : tone === "rose" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">{body}</p>
    </div>
  );
}

function EmptyState({ title, body, dark = false }: { title: string; body: string; dark?: boolean }) {
  return (
    <div className={dark ? "mt-8 rounded-[1.75rem] border border-white/10 bg-white/10 p-10 text-center backdrop-blur" : "mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-sm"}>
      <div className={dark ? "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10" : "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100"}>
        <Package className={dark ? "h-7 w-7 text-cyan-200" : "h-7 w-7 text-slate-400"} />
      </div>
      <h3 className={dark ? "mt-4 text-lg font-black text-white" : "mt-4 text-lg font-black text-slate-950"}>{title}</h3>
      <p className={dark ? "mx-auto mt-2 max-w-md text-sm font-semibold leading-relaxed text-slate-300" : "mx-auto mt-2 max-w-md text-sm font-semibold leading-relaxed text-slate-500"}>{body}</p>
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
