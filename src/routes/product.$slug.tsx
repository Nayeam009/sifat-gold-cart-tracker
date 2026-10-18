import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Heart, Minus, Plus, ShieldCheck, Truck, Wallet } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { formatTaka, DELIVERY } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { availableStock, validateAdd, variantPrice, type CatalogueItem } from "@/lib/catalogue";
import { catalogueQuery, productQuery } from "@/lib/catalogue-data";
import { ProductCard } from "@/components/site/product-card";
import { SectionTitle } from "@/components/site/page-header";
import { SafeImage } from "@/components/site/safe-image";
import { absUrl, breadcrumbLd, jsonLd, seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    if (!/^[a-z0-9-]{1,100}$/.test(params.slug)) throw notFound();
    const p = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData: p }) => {
    if (!p) return { meta: [{ title: "Product unavailable | SifatMart" }, { name: "robots", content: "noindex" }] };
    const path = `/product/${p.slug}`;
    const base = seo(p.name, p.summary ?? p.description?.slice(0, 155) ?? `${p.name} at SifatMart`, { path, image: p.image, type: "product" });
    const url = absUrl(path);
    const offer = (sku: string, price: number, stock: number, name?: string) => ({
      "@type": "Offer", sku, ...(name ? { name } : {}), price: price.toFixed(2), priceCurrency: "BDT", url, itemCondition: "https://schema.org/NewCondition",
      availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    });
    const product = {
      "@context": "https://schema.org", "@type": "Product", name: p.name, sku: p.sku, url,
      description: p.description ?? p.summary ?? undefined,
      image: p.images.map((i) => absUrl(i.url)),
      brand: { "@type": "Brand", name: "SifatMart" },
      ...(p.categoryName ? { category: p.categoryName } : {}),
      offers: p.variants.length ? p.variants.map((v) => offer(v.sku, variantPrice(p, v), v.stock, v.name)) : offer(p.sku, p.price, p.stock),
    };
    const crumbs = [{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }, ...(p.categorySlug && p.categoryName ? [{ name: p.categoryName, path: `/category/${p.categorySlug}` }] : []), { name: p.name, path }];
    return { ...base, scripts: [jsonLd(product), breadcrumbLd(crumbs)] };
  },
  notFoundComponent: () => (
    <div className="py-24 text-center">
      <h1 className="text-3xl">Product not found</h1>
      <p className="mt-2 text-muted-foreground">This product doesn't exist or is no longer available.</p>
      <Link to="/shop" className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-sm text-primary-foreground">Browse the shop</Link>
    </div>
  ),
  errorComponent: ProductError,
  component: ProductPage,
});

function ProductError() {
  const router = useRouter();
  return (
    <div role="alert" className="py-24 text-center">
      <h1 className="text-3xl">We couldn't load this product</h1>
      <p className="mt-2 text-muted-foreground">Please check your connection and try again.</p>
      <button onClick={() => router.invalidate()} className="mt-6 rounded-md bg-primary px-6 py-3 text-sm text-primary-foreground">Try again</button>
    </div>
  );
}

function ProductPage() {
  const initial = Route.useLoaderData();
  const { data } = useQuery({ ...productQuery(initial.slug), initialData: initial });
  const p = data ?? initial;
  return <ProductDetail key={p.slug} p={p} />;
}

function ProductDetail({ p }: { p: CatalogueItem }) {
  const { add, qtyInCart, wishlist, toggleWish } = useCart();
  const navigate = useNavigate();
  const [sku, setSku] = useState<string | undefined>(() => (p.variants.length === 1 && (p.variants[0]?.stock ?? 0) > 0 ? p.variants[0]?.sku : undefined));
  const [qty, setQty] = useState(1);
  const variant = p.variants.find((v) => v.sku === sku) ?? null;
  const price = variantPrice(p, variant);
  const total = availableStock(p);
  const limit = variant ? variant.stock : p.variants.length ? 0 : p.stock;
  const soldOut = total <= 0;
  const all = useQuery(catalogueQuery);
  const related = (all.data ?? []).filter((x) => x.slug !== p.slug && x.categorySlug === p.categorySlug).slice(0, 4);

  const tryAdd = () => {
    const err = validateAdd(p, sku, qty, qtyInCart(p.slug, sku));
    if (err) { toast.error(err); return false; }
    add(p.slug, qty, variant ? { sku: variant.sku, name: variant.name } : undefined);
    return true;
  };

  const stockText = soldOut
    ? "Out of stock"
    : p.variants.length && !variant
      ? "Choose an option to see availability"
      : limit <= 0 ? "This option is out of stock" : limit <= 5 ? `Only ${limit} left` : "In stock";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
        <Link to="/">Home</Link> / <Link to="/shop">Shop</Link>
        {p.categorySlug && <> / <Link to="/category/$slug" params={{ slug: p.categorySlug }}>{p.categoryName}</Link></>}
      </nav>
      <div className="grid gap-10 md:grid-cols-2">
        <Gallery images={p.images} name={p.name} />
        <div>
          {p.categoryName && <p className="eyebrow">{p.categoryName}</p>}
          <h1 className="mt-2 text-4xl">{p.name}</h1>
          {import.meta.env.DEV && p.isSample && <p className="mt-2 inline-block rounded bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">Sample listing (development only) — replace with real product details</p>}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-primary">{formatTaka(price)}</span>
            {p.oldPrice && !variant?.price && <span className="text-muted-foreground line-through">{formatTaka(p.oldPrice)}</span>}
            {p.oldPrice && !variant?.price && <span className="rounded-sm bg-accent px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent-foreground">Sale</span>}
          </div>
          <p role="status" className={cn("mt-2 text-sm", soldOut || (variant && limit <= 0) ? "text-destructive" : "text-muted-foreground")}>{stockText}</p>

          {p.variants.length > 0 && (
            <fieldset className="mt-6">
              <legend className="mb-2 text-sm font-medium">Option{variant ? `: ${variant.name}` : ""}</legend>
              <div className="flex flex-wrap gap-2">
                {p.variants.map((v) => (
                  <button
                    key={v.sku}
                    aria-pressed={sku === v.sku}
                    disabled={v.stock <= 0}
                    onClick={() => { setSku(v.sku); setQty((q) => Math.max(1, Math.min(q, v.stock))); }}
                    className={cn("rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:line-through disabled:opacity-50", sku === v.sku ? "border-primary bg-secondary text-primary" : "border-input bg-card")}
                  >
                    {v.name}{v.price != null && v.price !== p.price ? ` · ${formatTaka(v.price)}` : ""}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-md border border-input">
              <button aria-label="Decrease quantity" className="p-3 disabled:opacity-40" disabled={qty <= 1} onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center text-sm" aria-live="polite" aria-label={`Quantity ${qty}`}>{qty}</span>
              <button aria-label="Increase quantity" className="p-3 disabled:opacity-40" disabled={qty >= Math.min(20, Math.max(1, limit))} onClick={() => setQty(Math.min(20, Math.max(1, limit), qty + 1))}><Plus className="h-4 w-4" /></button>
            </div>
            <button disabled={soldOut} onClick={() => tryAdd() && toast.success("Added to cart")} className="flex-1 rounded-md bg-primary py-3 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {soldOut ? "Sold out" : "Add to Cart"}
            </button>
            <button aria-label={wishlist.includes(p.slug) ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={wishlist.includes(p.slug)} onClick={() => toggleWish(p.slug)} className="rounded-md border border-input p-3">
              <Heart className={cn("h-5 w-5", wishlist.includes(p.slug) && "fill-accent text-accent")} />
            </button>
          </div>
          {!soldOut && <button onClick={() => tryAdd() && navigate({ to: "/checkout" })} className="mt-3 w-full rounded-md bg-accent py-3 text-sm text-accent-foreground hover:opacity-90">Buy Now — Cash on Delivery</button>}

          <ul className="mt-6 space-y-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            <li className="flex gap-2"><Wallet className="h-4 w-4 shrink-0 text-primary" /> Cash on Delivery — pay when your order arrives</li>
            <li className="flex gap-2"><Truck className="h-4 w-4 shrink-0 text-primary" /> Delivery {formatTaka(DELIVERY.inside)} inside Saidpur · {formatTaka(DELIVERY.outside)} elsewhere in Bangladesh</li>
            <li className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" /> <Link to="/returns" className="underline">Returns & exchange policy</Link></li>
          </ul>

          {(p.description || p.summary) && (
            <section className="mt-8">
              <h2 className="text-2xl">Description</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-foreground/80">{p.description ?? p.summary}</p>
            </section>
          )}
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-20">
          <SectionTitle title="You May Also Like" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.slug} p={r} showStock />)}</div>
        </section>
      )}
    </div>
  );
}

function Gallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [i, setI] = useState(0);
  const touch = useRef<number | null>(null);
  const n = images.length;
  const go = (d: number) => n > 1 && setI((x) => (x + d + n) % n);
  const current = images[i];
  return (
    <div>
      <div
        className="relative overflow-hidden rounded-lg border border-border bg-card"
        onTouchStart={(e) => (touch.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => { if (touch.current == null) return; const dx = (e.changedTouches[0]?.clientX ?? touch.current) - touch.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); touch.current = null; }}
      >
        <SafeImage key={current?.url} src={current?.url} alt={current?.alt ?? name} loading="eager" fetchPriority="high" width={800} height={800} className="aspect-square w-full object-cover" />
        {n > 1 && (
          <>
            <button aria-label="Previous image" onClick={() => go(-1)} className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-card/90"><ChevronLeft className="h-5 w-5" /></button>
            <button aria-label="Next image" onClick={() => go(1)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-card/90"><ChevronRight className="h-5 w-5" /></button>
            <span className="absolute bottom-2 right-2 rounded bg-card/90 px-2 py-0.5 text-xs">{i + 1} / {n}</span>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, k) => (
            <button key={img.url + k} aria-label={`Show image ${k + 1}`} aria-current={k === i} onClick={() => setI(k)} className={cn("h-16 w-16 shrink-0 overflow-hidden rounded-md border-2", k === i ? "border-primary" : "border-transparent")}>
              <SafeImage src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
