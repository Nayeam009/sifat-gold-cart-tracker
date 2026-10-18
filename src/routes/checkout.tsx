import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DELIVERY, formatTaka, getProduct, type DeliveryZone } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { placeOrder } from "@/lib/orders.functions";
import { PageHeader } from "@/components/site/page-header";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/checkout")({
  head: () => seo("Checkout", "Complete your SifatMart order with Cash on Delivery."),
  component: Checkout,
});

const field = "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

function Checkout() {
  const { lines, subtotal, clear } = useCart();
  const [zone, setZone] = useState<DeliveryZone>("inside");
  const navigate = useNavigate();
  const submit = useServerFn(placeOrder);
  const m = useMutation({
    mutationFn: submit,
    onSuccess: (r) => { clear(); navigate({ to: "/order-confirmation/$orderNumber", params: { orderNumber: r.order_number } }); },
    onError: (e) => toast.error(e instanceof Error ? e.message.slice(0, 200) : "Something went wrong"),
  });

  if (lines.length === 0) return <div className="py-24 text-center"><p className="text-muted-foreground">Your cart is empty.</p><Link to="/shop" className="mt-4 inline-block text-primary underline">Go to shop</Link></div>;

  const delivery = DELIVERY[zone];
  return (
    <>
      <PageHeader title="Checkout" />
      <form
        className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1fr_360px]"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const phone = String(f.get("phone") || "").replace(/\s|-/g, "").replace(/^\+?88/, "");
          if (!/^01[3-9]\d{8}$/.test(phone)) return toast.error("Please enter a valid 11-digit mobile number (01XXXXXXXXX)");
          m.mutate({ data: {
            customer_name: String(f.get("name")), phone, email: String(f.get("email") || ""),
            address: String(f.get("address")), city: String(f.get("city")), zone, notes: String(f.get("notes") || ""),
            items: lines.map((l) => ({ slug: l.slug, qty: l.qty })),
          } });
        }}
      >
        <div className="space-y-4 rounded-lg border border-border bg-card p-6">
          <h2 className="text-2xl">Delivery Details</h2>
          <input name="name" required minLength={2} maxLength={100} placeholder="Full name *" className={field} />
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="phone" required placeholder="Mobile number * (01XXXXXXXXX)" className={field} />
            <input name="email" type="email" maxLength={255} placeholder="Email (optional)" className={field} />
          </div>
          <textarea name="address" required minLength={5} maxLength={300} placeholder="Full address (house, road, area) *" rows={3} className={field} />
          <input name="city" required minLength={2} maxLength={80} placeholder="District / City *" className={field} />
          <div>
            <p className="mb-2 text-sm font-medium">Delivery area</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["inside", "outside"] as const).map((z) => (
                <label key={z} className={`flex cursor-pointer items-center justify-between rounded-md border p-3 text-sm ${zone === z ? "border-primary bg-secondary" : "border-input"}`}>
                  <span><input type="radio" name="zone" checked={zone === z} onChange={() => setZone(z)} className="mr-2 accent-primary" />{z === "inside" ? "Inside Saidpur" : "Outside Saidpur"}</span>
                  <span>{formatTaka(DELIVERY[z])}</span>
                </label>
              ))}
            </div>
          </div>
          <textarea name="notes" maxLength={500} placeholder="Order notes (optional)" rows={2} className={field} />
          <div className="rounded-md border border-primary bg-secondary p-4 text-sm"><p className="font-medium">Payment: Cash on Delivery</p><p className="text-muted-foreground">Pay in cash when your order arrives.</p></div>
        </div>
        <aside className="h-fit rounded-lg border border-border bg-card p-6">
          <h2 className="text-2xl">Your Order</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {lines.map((l) => { const p = getProduct(l.slug); return p && <li key={l.slug} className="flex justify-between gap-3"><span>{p.name} × {l.qty}</span><span>{formatTaka(p.price * l.qty)}</span></li>; })}
          </ul>
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatTaka(subtotal)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{formatTaka(delivery)}</span></div>
            <div className="flex justify-between text-base font-semibold"><span>Total</span><span className="text-primary">{formatTaka(subtotal + delivery)}</span></div>
          </div>
          <button disabled={m.isPending} className="mt-6 w-full rounded-md bg-primary py-3 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-60">{m.isPending ? "Placing order…" : "Confirm Order"}</button>
        </aside>
      </form>
    </>
  );
}
