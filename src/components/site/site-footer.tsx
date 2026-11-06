import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Facebook, Instagram, MapPin, MessageCircle, Phone, Youtube } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import logoSrc from "@/assets/sifatmart-logo.webp";
import { BRAND } from "@/lib/catalog";
import { siteSettingQuery, socialLinksQuery, subscribeNewsletter } from "@/lib/store-data";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: social } = useQuery(socialLinksQuery);
  const { data: contact } = useQuery(siteSettingQuery("store_contact"));
  const hotline =
    typeof contact?.["hotline"] === "string" && contact["hotline"]
      ? contact["hotline"]
      : BRAND.hotline;
  const location =
    typeof contact?.["location"] === "string" && contact["location"]
      ? contact["location"]
      : BRAND.location;
  const links = [
    { href: social?.facebook, label: "Facebook", Icon: Facebook },
    { href: social?.instagram, label: "Instagram", Icon: Instagram },
    { href: social?.youtube, label: "YouTube", Icon: Youtube },
    { href: social?.whatsapp, label: "WhatsApp", Icon: MessageCircle },
  ].filter((l) => l.href);

  return (
    <footer className="bg-espresso text-espresso-foreground">
      <div className="relative overflow-hidden border-b border-espresso-foreground/10">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-5 py-14 text-center md:py-20">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold-soft">{BRAND.tagline}</p>
          <h2 className="mt-3 text-[clamp(1.8rem,6vw,3.2rem)] leading-tight text-espresso-foreground">
            Make your special day <em className="text-gold-soft">unforgettable.</em>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-espresso-foreground/75 sm:text-base">
            Order online and pay with Cash on Delivery, or call us for help choosing.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 min-[420px]:flex-row">
            <Link to="/shop" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Start shopping <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a href={`tel:${hotline}`} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-espresso-foreground/30 px-7 text-sm font-semibold hover:bg-espresso-foreground/10">
              <Phone className="h-4 w-4" aria-hidden /> {hotline}
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-14 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <div className="inline-block rounded-md bg-background px-3 py-2">
            <img
              src={logoSrc}
              alt="SifatMart"
              loading="lazy"
              decoding="async"
              width={58}
              height={48}
              className="h-12 w-auto"
            />
          </div>
          <ul className="mt-4 space-y-0 text-sm opacity-80 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center md:space-y-1 md:[&_a]:min-h-8">
            <li className="flex gap-2">
              <MapPin className="h-4 w-4 shrink-0" /> SifatMart, {location}
            </li>
            <li className="flex gap-2">
              <Phone className="h-4 w-4 shrink-0" />{" "}
              <a href={`tel:${hotline}`} className="hover:text-primary">
                {hotline}
              </a>
            </li>
          </ul>
          {links.length > 0 && (
            <div className="mt-4 flex gap-3">
              {links.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href!}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="hover:text-primary"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg text-gold-soft">Quick Links</h3>
          <ul className="mt-4 space-y-0 text-sm opacity-80 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center md:space-y-1 md:[&_a]:min-h-8">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/shop">Shop</Link>
            </li>
            <li>
              <Link to="/collections">Collections</Link>
            </li>
            <li>
              <Link to="/about">About Us</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg text-gold-soft">Customer Service</h3>
          <ul className="mt-4 space-y-0 text-sm opacity-80 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center md:space-y-1 md:[&_a]:min-h-8">
            <li>
              <Link to="/faq">FAQs</Link>
            </li>
            <li>
              <Link to="/track-order">Track Order</Link>
            </li>
            <li>
              <Link to="/shipping-policy">Shipping Policy</Link>
            </li>
            <li>
              <Link to="/returns">Returns & Exchanges</Link>
            </li>
            <li>
              <Link to="/terms">Terms & Conditions</Link>
            </li>
            <li>
              <Link to="/privacy">Privacy Policy</Link>
            </li>
          </ul>
        </div>
        <div className="col-span-2 md:col-span-1">
          <h3 className="text-lg text-gold-soft">Newsletter</h3>
          <p className="mt-4 text-sm opacity-80">Get updates on new arrivals and offers.</p>
          <form
            className="mt-4 space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const r = await subscribeNewsletter(email);
              setBusy(false);
              if (!r.ok) {
                toast.error(r.message);
                return;
              }
              setEmail("");
              toast.success("Thank you for subscribing!");
            }}
          >
            <input
              type="email"
              required
              aria-label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full border-b border-espresso-foreground/30 bg-transparent py-2 text-sm outline-none placeholder:text-espresso-foreground/50"
            />
            <button
              disabled={busy}
              className="min-h-11 w-full rounded-md bg-primary py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-espresso-foreground/15 py-4 text-center text-xs opacity-70">
        © {new Date().getFullYear()} SifatMart. All rights reserved. | {BRAND.tagline}
      </div>
    </footer>
  );
}
