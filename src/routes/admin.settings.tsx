import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { ADMIN_PAGE, errMsg } from "@/lib/admin";
import { isBdPhone, isHttpsUrl, validateFees } from "@/lib/admin-validation";
import { AdminTitle, Confirm, Pager, StatePanel, btnGhost, btnPrimary, inputCls } from "@/components/admin/confirm";

export const Route = createFileRoute("/admin/settings")({ component: Settings });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

function Settings() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("key, value, updated_at");
      if (error) throw new Error(errMsg(error));
      return Object.fromEntries(data.map((r) => [r.key, { ...(r.value as Record<string, unknown>), _updated: r.updated_at }])) as S;
    },
  });
  const [s, setS] = useState<S | null>(null);
  useEffect(() => { if (q.data) setS(structuredClone(q.data)); }, [q.data]);

  const save = useMutation({
    mutationFn: async ({ key, value, check }: { key: string; value: Record<string, unknown>; check?: string | null | undefined }) => {
      if (check) throw new Error(check);
      const { _updated, ...clean } = value;
      void _updated;
      const { error } = await supabase.from("site_settings").upsert({ key, value: clean as Json, is_public: true });
      if (error) throw new Error(errMsg(error));
    },
    onSuccess: () => { toast.success("Settings saved — the shop now shows the new details"); qc.invalidateQueries(); },
    onError: (e) => toast.error((e as Error).message),
  });

  if (q.isPending || !s) return <StatePanel>Loading settings…</StatePanel>;
  if (q.isError) return <StatePanel tone="error">{q.error.message}</StatePanel>;
  const get = (k: string, f: string) => String(s[k]?.[f] ?? "");
  const put = (k: string, f: string, v: unknown) => setS({ ...s, [k]: { ...(s[k] ?? {}), [f]: v } });
  const T = ({ k, f, label, area, max = 200 }: { k: string; f: string; label: string; area?: boolean; max?: number }) => (
    <label className="block text-sm"><span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {area ? <textarea rows={6} maxLength={max} className={inputCls} value={get(k, f)} onChange={(e) => put(k, f, e.target.value)} />
        : <input maxLength={max} className={inputCls} value={get(k, f)} onChange={(e) => put(k, f, e.target.value)} />}
    </label>
  );
  const fees = s.delivery_fees ?? {};
  const social = s.social_links ?? {};
  const go = (key: string, check?: string | null, transform?: (v: Record<string, unknown>) => Record<string, unknown>) => save.mutate({ key, value: transform ? transform(s[key] ?? {}) : (s[key] ?? {}), check });

  return (
    <div className="space-y-6">
      <AdminTitle title="Settings" />
      <Card title="Delivery charges" updated={s.delivery_fees?._updated} onSave={() => go("delivery_fees", validateFees(Number(fees.inside), Number(fees.outside)), (v) => ({ inside: Number(v["inside"]), outside: Number(v["outside"]) }))} busy={save.isPending}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Inside Saidpur (৳)<input type="number" min={0} max={5000} className={`${inputCls} mt-1`} value={String(fees.inside ?? "")} onChange={(e) => put("delivery_fees", "inside", e.target.value)} /></label>
          <label className="text-sm">Outside Saidpur (৳)<input type="number" min={0} max={5000} className={`${inputCls} mt-1`} value={String(fees.outside ?? "")} onChange={(e) => put("delivery_fees", "outside", e.target.value)} /></label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Checkout and order totals use these immediately. Past orders keep the fee they were charged.</p>
      </Card>

      <Card title="Store contact" updated={s.store_contact?._updated} busy={save.isPending} onSave={() => go("store_contact", isBdPhone(get("store_contact", "hotline")) ? null : "Hotline must be a Bangladeshi mobile number like 01XXXXXXXXX.")}>
        <div className="grid gap-3 sm:grid-cols-2">
          {T({ k: "store_contact", f: "owner", label: "Owner name" })}
          {T({ k: "store_contact", f: "hotline", label: "Hotline", max: 11 })}
          {T({ k: "store_contact", f: "location", label: "Short location (e.g. Saidpur, Nilphamari)" })}
          {T({ k: "store_contact", f: "hours", label: "Opening hours" })}
        </div>
        <div className="mt-3">{T({ k: "store_contact", f: "address", label: "Full business address", area: true, max: 300 })}</div>
      </Card>

      <Card title="Official social links" updated={s.social_links?._updated} busy={save.isPending} onSave={() => {
        const bad = ["facebook", "instagram", "youtube", "whatsapp"].find((k) => social[k] && !isHttpsUrl(String(social[k])));
        go("social_links", bad ? `The ${bad} link must start with https://` : null, (v) => Object.fromEntries(["facebook", "instagram", "youtube", "whatsapp"].map((k) => [k, v[k] ? String(v[k]).trim() : null])));
      }}>
        <div className="grid gap-3 sm:grid-cols-2">
          {["facebook", "instagram", "youtube", "whatsapp"].map((k) => <div key={k}>{T({ k: "social_links", f: k, label: `${k.charAt(0).toUpperCase()}${k.slice(1)} (https://…)`, max: 300 })}</div>)}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Leave empty to hide an icon.</p>
      </Card>

      <Card title="Homepage text" updated={s.homepage?._updated} busy={save.isPending} onSave={() => go("homepage", get("homepage", "hero_title").trim().length < 3 ? "Headline is required." : null)}>
        {T({ k: "homepage", f: "hero_title", label: "Main headline", max: 120 })}
        <div className="mt-3">{T({ k: "homepage", f: "hero_subtitle", label: "Sub-headline", area: true, max: 300 })}</div>
      </Card>

      <Card title="Policies" updated={s.policies?._updated} busy={save.isPending} onSave={() => go("policies")}>
        <p className="mb-3 text-xs text-muted-foreground">Leave a policy empty to keep the current default text on that page.</p>
        <div className="grid gap-3 lg:grid-cols-2">
          {T({ k: "policies", f: "shipping", label: "Shipping policy", area: true, max: 8000 })}
          {T({ k: "policies", f: "returns", label: "Returns & exchanges", area: true, max: 8000 })}
          {T({ k: "policies", f: "terms", label: "Terms & conditions", area: true, max: 8000 })}
          {T({ k: "policies", f: "privacy", label: "Privacy policy", area: true, max: 8000 })}
          {T({ k: "policies", f: "about", label: "About Us page", area: true, max: 8000 })}
        </div>
      </Card>

      <Card title="Newsletter" updated={s.newsletter?._updated} busy={save.isPending} onSave={() => go("newsletter")}>
        <label className="mb-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={!!s.newsletter?.enabled} onChange={(e) => put("newsletter", "enabled", e.target.checked)} /> Show the sign-up form in the footer</label>
        <div className="grid gap-3 sm:grid-cols-2">{T({ k: "newsletter", f: "heading", label: "Heading", max: 80 })}{T({ k: "newsletter", f: "blurb", label: "Short text", max: 200 })}</div>
        <Subscribers />
      </Card>

      <Card title="Payments">
        <p className="text-sm">Cash on Delivery is the only payment method. Online payment stays switched off until a real payment provider is connected.</p>
      </Card>
    </div>
  );
}

function Card({ title, updated, onSave, busy, children }: { title: string; updated?: unknown; onSave?: () => void; busy?: boolean; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="font-display text-xl">{title}</h2>{typeof updated === "string" && <p className="text-xs text-muted-foreground">Last saved {new Date(updated).toLocaleString("en-GB")}</p>}</div>
        {onSave && <button className={btnPrimary} disabled={busy} onClick={onSave}>Save</button>}
      </div>
      {children}
    </section>
  );
}

function Subscribers() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const q = useQuery({
    queryKey: ["admin", "subscribers", page],
    queryFn: async () => {
      const { data, error, count } = await supabase.from("newsletter_subscribers").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(page * ADMIN_PAGE, page * ADMIN_PAGE + ADMIN_PAGE - 1);
      if (error) throw new Error(errMsg(error));
      return { rows: data, count: count ?? 0 };
    },
  });
  const exportCsv = async () => {
    const { data, error } = await supabase.from("newsletter_subscribers").select("email, created_at").order("created_at").limit(10000);
    if (error) { toast.error(errMsg(error)); return; }
    const csv = "email,subscribed_at\n" + data.map((r) => `"${r.email.replace(/"/g, '""')}",${r.created_at}`).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "sifatmart-subscribers.csv"; a.click();
  };
  return (
    <div className="mt-5 border-t border-border pt-4">
      <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-medium">Subscribers</h3><button className={btnGhost} onClick={exportCsv}><Download className="h-3.5 w-3.5" /> Export CSV</button></div>
      {q.isPending ? <p className="text-sm text-muted-foreground">Loading…</p> : q.isError ? <p className="text-sm text-destructive">{q.error.message}</p> : q.data.rows.length === 0 ? <p className="text-sm text-muted-foreground">No subscribers yet.</p> : (
        <ul className="divide-y divide-border text-sm">
          {q.data.rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-1.5">
              <span>{r.email} <span className="text-xs text-muted-foreground">· {new Date(r.created_at).toLocaleDateString("en-GB")}</span></span>
              <Confirm title="Remove subscriber?" description={`${r.email} will no longer receive newsletters.`} action="Remove" onConfirm={async () => {
                const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", r.id);
                if (error) toast.error(errMsg(error)); else { toast.success("Subscriber removed"); qc.invalidateQueries({ queryKey: ["admin", "subscribers"] }); }
              }} trigger={<button className="text-destructive" aria-label={`Remove ${r.email}`}><Trash2 className="h-3.5 w-3.5" /></button>} />
            </li>
          ))}
        </ul>
      )}
      {q.data && <Pager page={page} total={q.data.count} size={ADMIN_PAGE} onPage={setPage} />}
    </div>
  );
}
