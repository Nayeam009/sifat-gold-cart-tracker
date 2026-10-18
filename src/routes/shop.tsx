import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { categories, products } from "@/lib/catalog";
import { ProductCard } from "@/components/site/product-card";
import { PageHeader } from "@/components/site/page-header";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

const search = z.object({
  category: z.string().optional(),
  sort: z.enum(["popular", "price-asc", "price-desc", "rating"]).optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: search,
  head: () => seo("Shop All", "Browse every SifatMart product: bridal sets, sarees, jewellery, makeup, skincare and bridal shoes."),
  component: Shop,
});

function Shop() {
  const { category, sort = "popular" } = Route.useSearch();
  let list = products.filter((p) => !category || p.category === category);
  list = [...list].sort((a, b) =>
    sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : sort === "rating" ? b.rating - a.rating : b.reviews - a.reviews,
  );
  return (
    <>
      <PageHeader eyebrow="SifatMart" title="Shop All">Beautiful pieces for every special moment.</PageHeader>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-[220px_1fr]">
        <aside>
          <p className="eyebrow mb-3">Categories</p>
          <ul className="space-y-1 text-sm">
            <li><Link to="/shop" search={(s) => ({ ...s, category: undefined })} className={cn("block rounded px-2 py-1.5 hover:bg-secondary", !category && "bg-secondary text-primary")}>All products</Link></li>
            {categories.map((c) => (
              <li key={c.slug}><Link to="/shop" search={(s) => ({ ...s, category: c.slug })} className={cn("block rounded px-2 py-1.5 hover:bg-secondary", category === c.slug && "bg-secondary text-primary")}>{c.name}</Link></li>
            ))}
          </ul>
        </aside>
        <div>
          <div className="mb-6 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{list.length} products</span>
            <SortSelect value={sort} />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{list.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
        </div>
      </div>
    </>
  );
}

function SortSelect({ value }: { value: string }) {
  const navigate = Route.useNavigate();
  return (
    <select value={value} onChange={(e) => navigate({ search: (s) => ({ ...s, sort: e.target.value as "popular" }) })} className="rounded-md border border-input bg-card px-3 py-2">
      <option value="popular">Most popular</option>
      <option value="rating">Top rated</option>
      <option value="price-asc">Price: low to high</option>
      <option value="price-desc">Price: high to low</option>
    </select>
  );
}
