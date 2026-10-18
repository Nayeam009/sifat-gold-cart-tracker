import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { occasions } from "@/lib/catalog";
import { errMsg, slugify, uploadImage } from "@/lib/admin";
import { validateProduct, type ProductForm } from "@/lib/admin-validation";
import {
  AdminTitle,
  Confirm,
  StatePanel,
  btnGhost,
  btnPrimary,
  inputCls,
} from "@/components/admin/confirm";
import { StockAdjust } from "@/components/admin/stock-adjust";

export const Route = createFileRoute("/admin/products/$id")({ component: ProductEditor });

const EMPTY: ProductForm = {
  name: "",
  slug: "",
  sku: "",
  category_id: "",
  short_description: "",
  description: "",
  price: "",
  compare_at_price: "",
  stock_quantity: "0",
  is_published: false,
  is_featured: false,
  occasions: [],
  seo_title: "",
  seo_description: "",
};

function ProductEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const qc = useQueryClient();
  const navigate = useNavigate();
  const refresh = () =>
    ["admin", "catalogue", "bestsellers", "product"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k] }),
    );

  const cats = useQuery({
    queryKey: ["admin", "cat-options"],
    queryFn: async () =>
      (await supabase.from("categories").select("id, name").order("sort_order")).data ?? [],
  });
  const prod = useQuery({
    queryKey: ["admin", "product", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(*), product_variants(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(errMsg(error));
      return data;
    },
  });
  const [f, setF] = useState<ProductForm>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  useEffect(() => {
    const p = prod.data;
    if (p) {
      setSlugTouched(true);
      setF({
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        category_id: p.category_id ?? "",
        short_description: p.short_description ?? "",
        description: p.description ?? "",
        price: String(p.price),
        compare_at_price: p.compare_at_price == null ? "" : String(p.compare_at_price),
        stock_quantity: String(p.stock_quantity),
        is_published: p.is_published,
        is_featured: p.is_featured,
        occasions: p.occasions,
        seo_title: p.seo_title ?? "",
        seo_description: p.seo_description ?? "",
      });
    }
  }, [prod.data]);

  const save = useMutation({
    mutationFn: async () => {
      const v = validateProduct(f, isNew);
      if (!v.ok) throw new Error(v.error);
      if (isNew) {
        const { data, error } = await supabase
          .from("products")
          .insert(v.value)
          .select("id")
          .single();
        if (error) throw new Error(errMsg(error));
        return data.id;
      }
      const { stock_quantity: _ignored, ...rest } = v.value;
      const { error } = await supabase.from("products").update(rest).eq("id", id);
      if (error) throw new Error(errMsg(error));
      return id;
    },
    onSuccess: (newId) => {
      toast.success(isNew ? "Product created — now add photos and options" : "Product saved");
      refresh();
      if (isNew) navigate({ to: "/admin/products/$id", params: { id: newId } });
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw new Error(errMsg(error));
    },
    onSuccess: () => {
      toast.success("Product deleted. Past orders keep their item details.");
      refresh();
      navigate({ to: "/admin/products" });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!isNew && prod.isPending) return <StatePanel>Loading product…</StatePanel>;
  if (!isNew && prod.isError) return <StatePanel tone="error">{prod.error.message}</StatePanel>;
  if (!isNew && !prod.data)
    return (
      <StatePanel>
        Product not found.{" "}
        <Link to="/admin/products" className="text-primary">
          Back
        </Link>
      </StatePanel>
    );

  const set = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) =>
    setF((s) => ({ ...s, [k]: v }));
  const hasVariants = (prod.data?.product_variants.length ?? 0) > 0;
  return (
    <div>
      <Link to="/admin/products" className="text-sm text-primary">
        ← Products
      </Link>
      <AdminTitle title={isNew ? "New product" : f.name || "Product"}>
        {!isNew && f.is_published && (
          <a
            href={`/product/${prod.data!.slug}`}
            target="_blank"
            rel="noreferrer"
            className={btnGhost}
          >
            View in shop
          </a>
        )}
        {!isNew && (
          <Confirm
            title="Delete product?"
            description="This removes the product, its photos and options from the shop. Past orders are not affected."
            onConfirm={() => del.mutate()}
            trigger={
              <button className={`${btnGhost} text-destructive`}>
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            }
          />
        )}
      </AdminTitle>
      <form
        className="grid gap-6 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="space-y-4 rounded-lg border border-border bg-card p-4 lg:col-span-2">
          <L label="Name *">
            <input
              className={inputCls}
              maxLength={150}
              value={f.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
            />
          </L>
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="URL slug *" help={`/product/${f.slug || "…"}`}>
              <input
                className={inputCls}
                value={f.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase());
                }}
              />
            </L>
            <L label="SKU *">
              <input
                className={inputCls}
                maxLength={60}
                value={f.sku}
                onChange={(e) => set("sku", e.target.value.toUpperCase())}
              />
            </L>
          </div>
          <L label="Category">
            <select
              className={inputCls}
              value={f.category_id}
              onChange={(e) => set("category_id", e.target.value)}
            >
              <option value="">— None —</option>
              {cats.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </L>
          <L label="Short description">
            <input
              className={inputCls}
              maxLength={300}
              value={f.short_description}
              onChange={(e) => set("short_description", e.target.value)}
            />
          </L>
          <L label="Full description">
            <textarea
              rows={6}
              maxLength={5000}
              className={inputCls}
              value={f.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </L>
          <div className="grid gap-4 sm:grid-cols-3">
            <L label="Price (৳) *">
              <input
                type="number"
                min={0}
                step={1}
                className={inputCls}
                value={f.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </L>
            <L label="Compare-at price (৳)" help="Shows a Sale badge. Must be higher than price.">
              <input
                type="number"
                min={0}
                step={1}
                className={inputCls}
                value={f.compare_at_price}
                onChange={(e) => set("compare_at_price", e.target.value)}
              />
            </L>
            <L
              label="Stock"
              help={
                isNew
                  ? "Starting stock"
                  : hasVariants
                    ? "Stock is tracked per option below"
                    : "Use Adjust to keep a history"
              }
            >
              {isNew ? (
                <input
                  type="number"
                  min={0}
                  step={1}
                  className={inputCls}
                  value={f.stock_quantity}
                  onChange={(e) => set("stock_quantity", e.target.value)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-lg">{prod.data!.stock_quantity}</span>
                  <StockAdjust productId={id} label={f.name} current={prod.data!.stock_quantity} />
                </div>
              )}
            </L>
          </div>
          <fieldset>
            <legend className="mb-1 text-xs font-medium text-muted-foreground">Occasions</legend>
            <div className="flex flex-wrap gap-3">
              {occasions.map((o) => (
                <label key={o.slug} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={f.occasions.includes(o.slug)}
                    onChange={(e) =>
                      set(
                        "occasions",
                        e.target.checked
                          ? [...f.occasions, o.slug]
                          : f.occasions.filter((x) => x !== o.slug),
                      )
                    }
                  />{" "}
                  {o.name}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="space-y-4">
          <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={f.is_published}
                onChange={(e) => set("is_published", e.target.checked)}
              />{" "}
              Published (visible in shop)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={f.is_featured}
                onChange={(e) => set("is_featured", e.target.checked)}
              />{" "}
              Featured on homepage
            </label>
            <button className={`${btnPrimary} w-full`} disabled={save.isPending}>
              {save.isPending ? "Saving…" : isNew ? "Create product" : "Save product"}
            </button>
            {!isNew && (
              <p className="text-xs text-muted-foreground">
                Created {new Date(prod.data!.created_at).toLocaleString("en-GB")} · Updated{" "}
                {new Date(prod.data!.updated_at).toLocaleString("en-GB")}
              </p>
            )}
          </div>
          <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <h2 className="font-display text-lg">Search engine (SEO)</h2>
            <L label="SEO title" help={`${f.seo_title.length}/70`}>
              <input
                className={inputCls}
                maxLength={70}
                value={f.seo_title}
                onChange={(e) => set("seo_title", e.target.value)}
              />
            </L>
            <L label="SEO description" help={`${f.seo_description.length}/160`}>
              <textarea
                rows={3}
                maxLength={160}
                className={inputCls}
                value={f.seo_description}
                onChange={(e) => set("seo_description", e.target.value)}
              />
            </L>
          </div>
        </div>
      </form>
      {!isNew && prod.data && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Images
            productId={id}
            name={f.name}
            images={prod.data.product_images}
            onChange={refresh}
          />
          <Variants productId={id} variants={prod.data.product_variants} onChange={refresh} />
        </div>
      )}
    </div>
  );
}

function L({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {help && <span className="mt-1 block text-xs text-muted-foreground">{help}</span>}
    </label>
  );
}

type Img = { id: string; image_url: string; alt_text: string | null; sort_order: number };
function Images({
  productId,
  name,
  images,
  onChange,
}: {
  productId: string;
  name: string;
  images: Img[];
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const run = async (fn: () => Promise<{ error: unknown } | void>, ok: string) => {
    try {
      const r = await fn();
      if (r && r.error) throw r.error;
      toast.success(ok);
      onChange();
    } catch (e) {
      toast.error(e instanceof Error && !("code" in e) ? e.message : errMsg(e));
    }
  };
  const swap = (i: number, j: number) =>
    run(async () => {
      const a = sorted[i]!,
        b = sorted[j]!;
      const r1 = await supabase.from("product_images").update({ sort_order: j }).eq("id", a.id);
      if (r1.error) return r1;
      return supabase.from("product_images").update({ sort_order: i }).eq("id", b.id);
    }, "Order updated");
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl">Photos</h2>
        <label className={`${btnGhost} cursor-pointer`}>
          <Upload className="h-4 w-4" /> {busy ? "Uploading…" : "Upload"}
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={async (e) => {
              const files = [...(e.target.files ?? [])].slice(0, 8);
              e.target.value = "";
              if (!files.length) return;
              setBusy(true);
              let n = sorted.length;
              for (const file of files) {
                try {
                  const url = await uploadImage(file);
                  const { error } = await supabase.from("product_images").insert({
                    product_id: productId,
                    image_url: url,
                    alt_text: name,
                    sort_order: n++,
                  });
                  if (error) throw new Error(errMsg(error));
                } catch (err) {
                  toast.error(`${file.name}: ${(err as Error).message}`);
                }
              }
              setBusy(false);
              toast.success("Upload finished");
              onChange();
            }}
          />
        </label>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        JPG, PNG or WebP, up to 5 MB each. The first photo is the main one.
      </p>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No photos yet — the shop shows a placeholder.
        </p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((img, i) => (
            <li key={img.id} className="flex items-center gap-3">
              <img
                src={img.image_url}
                alt={img.alt_text ?? ""}
                className="h-16 w-16 rounded object-cover"
              />
              <input
                className={`${inputCls} flex-1`}
                defaultValue={img.alt_text ?? ""}
                maxLength={150}
                aria-label="Alt text"
                placeholder="Describe the photo"
                onBlur={(e) =>
                  e.target.value !== (img.alt_text ?? "") &&
                  run(
                    async () =>
                      supabase
                        .from("product_images")
                        .update({ alt_text: e.target.value.trim() || null })
                        .eq("id", img.id),
                    "Description saved",
                  )
                }
              />
              <button
                type="button"
                className={btnGhost}
                disabled={i === 0}
                aria-label="Move up"
                onClick={() => swap(i, i - 1)}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className={btnGhost}
                disabled={i === sorted.length - 1}
                aria-label="Move down"
                onClick={() => swap(i, i + 1)}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <Confirm
                title="Remove photo?"
                description="The photo will be removed from this product."
                action="Remove"
                onConfirm={() =>
                  run(
                    async () => supabase.from("product_images").delete().eq("id", img.id),
                    "Photo removed",
                  )
                }
                trigger={
                  <button
                    type="button"
                    className={`${btnGhost} text-destructive`}
                    aria-label="Remove photo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type Variant = {
  id: string;
  sku: string;
  name: string;
  price: number | null;
  stock_quantity: number;
  is_active: boolean;
  sort_order: number;
};
function Variants({
  productId,
  variants,
  onChange,
}: {
  productId: string;
  variants: Variant[];
  onChange: () => void;
}) {
  const [draft, setDraft] = useState({ name: "", sku: "", price: "", stock: "0" });
  const sorted = [...variants].sort((a, b) => a.sort_order - b.sort_order);
  const add = useMutation({
    mutationFn: async () => {
      const name = draft.name.trim(),
        sku = draft.sku.trim().toUpperCase();
      if (name.length < 1 || name.length > 60)
        throw new Error("Option name is required (max 60 characters).");
      if (!/^[A-Z0-9-]{2,60}$/.test(sku))
        throw new Error("Option SKU: 2–60 letters, numbers or dashes.");
      const price = draft.price === "" ? null : Number(draft.price);
      if (price != null && (!Number.isInteger(price) || price < 0))
        throw new Error("Option price must be a whole Taka amount.");
      const stock = Number(draft.stock);
      if (!Number.isInteger(stock) || stock < 0) throw new Error("Stock must be 0 or more.");
      const { error } = await supabase.from("product_variants").insert({
        product_id: productId,
        name,
        sku,
        price,
        stock_quantity: stock,
        sort_order: sorted.length,
      });
      if (error) throw new Error(errMsg(error));
    },
    onSuccess: () => {
      toast.success("Option added");
      setDraft({ name: "", sku: "", price: "", stock: "0" });
      onChange();
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const upd = async (id: string, patch: Partial<Variant>, msg: string) => {
    const { error } = await supabase.from("product_variants").update(patch).eq("id", id);
    if (error) toast.error(errMsg(error));
    else {
      toast.success(msg);
      onChange();
    }
  };
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-1 font-display text-xl">Options (sizes, colours)</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        When a product has options, customers must pick one and stock is counted per option. Leave
        price empty to use the main price.
      </p>
      {sorted.length > 0 && (
        <table className="mb-4 w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th>Option</th>
              <th>Price ৳</th>
              <th>Stock</th>
              <th>On sale</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sorted.map((v) => (
              <tr key={v.id} className="border-t border-border">
                <td className="py-1.5">
                  {v.name}
                  <div className="text-xs text-muted-foreground">{v.sku}</div>
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    className={`${inputCls} w-24`}
                    defaultValue={v.price ?? ""}
                    aria-label={`Price for ${v.name}`}
                    onBlur={(e) => {
                      const p = e.target.value === "" ? null : Number(e.target.value);
                      if (p !== v.price) {
                        if (p != null && (!Number.isInteger(p) || p < 0)) {
                          toast.error("Price must be a whole Taka amount.");
                          return;
                        }
                        upd(v.id, { price: p }, "Price saved");
                      }
                    }}
                  />
                </td>
                <td>
                  <span className="mr-2">{v.stock_quantity}</span>
                  <StockAdjust
                    productId={productId}
                    variantId={v.id}
                    label={v.name}
                    current={v.stock_quantity}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={v.is_active}
                    aria-label={`Active: ${v.name}`}
                    onChange={(e) => upd(v.id, { is_active: e.target.checked }, "Option updated")}
                  />
                </td>
                <td className="text-right">
                  <Confirm
                    title="Delete option?"
                    description={`"${v.name}" will be removed. Past orders keep their details.`}
                    onConfirm={async () => {
                      const { error } = await supabase
                        .from("product_variants")
                        .delete()
                        .eq("id", v.id);
                      if (error) toast.error(errMsg(error));
                      else {
                        toast.success("Option deleted");
                        onChange();
                      }
                    }}
                    trigger={
                      <button
                        type="button"
                        className={`${btnGhost} text-destructive`}
                        aria-label={`Delete ${v.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <form
        className="grid grid-cols-2 gap-2 sm:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate();
        }}
      >
        <input
          className={inputCls}
          placeholder="Name e.g. Size 37"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          aria-label="Option name"
        />
        <input
          className={inputCls}
          placeholder="SKU"
          value={draft.sku}
          onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
          aria-label="Option SKU"
        />
        <input
          className={inputCls}
          type="number"
          min={0}
          placeholder="Price"
          value={draft.price}
          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
          aria-label="Option price"
        />
        <input
          className={inputCls}
          type="number"
          min={0}
          placeholder="Stock"
          value={draft.stock}
          onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
          aria-label="Option stock"
        />
        <button className={btnPrimary} disabled={add.isPending}>
          Add option
        </button>
      </form>
    </section>
  );
}
