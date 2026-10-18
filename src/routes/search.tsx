import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { products, getCategory } from "@/lib/catalog";
import { ProductCard } from "@/components/site/product-card";
import { PageHeader } from "@/components/site/page-header";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => seo("Search", "Search SifatMart for bridal, beauty and fashion products.", { path: "/search", noindex: true }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const term = q.trim().toLowerCase();
  const list = term
    ? products.filter((p) => [p.name, p.description, getCategory(p.category)?.name ?? ""].join(" ").toLowerCase().includes(term))
    : [];
  return (
    <>
      <PageHeader eyebrow="Search" title={q ? `Results for “${q}”` : "Search our store"}>{term ? `${list.length} products found` : "Use the search icon at the top to look for products."}</PageHeader>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-12 md:grid-cols-3 lg:grid-cols-4">
        {list.map((p) => <ProductCard key={p.slug} p={p} />)}
        {term && list.length === 0 && <p className="col-span-full text-center text-muted-foreground">No products match your search.</p>}
      </div>
    </>
  );
}
