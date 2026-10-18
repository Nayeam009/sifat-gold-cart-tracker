import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Prose } from "@/components/site/page-header";
import { seo } from "@/lib/seo";
import { PolicyText } from "@/components/site/policy-text";

export const Route = createFileRoute("/about")({
  head: () =>
    seo(
      "About Us",
      "The story behind SifatMart, a bridal, beauty and fashion shop from Saidpur, Bangladesh.",
      { path: "/about" },
    ),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="Our Story" title="About Us" />
      <Prose>
        <PolicyText field="about">
          <p>
            SifatMart was founded by <strong>Rowsan Parvin</strong> in Saidpur, Nilphamari with one
            simple wish: that every woman in Bangladesh can find beautiful, authentic pieces for
            life's special moments — without the stress.
          </p>
          <p>
            From bridal flower sets and sarees to jewellery, makeup and shoes, we hand-pick every
            product and check its quality before it reaches you.
          </p>
          <h2>What we believe</h2>
          <ul>
            <li>Only genuine, quality products</li>
            <li>Fair prices for every budget</li>
            <li>Cash on Delivery across Bangladesh</li>
            <li>Warm, friendly help whenever you need it</li>
          </ul>
        </PolicyText>
      </Prose>
    </>
  );
}
