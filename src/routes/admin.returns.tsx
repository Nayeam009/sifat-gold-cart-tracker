import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { formatTaka } from "@/lib/catalog";
import { errMsg } from "@/lib/admin";
import { nextReturnStatuses, refundAllowed, type ReturnStatus } from "@/lib/admin-rules";
import { AdminTitle, Chip, StatePanel, btnGhost, btnPrimary, inputCls } from "@/components/admin/confirm";
import { StatusBadge } from "@/components/admin/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/returns")({
  validateSearch: z.object({ order: z.string().uuid().optional().catch(undefined) }),
  component: Returns,
});

const STATUSES: ReturnStatus[] = ["requested", "approved", "received", "completed", "rejected"];
const returnErr = (e: unknown) => {
  const m = (e as Error)?.message ?? "";
  if (m.includes("REFUND_TOO_HIGH")) return "The refund can't be more than the order total (including earlier refunds).";
  if (m.includes("INVALID_TRANSITION")) return "That step isn't allowed from the current status.";
  if (m.includes("REASON_REQUIRED")) return "Please give a reason.";
  return errMsg(e);
};

function Returns() {
  const { order } = Route.useSearch();
  const nav = Route.useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<ReturnStatus | null>(null);
  const list = useQuery({
    queryKey: ["admin", "returns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_returns")
        .select("*, orders(id, order_number, customer_name, phone, total)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw new Error(errMsg(error));
      return data;
    },
  });
  const step = useMutation({
    mutationFn: async ({ id, to }: { id: string; to: ReturnStatus }) => {
      const { error } = await supabase.rpc("admin_return_transition", { p_id: id, p_to: to, p_note: "" });
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      toast.success(`Return marked ${v.to}`);
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(returnErr(e)),
  });
  const rows = (list.data ?? []).filter((r) => !filter || r.status === filter);
  return (
    <div>
      <AdminTitle title="Returns & exchanges" />
      <p className="-mt-4 mb-4 text-sm text-muted-foreground">
        Start a return from an order's page. Steps: requested → approved → received (puts stock back if chosen) → completed. Records are kept for your audit trail.
      </p>
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Chip active={!filter} onClick={() => setFilter(null)}>
          All
        </Chip>
        {STATUSES.map((s) => (
          <Chip key={s} active={filter === s} onClick={() => setFilter(s)}>
            <span className="capitalize">{s}</span>
          </Chip>
        ))}
      </div>
      {list.isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : list.isError ? (
        <StatePanel tone="error">{list.error.message}</StatePanel>
      ) : rows.length === 0 ? (
        <StatePanel>No returns yet.</StatePanel>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => (
            <li key={r.id} className="rounded-lg border border-border bg-card p-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                {r.orders && (
                  <Link to="/admin/orders/$id" params={{ id: r.orders.id }} className="font-medium text-primary">
                    {r.orders.order_number}
                  </Link>
                )}
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-1">{r.orders?.customer_name} · {r.orders?.phone}</p>
              <p className="mt-1 text-muted-foreground">
                <span className="capitalize">{r.kind}</span> · {r.reason}
              </p>
              <p className="mt-1">
                Refund {formatTaka(r.refund_amount)} ({r.refund_method.replace("_", " ")}) · {r.restock ? "restock" : "no restock"}
              </p>
              <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("en-GB")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {nextReturnStatuses(r.status as ReturnStatus).map((to) => (
                  <button
                    key={to}
                    disabled={step.isPending}
                    onClick={() => step.mutate({ id: r.id, to })}
                    className={to === "rejected" ? btnGhost : btnPrimary}
                  >
                    Mark {to}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
      {order && <NewReturn orderId={order} onClose={() => nav({ search: {} })} />}
    </div>
  );
}

function NewReturn({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const o = useQuery({
    queryKey: ["admin", "return-order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, total, order_items(id, product_name, variant_name, quantity), order_returns(refund_amount, status)")
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw new Error(errMsg(error));
      return data;
    },
  });
  const [qty, setQty] = useState<Record<string, number>>({});
  const [f, setF] = useState({ kind: "return", reason: "", refund: "0", method: "cash", restock: true });
  useEffect(() => {
    if (o.data) setQty(Object.fromEntries(o.data.order_items.map((i) => [i.id, i.quantity])));
  }, [o.data]);
  const prior = (o.data?.order_returns ?? []).filter((r) => r.status !== "rejected").reduce((a, r) => a + r.refund_amount, 0);
  const create = useMutation({
    mutationFn: async () => {
      const refund = Math.round(Number(f.refund));
      if (!f.reason.trim()) throw new Error("REASON_REQUIRED");
      if (!o.data || !refundAllowed(o.data.total, prior, refund)) throw new Error("REFUND_TOO_HIGH");
      const items = Object.entries(qty).filter(([, n]) => n > 0).map(([order_item_id, quantity]) => ({ order_item_id, quantity }));
      const { error } = await supabase.rpc("admin_create_return", {
        p_order_id: orderId,
        p_kind: f.kind,
        p_reason: f.reason.trim(),
        p_items: items,
        p_refund: refund,
        p_method: f.method,
        p_restock: f.restock,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Return created");
      qc.invalidateQueries({ queryKey: ["admin"] });
      onClose();
    },
    onError: (e) => toast.error(returnErr(e)),
  });
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New return {o.data && `· ${o.data.order_number}`}</DialogTitle>
        </DialogHeader>
        {o.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : !o.data ? (
          <p className="text-sm text-destructive">Order not found.</p>
        ) : (
          <form
            className="space-y-3 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <fieldset className="space-y-2">
              <legend className="mb-1">Items coming back</legend>
              {o.data.order_items.map((i) => (
                <label key={i.id} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate">
                    {i.product_name}
                    {i.variant_name && ` — ${i.variant_name}`}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={i.quantity}
                    value={qty[i.id] ?? 0}
                    onChange={(e) => setQty({ ...qty, [i.id]: Math.max(0, Math.min(i.quantity, Number(e.target.value) || 0)) })}
                    className={`${inputCls} w-20`}
                    aria-label={`Quantity of ${i.product_name}`}
                  />
                </label>
              ))}
            </fieldset>
            <label className="block">
              Type
              <select className={`${inputCls} mt-1`} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
                <option value="return">Return</option>
                <option value="exchange">Exchange</option>
              </select>
            </label>
            <label className="block">
              Reason
              <textarea required maxLength={500} rows={2} className={`${inputCls} mt-1`} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                Refund (৳)
                <input type="number" min={0} max={o.data.total - prior} className={`${inputCls} mt-1`} value={f.refund} onChange={(e) => setF({ ...f, refund: e.target.value })} />
              </label>
              <label className="block">
                Refund as
                <select className={`${inputCls} mt-1`} value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
                  <option value="cash">Cash</option>
                  <option value="store_credit">Store credit</option>
                  <option value="none">No refund</option>
                </select>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Order total {formatTaka(o.data.total)} · already refunded {formatTaka(prior)}
            </p>
            <label className="flex min-h-11 items-center gap-2">
              <input type="checkbox" checked={f.restock} onChange={(e) => setF({ ...f, restock: e.target.checked })} className="h-5 w-5 accent-primary" />
              Put items back in stock when received
            </label>
            <button className={`${btnPrimary} w-full`} disabled={create.isPending}>
              {create.isPending ? "Saving…" : "Create return"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
