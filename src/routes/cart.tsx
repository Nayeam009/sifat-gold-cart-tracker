import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatTaka, getProduct } from "@/lib/catalog";
import { lineKey, useCart } from "@/lib/cart";
import { PageHeader } from "@/components/site/page-header";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/cart")({
  head: () => seo("Your Cart", "Review the items in your SifatMart shopping cart."),
  component: CartPage,
});

function CartPage() {
  const { lines, setQty, remove, subtotal } = useCart();
  return (
    <>
      <PageHeader title="Shopping Cart" />
      <div className="mx-auto max-w-6xl px-4 py-12">
        {lines.length === 0 ? (
          <div className="text-center"><p className="text-muted-foreground">Your cart is empty.</p><Link to="/shop" className="mt-4 inline-block rounded-md bg-primary px-6 py-3 text-sm text-primary-foreground">Continue shopping</Link></div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {lines.map((l) => {
                const p = getProduct(l.slug);
                if (!p) return null;
                return (
                  <li key={lineKey(l)} className="flex items-center gap-4 p-4">
                    <img src={p.image} alt={p.name} className="h-20 w-20 rounded-md object-cover" />
                    <div className="flex-1">
                      <Link to="/product/$slug" params={{ slug: p.slug }} className="text-sm font-medium hover:text-primary">{p.name}</Link>
                      {l.variant && <p className="text-xs text-muted-foreground">Option: {l.variant}</p>}
                      <p className="text-sm text-primary">{formatTaka(p.price)}</p>
                    </div>
                    <div className="flex items-center rounded-md border border-input">
                      <button aria-label="Decrease" className="p-2" onClick={() => setQty(lineKey(l), l.qty - 1)}><Minus className="h-3 w-3" /></button>
                      <span className="w-6 text-center text-sm">{l.qty}</span>
                      <button aria-label="Increase" className="p-2" onClick={() => setQty(lineKey(l), l.qty + 1)}><Plus className="h-3 w-3" /></button>
                    </div>
                    <p className="w-20 text-right text-sm font-semibold">{formatTaka(p.price * l.qty)}</p>
                    <button aria-label="Remove" onClick={() => remove(lineKey(l))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </li>
                );
              })}
            </ul>
            <aside className="h-fit rounded-lg border border-border bg-card p-6">
              <h2 className="text-2xl">Order Summary</h2>
              <div className="mt-4 flex justify-between text-sm"><span>Subtotal</span><span>{formatTaka(subtotal)}</span></div>
              <p className="mt-1 text-xs text-muted-foreground">Delivery calculated at checkout.</p>
              <Link to="/checkout" className="mt-6 block rounded-md bg-primary py-3 text-center text-sm text-primary-foreground hover:opacity-90">Proceed to Checkout</Link>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
