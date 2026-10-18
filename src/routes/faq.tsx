import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHeader } from "@/components/site/page-header";
import { seo } from "@/lib/seo";
import { homeFaqs } from "@/lib/faqs";
import { faqsQuery } from "@/lib/store-data";

export const Route = createFileRoute("/faq")({
  head: () => seo("FAQs", "Answers to common questions about ordering, delivery and returns at SifatMart."),
  component: FaqPage,
});

function FaqPage() {
  const q = useQuery(faqsQuery);
  // Owner-edited FAQs from the dashboard; built-in answers only if none are published yet.
  const list = q.data?.length ? q.data.map((f) => ({ q: f.question, a: f.answer })) : homeFaqs;
  return (
    <>
      <PageHeader eyebrow="Help" title="Frequently Asked Questions" />
      <div className="mx-auto max-w-3xl px-4 py-12">
        {q.isLoading ? (
          <p role="status" className="text-center text-muted-foreground">Loading questions…</p>
        ) : (
          <>
            {q.isError && <p role="alert" className="mb-4 text-sm text-muted-foreground">Couldn't load the latest answers — showing our standard FAQs.</p>}
            <Accordion type="single" collapsible>
              {list.map((f) => (
                <AccordionItem key={f.q} value={f.q}><AccordionTrigger>{f.q}</AccordionTrigger><AccordionContent className="whitespace-pre-line text-muted-foreground">{f.a}</AccordionContent></AccordionItem>
              ))}
            </Accordion>
          </>
        )}
      </div>
    </>
  );
}
