import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Phone, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatTaka } from "@/lib/catalog";
import { ORDER_STATUSES, PAYMENT_STATUSES, errMsg } from "@/lib/admin";
import { AdminTitle, StatePanel, btnPrimary, inputCls } from "@/components/admin/confirm";
import { StatusBadge } from "@/components/admin/status-badge";

export const Route = createFileRoute("/admin/orders/$id")({ component: OrderDetail });

function OrderDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), order_status_history(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(errMsg(error));
      if (!data) return null;
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("phone", data.phone);
      return { ...data, phoneOrders: count ?? 1 };
    },
  });
  const [form, setForm] = useState({ status: "", payment_status: "", admin_notes: "" });
  useEffect(() => {
    if (q.data)
      setForm({
        status: q.data.status,
        payment_status: q.data.payment_status,
        admin_notes: q.data.admin_notes ?? "",
      });
  }, [q.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (form.payment_status === "collected" && form.status === "cancelled")
        throw new Error("A cancelled order can't be marked as cash collected.");
      const { error } = await supabase
        .from("orders")
        .update({
          status: form.status,
          payment_status: form.payment_status,
          admin_notes: form.admin_notes.trim().slice(0, 1000) || null,
        })
        .eq("id", id);
      if (error) throw new Error(errMsg(error));
    },
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (q.isPending) return <StatePanel>Loading order…</StatePanel>;
  if (q.isError) return <StatePanel tone="error">{q.error.message}</StatePanel>;
  if (!q.data)
    return (
      <StatePanel>
        Order not found.{" "}
        <Link to="/admin/orders" className="text-primary">
          Back to orders
        </Link>
      </StatePanel>
    );
  const o = q.data;
  const wa = `https://wa.me/88${o.phone}`;
  const history = [...o.order_status_history].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  return (
    <div>
      <Link to="/admin/orders" className="text-sm text-primary">
        ← Orders
      </Link>
      <AdminTitle title={`Order ${o.order_number}`}>
        <StatusBadge status={o.status} />
        <StatusBadge status={o.payment_status} />
      </AdminTitle>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 font-display text-xl">Items</h2>
            <table className="w-full text-sm">
              <tbody>
                {o.order_items.map((it) => (
                  <tr key={it.id} className="border-b border-border last:border-0">
                    <td className="py-2">
                      {it.product_name}
                      {it.variant_name && (
                        <span className="text-muted-foreground"> — {it.variant_name}</span>
                      )}
                      <div className="text-xs text-muted-foreground">SKU {it.sku ?? "—"}</div>
                    </td>
                    <td className="py-2 text-right text-muted-foreground">
                      {it.quantity} × {formatTaka(it.unit_price)}
                    </td>
                    <td className="py-2 text-right">
                      {formatTaka(it.line_total ?? it.unit_price * it.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-3 space-y-1 text-sm">
              <Row k="Subtotal" v={formatTaka(o.subtotal)} />
              <Row k={`Delivery (${o.area})`} v={formatTaka(o.delivery_fee)} />
              {o.discount > 0 && (
                <Row
                  k={`Discount${o.coupon_code ? ` (${o.coupon_code})` : ""}`}
                  v={`− ${formatTaka(o.discount)}`}
                />
              )}
              <Row k="Total to collect (COD)" v={formatTaka(o.total)} bold />
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">
              Prices are a snapshot from when the order was placed and can't be edited.
            </p>
          </section>
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 font-display text-xl">History</h2>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No changes yet. Placed {new Date(o.created_at).toLocaleString("en-GB")}.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {history.map((h) => (
                  <li key={h.id}>
                    <span className="text-muted-foreground">
                      {new Date(h.created_at).toLocaleString("en-GB")}
                    </span>{" "}
                    — {h.field === "status" ? "Status" : "Payment"}: {h.old_value} →{" "}
                    <b>{h.new_value}</b>
                  </li>
                ))}
                <li className="text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("en-GB")} — Order placed
                </li>
              </ul>
            )}
          </section>
        </div>
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-4 text-sm">
            <h2 className="mb-2 font-display text-xl">Customer</h2>
            <p className="font-medium">{o.customer_name}</p>
            <p>{o.phone}</p>
            {o.email && <p>{o.email}</p>}
            <div className="mt-2 flex gap-3">
              <a href={`tel:${o.phone}`} className="flex items-center gap-1 text-primary">
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </div>
            <h3 className="mt-4 text-xs uppercase text-muted-foreground">Deliver to</h3>
            <p>{o.address}</p>
            {o.notes && (
              <>
                <h3 className="mt-3 text-xs uppercase text-muted-foreground">Customer note</h3>
                <p>{o.notes}</p>
              </>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              {o.user_id ? "Signed-in customer" : "Guest checkout"} ·{" "}
              <Link to="/admin/orders" search={{ q: o.phone }} className="text-primary">
                {o.phoneOrders} order(s) from this phone
              </Link>
            </p>
          </section>
          <form
            className="space-y-3 rounded-lg border border-border bg-card p-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <h2 className="font-display text-xl">Update</h2>
            <label className="block text-sm">
              Order status
              <select
                className={`${inputCls} mt-1 capitalize`}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Cash on delivery
              <select
                className={`${inputCls} mt-1`}
                value={form.payment_status}
                onChange={(e) => setForm({ ...form, payment_status: e.target.value })}
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === "unpaid"
                      ? "Not collected yet"
                      : s === "collected"
                        ? "Cash collected"
                        : "Refunded"}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Internal notes (not shown to customer)
              <textarea
                rows={3}
                maxLength={1000}
                className={`${inputCls} mt-1`}
                value={form.admin_notes}
                onChange={(e) => setForm({ ...form, admin_notes: e.target.value })}
              />
            </label>
            <button className={`${btnPrimary} w-full`} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save changes"}
            </button>
            <p className="text-xs text-muted-foreground">
              Last updated {new Date(o.updated_at).toLocaleString("en-GB")}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

const Row = ({ k, v, bold }: { k: string; v: string; bold?: boolean }) => (
  <div
    className={`flex justify-between ${bold ? "border-t border-border pt-1 font-semibold" : ""}`}
  >
    <dt>{k}</dt>
    <dd>{v}</dd>
  </div>
);
