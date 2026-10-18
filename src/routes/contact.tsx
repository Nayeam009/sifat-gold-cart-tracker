import { createFileRoute } from "@tanstack/react-router";
import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { BRAND } from "@/lib/catalog";
import { PageHeader } from "@/components/site/page-header";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => seo("Contact Us", "Call, WhatsApp or message SifatMart in Saidpur, Nilphamari. Hotline 01997974394."),
  component: Contact,
});

function Contact() {
  const field = "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
  return (
    <>
      <PageHeader eyebrow="We're here to help" title="Contact Us" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-2">
        <div className="space-y-5 rounded-lg border border-border bg-secondary p-8 text-sm">
          <p className="flex gap-3"><MapPin className="h-5 w-5 text-primary" /> {BRAND.location}</p>
          <p className="flex gap-3"><Phone className="h-5 w-5 text-primary" /> <a href={`tel:${BRAND.hotline}`}>{BRAND.hotline}</a></p>
          <p className="flex gap-3"><Clock className="h-5 w-5 text-primary" /> {BRAND.hours}</p>
          <a href={`tel:${BRAND.hotline}`} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-primary-foreground"><MessageCircle className="h-4 w-4" /> Call {BRAND.hotline}</a>
        </div>
        <form className="space-y-3 rounded-lg border border-border bg-card p-8" onSubmit={(e) => { e.preventDefault(); e.currentTarget.reset(); toast.success("Thanks! We'll get back to you soon."); }}>
          <h2 className="text-2xl">Send a message</h2>
          <input required maxLength={100} placeholder="Your name" className={field} />
          <input required maxLength={20} placeholder="Mobile number" className={field} />
          <textarea required maxLength={1000} rows={4} placeholder="How can we help?" className={field} />
          <button className="w-full rounded-md bg-primary py-3 text-sm text-primary-foreground">Send Message</button>
        </form>
      </div>
    </>
  );
}
