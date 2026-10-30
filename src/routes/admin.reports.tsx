import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatTaka } from "@/lib/catalog";
import { errMsg } from "@/lib/admin";
import { downloadCsv } from "@/lib/admin-rules";
import { AdminTitle, Chip, StatePanel, btnGhost } from "@/components/admin/confirm";
import { StatusBadge } from "@/components/admin/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

const SalesChart = lazy(() => import("@/components/admin/sales-chart"));

export const Route = createFileRoute("/admin/reports")({ component: Reports });

const RANGES = [7, 30, 90] as const;
const COUNTED = (s: string) => s !== "cancelled" && s !== "returned";

function Reports() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const q = useQuery({
    queryKey: ["admin", "reports", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86_400_000).toISOString();
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, status, created_at, order_items(product_name, quantity, line_total, unit_price)")
        .gte("created_at", since)
        .order("created_at")
        .limit(5000);
      if (error) throw new Error(errMsg(error));
      return data;
    },
  });
  const r = useMemo(() => {
    const rows = q.data ?? [];
    const counted = rows.filter((o) => COUNTED(o.status));
    const revenue = counted.reduce((a, o) => a + o.total, 0);
    const byDay = new Map<string, { day: string; revenue: number; orders: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      const k = d.toISOString().slice(0, 10);
      byDay.set(k, { day: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), revenue: 0, orders: 0 });
    }
    for (const o of counted) {
      const e = byDay.get(o.created_at.slice(0, 10));
      if (e) {
        e.revenue += o.total;
        e.orders++;
      }
    }
    const status = new Map<string, number>();
    rows.forEach((o) => status.set(o.status, (status.get(o.status) ?? 0) + 1));
    const prod = new Map<string, { qty: number; sales: number }>();
    counted.forEach((o) =>
      o.order_items.forEach((i) => {
        const p = prod.get(i.product_name) ?? { qty: 0, sales: 0 };
        p.qty += i.quantity;
        p.sales += i.line_total ?? i.unit_price * i.quantity;
        prod.set(i.product_name, p);
      }),
    );
    return {
      revenue,
      orders: counted.length,
      aov: counted.length ? Math.round(revenue / counted.length) : 0,
      series: [...byDay.values()],
      status: [...status.entries()],
      top: [...prod.entries()].sort((a, b) => b[1].sales - a[1].sales).slice(0, 10),
    };
  }, [q.data, days]);
  return (
    <div>
      <AdminTitle title="Reports">
        <button
          className={btnGhost}
          disabled={!q.data}
          onClick={() => downloadCsv(`sales-${days}d.csv`, [["Day", "Orders", "Sales (BDT)"], ...r.series.map((d) => [d.day, d.orders, d.revenue])])}
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </AdminTitle>
      <div className="mb-4 flex gap-2">
        {RANGES.map((d) => (
          <Chip key={d} active={days === d} onClick={() => setDays(d)}>
            Last {d} days
          </Chip>
        ))}
      </div>
      {q.isPending ? (
        <Skeleton className="h-80 w-full" />
      ) : q.isError ? (
        <StatePanel tone="error">{q.error.message}</StatePanel>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Kpi label="Sales" value={formatTaka(r.revenue)} />
            <Kpi label="Orders" value={String(r.orders)} />
            <Kpi label="Avg. order" value={formatTaka(r.aov)} />
          </div>
          <p className="text-xs text-muted-foreground">Cancelled and returned orders are not counted in sales.</p>
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-2 font-display text-xl">Daily sales</h2>
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <SalesChart data={r.series} />
            </Suspense>
          </section>
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="mb-2 font-display text-xl">Top products</h2>
              {r.top.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sales in this period.</p>
              ) : (
                <ol className="space-y-1 text-sm">
                  {r.top.map(([n, p]) => (
                    <li key={n} className="flex justify-between gap-2">
                      <span className="min-w-0 truncate">{n}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {p.qty} · {formatTaka(p.sales)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="mb-2 font-display text-xl">Orders by status</h2>
              {r.status.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders in this period.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {r.status.map(([s, n]) => (
                    <li key={s} className="flex items-center justify-between">
                      <StatusBadge status={s} /> <span>{n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate font-display text-xl md:text-2xl">{value}</p>
    </div>
  );
}
