import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCategory, products } from "@/lib/catalog";
import { ProductCard } from "@/components/site/product-card";
import { PageHeader } from "@/components/site/page-header";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const c = getCategory(params.slug);
    if (!c) throw notFound();
    return c;
  },
  head: ({ loaderData }) => (loaderData ? seo(loaderData.name, loaderData.blurb) : { meta: [{ title: "Category not found | SifatMart" }, { name: "robots", content: "noindex" }] }),
  component: CategoryPage,
});

function CategoryPage() {
  const c = Route.useLoaderData();
  const list = products.filter((p) => p.category === c.slug);
  return (
    <>
      <PageHeader eyebrow={c.group} title={c.name}>{c.blurb}</PageHeader>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-12 md:grid-cols-3 lg:grid-cols-4">
        {list.map((p) => <ProductCard key={p.slug} p={p} />)}
      </div>
    </>
  );
}
