import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { downloadCsv, parseStockCsv, type StockChange } from "@/lib/admin-rules";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_PAGE, LOW_STOCK, errMsg } from "@/lib/admin";
import { AdminTitle, Chip, Pager, StatePanel, btnGhost, btnPrimary, inputCls } from "@/components/admin/confirm";
import { StockAdjust } from "@/components/admin/stock-adjust";

export const Route = createFileRoute("/admin/inventory")({ component: Inventory });

function Inventory() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [preview, setPreview] = useState<{ changes: StockChange[]; errors: string[] } | null>(null);
  const qc = useQueryClient();
  const apply = useMutation({
    mutationFn: async (changes: StockChange[]) => {
      let done = 0;
      for (const c of changes) {
        const row = (items.data ?? []).find((r) => (c.kind === "variant" ? r.variantId === c.id : r.productId === c.id && !r.variantId));
        if (!row) continue;
        const { error } = await supabase.rpc("admin_adjust_stock", {
          p_product_id: row.productId,
          p_variant_id: row.variantId,
          p_change: c.next - c.stock,
          p_reason: "count_correction",
          p_note: "CSV import",
        });
        if (error) throw new Error(`${c.label}: ${errMsg(error)} (${done} saved before this)`);
        done++;
      }
      return done;
    },
    onSuccess: (n) => {
      toast.success(`${n} stock level${n === 1 ? "" : "s"} updated`);
      setPreview(null);
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => {
      toast.error((e as Error).message);
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
  const [page, setPage] = useState(0);
  const [logPage, setLogPage] = useState(0);
  const items = useQuery({
    queryKey: ["admin", "inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, stock_quantity, product_variants(id, name, sku, stock_quantity)")
        .order("name");
      if (error) throw new Error(errMsg(error));
      return data.flatMap((p) =>
        p.product_variants.length
          ? p.product_variants.map((v) => ({
              key: v.id,
              productId: p.id,
              variantId: v.id as string | null,
              label: `${p.name} — ${v.name}`,
              sku: v.sku,
              stock: v.stock_quantity,
            }))
          : [
              {
                key: p.id,
                productId: p.id,
                variantId: null,
                label: p.name,
                sku: p.sku,
                stock: p.stock_quantity,
              },
            ],
      );
    },
  });
  const log = useQuery({
    queryKey: ["admin", "stock-log", logPage],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("stock_adjustments")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(logPage * ADMIN_PAGE, logPage * ADMIN_PAGE + ADMIN_PAGE - 1);
      if (error) throw new Error(errMsg(error));
      return { rows: data, count: count ?? 0 };
    },
  });
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (items.data ?? []).filter(
      (r) =>
        (filter === "all" || (filter === "low" ? r.stock <= LOW_STOCK : r.stock === 0)) &&
        (!t || r.label.toLowerCase().includes(t) || r.sku.toLowerCase().includes(t)),
    );
  }, [items.data, q, filter]);
  return (
    <div>
      <AdminTitle title="Inventory">
        <button
          className={btnGhost}
          disabled={!items.data}
          onClick={() =>
            downloadCsv("inventory.csv", [
              ["id", "kind", "label", "stock"],
              ...(items.data ?? []).map((r) => [r.variantId ?? r.productId, r.variantId ? "variant" : "product", r.label, r.stock]),
            ])
          }
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
        <label className={`${btnGhost} cursor-pointer`}>
          <Upload className="h-4 w-4" /> Import CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f || !items.data) return;
              if (f.size > 1_000_000) {
                toast.error("CSV must be under 1 MB.");
                return;
              }
              const cur = items.data.map((r) => ({
                id: r.variantId ?? r.productId,
                kind: (r.variantId ? "variant" : "product") as "variant" | "product",
                label: r.label,
                stock: r.stock,
              }));
              setPreview(parseStockCsv(await f.text(), cur));
            }}
          />
        </label>
      </AdminTitle>
      <p className="-mt-4 mb-4 text-sm text-muted-foreground">
        Export, change the stock column, then import. Blank cells stay unchanged; every change is logged in stock history.
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Search item or SKU"
          aria-label="Search inventory"
          className={`${inputCls} max-w-xs`}
        />
        <div className="flex gap-2 overflow-x-auto">
          {(["all", "low", "out"] as const).map((f) => (
            <Chip key={f} active={filter === f} onClick={() => { setFilter(f); setPage(0); }}>
              {f === "all" ? "All" : f === "low" ? `Low (≤${LOW_STOCK})` : "Out of stock"}
            </Chip>
          ))}
        </div>
      </div>
      {items.isPending ? (
        <StatePanel>Loading…</StatePanel>
      ) : items.isError ? (
        <StatePanel tone="error">{items.error.message}</StatePanel>
      ) : rows.length === 0 ? (
        <StatePanel>Nothing matches.</StatePanel>
      ) : (
        <>
        <ul className="space-y-2 md:hidden">
          {rows.slice(page * ADMIN_PAGE, (page + 1) * ADMIN_PAGE).map((r) => (
            <li key={r.key} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm">
              <div className="min-w-0 flex-1">
                <Link to="/admin/products/$id" params={{ id: r.productId }} className="line-clamp-2 font-medium">
                  {r.label}
                </Link>
                <p className="text-xs text-muted-foreground">{r.sku}</p>
                <p className={r.stock === 0 ? "text-destructive" : ""}>{r.stock === 0 ? "Out of stock" : `${r.stock} in stock`}</p>
              </div>
              <StockAdjust productId={r.productId} variantId={r.variantId} label={r.label} current={r.stock} />
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Stock</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.slice(page * ADMIN_PAGE, (page + 1) * ADMIN_PAGE).map((r) => (
                <tr key={r.key} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link
                      to="/admin/products/$id"
                      params={{ id: r.productId }}
                      className="hover:underline"
                    >
                      {r.label}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{r.sku}</td>
                  <td className={`px-3 py-2 ${r.stock === 0 ? "text-destructive" : ""}`}>
                    {r.stock === 0 ? "Out of stock" : r.stock}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <StockAdjust
                      productId={r.productId}
                      variantId={r.variantId}
                      label={r.label}
                      current={r.stock}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
      <Pager page={page} total={rows.length} size={ADMIN_PAGE} onPage={setPage} />

      {preview && (
        <Dialog open onOpenChange={(v) => !v && setPreview(null)}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review stock changes</DialogTitle>
            </DialogHeader>
            {preview.errors.length > 0 && (
              <ul className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {preview.errors.slice(0, 20).map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            {preview.changes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stock changes found in this file.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {preview.changes.map((c) => (
                  <li key={c.kind + c.id} className="flex justify-between gap-2 py-2">
                    <span className="min-w-0 truncate">{c.label}</span>
                    <span className="shrink-0">
                      {c.stock} → <b>{c.next}</b>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <button
              className={`${btnPrimary} w-full`}
              disabled={!preview.changes.length || preview.errors.length > 0 || apply.isPending}
              onClick={() => apply.mutate(preview.changes)}
            >
              {apply.isPending ? "Saving…" : preview.errors.length ? "Fix the errors first" : `Apply ${preview.changes.length} change(s)`}
            </button>
          </DialogContent>
        </Dialog>
      )}

      <h2 className="mb-3 mt-10 font-display text-2xl">Stock history</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Every manual adjustment, with who and why. Stock taken by customer orders is recorded on
        each order.
      </p>
      {log.isPending ? (
        <StatePanel>Loading…</StatePanel>
      ) : log.isError ? (
        <StatePanel tone="error">{log.error.message}</StatePanel>
      ) : log.data.rows.length === 0 ? (
        <StatePanel>No adjustments yet.</StatePanel>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Change</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {log.data.rows.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-3 py-2 text-muted-foreground">
                    {new Date(l.created_at).toLocaleString("en-GB")}
                  </td>
                  <td className="px-3 py-2">{l.item_label}</td>
                  <td className="px-3 py-2">
                    {l.change > 0 ? `+${l.change}` : l.change}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({l.previous_qty} → {l.new_qty})
                    </span>
                  </td>
                  <td className="px-3 py-2 capitalize">{l.reason.replace("_", " ")}</td>
                  <td className="px-3 py-2 text-muted-foreground">{l.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {log.data && (
        <Pager page={logPage} total={log.data.count} size={ADMIN_PAGE} onPage={setLogPage} />
      )}
    </div>
  );
}
