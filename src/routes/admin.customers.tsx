import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatTaka } from "@/lib/catalog";
import { ADMIN_PAGE, errMsg } from "@/lib/admin";
import { SEGMENT_LABELS, customerSegments, downloadCsv, type Segment } from "@/lib/admin-rules";
import { AdminTitle, Chip, Pager, StatePanel, btnGhost, inputCls } from "@/components/admin/confirm";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/customers")({ component: Customers });

function Customers() {
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState<Segment | null>(null);
  const [page, setPage] = useState(0);
  const data = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("customer_name, phone, email, city, total, status, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw new Error(errMsg(error));
      return data;
    },
  });
  const all = useMemo(() => {
    const map = new Map<
      string,
      { name: string; phone: string; email: string | null; city: string; orders: number; spent: number; last: string; account: boolean }
    >();
    for (const o of data.data ?? []) {
      const c = map.get(o.phone) ?? {
        name: o.customer_name,
        phone: o.phone,
        email: o.email,
        city: o.city,
        orders: 0,
        spent: 0,
        last: o.created_at,
        account: false,
      };
      c.orders++;
      if (o.status !== "cancelled" && o.status !== "returned") c.spent += o.total;
      c.account ||= !!o.user_id;
      map.set(o.phone, c);
    }
    return [...map.values()].map((c) => ({ ...c, segments: customerSegments(c) }));
  }, [data.data]);
  const customers = useMemo(() => {
    const t = q.trim().toLowerCase();
    return all.filter(
      (c) =>
        (!seg || c.segments.includes(seg)) &&
        (!t || c.name.toLowerCase().includes(t) || c.phone.includes(t) || (c.email ?? "").toLowerCase().includes(t)),
    );
  }, [all, q, seg]);
  const pageRows = customers.slice(page * ADMIN_PAGE, (page + 1) * ADMIN_PAGE);
  return (
    <div>
      <AdminTitle title="Customers">
        <button
          className={btnGhost}
          disabled={!customers.length}
          onClick={() =>
            downloadCsv("customers.csv", [
              ["Name", "Phone", "Email", "District", "Orders", "Spent (BDT)", "Last order", "Groups"],
              ...customers.map((c) => [c.name, c.phone, c.email, c.city, c.orders, c.spent, c.last.slice(0, 10), c.segments.map((s) => SEGMENT_LABELS[s]).join(" ")]),
            ])
          }
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </AdminTitle>
      <p className="-mt-4 mb-4 text-sm text-muted-foreground">
        Grouped by phone number. VIP = 4+ orders · High spender = ৳10,000+ · At risk = no order for 60+ days · New = one order.
      </p>
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Chip active={!seg} onClick={() => { setSeg(null); setPage(0); }}>
          All <span className="ml-1 text-xs opacity-70">{all.length}</span>
        </Chip>
        {(Object.keys(SEGMENT_LABELS) as Segment[]).map((s) => (
          <Chip key={s} active={seg === s} onClick={() => { setSeg(s); setPage(0); }}>
            {SEGMENT_LABELS[s]}
            <span className="ml-1 text-xs opacity-70">{all.filter((c) => c.segments.includes(s)).length}</span>
          </Chip>
        ))}
      </div>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(0);
        }}
        placeholder="Name, phone or email"
        aria-label="Search customers"
        className={`${inputCls} mb-4 sm:max-w-xs`}
      />
      {data.isPending ? (
        <Skeleton className="h-48 w-full" />
      ) : data.isError ? (
        <StatePanel tone="error">{data.error.message}</StatePanel>
      ) : customers.length === 0 ? (
        <StatePanel>No customers found.</StatePanel>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {pageRows.map((c) => (
            <li key={c.phone}>
              <Link
                to="/admin/customers/$phone"
                params={{ phone: c.phone }}
                className="grid min-h-14 gap-1 p-3 text-sm hover:bg-muted/50 md:grid-cols-[2fr_1fr_auto_auto_auto] md:items-center md:gap-4"
              >
                <div className="min-w-0">
                  <span className="font-medium">{c.name}</span>
                  {c.account && <span className="ml-1 text-xs text-primary">account</span>}
                  <div className="truncate text-xs text-muted-foreground">
                    {c.phone}
                    {c.email && ` · ${c.email}`}
                  </div>
                  {c.segments.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.segments.map((s) => (
                        <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-foreground">
                          {SEGMENT_LABELS[s]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-muted-foreground">{c.city}</span>
                <span>{c.orders} orders</span>
                <span className="font-medium">{formatTaka(c.spent)}</span>
                <span className="text-xs text-muted-foreground">{new Date(c.last).toLocaleDateString("en-GB")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {customers.length > 0 && <Pager page={page} total={customers.length} size={ADMIN_PAGE} onPage={setPage} />}
    </div>
  );
}
