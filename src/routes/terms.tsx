import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Prose } from "@/components/site/page-header";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => seo("Terms & Conditions", "Terms and conditions for shopping at SifatMart."),
  component: TermsPage,
});

function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Policies" title="Terms & Conditions" />
      <Prose>
        <p>By placing an order with SifatMart you agree to these terms.</p>
<h2>Orders</h2><p>Orders are confirmed by phone. We may cancel an order if we can't reach you or a product is unavailable.</p>
<h2>Prices</h2><p>All prices are in Bangladeshi taka (৳) and may change without notice. The price at the time of order applies.</p>
<h2>Product images</h2><p>Colours may vary slightly from photos due to lighting and screens.</p>
      </Prose>
    </>
  );
}
