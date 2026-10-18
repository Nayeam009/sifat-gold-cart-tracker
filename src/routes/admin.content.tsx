import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CrudTable } from "@/components/admin/crud-table";
import { AdminTitle } from "@/components/admin/confirm";

export const Route = createFileRoute("/admin/content")({ component: Content });

const TABS = ["Banners", "Reviews", "FAQs"] as const;

function Content() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Banners");
  return (
    <div>
      <AdminTitle title="Homepage & FAQs" />
      <div role="tablist" className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm ${tab === t ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}>{t}</button>)}
      </div>
      {tab === "Banners" && (
        <CrudTable key="b" table="homepage_banners" noun="Banner" orderBy="sort_order" searchKeys={["title"]} label={(r) => String(r.title)} invalidate={["banners"]}
          defaults={{ title: "", subtitle: "", image_url: null, link_url: "", sort_order: 0, is_published: true }}
          validate={(r) => (r.link_url && !/^(\/|https:\/\/)/.test(String(r.link_url)) ? "Link must start with / (a page in your shop) or https://." : null)}
          fields={[
            { key: "title", label: "Title", type: "text", required: true, maxLength: 120 },
            { key: "subtitle", label: "Subtitle", type: "textarea", maxLength: 300 },
            { key: "image_url", label: "Image", type: "image" },
            { key: "link_url", label: "Button link", type: "text", placeholder: "/shop", maxLength: 300 },
            { key: "sort_order", label: "Display order", type: "number", min: 0, max: 999 },
            { key: "is_published", label: "Show on homepage", type: "bool" },
          ]}
          columns={[{ key: "title", label: "Title" }, { key: "link_url", label: "Link" }, { key: "sort_order", label: "Order" }, { key: "is_published", label: "Shown", render: (r) => (r.is_published ? "Yes" : "Hidden") }]} />
      )}
      {tab === "Reviews" && (
        <CrudTable key="t" table="testimonials" noun="Review" orderBy="sort_order" searchKeys={["customer_name", "body"]} label={(r) => String(r.customer_name)} invalidate={["testimonials"]}
          defaults={{ customer_name: "", location: "", body: "", rating: 5, sort_order: 0, is_published: false }}
          fields={[
            { key: "customer_name", label: "Customer name", type: "text", required: true, maxLength: 80 },
            { key: "location", label: "Location", type: "text", maxLength: 80 },
            { key: "body", label: "Review", type: "textarea", required: true, maxLength: 800, help: "Only publish genuine reviews with the customer's permission." },
            { key: "rating", label: "Stars (1–5)", type: "number", required: true, min: 1, max: 5 },
            { key: "sort_order", label: "Display order", type: "number", min: 0, max: 999 },
            { key: "is_published", label: "Show on homepage", type: "bool" },
          ]}
          columns={[{ key: "customer_name", label: "Customer" }, { key: "rating", label: "Stars" }, { key: "body", label: "Review", render: (r) => <span className="line-clamp-2">{String(r.body)}</span> }, { key: "is_published", label: "Shown", render: (r) => (r.is_published ? "Yes" : "Hidden") }]} />
      )}
      {tab === "FAQs" && (
        <CrudTable key="f" table="faqs" noun="FAQ" orderBy="sort_order" searchKeys={["question", "answer"]} label={(r) => String(r.question)} invalidate={["faqs"]}
          defaults={{ question: "", answer: "", topic: "", sort_order: 0, is_published: true }}
          fields={[
            { key: "question", label: "Question", type: "text", required: true, maxLength: 200 },
            { key: "answer", label: "Answer", type: "textarea", required: true, maxLength: 1500 },
            { key: "topic", label: "Topic (optional)", type: "text", maxLength: 60 },
            { key: "sort_order", label: "Display order", type: "number", min: 0, max: 999 },
            { key: "is_published", label: "Published", type: "bool" },
          ]}
          columns={[{ key: "question", label: "Question" }, { key: "topic", label: "Topic" }, { key: "sort_order", label: "Order" }, { key: "is_published", label: "Published", render: (r) => (r.is_published ? "Yes" : "Hidden") }]} />
      )}
    </div>
  );
}
