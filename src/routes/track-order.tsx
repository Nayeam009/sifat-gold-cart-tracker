import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { formatTaka } from "@/lib/catalog";
import { trackOrder } from "@/lib/orders.functions";
import { PageHeader } from "@/components/site/page-header";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/track-order")({
  validateSearch: z.object({ order: z.string().optional() }),
  head: () => seo("Track Your Order", "Check the status of your SifatMart order with your order number and phone.", { path: "/track-order" }),
  component: Track,
});

const steps = ["pending", "confirmed", "shipped", "delivered"];

function Track() {
  const { order } = Route.useSearch();
  const fn = useServerFn(trackOrder);
  const m = useMutation({ mutationFn: fn });
  const field = "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
  const res = m.data;
  return (
    <>
      <PageHeader eyebrow="Order status" title="Track Your Order">Enter your order number and the mobile number used at checkout.</PageHeader>
      <div className="mx-auto max-w-xl px-4 py-12">
        <form className="space-y-3 rounded-lg border border-border bg-card p-6" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); m.mutate({ data: { order_number: String(f.get("order")), phone: String(f.get("phone")).replace(/\s|-/g, "").replace(/^\+?88/, "") } }); }}>
          <label htmlFor="track-order" className="sr-only">Order number</label>
          <input id="track-order" name="order" defaultValue={order} required placeholder="Order number (e.g. SM123456789)" className={field} />
          <label htmlFor="track-phone" className="sr-only">Mobile number used for the order</label>
          <input id="track-phone" name="phone" inputMode="tel" autoComplete="tel" required placeholder="Mobile number" className={field} />
          <button disabled={m.isPending} className="w-full rounded-md bg-primary py-3 text-sm text-primary-foreground disabled:opacity-60">{m.isPending ? "Checking…" : "Track Order"}</button>
        </form>
        {m.isSuccess && !res && <p className="mt-6 text-center text-sm text-destructive">No order found with those details.</p>}
        {res && (
          <div className="mt-6 rounded-lg border border-border bg-card p-6">
            <div className="flex justify-between"><h2 className="text-2xl">{res.order_number}</h2><span className="text-xs text-muted-foreground">{new Date(res.created_at).toLocaleDateString("en-GB")}</span></div>
            <ol className="mt-5 grid grid-cols-4 gap-2 text-center text-xs">
              {steps.map((s, i) => (
                <li key={s} className={cn("rounded-md border px-1 py-2 capitalize", steps.indexOf(res.status) >= i ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>{s}</li>
              ))}
            </ol>
            {res.status === "cancelled" && <p className="mt-3 text-sm text-destructive">This order was cancelled.</p>}
            <ul className="mt-5 space-y-1 text-sm">
              {res.order_items.map((i, k) => <li key={k} className="flex justify-between"><span>{i.product_name} × {i.quantity}</span><span>{formatTaka(i.unit_price * i.quantity)}</span></li>)}
            </ul>
            <div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold"><span>Total (Cash on Delivery)</span><span className="text-primary">{formatTaka(res.total)}</span></div>
          </div>
        )}
      </div>
    </>
  );
}
