import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Minus, Plus, Trash2 } from "lucide-react";
import { formatTaka } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { catalogueQuery } from "@/lib/catalogue-data";
import { reviewCart } from "@/lib/checkout";
import { PageHeader } from "@/components/site/page-header";
import { SafeImage } from "@/components/site/safe-image";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/cart")({
  head: () => seo("Your Cart", "Review the items in your SifatMart shopping cart.", { path: "/cart", noindex: true }),
  component: CartPage,
});

function CartPage() {
  const { lines, setQty, remove } = useCart();
  const cat = useQuery(catalogueQuery);
  const reviewed = cat.data ? reviewCart(lines, cat.data) : [];
  const subtotal = reviewed.reduce((s, r) => s + r.lineTotal, 0);
  const hasIssue = reviewed.some((r) => r.issue);

  return (
    <>
      <PageHeader title="Shopping Cart" />
      <div className="mx-auto max-w-6xl px-4 py-12">
        {lines.length === 0 ? (
          <div className="text-center"><p className="text-muted-foreground">Your cart is empty.</p><Link to="/shop" className="mt-4 inline-block rounded-md bg-primary px-6 py-3 text-sm text-primary-foreground">Continue shopping</Link></div>
        ) : cat.isPending ? (
          <p className="text-center text-muted-foreground">Checking latest prices and stock…</p>
        ) : cat.isError ? (
          <div className="text-center"><p className="text-destructive">We couldn't load the latest prices. Your cart is safe.</p><button onClick={() => cat.refetch()} className="mt-4 rounded-md border border-border px-5 py-2 text-sm">Try again</button></div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {reviewed.map((r) => (
                <li key={r.key} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
                  <SafeImage src={r.product?.image ?? ""} alt={r.product?.name ?? r.line.slug} className="h-20 w-20 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    {r.product ? <Link to="/product/$slug" params={{ slug: r.product.slug }} className="text-sm font-medium hover:text-primary">{r.product.name}</Link> : <p className="text-sm font-medium">{r.line.slug}</p>}
                    {r.line.variant && <p className="text-xs text-muted-foreground">Option: {r.line.variant}</p>}
                    <p className="text-sm text-primary">{formatTaka(r.unitPrice)}</p>
                    {r.issue && <p className="mt-1 flex items-center gap-1 text-xs text-destructive"><AlertCircle className="h-3 w-3" />{r.issue}</p>}
                  </div>
                  <div className="flex items-center rounded-md border border-input">
                    <button aria-label="Decrease quantity" className="p-2" onClick={() => setQty(r.key, r.line.qty - 1)}><Minus className="h-3 w-3" /></button>
                    <span className="w-6 text-center text-sm" aria-live="polite">{r.line.qty}</span>
                    <button aria-label="Increase quantity" disabled={r.line.qty >= r.maxQty} className="p-2 disabled:opacity-40" onClick={() => setQty(r.key, r.line.qty + 1)}><Plus className="h-3 w-3" /></button>
                  </div>
                  <p className="w-20 text-right text-sm font-semibold">{formatTaka(r.lineTotal)}</p>
                  <button aria-label={`Remove ${r.product?.name ?? "item"}`} onClick={() => remove(r.key)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
            <aside className="h-fit rounded-lg border border-border bg-card p-6">
              <h2 className="text-2xl">Order Summary</h2>
              <div className="mt-4 flex justify-between text-sm"><span>Subtotal</span><span>{formatTaka(subtotal)}</span></div>
              <p className="mt-1 text-xs text-muted-foreground">Delivery charge and final total are confirmed at checkout.</p>
              {hasIssue && <p className="mt-3 text-xs text-destructive">Please fix the highlighted items before checking out.</p>}
              {hasIssue ? (
                <span aria-disabled className="mt-6 block cursor-not-allowed rounded-md bg-primary py-3 text-center text-sm text-primary-foreground opacity-50">Proceed to Checkout</span>
              ) : (
                <Link to="/checkout" className="mt-6 block rounded-md bg-primary py-3 text-center text-sm text-primary-foreground hover:opacity-90">Proceed to Checkout</Link>
              )}
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
