import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Printer, Download } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { formatTaka } from "@/lib/catalog";
import { ADMIN_PAGE, ORDER_STATUSES, errMsg, safeSearch } from "@/lib/admin";
import { downloadCsv } from "@/lib/admin-rules";
import { AdminTitle, Chip, Pager, StatePanel, btnGhost, inputCls } from "@/components/admin/confirm";
import { StatusBadge } from "@/components/admin/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

const search = z.object({
  q: z.string().optional().catch(undefined),
  status: z.string().optional().catch(undefined),
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
  page: z.number().int().min(0).optional().catch(undefined),
});

export const Route = createFileRoute("/admin/orders/")({
  validateSearch: search,
  component: Orders,
});

const fmtDate = (d: string) =>
  new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

function Orders() {
  const s = Route.useSearch();
  const nav = Route.useNavigate();
  const qc = useQueryClient();
  const page = s.page ?? 0;
  const [sel, setSel] = useState<Set<string>>(new Set());
  const set = (p: Partial<typeof s>) => {
    setSel(new Set());
    nav({ search: { ...s, page: 0, ...p }, replace: true });
  };
  const counts = useQuery({
    queryKey: ["admin", "order-counts"],
    queryFn: async () => {
      const res = await Promise.all(
        ORDER_STATUSES.map((st) =>
          supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", st),
        ),
      );
      return Object.fromEntries(ORDER_STATUSES.map((st, i) => [st, res[i]?.count ?? 0]));
    },
  });
  const q = useQuery({
    queryKey: ["admin", "orders", s],
    queryFn: async () => {
      let r = supabase
        .from("orders")
        .select(
          "id, order_number, customer_name, phone, city, area, address, total, status, payment_status, created_at, courier_name, tracking_code",
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(page * ADMIN_PAGE, page * ADMIN_PAGE + ADMIN_PAGE - 1);
      if (s.status) r = r.eq("status", s.status);
      if (s.from) r = r.gte("created_at", new Date(s.from).toISOString());
      if (s.to) r = r.lt("created_at", new Date(new Date(s.to).getTime() + 86_400_000).toISOString());
      const t = safeSearch(s.q ?? "");
      if (t) r = r.or(`order_number.ilike.%${t}%,customer_name.ilike.%${t}%,phone.ilike.%${t}%`);
      const { data, error, count } = await r;
      if (error) throw new Error(errMsg(error));
      return { rows: data, count: count ?? 0 };
    },
  });
  const bulk = useMutation({
    mutationFn: async (status: string) => {
      const ids = [...sel];
      const { error } = await supabase.from("orders").update({ status }).in("id", ids);
      if (error) throw new Error(errMsg(error));
      return ids.length;
    },
    onSuccess: (n, st) => {
      toast.success(`${n} order${n > 1 ? "s" : ""} marked ${st}`);
      setSel(new Set());
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const rows = q.data?.rows ?? [];
  const allSel = rows.length > 0 && rows.every((r) => sel.has(r.id));
  const toggle = (id: string) =>
    setSel((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const ids = [...sel].join(",");
  return (
    <div>
      <AdminTitle title="Orders">
        <button
          className={btnGhost}
          disabled={!rows.length}
          onClick={() =>
            downloadCsv("orders.csv", [
              ["Order", "Date", "Customer", "Phone", "District", "Status", "COD", "Total"],
              ...rows.map((o) => [o.order_number, o.created_at, o.customer_name, o.phone, o.city, o.status, o.payment_status, o.total]),
            ])
          }
        >
          <Download className="h-4 w-4" /> Export page
        </button>
      </AdminTitle>

      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        <Chip active={!s.status} onClick={() => set({ status: undefined })}>
          All
        </Chip>
        {ORDER_STATUSES.map((st) => (
          <Chip key={st} active={s.status === st} onClick={() => set({ status: st })}>
            <span className="capitalize">{st}</span>
            {counts.data && <span className="ml-1 text-xs opacity-70">{counts.data[st]}</span>}
          </Chip>
        ))}
      </div>
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <input
          defaultValue={s.q}
          onChange={(e) => set({ q: e.target.value || undefined })}
          placeholder="Order no., name or phone"
          aria-label="Search orders"
          className={inputCls}
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          From
          <input type="date" value={s.from ?? ""} onChange={(e) => set({ from: e.target.value || undefined })} className={inputCls} />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          To
          <input type="date" value={s.to ?? ""} onChange={(e) => set({ to: e.target.value || undefined })} className={inputCls} />
        </label>
        {(s.q || s.status || s.from || s.to) && (
          <button className="min-h-11 text-sm text-primary" onClick={() => nav({ search: {} })}>
            Clear
          </button>
        )}
      </div>

      {sel.size > 0 && (
        <div className="sticky top-14 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-card p-2 shadow-sm md:top-2">
          <span className="px-2 text-sm font-medium">{sel.size} selected</span>
          <select
            aria-label="Mark selected as"
            defaultValue=""
            disabled={bulk.isPending}
            onChange={(e) => {
              if (e.target.value) bulk.mutate(e.target.value);
              e.target.value = "";
            }}
            className={`${inputCls} w-auto`}
          >
            <option value="">Mark as…</option>
            {ORDER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <a className={btnGhost} href={`/admin-print?type=invoice&ids=${ids}`} target="_blank" rel="noreferrer">
            <Printer className="h-4 w-4" /> Invoices
          </a>
          <a className={btnGhost} href={`/admin-print?type=label&ids=${ids}`} target="_blank" rel="noreferrer">
            <Printer className="h-4 w-4" /> Labels
          </a>
          <button className="ml-auto px-2 text-sm text-muted-foreground" onClick={() => setSel(new Set())}>
            Clear
          </button>
        </div>
      )}

      {q.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : q.isError ? (
        <StatePanel tone="error">{q.error.message}</StatePanel>
      ) : rows.length === 0 ? (
        <StatePanel>No orders match.</StatePanel>
      ) : (
        <>
          <ul className="space-y-2 md:hidden">
            {rows.map((o) => (
              <li key={o.id} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                <input
                  type="checkbox"
                  aria-label={`Select ${o.order_number}`}
                  checked={sel.has(o.id)}
                  onChange={() => toggle(o.id)}
                  className="mt-1 h-5 w-5 accent-primary"
                />
                <Link to="/admin/orders/$id" params={{ id: o.id }} className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-primary">{o.order_number}</span>
                    <span className="font-medium">{formatTaka(o.total)}</span>
                  </div>
                  <p className="truncate text-sm">{o.customer_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {o.phone} · {o.city} · {fmtDate(o.created_at)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <StatusBadge status={o.status} />
                    <StatusBadge status={o.payment_status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label="Select all on this page"
                      checked={allSel}
                      onChange={() => setSel(allSel ? new Set() : new Set(rows.map((r) => r.id)))}
                      className="h-4 w-4 accent-primary"
                    />
                  </th>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">COD</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label={`Select ${o.order_number}`}
                        checked={sel.has(o.id)}
                        onChange={() => toggle(o.id)}
                        className="h-4 w-4 accent-primary"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Link to="/admin/orders/$id" params={{ id: o.id }} className="font-medium text-primary hover:underline">
                        {o.order_number}
                      </Link>
                      {o.tracking_code && <div className="text-xs text-muted-foreground">{o.courier_name} · {o.tracking_code}</div>}
                    </td>
                    <td className="px-3 py-2">
                      {o.customer_name}
                      <div className="text-xs text-muted-foreground">
                        {o.phone} · {o.city}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{fmtDate(o.created_at)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={o.payment_status} />
                    </td>
                    <td className="px-3 py-2 text-right">{formatTaka(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {q.data && (
        <Pager page={page} total={q.data.count} size={ADMIN_PAGE} onPage={(p) => nav({ search: { ...s, page: p } })} />
      )}
    </div>
  );
}
