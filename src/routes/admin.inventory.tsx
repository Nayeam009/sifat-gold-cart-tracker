import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_PAGE, LOW_STOCK, errMsg } from "@/lib/admin";
import { AdminTitle, Pager, StatePanel, inputCls } from "@/components/admin/confirm";
import { StockAdjust } from "@/components/admin/stock-adjust";

export const Route = createFileRoute("/admin/inventory")({ component: Inventory });

function Inventory() {
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
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
        (!lowOnly || r.stock <= LOW_STOCK) &&
        (!t || r.label.toLowerCase().includes(t) || r.sku.toLowerCase().includes(t)),
    );
  }, [items.data, q, lowOnly]);
  return (
    <div>
      <AdminTitle title="Inventory" />
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => {
              setLowOnly(e.target.checked);
              setPage(0);
            }}
          />{" "}
          Only {LOW_STOCK} or fewer
        </label>
      </div>
      {items.isPending ? (
        <StatePanel>Loading…</StatePanel>
      ) : items.isError ? (
        <StatePanel tone="error">{items.error.message}</StatePanel>
      ) : rows.length === 0 ? (
        <StatePanel>Nothing matches.</StatePanel>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
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
      )}
      <Pager page={page} total={rows.length} size={ADMIN_PAGE} onPage={setPage} />

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
