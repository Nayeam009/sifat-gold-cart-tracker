import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHeader } from "@/components/site/page-header";
import { seo } from "@/lib/seo";
import { homeFaqs } from "@/lib/faqs";

const more = [
  { q: "Are your products authentic?", a: "Yes. Every product is sourced from trusted suppliers and checked before delivery." },
  { q: "Do you deliver outside Saidpur?", a: "Yes, we deliver anywhere in Bangladesh by courier." },
  { q: "Can I pay online?", a: "Right now we accept Cash on Delivery only." },
];

export const Route = createFileRoute("/faq")({
  head: () => seo("FAQs", "Answers to common questions about ordering, delivery and returns at SifatMart."),
  component: () => (
    <>
      <PageHeader eyebrow="Help" title="Frequently Asked Questions" />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Accordion type="single" collapsible>
          {[...homeFaqs, ...more].map((f) => (
            <AccordionItem key={f.q} value={f.q}><AccordionTrigger>{f.q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{f.a}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
      </div>
    </>
  ),
});
