import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { categories, getCategory } from "@/lib/catalog";
import { PageHeader } from "@/components/site/page-header";
import { CatalogueView, catalogueSearch } from "@/components/site/catalogue-view";
import { absUrl, breadcrumbLd, jsonLd, seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/category/$slug")({
  validateSearch: catalogueSearch.omit({ category: true }),
  loader: ({ params }) => {
    const c = getCategory(params.slug);
    if (!c) throw notFound();
    return c;
  },
  head: ({ loaderData: c }) =>
    c
      ? {
          ...seo(c.name, c.blurb, { path: `/category/${c.slug}` }),
          scripts: [
            jsonLd({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: c.name,
              description: c.blurb,
              url: absUrl(`/category/${c.slug}`),
            }),
            breadcrumbLd([
              { name: "Home", path: "/" },
              { name: "Shop", path: "/shop" },
              { name: c.name, path: `/category/${c.slug}` },
            ]),
          ],
        }
      : {
          meta: [
            { title: "Category not found | SifatMart" },
            { name: "robots", content: "noindex" },
          ],
        },
  notFoundComponent: () => (
    <div className="py-24 text-center">
      <h1 className="text-3xl">Category not found</h1>
      <p className="mt-2 text-muted-foreground">This category doesn't exist or has moved.</p>
      <Link
        to="/shop"
        className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-sm text-primary-foreground"
      >
        Browse all products
      </Link>
    </div>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const c = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow={c.group} title={c.name}>
        {c.blurb}
      </PageHeader>
      <nav
        aria-label="Categories"
        className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pt-8 text-sm"
      >
        <Link
          to="/shop"
          className="whitespace-nowrap rounded-full border border-input px-4 py-1.5 hover:bg-secondary"
        >
          All
        </Link>
        {categories.map((x) => (
          <Link
            key={x.slug}
            to="/category/$slug"
            params={{ slug: x.slug }}
            className={cn(
              "whitespace-nowrap rounded-full border px-4 py-1.5 hover:bg-secondary",
              x.slug === c.slug ? "border-primary bg-secondary text-primary" : "border-input",
            )}
          >
            {x.name}
          </Link>
        ))}
      </nav>
      <CatalogueView search={Route.useSearch()} fixedCategory={c.slug} />
    </>
  );
}
