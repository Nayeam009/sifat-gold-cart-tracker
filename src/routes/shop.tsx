import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/page-header";
import { CatalogueView, catalogueSearch } from "@/components/site/catalogue-view";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/shop")({
  validateSearch: catalogueSearch,
  head: () =>
    seo(
      "Shop All",
      "Browse every SifatMart product: bridal flower sets, sarees, jewellery, makeup, skincare, bridal shoes and mehendi.",
      { path: "/shop" },
    ),
  component: Shop,
});

function Shop() {
  return (
    <>
      <PageHeader eyebrow="SifatMart" title="Shop All">
        Beautiful pieces for every special moment.
      </PageHeader>
      <CatalogueView search={Route.useSearch()} />
    </>
  );
}
