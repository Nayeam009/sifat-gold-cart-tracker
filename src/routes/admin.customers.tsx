import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatTaka } from "@/lib/catalog";
import { ADMIN_PAGE, errMsg } from "@/lib/admin";
import { AdminTitle, Pager, StatePanel, inputCls } from "@/components/admin/confirm";

export const Route = createFileRoute("/admin/customers")({ component: Customers });

function Customers() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const data = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("customer_name, phone, email, city, total, status, created_at, user_id").order("created_at", { ascending: false }).limit(5000);
      if (error) throw new Error(errMsg(error));
      return data;
    },
  });
  const customers = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; email: string | null; city: string; orders: number; spent: number; last: string; account: boolean }>();
    for (const o of data.data ?? []) {
      const c = map.get(o.phone) ?? { name: o.customer_name, phone: o.phone, email: o.email, city: o.city, orders: 0, spent: 0, last: o.created_at, account: false };
      c.orders++;
      if (o.status !== "cancelled" && o.status !== "returned") c.spent += o.total;
      c.account ||= !!o.user_id;
      map.set(o.phone, c);
    }
    const t = q.trim().toLowerCase();
    return [...map.values()].filter((c) => !t || c.name.toLowerCase().includes(t) || c.phone.includes(t) || (c.email ?? "").toLowerCase().includes(t));
  }, [data.data, q]);
  return (
    <div>
      <AdminTitle title="Customers" />
      <p className="-mt-4 mb-4 text-sm text-muted-foreground">Grouped by phone number from orders. "Spent" excludes cancelled and returned orders.</p>
      <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Name, phone or email" aria-label="Search customers" className={`${inputCls} mb-4 max-w-xs`} />
      {data.isPending ? <StatePanel>Loading…</StatePanel> : data.isError ? <StatePanel tone="error">{data.error.message}</StatePanel> : customers.length === 0 ? <StatePanel>No customers found.</StatePanel> : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Customer</th><th className="px-3 py-2">District</th><th className="px-3 py-2">Orders</th><th className="px-3 py-2">Spent</th><th className="px-3 py-2">Last order</th></tr></thead>
            <tbody>
              {customers.slice(page * ADMIN_PAGE, (page + 1) * ADMIN_PAGE).map((c) => (
                <tr key={c.phone} className="border-t border-border">
                  <td className="px-3 py-2">{c.name}{c.account && <span className="ml-1 text-xs text-primary">account</span>}<div className="text-xs text-muted-foreground">{c.phone}{c.email && ` · ${c.email}`}</div></td>
                  <td className="px-3 py-2">{c.city}</td>
                  <td className="px-3 py-2"><Link to="/admin/orders" search={{ q: c.phone }} className="text-primary hover:underline">{c.orders}</Link></td>
                  <td className="px-3 py-2">{formatTaka(c.spent)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(c.last).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} total={customers.length} size={ADMIN_PAGE} onPage={setPage} />
    </div>
  );
}
