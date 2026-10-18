import { createFileRoute, notFound } from "@tanstack/react-router";
import { getOccasion, products } from "@/lib/catalog";
import { ProductCard } from "@/components/site/product-card";
import { PageHeader } from "@/components/site/page-header";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/occasion/$slug")({
  loader: ({ params }) => {
    const o = getOccasion(params.slug);
    if (!o) throw notFound();
    return o;
  },
  head: ({ loaderData }) => (loaderData ? seo(`${loaderData.name} Collection`, loaderData.blurb, { path: `/occasion/${loaderData.slug}` }) : { meta: [{ title: "Not found | SifatMart" }, { name: "robots", content: "noindex" }] }),
  component: OccasionPage,
});

function OccasionPage() {
  const o = Route.useLoaderData();
  const list = products.filter((p) => p.occasions.includes(o.slug));
  return (
    <>
      <PageHeader eyebrow="For every special occasion" title={o.name}>{o.blurb}</PageHeader>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-12 md:grid-cols-3 lg:grid-cols-4">
        {list.map((p) => <ProductCard key={p.slug} p={p} />)}
      </div>
    </>
  );
}
