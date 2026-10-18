import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Heart, Minus, Plus, ShieldCheck, Star, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatTaka, getCategory, getProduct, products } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/site/product-card";
import { SectionTitle } from "@/components/site/page-header";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const p = getProduct(params.slug);
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => (loaderData ? seo(loaderData.name, loaderData.description) : { meta: [{ title: "Product not found | SifatMart" }, { name: "robots", content: "noindex" }] }),
  component: ProductPage,
});

function ProductPage() {
  const p = Route.useLoaderData();
  const cat = getCategory(p.category);
  const { add, wishlist, toggleWish } = useCart();
  const [qty, setQty] = useState(1);
  const navigate = useNavigate();
  const related = products.filter((x) => x.category === p.category && x.slug !== p.slug).concat(products.filter((x) => x.slug !== p.slug)).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / {cat && <Link to="/category/$slug" params={{ slug: cat.slug }}>{cat.name}</Link>}
      </nav>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-border bg-card"><img src={p.image} alt={p.name} className="aspect-square w-full object-cover" /></div>
        <div>
          <p className="eyebrow">{cat?.name}</p>
          <h1 className="mt-2 text-4xl">{p.name}</h1>
          <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><Star className="h-4 w-4 fill-star text-star" /> {p.rating} · {p.reviews}+ reviews</div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-primary">{formatTaka(p.price)}</span>
            {p.oldPrice && <span className="text-muted-foreground line-through">{formatTaka(p.oldPrice)}</span>}
          </div>
          <p className="mt-5 text-sm leading-7 text-foreground/80">{p.description}</p>
          <p className="mt-3 text-xs text-muted-foreground">{p.stock > 0 ? `In stock (${p.stock} available)` : "Out of stock"}</p>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-md border border-input">
              <button aria-label="Decrease" className="p-3" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center text-sm">{qty}</span>
              <button aria-label="Increase" className="p-3" onClick={() => setQty(Math.min(p.stock, qty + 1))}><Plus className="h-4 w-4" /></button>
            </div>
            <button onClick={() => { add(p.slug, qty); toast.success("Added to cart"); }} className="flex-1 rounded-md bg-primary py-3 text-sm text-primary-foreground hover:opacity-90">Add to Cart</button>
            <button aria-label="Wishlist" onClick={() => toggleWish(p.slug)} className="rounded-md border border-input p-3"><Heart className={cn("h-5 w-5", wishlist.includes(p.slug) && "fill-accent text-accent")} /></button>
          </div>
          <button onClick={() => { add(p.slug, qty); navigate({ to: "/checkout" }); }} className="mt-3 w-full rounded-md bg-accent py-3 text-sm text-accent-foreground hover:opacity-90">Buy Now — Cash on Delivery</button>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><Truck className="h-4 w-4 text-primary" /> ৳60 inside Saidpur · ৳120 across Bangladesh</li>
            <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> 100% authentic · 3-day exchange</li>
          </ul>
        </div>
      </div>
      <section className="mt-20">
        <SectionTitle title="You May Also Like" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.slug} p={r} />)}</div>
      </section>
    </div>
  );
}
