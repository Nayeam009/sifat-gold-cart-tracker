import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Phone, MessageCircle, Trash2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { formatTaka } from "@/lib/catalog";
import { errMsg } from "@/lib/admin";
import { SEGMENT_LABELS, creditChangeAllowed, customerSegments } from "@/lib/admin-rules";
import { AdminTitle, Confirm, StatePanel, btnGhost, btnPrimary, inputCls } from "@/components/admin/confirm";
import { StatusBadge } from "@/components/admin/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/customers_/$phone")({ component: CustomerDetail });

const creditSchema = z.object({
  amount: z.number().int().refine((n) => n !== 0, "Enter an amount"),
  reason: z.string().trim().min(2, "Give a reason").max(200),
});

function CustomerDetail() {
  const { phone } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "customer", phone],
    queryFn: async () => {
      const [orders, notes, credits] = await Promise.all([
        supabase.from("orders").select("id, order_number, customer_name, email, city, address, total, status, created_at").eq("phone", phone).order("created_at", { ascending: false }),
        supabase.from("customer_notes").select("*").eq("phone", phone).order("created_at", { ascending: false }),
        supabase.from("store_credits").select("*").eq("phone", phone).order("created_at", { ascending: false }),
      ]);
      const err = orders.error ?? notes.error ?? credits.error;
      if (err) throw new Error(errMsg(err));
      return { orders: orders.data ?? [], notes: notes.data ?? [], credits: credits.data ?? [] };
    },
  });
  const [note, setNote] = useState("");
  const [credit, setCredit] = useState({ amount: "", reason: "", sign: 1 });
  const addNote = useMutation({
    mutationFn: async () => {
      const body = note.trim();
      if (!body) throw new Error("Write a note first.");
      const { error } = await supabase.from("customer_notes").insert({ phone, body: body.slice(0, 1000) });
      if (error) throw new Error(errMsg(error));
    },
    onSuccess: () => {
      setNote("");
      toast.success("Note saved");
      qc.invalidateQueries({ queryKey: ["admin", "customer", phone] });
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const delNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_notes").delete().eq("id", id);
      if (error) throw new Error(errMsg(error));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "customer", phone] }),
  });
  const balance = (q.data?.credits ?? []).reduce((a, c) => a + c.amount, 0);
  const addCredit = useMutation({
    mutationFn: async () => {
      const parsed = creditSchema.safeParse({ amount: Math.round(Number(credit.amount)) * credit.sign, reason: credit.reason });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the values");
      if (!creditChangeAllowed(balance, parsed.data.amount)) throw new Error("Store credit can't go below zero.");
      const { error } = await supabase.rpc("admin_add_store_credit", { p_phone: phone, p_amount: parsed.data.amount, p_reason: parsed.data.reason });
      if (error) throw new Error(error.message.includes("CREDIT_BELOW_ZERO") ? "Store credit can't go below zero." : errMsg(error));
    },
    onSuccess: () => {
      setCredit({ amount: "", reason: "", sign: 1 });
      toast.success("Store credit updated");
      qc.invalidateQueries({ queryKey: ["admin", "customer", phone] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (q.isPending) return <Skeleton className="h-96 w-full" />;
  if (q.isError) return <StatePanel tone="error">{q.error.message}</StatePanel>;
  const { orders, notes, credits } = q.data;
  if (orders.length === 0)
    return (
      <StatePanel>
        No orders from this phone. <Link to="/admin/customers" className="text-primary">Back</Link>
      </StatePanel>
    );
  const latest = orders[0]!;
  const spent = orders.filter((o) => o.status !== "cancelled" && o.status !== "returned").reduce((a, o) => a + o.total, 0);
  const segs = customerSegments({ orders: orders.length, spent, last: latest.created_at });
  return (
    <div>
      <Link to="/admin/customers" className="text-sm text-primary">← Customers</Link>
      <AdminTitle title={latest.customer_name}>
        {segs.map((s) => (
          <span key={s} className="rounded-full bg-primary/10 px-3 py-1 text-xs">{SEGMENT_LABELS[s]}</span>
        ))}
      </AdminTitle>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-3 gap-2">
            <Box label="Orders" value={String(orders.length)} />
            <Box label="Spent" value={formatTaka(spent)} />
            <Box label="Store credit" value={formatTaka(balance)} />
          </div>
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-2 font-display text-xl">Orders</h2>
            <ul className="divide-y divide-border text-sm">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link to="/admin/orders/$id" params={{ id: o.id }} className="flex min-h-12 items-center justify-between gap-2 py-2 hover:bg-muted/40">
                    <span>
                      <span className="font-medium text-primary">{o.order_number}</span>
                      <span className="block text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-GB")}</span>
                    </span>
                    <StatusBadge status={o.status} />
                    <span>{formatTaka(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-2 font-display text-xl">Store credit</h2>
            <form
              className="mb-3 grid gap-2 sm:grid-cols-[auto_8rem_1fr_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                addCredit.mutate();
              }}
            >
              <select aria-label="Add or remove" className={inputCls} value={credit.sign} onChange={(e) => setCredit({ ...credit, sign: Number(e.target.value) })}>
                <option value={1}>Add</option>
                <option value={-1}>Remove</option>
              </select>
              <input aria-label="Amount in taka" type="number" min={1} placeholder="৳" className={inputCls} value={credit.amount} onChange={(e) => setCredit({ ...credit, amount: e.target.value })} />
              <input aria-label="Reason" placeholder="Reason" maxLength={200} className={inputCls} value={credit.reason} onChange={(e) => setCredit({ ...credit, reason: e.target.value })} />
              <button className={btnPrimary} disabled={addCredit.isPending}>Save</button>
            </form>
            {credits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No store credit history.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {credits.map((c) => (
                  <li key={c.id} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">
                      {c.reason} <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("en-GB")}</span>
                    </span>
                    <span className={c.amount < 0 ? "text-destructive" : "text-primary"}>
                      {c.amount > 0 ? "+" : "−"}
                      {formatTaka(Math.abs(c.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-muted-foreground">Entries can't be deleted; remove credit with a new entry instead.</p>
          </section>
        </div>
        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-4 text-sm">
            <h2 className="mb-2 font-display text-xl">Contact</h2>
            <p>{phone}</p>
            {latest.email && <p>{latest.email}</p>}
            <p className="mt-2 text-muted-foreground">{latest.address}, {latest.city}</p>
            <div className="mt-3 flex gap-2">
              <a href={`tel:${phone}`} className={btnGhost}><Phone className="h-4 w-4" /> Call</a>
              <a href={`https://wa.me/88${phone}`} target="_blank" rel="noreferrer" className={btnGhost}><MessageCircle className="h-4 w-4" /> WhatsApp</a>
            </div>
          </section>
          <section className="rounded-lg border border-border bg-card p-4 text-sm">
            <h2 className="mb-2 font-display text-xl">Private notes</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addNote.mutate();
              }}
            >
              <textarea aria-label="New note" rows={3} maxLength={1000} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only admins see this" />
              <button className={`${btnPrimary} mt-2 w-full`} disabled={addNote.isPending}>Add note</button>
            </form>
            <ul className="mt-3 space-y-2">
              {notes.map((n) => (
                <li key={n.id} className="flex gap-2 rounded-md bg-muted/50 p-2">
                  <p className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                    {n.body}
                    <span className="block text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("en-GB")}</span>
                  </p>
                  <Confirm
                    title="Delete note?"
                    description="This can't be undone."
                    onConfirm={() => delNote.mutate(n.id)}
                    trigger={<button aria-label="Delete note" className="grid h-9 w-9 place-items-center rounded hover:bg-muted"><Trash2 className="h-4 w-4" /></button>}
                  />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate font-display text-xl">{value}</p>
    </div>
  );
}
