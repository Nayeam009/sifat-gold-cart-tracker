import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Prose } from "@/components/site/page-header";
import { seo } from "@/lib/seo";
import { PolicyText } from "@/components/site/policy-text";

export const Route = createFileRoute("/shipping-policy")({
  head: () =>
    seo("Shipping Policy", "Delivery charges and times for SifatMart orders across Bangladesh.", {
      path: "/shipping-policy",
    }),
  component: ShippingPolicyPage,
});

function ShippingPolicyPage() {
  return (
    <>
      <PageHeader eyebrow="Policies" title="Shipping Policy" />
      <Prose>
        <PolicyText field="shipping">
          <h2>Delivery charges</h2>
          <ul>
            <li>Inside Saidpur: ৳60</li>
            <li>Outside Saidpur (all Bangladesh): ৳120</li>
          </ul>
          <h2>Delivery time</h2>
          <p>Inside Saidpur: 1–2 days. Elsewhere in Bangladesh: 2–5 working days.</p>
          <h2>Payment</h2>
          <p>All orders are Cash on Delivery. We'll call to confirm your order before it ships.</p>
        </PolicyText>
      </Prose>
    </>
  );
}
