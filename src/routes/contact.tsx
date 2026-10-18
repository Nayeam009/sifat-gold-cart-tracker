import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Facebook, Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import { BRAND } from "@/lib/catalog";
import { PageHeader } from "@/components/site/page-header";
import { seo } from "@/lib/seo";
import { siteSettingQuery, socialLinksQuery } from "@/lib/store-data";

export const Route = createFileRoute("/contact")({
  head: () => seo("Contact Us", "Call or message SifatMart in Saidpur, Nilphamari, Bangladesh. Hotline 01997974394.", { path: "/contact" }),
  component: Contact,
});

const str = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v.trim() : fallback);

function Contact() {
  const { data: c } = useQuery(siteSettingQuery("store_contact"));
  const { data: social } = useQuery(socialLinksQuery);
  const hotline = /^01[3-9]\d{8}$/.test(String(c?.["hotline"] ?? "")) ? String(c!["hotline"]) : BRAND.hotline;
  const address = str(c?.["address"], BRAND.location);
  const hours = str(c?.["hours"], BRAND.hours);
  const links = [
    social?.whatsapp && { href: social.whatsapp, label: "WhatsApp us", Icon: MessageCircle },
    social?.facebook && { href: social.facebook, label: "Facebook", Icon: Facebook },
    social?.instagram && { href: social.instagram, label: "Instagram", Icon: Instagram },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof Phone }[];
  return (
    <>
      <PageHeader eyebrow="We're here to help" title="Contact Us" />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="space-y-5 rounded-lg border border-border bg-secondary p-8 text-sm">
          <p className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-primary" aria-hidden /> <span>{address}{!address.includes("Saidpur") && <><br />{BRAND.location}</>}</span></p>
          <p className="flex gap-3"><Phone className="h-5 w-5 text-primary" aria-hidden /> <a href={`tel:+88${hotline}`} className="underline">{hotline}</a></p>
          <p className="flex gap-3"><Clock className="h-5 w-5 text-primary" aria-hidden /> {hours}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href={`tel:+88${hotline}`} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-primary-foreground"><Phone className="h-4 w-4" aria-hidden /> Call {hotline}</a>
            {links.map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5"><Icon className="h-4 w-4" aria-hidden /> {label}</a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
