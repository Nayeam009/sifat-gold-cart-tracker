import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Phone, MessageCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatTaka } from "@/lib/catalog";
import { errMsg } from "@/lib/admin";
import { AdminTitle, Confirm, StatePanel, btnGhost } from "@/components/admin/confirm";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/incomplete")({ component: Incomplete });

type CartLine = { name?: string; qty?: number };

function Incomplete() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "incomplete"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incomplete_checkouts")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(300);
      if (error) throw new Error(errMsg(error));
      return data;
    },
  });
  const upd = useMutation({
    mutationFn: async (v: { id: string; del?: boolean }) => {
      const r = v.del
        ? await supabase.from("incomplete_checkouts").delete().eq("id", v.id)
        : await supabase.from("incomplete_checkouts").update({ contacted_at: new Date().toISOString() }).eq("id", v.id);
      if (r.error) throw new Error(errMsg(r.error));
    },
    onSuccess: (_, v) => {
      toast.success(v.del ? "Removed" : "Marked as contacted");
      qc.invalidateQueries({ queryKey: ["admin", "incomplete"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const rows = q.data ?? [];
  const open = rows.filter((r) => !r.recovered);
  const recovered = rows.length - open.length;
  return (
    <div>
      <AdminTitle title="Incomplete checkouts" />
      <p className="-mt-4 mb-4 text-sm text-muted-foreground">
        Visitors who typed a valid phone number at checkout but didn't place the order. Follow up politely by call or WhatsApp.
      </p>
      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Open" value={open.length} />
        <Stat label="Recovered" value={recovered} />
        <Stat label="Recovery rate" value={rows.length ? `${Math.round((recovered / rows.length) * 100)}%` : "—"} />
      </div>
      {q.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : q.isError ? (
        <StatePanel tone="error">{q.error.message}</StatePanel>
      ) : open.length === 0 ? (
        <StatePanel>No incomplete checkouts right now.</StatePanel>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {open.map((r) => {
            const cart = (Array.isArray(r.cart) ? r.cart : []) as CartLine[];
            const msg = encodeURIComponent(
              `Assalamu alaikum${r.customer_name ? ` ${r.customer_name}` : ""}, this is SifatMart. We noticed your order wasn't completed — can we help you finish it?`,
            );
            return (
              <li key={r.id} className="rounded-lg border border-border bg-card p-4 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{r.customer_name || "No name given"}</span>
                  <span>{formatTaka(r.subtotal)}</span>
                </div>
                <p className="text-muted-foreground">
                  {r.phone}
                  {r.city && ` · ${r.city}`} · {new Date(r.updated_at).toLocaleString("en-GB")}
                </p>
                <p className="mt-1 line-clamp-2">
                  {cart.map((c) => `${c.name ?? "Item"} × ${c.qty ?? 1}`).join(", ") || "Cart details unavailable"}
                </p>
                {r.contacted_at && (
                  <p className="mt-1 text-xs text-primary">Contacted {new Date(r.contacted_at).toLocaleDateString("en-GB")}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={`tel:${r.phone}`} className={btnGhost} onClick={() => upd.mutate({ id: r.id })}>
                    <Phone className="h-4 w-4" /> Call
                  </a>
                  <a
                    href={`https://wa.me/88${r.phone}?text=${msg}`}
                    target="_blank"
                    rel="noreferrer"
                    className={btnGhost}
                    onClick={() => upd.mutate({ id: r.id })}
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                  <Confirm
                    title="Remove this entry?"
                    description="It will disappear from this list."
                    action="Remove"
                    onConfirm={() => upd.mutate({ id: r.id, del: true })}
                    trigger={
                      <button className={btnGhost} aria-label="Remove entry">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="font-display text-2xl">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
