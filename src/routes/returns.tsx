import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Prose } from "@/components/site/page-header";
import { seo } from "@/lib/seo";
import { PolicyText } from "@/components/site/policy-text";

export const Route = createFileRoute("/returns")({
  head: () => seo("Returns & Exchanges", "SifatMart return and exchange policy."),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <>
      <PageHeader eyebrow="Policies" title="Returns & Exchanges" />
      <Prose><PolicyText field="returns">
        <p>If something isn't right, contact us within <strong>3 days</strong> of delivery.</p>
<ul><li>Items must be unused and in original packaging.</li><li>Makeup, skincare and fresh flower items can be exchanged only if damaged or incorrect.</li><li>We'll arrange an exchange or refund after checking the item.</li></ul>
<p>Call our hotline 01997974394 to start an exchange.</p>
      </PolicyText></Prose>
    </>
  );
}
