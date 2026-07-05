import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header";
import { ProductPurchaseActions } from "@/components/products/product-purchase-actions";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Package,
  Shield,
  ShoppingBag,
  Star,
  Tag,
  Truck,
} from "@/components/imported/design-icons";
import { getPublicProduct } from "@/lib/public-products";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  noStore();
  const { slug } = await params;
  const product = await getProductOrNotFound(slug);
  const mainImage = product.images[0] ?? product.image;

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <MarketplaceHeader active="products" />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-extrabold text-stone-500 transition hover:text-stone-950"
          href="/products"
        >
          Back to products
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_460px]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
              <div className="aspect-[4/3] bg-stone-100">
                {mainImage ? (
                  <img
                    alt={mainImage.altText ?? product.title}
                    className="h-full w-full object-cover"
                    src={mainImage.url}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-16 w-16 text-stone-300" />
                  </div>
                )}
              </div>
            </div>

            {product.images.length > 1 ? (
              <div className="grid grid-cols-4 gap-3">
                {product.images.slice(0, 4).map((image) => (
                  <div
                    className="aspect-square overflow-hidden rounded-2xl border border-stone-200 bg-white"
                    key={image.id}
                  >
                    <img
                      alt={image.altText ?? product.title}
                      className="h-full w-full object-cover"
                      src={image.url}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <aside className="h-fit rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                {product.category.name}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700">
                <Star className="h-3.5 w-3.5" />
                {product.averageRating.toFixed(1)} ({product.reviewCount})
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-stone-950 sm:text-4xl">
              {product.title}
            </h1>
            <p className="mt-4 text-sm leading-7 text-stone-500">
              {product.description}
            </p>

            <div className="mt-6 flex items-end justify-between gap-4 border-y border-stone-100 py-5">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">
                  Price
                </p>
                <p className="mt-1 text-3xl font-extrabold text-emerald-700">
                  {formatMoney(product.priceCents, product.currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">
                  Stock
                </p>
                <p className="mt-1 text-sm font-extrabold text-stone-900">
                  {product.stockQuantity > 0
                    ? `${product.stockQuantity} available`
                    : "Out of stock"}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-extrabold text-stone-950">
                    {product.store.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-emerald-800">
                    Verified seller. This product is public because the product,
                    store, seller profile, and category passed approval checks.
                  </p>
                </div>
              </div>
            </div>

            {product.variants.length ? (
              <div className="mt-5">
                <p className="text-sm font-extrabold text-stone-950">
                  Available options
                </p>
                <div className="mt-3 grid gap-2">
                  {product.variants.map((variant) => (
                    <div
                      className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                      key={variant.id}
                    >
                      <span className="text-sm font-bold text-stone-800">
                        {variant.name}: {variant.value}
                      </span>
                      <span className="text-xs font-bold text-stone-500">
                        {variant.stockQuantity} left
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {product.tags.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-bold text-stone-500"
                    key={tag}
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <ProductPurchaseActions
                productId={product.id}
                stockQuantity={product.stockQuantity}
              />
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 text-sm font-extrabold text-stone-800 transition hover:border-stone-300"
                href={`/products?categorySlug=${product.category.slug}`}
              >
                More like this
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              Icon: Shield,
              title: "Approved listing",
              body: "Only approved products are visible on public pages.",
            },
            {
              Icon: Truck,
              title: "Seller managed",
              body: "Stores control product details, stock, and fulfillment.",
            },
            {
              Icon: BadgeCheck,
              title: "Verified store",
              body: "Seller approval is required before public visibility.",
            },
          ].map(({ Icon, title, body }) => (
            <div
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
              key={title}
            >
              <Icon className="h-5 w-5 text-emerald-600" />
              <h2 className="mt-4 text-sm font-extrabold text-stone-950">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

async function getProductOrNotFound(slug: string) {
  try {
    return await getPublicProduct(slug);
  } catch {
    notFound();
  }
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}
