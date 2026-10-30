import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { formatTaka } from "@/lib/catalog";
import { errMsg, useAdminAuth } from "@/lib/admin";

export const Route = createFileRoute("/admin-print")({
  ssr: false,
  validateSearch: z.object({
    type: z.enum(["invoice", "label"]).catch("invoice"),
    ids: z.string().catch(""),
  }),
  head: () => ({ meta: [{ title: "Print — SifatMart admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: PrintPage,
});

const UUID = /^[0-9a-f-]{36}$/i;

function PrintPage() {
  const { type, ids } = Route.useSearch();
  const auth = useAdminAuth();
  const list = ids.split(",").filter((i) => UUID.test(i)).slice(0, 100);
  const q = useQuery({
    enabled: auth.status === "admin" && list.length > 0,
    queryKey: ["admin", "print", list],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(product_name, variant_name, sku, quantity, unit_price, line_total)")
        .in("id", list)
        .order("created_at");
      if (error) throw new Error(errMsg(error));
      return data;
    },
  });
  useEffect(() => {
    if (q.data?.length) setTimeout(() => window.print(), 400);
  }, [q.data]);
  if (auth.status === "loading") return <p className="p-8">Checking access…</p>;
  if (auth.status !== "admin") return <p className="p-8">Only SifatMart admins can print orders.</p>;
  if (!list.length) return <p className="p-8">No orders selected.</p>;
  if (q.isPending) return <p className="p-8">Preparing…</p>;
  if (q.isError) return <p className="p-8 text-destructive">{q.error.message}</p>;
  return (
    <div className="bg-background text-foreground">
      <style>{type === "label" ? "@page{size:4in 6in;margin:0.15in}" : "@page{size:A4;margin:12mm}"}</style>
      <div className="flex justify-end gap-2 p-4 print:hidden">
        <button onClick={() => window.print()} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          Print
        </button>
      </div>
      {q.data.map((o) =>
        type === "label" ? (
          <section key={o.id} className="mx-auto mb-4 flex h-[5.6in] w-[3.7in] break-after-page flex-col border border-foreground p-3 text-sm">
            <p className="font-display text-2xl">SifatMart</p>
            <p className="text-xs">Saidpur, Nilphamari · 01997974394</p>
            <hr className="my-2 border-foreground" />
            <p className="text-xs uppercase">Deliver to</p>
            <p className="text-lg font-semibold">{o.customer_name}</p>
            <p className="text-lg">{o.phone}</p>
            <p>{o.address}</p>
            <p>{o.area}, {o.city}</p>
            <hr className="my-2 border-foreground" />
            <p>Order <b>{o.order_number}</b></p>
            <p>Items: {o.order_items.reduce((a, i) => a + i.quantity, 0)}</p>
            {o.courier_name && <p>Courier: {o.courier_name} {o.tracking_code}</p>}
            <p className="mt-auto border-2 border-foreground p-2 text-center text-xl font-bold">
              COLLECT {formatTaka(o.payment_status === "collected" ? 0 : o.total)}
            </p>
          </section>
        ) : (
          <section key={o.id} className="mx-auto mb-8 max-w-[190mm] break-after-page p-6 text-sm">
            <div className="flex justify-between">
              <div>
                <p className="font-display text-3xl text-primary">SifatMart</p>
                <p className="text-xs text-muted-foreground">Beauty for Your Special Moments</p>
                <p className="text-xs">Saidpur, Nilphamari, Bangladesh · 01997974394</p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl">Invoice</p>
                <p>{o.order_number}</p>
                <p className="text-xs">{new Date(o.created_at).toLocaleDateString("en-GB")}</p>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-xs uppercase text-muted-foreground">Bill &amp; deliver to</p>
              <p className="font-medium">{o.customer_name} · {o.phone}</p>
              <p>{o.address}, {o.area}, {o.city}</p>
            </div>
            <table className="mt-6 w-full border-collapse">
              <thead>
                <tr className="border-b border-foreground text-left">
                  <th className="py-1">Item</th>
                  <th className="py-1">SKU</th>
                  <th className="py-1 text-right">Qty</th>
                  <th className="py-1 text-right">Price</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {o.order_items.map((i, k) => (
                  <tr key={k} className="border-b border-border">
                    <td className="py-1">{i.product_name}{i.variant_name && ` — ${i.variant_name}`}</td>
                    <td className="py-1">{i.sku ?? ""}</td>
                    <td className="py-1 text-right">{i.quantity}</td>
                    <td className="py-1 text-right">{formatTaka(i.unit_price)}</td>
                    <td className="py-1 text-right">{formatTaka(i.line_total ?? i.unit_price * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="ml-auto mt-4 w-64 space-y-1">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatTaka(o.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Delivery</dt><dd>{formatTaka(o.delivery_fee)}</dd></div>
              {o.discount > 0 && <div className="flex justify-between"><dt>Discount</dt><dd>− {formatTaka(o.discount)}</dd></div>}
              <div className="flex justify-between border-t border-foreground pt-1 font-semibold"><dt>Total (Cash on Delivery)</dt><dd>{formatTaka(o.total)}</dd></div>
            </dl>
            <p className="mt-10 text-center text-xs text-muted-foreground">Thank you for shopping with SifatMart.</p>
          </section>
        ),
      )}
    </div>
  );
}
