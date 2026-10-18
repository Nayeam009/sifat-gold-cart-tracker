import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatTaka } from "@/lib/catalog";
import { ADMIN_PAGE, LOW_STOCK, errMsg, safeSearch } from "@/lib/admin";
import { AdminTitle, Pager, StatePanel, btnPrimary, inputCls } from "@/components/admin/confirm";

export const Route = createFileRoute("/admin/products/")({ component: Products });

function Products() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [cat, setCat] = useState("");
  const [page, setPage] = useState(0);
  const cats = useQuery({ queryKey: ["admin", "cat-options"], queryFn: async () => (await supabase.from("categories").select("id, name").order("sort_order")).data ?? [] });
  const list = useQuery({
    queryKey: ["admin", "products", q, status, cat, page],
    queryFn: async () => {
      let r = supabase.from("products").select("id, name, sku, slug, price, compare_at_price, stock_quantity, is_published, is_featured, updated_at, categories(name), product_images(image_url, sort_order), product_variants(stock_quantity)", { count: "exact" })
        .order("updated_at", { ascending: false }).range(page * ADMIN_PAGE, page * ADMIN_PAGE + ADMIN_PAGE - 1);
      const t = safeSearch(q);
      if (t) r = r.or(`name.ilike.%${t}%,sku.ilike.%${t}%`);
      if (status === "published") r = r.eq("is_published", true);
      if (status === "draft") r = r.eq("is_published", false);
      if (status === "featured") r = r.eq("is_featured", true);
      if (cat) r = r.eq("category_id", cat);
      const { data, error, count } = await r;
      if (error) throw new Error(errMsg(error));
      return { rows: data, count: count ?? 0 };
    },
  });
  const toggle = useMutation({
    mutationFn: async (p: { id: string; field: "is_published" | "is_featured"; value: boolean }) => {
      const { error } = await supabase.from("products").update(p.field === "is_published" ? { is_published: p.value } : { is_featured: p.value }).eq("id", p.id);
      if (error) throw new Error(errMsg(error));
    },
    onSuccess: () => { toast.success("Product updated"); qc.invalidateQueries({ queryKey: ["admin"] }); qc.invalidateQueries({ queryKey: ["catalogue"] }); qc.invalidateQueries({ queryKey: ["bestsellers"] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <div>
      <AdminTitle title="Products"><Link to="/admin/products/$id" params={{ id: "new" }} className={btnPrimary}><Plus className="h-4 w-4" /> New product</Link></AdminTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search name or SKU" aria-label="Search products" className={`${inputCls} max-w-xs`} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} aria-label="Status" className={`${inputCls} max-w-[160px]`}>
          <option value="">All</option><option value="published">Published</option><option value="draft">Drafts</option><option value="featured">Featured</option>
        </select>
        <select value={cat} onChange={(e) => { setCat(e.target.value); setPage(0); }} aria-label="Category" className={`${inputCls} max-w-[200px]`}>
          <option value="">All categories</option>{cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {list.isPending ? <StatePanel>Loading products…</StatePanel> : list.isError ? <StatePanel tone="error">{list.error.message}</StatePanel> : list.data.rows.length === 0 ? <StatePanel>No products found.</StatePanel> : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Product</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Stock</th><th className="px-3 py-2">Published</th><th className="px-3 py-2">Featured</th></tr></thead>
            <tbody>
              {list.data.rows.map((p) => {
                const img = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order)[0]?.image_url;
                const stock = p.product_variants.length ? p.product_variants.reduce((s, v) => s + v.stock_quantity, 0) : p.stock_quantity;
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Link to="/admin/products/$id" params={{ id: p.id }} className="flex items-center gap-3 hover:underline">
                        {img ? <img src={img} alt="" className="h-10 w-10 rounded object-cover" /> : <span className="h-10 w-10 rounded bg-muted" />}
                        <span><span className="font-medium">{p.name}</span><span className="block text-xs text-muted-foreground">{p.sku} · {p.categories?.name ?? "No category"}</span></span>
                      </Link>
                    </td>
                    <td className="px-3 py-2">{formatTaka(p.price)}{p.compare_at_price && <span className="block text-xs text-muted-foreground line-through">{formatTaka(p.compare_at_price)}</span>}</td>
                    <td className={`px-3 py-2 ${stock === 0 ? "text-destructive" : stock <= LOW_STOCK ? "text-primary" : ""}`}>{stock}{p.product_variants.length > 0 && <span className="text-xs text-muted-foreground"> ({p.product_variants.length} options)</span>}</td>
                    <td className="px-3 py-2"><input type="checkbox" aria-label={`Published: ${p.name}`} checked={p.is_published} onChange={(e) => toggle.mutate({ id: p.id, field: "is_published", value: e.target.checked })} /></td>
                    <td className="px-3 py-2"><input type="checkbox" aria-label={`Featured: ${p.name}`} checked={p.is_featured} onChange={(e) => toggle.mutate({ id: p.id, field: "is_featured", value: e.target.checked })} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {list.data && <Pager page={page} total={list.data.count} size={ADMIN_PAGE} onPage={setPage} />}
    </div>
  );
}
