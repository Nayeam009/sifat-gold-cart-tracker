import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { formatTaka } from "@/lib/catalog";
import { ADMIN_PAGE, ORDER_STATUSES, errMsg, safeSearch } from "@/lib/admin";
import { AdminTitle, Pager, StatePanel, inputCls } from "@/components/admin/confirm";
import { StatusBadge } from "@/components/admin/status-badge";

const search = z.object({ q: z.string().optional().catch(undefined), status: z.string().optional().catch(undefined), page: z.number().int().min(0).optional().catch(undefined) });

export const Route = createFileRoute("/admin/orders/")({ validateSearch: search, component: Orders });

function Orders() {
  const s = Route.useSearch();
  const nav = Route.useNavigate();
  const page = s.page ?? 0;
  const set = (p: Partial<typeof s>) => nav({ search: { ...s, page: 0, ...p }, replace: true });
  const q = useQuery({
    queryKey: ["admin", "orders", s],
    queryFn: async () => {
      let r = supabase.from("orders").select("id, order_number, customer_name, phone, city, total, status, payment_status, created_at", { count: "exact" })
        .order("created_at", { ascending: false }).range(page * ADMIN_PAGE, page * ADMIN_PAGE + ADMIN_PAGE - 1);
      if (s.status) r = r.eq("status", s.status);
      const t = safeSearch(s.q ?? "");
      if (t) r = r.or(`order_number.ilike.%${t}%,customer_name.ilike.%${t}%,phone.ilike.%${t}%`);
      const { data, error, count } = await r;
      if (error) throw new Error(errMsg(error));
      return { rows: data, count: count ?? 0 };
    },
  });
  return (
    <div>
      <AdminTitle title="Orders" />
      <div className="mb-4 flex flex-wrap gap-2">
        <input defaultValue={s.q} onChange={(e) => set({ q: e.target.value || undefined })} placeholder="Order no., name or phone" aria-label="Search orders" className={`${inputCls} max-w-xs`} />
        <select value={s.status ?? ""} onChange={(e) => set({ status: e.target.value || undefined })} aria-label="Filter by status" className={`${inputCls} max-w-[180px]`}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((st) => <option key={st} value={st} className="capitalize">{st}</option>)}
        </select>
        {(s.q || s.status) && <button className="text-sm text-primary" onClick={() => nav({ search: {} })}>Clear</button>}
      </div>
      {q.isPending ? <StatePanel>Loading orders…</StatePanel> : q.isError ? <StatePanel tone="error">{q.error.message}</StatePanel> : q.data.rows.length === 0 ? <StatePanel>No orders match.</StatePanel> : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Order</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">COD</th><th className="px-3 py-2 text-right">Total</th></tr></thead>
            <tbody>
              {q.data.rows.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-3 py-2"><Link to="/admin/orders/$id" params={{ id: o.id }} className="font-medium text-primary hover:underline">{o.order_number}</Link></td>
                  <td className="px-3 py-2">{o.customer_name}<div className="text-xs text-muted-foreground">{o.phone} · {o.city}</div></td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(o.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="px-3 py-2"><StatusBadge status={o.status} /></td>
                  <td className="px-3 py-2"><StatusBadge status={o.payment_status} /></td>
                  <td className="px-3 py-2 text-right">{formatTaka(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {q.data && <Pager page={page} total={q.data.count} size={ADMIN_PAGE} onPage={(p) => nav({ search: { ...s, page: p } })} />}
    </div>
  );
}
