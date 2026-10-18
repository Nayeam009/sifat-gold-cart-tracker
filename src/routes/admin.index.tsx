import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatTaka } from "@/lib/catalog";
import { LOW_STOCK, errMsg, orderMetrics } from "@/lib/admin";
import { AdminTitle, StatePanel } from "@/components/admin/confirm";
import { StatusBadge } from "@/components/admin/status-badge";

export const Route = createFileRoute("/admin/")({ component: Overview });

function Overview() {
  const q = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const [orders, recent, products, variants] = await Promise.all([
        supabase.from("orders").select("total, status, payment_status, created_at").limit(5000),
        supabase.from("orders").select("id, order_number, customer_name, phone, total, status, payment_status, created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("products").select("id, name, stock_quantity, is_published, product_images(id), product_variants(id)"),
        supabase.from("product_variants").select("id, name, stock_quantity, is_active, product_id, products(name)").eq("is_active", true).lte("stock_quantity", LOW_STOCK),
      ]);
      const err = orders.error || recent.error || products.error || variants.error;
      if (err) throw new Error(errMsg(err));
      return { orders: orders.data, recent: recent.data, products: products.data, variants: variants.data };
    },
  });
  if (q.isPending) return <StatePanel>Loading dashboard…</StatePanel>;
  if (q.isError) return <StatePanel tone="error">{q.error.message}</StatePanel>;
  const m = orderMetrics(q.data.orders);
  const simple = q.data.products.filter((p) => p.product_variants.length === 0);
  const low = [
    ...simple.filter((p) => p.stock_quantity <= LOW_STOCK).map((p) => ({ id: p.id, name: p.name, stock: p.stock_quantity })),
    ...q.data.variants.map((v) => ({ id: v.product_id, name: `${v.products?.name ?? ""} — ${v.name}`, stock: v.stock_quantity })),
  ].sort((a, b) => a.stock - b.stock);
  const dayAgo = Date.now() - 24 * 3600_000;
  const stalePending = q.data.orders.filter((o) => o.status === "pending" && Date.parse(o.created_at) < dayAgo).length;
  const noImage = q.data.products.filter((p) => p.is_published && p.product_images.length === 0).length;
  const alerts = [
    stalePending && `${stalePending} order(s) have been pending for over 24 hours.`,
    low.filter((l) => l.stock === 0).length && `${low.filter((l) => l.stock === 0).length} item(s) are out of stock.`,
    noImage && `${noImage} published product(s) have no uploaded photo yet.`,
  ].filter(Boolean) as string[];

  return (
    <div>
      <AdminTitle title="Overview" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Orders (all time)" value={String(m.totalOrders)} hint="Every order ever placed" />
        <Kpi label="Orders today" value={String(m.todayOrders)} hint="Placed since midnight (UTC)" />
        <Kpi label="Awaiting confirmation" value={String(m.pending)} hint="Status: pending" />
        <Kpi label="Cash collected" value={formatTaka(m.collectedRevenue)} hint="Orders marked COD collected" />
        <Kpi label="Cash to collect" value={formatTaka(m.pipeline)} hint="Open orders not yet paid" />
      </div>

      {alerts.length > 0 && (
        <div className="mt-6 space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          {alerts.map((a) => <p key={a} className="flex items-center gap-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4" /> {a}</p>)}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
          <div className="mb-3 flex justify-between"><h2 className="font-display text-xl">Recent orders</h2><Link to="/admin/orders" className="text-sm text-primary">All orders →</Link></div>
          {q.data.recent.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet.</p> : (
            <ul className="divide-y divide-border text-sm">
              {q.data.recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                  <Link to="/admin/orders/$id" params={{ id: o.id }} className="font-medium hover:underline">{o.order_number}</Link>
                  <span className="hidden flex-1 truncate text-muted-foreground sm:block">{o.customer_name}</span>
                  <StatusBadge status={o.status} />
                  <span className="w-20 text-right">{formatTaka(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex justify-between"><h2 className="font-display text-xl">Low stock</h2><Link to="/admin/inventory" className="text-sm text-primary">Inventory →</Link></div>
          {low.length === 0 ? <p className="text-sm text-muted-foreground">Everything has more than {LOW_STOCK} in stock.</p> : (
            <ul className="space-y-1.5 text-sm">
              {low.slice(0, 10).map((l, i) => (
                <li key={i} className="flex justify-between gap-2"><Link to="/admin/products/$id" params={{ id: l.id }} className="truncate hover:underline">{l.name}</Link>
                  <span className={l.stock === 0 ? "text-destructive" : "text-muted-foreground"}>{l.stock === 0 ? "Out" : l.stock}</span></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
