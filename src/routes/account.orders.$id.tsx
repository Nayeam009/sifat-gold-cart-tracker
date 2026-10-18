import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatTaka } from "@/lib/catalog";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/account";
import { FormAlert } from "@/components/site/auth-card";

export const Route = createFileRoute("/account/orders/$id")({ component: OrderDetail });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function OrderDetail() {
  const { id } = Route.useParams();
  // Row-level security returns nothing for orders that belong to someone else, so a changed URL just shows "not found".
  const q = useQuery({
    queryKey: ["my-order", id],
    enabled: UUID.test(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "order_number, created_at, customer_name, phone, address, area, notes, subtotal, delivery_fee, discount, total, status, payment_status, payment_method, order_items(id, product_name, variant_name, unit_price, quantity, line_total)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const back = (
    <Link to="/account/orders" className="text-sm text-primary underline">
      ← All orders
    </Link>
  );
  if (!UUID.test(id) || (q.isSuccess && !q.data))
    return (
      <div className="space-y-3">
        {back}
        <FormAlert>We couldn't find that order on your account.</FormAlert>
      </div>
    );
  if (q.isLoading)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading order…
      </p>
    );
  if (q.isError || !q.data)
    return (
      <div className="space-y-3">
        {back}
        <FormAlert>Could not load this order. Please try again.</FormAlert>
      </div>
    );
  const o = q.data;
  return (
    <div className="space-y-6">
      {back}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl">Order #{o.order_number}</h2>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm">
          {ORDER_STATUS_LABEL[o.status] ?? o.status}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Placed{" "}
        {new Date(o.created_at).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </p>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Price</th>
              <th className="p-3">Qty</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {o.order_items.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="p-3">
                  {i.product_name}
                  {i.variant_name && (
                    <span className="block text-xs text-muted-foreground">{i.variant_name}</span>
                  )}
                </td>
                <td className="p-3">{formatTaka(i.unit_price)}</td>
                <td className="p-3">{i.quantity}</td>
                <td className="p-3 text-right">
                  {formatTaka(i.line_total ?? i.unit_price * i.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5 text-sm">
          <h3 className="mb-2 font-medium">Delivery</h3>
          <p>
            {o.customer_name} · {o.phone}
          </p>
          <p className="text-muted-foreground">{o.address}</p>
          <p className="text-muted-foreground">{o.area}</p>
          {o.notes && <p className="mt-2 text-muted-foreground">Note: {o.notes}</p>}
        </div>
        <div className="space-y-1 rounded-lg border border-border bg-card p-5 text-sm">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatTaka(o.subtotal)}</span>
          </p>
          <p className="flex justify-between">
            <span>Delivery</span>
            <span>{formatTaka(o.delivery_fee)}</span>
          </p>
          {o.discount > 0 && (
            <p className="flex justify-between">
              <span>Discount</span>
              <span>− {formatTaka(o.discount)}</span>
            </p>
          )}
          <p className="flex justify-between border-t border-border pt-2 text-base font-medium">
            <span>Total</span>
            <span>{formatTaka(o.total)}</span>
          </p>
          <p className="pt-2 text-muted-foreground">
            Payment: Cash on Delivery — {PAYMENT_STATUS_LABEL[o.payment_status] ?? o.payment_status}
          </p>
        </div>
      </div>
    </div>
  );
}
