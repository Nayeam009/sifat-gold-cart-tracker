import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BRAND, formatTaka } from "@/lib/catalog";
import type { PlacedOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/order-confirmation/$orderNumber")({
  head: () => ({ meta: [{ title: "Order Confirmed | SifatMart" }, { name: "description", content: "Thank you for your SifatMart order." }, { property: "og:title", content: "Order Confirmed | SifatMart" }, { property: "og:description", content: "Thank you for your SifatMart order." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Confirmation,
});

function Confirmation() {
  const { orderNumber } = Route.useParams();
  // Details are only kept in this browser tab (never fetched by number alone, so other customers' orders stay private).
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  useEffect(() => {
    try { const raw = sessionStorage.getItem(`sm-order-${orderNumber}`); if (raw) setOrder(JSON.parse(raw)); } catch {}
  }, [orderNumber]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-6 text-4xl">Thank you for your order!</h1>
        <p className="mt-3 text-muted-foreground">Your order number is</p>
        <p className="mt-1 font-display text-3xl text-accent">{orderNumber}</p>
      </div>

      {order && (
        <div className="mt-8 space-y-6 rounded-lg border border-border bg-card p-6 text-sm">
          <div>
            <h2 className="text-xl">Items</h2>
            <ul className="mt-3 space-y-2">
              {order.items.map((i, n) => (
                <li key={n} className="flex justify-between gap-3"><span>{i.product_name}{i.variant_name ? ` (${i.variant_name})` : ""} × {i.quantity}</span><span>{formatTaka(i.line_total ?? i.unit_price * i.quantity)}</span></li>
              ))}
            </ul>
          </div>
          <div className="space-y-1 border-t border-border pt-4">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatTaka(order.subtotal)}</span></div>
            <div className="flex justify-between"><span>Delivery ({order.area})</span><span>{formatTaka(order.delivery_fee)}</span></div>
            {order.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>−{formatTaka(order.discount)}</span></div>}
            <div className="flex justify-between text-base font-semibold"><span>Pay on delivery</span><span className="text-primary">{formatTaka(order.total)}</span></div>
          </div>
          <div className="border-t border-border pt-4">
            <h2 className="text-xl">Delivery to</h2>
            <p className="mt-2">{order.customer_name} · {order.phone}</p>
            <p className="text-muted-foreground">{order.address}</p>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-md border border-primary bg-secondary p-4 text-sm">
        <p className="font-medium">Cash on Delivery</p>
        <p className="text-muted-foreground">We'll call you to confirm your order. Please keep {order ? formatTaka(order.total) : "the total amount"} in cash ready when the parcel arrives. Questions? Call <a className="text-primary underline" href={`tel:${BRAND.hotline}`}>{BRAND.hotline}</a>.</p>
      </div>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/track-order" search={{ order: orderNumber }} className="rounded-md bg-primary px-6 py-3 text-sm text-primary-foreground">Track Order</Link>
        <Link to="/shop" className="rounded-md border border-border px-6 py-3 text-sm">Continue Shopping</Link>
      </div>
    </div>
  );
}
