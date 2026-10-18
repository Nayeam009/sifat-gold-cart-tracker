import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Prose } from "@/components/site/page-header";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => seo("Privacy Policy", "How SifatMart collects and uses your information."),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Policies" title="Privacy Policy" />
      <Prose>
        <p>We collect only the details needed to deliver your order: name, mobile number, address and optional email.</p>
<p>We never sell your information. We use it to confirm, deliver and support your orders, and — if you subscribe — to send occasional offers.</p>
<p>To ask about or delete your data, call 01997974394.</p>
      </Prose>
    </>
  );
}
