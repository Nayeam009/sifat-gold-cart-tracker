import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { categoriesQuery, catalogueQuery } from "@/lib/catalogue-data";
import { applyFilters, PAGE_SIZE, type Sort } from "@/lib/catalogue";
import { formatTaka } from "@/lib/catalog";
import { ProductCard } from "@/components/site/product-card";
import { cn } from "@/lib/utils";

export const catalogueSearch = z.object({
  q: z.string().max(80).optional().catch(undefined),
  category: z.string().max(60).optional().catch(undefined),
  min: z.coerce.number().int().min(0).optional().catch(undefined),
  max: z.coerce.number().int().min(0).optional().catch(undefined),
  stock: z.literal("1").optional().catch(undefined),
  sort: z.enum(["newest", "price-asc", "price-desc"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(50).optional().catch(undefined),
});
export type CatalogueSearch = z.infer<typeof catalogueSearch>;

const PRICE_PRESETS = [
  { label: "Under ৳1,000", max: 999 },
  { label: "৳1,000 – ৳2,500", min: 1000, max: 2500 },
  { label: "Over ৳2,500", min: 2501 },
];

export function CatalogueView({ search, fixedCategory }: { search: CatalogueSearch; fixedCategory?: string }) {
  const navigate = useNavigate();
  const products = useQuery(catalogueQuery);
  const cats = useQuery(categoriesQuery);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const category = fixedCategory ?? search.category;
  const set = (patch: Partial<CatalogueSearch>) =>
    navigate({ to: ".", search: (s: CatalogueSearch) => ({ ...s, ...patch, page: undefined }), replace: true, resetScroll: false } as never);

  const list = products.data ? applyFilters(products.data, { q: search.q, category, min: search.min, max: search.max, inStock: !!search.stock, sort: search.sort as Sort }) : [];
  const page = search.page ?? 1;
  const visible = list.slice(0, page * PAGE_SIZE);
  const active = !!(search.q || (!fixedCategory && search.category) || search.min != null || search.max != null || search.stock);
  const clearAll = () => navigate({ to: ".", search: {}, replace: true } as never);
  const countFor = (slug: string) => products.data?.filter((p) => p.categorySlug === slug).length ?? 0;

  const sidebar = (
    <div className="space-y-8 text-sm">
      {!fixedCategory && (
        <fieldset>
          <legend className="eyebrow mb-3">Category</legend>
          <ul className="space-y-1">
            <li><button onClick={() => set({ category: undefined })} className={cn("block w-full rounded px-2 py-1.5 text-left hover:bg-secondary", !category && "bg-secondary text-primary")}>All products</button></li>
            {(cats.data ?? []).map((c) => (
              <li key={c.slug}>
                <button aria-pressed={category === c.slug} onClick={() => set({ category: c.slug })} className={cn("flex w-full justify-between rounded px-2 py-1.5 text-left hover:bg-secondary", category === c.slug && "bg-secondary text-primary")}>
                  <span>{c.name}</span><span className="text-muted-foreground">{countFor(c.slug)}</span>
                </button>
              </li>
            ))}
          </ul>
          {cats.isError && <p className="text-xs text-destructive">Categories couldn't load.</p>}
        </fieldset>
      )}
      <fieldset>
        <legend className="eyebrow mb-3">Price (৳)</legend>
        <PriceInputs min={search.min} max={search.max} onApply={(min, max) => set({ min, max })} />
        <div className="mt-3 flex flex-wrap gap-2">
          {PRICE_PRESETS.map((p) => {
            const on = search.min === p.min && search.max === p.max;
            return <button key={p.label} aria-pressed={on} onClick={() => set(on ? { min: undefined, max: undefined } : { min: p.min, max: p.max })} className={cn("rounded-full border px-3 py-1 text-xs", on ? "border-primary bg-secondary text-primary" : "border-input")}>{p.label}</button>;
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="eyebrow mb-3">Availability</legend>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" className="accent-primary" checked={!!search.stock} onChange={(e) => set({ stock: e.target.checked ? "1" : undefined })} />
          In stock only
        </label>
      </fieldset>
      {active && <button onClick={clearAll} className="text-xs text-primary underline">Clear all filters</button>}
    </div>
  );

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-[230px_1fr]">
      <aside className="hidden md:block">{sidebar}</aside>
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <SearchBox value={search.q ?? ""} onSubmit={(q) => set({ q: q || undefined })} />
          <button onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen} className="flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm md:hidden">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
          <label className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sort</span>
            <select value={search.sort ?? "newest"} onChange={(e) => set({ sort: e.target.value === "newest" ? undefined : (e.target.value as Sort) })} className="rounded-md border border-input bg-card px-3 py-2">
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </div>
        {filtersOpen && <div className="mb-6 rounded-lg border border-border bg-card p-4 md:hidden">{sidebar}</div>}

        {active && (
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {search.q && <Chip onClear={() => set({ q: undefined })}>“{search.q}”</Chip>}
            {!fixedCategory && search.category && <Chip onClear={() => set({ category: undefined })}>{cats.data?.find((c) => c.slug === search.category)?.name ?? search.category}</Chip>}
            {(search.min != null || search.max != null) && <Chip onClear={() => set({ min: undefined, max: undefined })}>{search.min != null ? formatTaka(search.min) : "৳ 0"} – {search.max != null ? formatTaka(search.max) : "any"}</Chip>}
            {search.stock && <Chip onClear={() => set({ stock: undefined })}>In stock</Chip>}
          </div>
        )}

        {products.isPending ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3" aria-busy="true" aria-label="Loading products">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : products.isError ? (
          <div role="alert" className="rounded-lg border border-border bg-card p-10 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-3">We couldn't load products right now.</p>
            <button onClick={() => products.refetch()} className="mt-4 rounded-md bg-primary px-5 py-2 text-sm text-primary-foreground">Try again</button>
          </div>
        ) : products.data.length === 0 ? (
          <p className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">No products have been added yet. Please check back soon.</p>
        ) : list.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3">No products match your search.</p>
            <p className="text-sm text-muted-foreground">Try a different word or remove a filter.</p>
            {active ? <button onClick={clearAll} className="mt-4 rounded-md bg-primary px-5 py-2 text-sm text-primary-foreground">Clear filters</button> : <Link to="/shop" className="mt-4 inline-block text-primary underline">Browse all products</Link>}
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">Showing {visible.length} of {list.length} products</p>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{visible.map((p) => <ProductCard key={p.slug} p={p} showStock />)}</div>
            {visible.length < list.length && (
              <div className="mt-8 text-center">
                <button onClick={() => navigate({ to: ".", search: (s: CatalogueSearch) => ({ ...s, page: page + 1 }), replace: true, resetScroll: false } as never)} className="rounded-md border border-primary px-6 py-2.5 text-sm text-primary hover:bg-secondary">
                  Load more ({list.length - visible.length} more)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1">
      {children}
      <button aria-label="Remove filter" onClick={onClear}><X className="h-3 w-3" /></button>
    </span>
  );
}

function SearchBox({ value, onSubmit }: { value: string; onSubmit: (q: string) => void }) {
  const [q, setQ] = useState(value);
  useEffect(() => setQ(value), [value]);
  return (
    <form role="search" className="flex min-w-0 flex-1 items-center rounded-md border border-input bg-card" onSubmit={(e) => { e.preventDefault(); onSubmit(q.trim().slice(0, 80)); }}>
      <Search className="ml-3 h-4 w-4 text-muted-foreground" aria-hidden />
      <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={80} placeholder="Search products…" aria-label="Search products" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none" />
      {q && <button type="button" aria-label="Clear search" onClick={() => { setQ(""); onSubmit(""); }} className="px-2"><X className="h-4 w-4" /></button>}
    </form>
  );
}

function PriceInputs({ min, max, onApply }: { min?: number | undefined; max?: number | undefined; onApply: (min?: number, max?: number) => void }) {
  const [lo, setLo] = useState(min?.toString() ?? "");
  const [hi, setHi] = useState(max?.toString() ?? "");
  useEffect(() => { setLo(min?.toString() ?? ""); setHi(max?.toString() ?? ""); }, [min, max]);
  const n = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? undefined : Math.max(0, Math.floor(Number(v))));
  return (
    <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); let a = n(lo), b = n(hi); if (a != null && b != null && a > b) [a, b] = [b, a]; onApply(a, b); }}>
      <input inputMode="numeric" aria-label="Minimum price" placeholder="Min" value={lo} onChange={(e) => setLo(e.target.value)} className="w-20 rounded-md border border-input bg-card px-2 py-1.5" />
      <span>–</span>
      <input inputMode="numeric" aria-label="Maximum price" placeholder="Max" value={hi} onChange={(e) => setHi(e.target.value)} className="w-20 rounded-md border border-input bg-card px-2 py-1.5" />
      <button className="rounded-md bg-primary px-2 py-1.5 text-xs text-primary-foreground">Go</button>
    </form>
  );
}
