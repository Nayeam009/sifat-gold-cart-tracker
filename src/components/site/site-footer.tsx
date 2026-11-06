import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Youtube } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MeadowHills } from "./meadow-hills";
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

  const col = "mt-3 space-y-0 text-sm text-espresso-foreground/75 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a:hover]:text-gold-soft md:[&_a]:min-h-9";
  return (
    <footer className="relative overflow-hidden bg-espresso text-espresso-foreground">
      {/* Sky + headline */}
      <div className="relative bg-gradient-to-b from-background via-background to-secondary">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-72 w-[40rem] max-w-full -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-5 pb-4 pt-16 text-center md:pt-24">
          <h2 className="text-[clamp(2rem,7vw,4.5rem)] leading-[1.02] text-espresso">
            Make your special day <em className="text-primary">unforgettable.</em>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-foreground/75 sm:text-base">
            Order online and pay with Cash on Delivery — {BRAND.tagline.toLowerCase()}.
          </p>
          <Link to="/shop" className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-full bg-background py-1.5 pl-6 pr-1.5 text-sm font-semibold text-espresso shadow-soft transition hover:opacity-90">
            Start shopping
            <span className="grid h-9 w-9 place-items-center rounded-full bg-espresso text-espresso-foreground"><ArrowUpRight className="h-4 w-4" aria-hidden /></span>
          </Link>
        </div>
        <MeadowHills className="block h-[180px] w-full sm:h-[240px] md:h-[320px]" />
      </div>

      {/* Ground */}
      <div className="relative">
        <Wildflowers />
        <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:py-16">
          <div className="col-span-2 md:col-span-1 md:pr-10">
            <img src={logoSrc} alt="SifatMart" loading="lazy" decoding="async" width={77} height={64} className="h-14 w-auto rounded-md bg-background px-2 py-1" />
            <ul className="mt-4 text-sm text-espresso-foreground/75 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center">
              <li className="flex items-center gap-2 py-1"><MapPin className="h-4 w-4 shrink-0 text-gold-soft" aria-hidden /> {location}</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-gold-soft" aria-hidden /><a href={`tel:${hotline}`} className="hover:text-gold-soft">{hotline}</a></li>
            </ul>
            <form
              className="mt-5 flex max-w-sm items-center gap-2 border-b border-espresso-foreground/30 pb-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                const r = await subscribeNewsletter(email);
                setBusy(false);
                if (!r.ok) { toast.error(r.message); return; }
                setEmail("");
                toast.success("Thank you for subscribing!");
              }}
            >
              <Mail className="h-4 w-4 shrink-0 text-espresso-foreground/60" aria-hidden />
              <input type="email" required aria-label="Email address" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email for new arrivals & offers" className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-espresso-foreground/50" />
              <button disabled={busy} aria-label={busy ? "Subscribing" : "Subscribe"} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </button>
            </form>
          </div>
          <nav aria-label="Shop">
            <h3 className="text-lg text-gold-soft">Shop</h3>
            <ul className={col}>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/shop">Shop</Link></li>
              <li><Link to="/collections">Collections</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </nav>
          <nav aria-label="Help">
            <h3 className="text-lg text-gold-soft">Help</h3>
            <ul className={col}>
              <li><Link to="/faq">FAQs</Link></li>
              <li><Link to="/track-order">Track Order</Link></li>
              <li><Link to="/shipping-policy">Shipping Policy</Link></li>
              <li><Link to="/returns">Returns & Exchanges</Link></li>
            </ul>
          </nav>
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-lg text-gold-soft">Policies</h3>
            <ul className={col}>
              <li><Link to="/terms">Terms & Conditions</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
            {links.length > 0 && (
              <div className="mt-4 flex gap-2">
                {links.map(({ href, label, Icon }) => (
                  <a key={label} href={href!} target="_blank" rel="noreferrer" aria-label={label} className="grid h-11 w-11 place-items-center rounded-full border border-espresso-foreground/20 hover:text-gold-soft">
                    <Icon className="h-5 w-5" aria-hidden />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="relative mx-auto flex max-w-7xl flex-col gap-2 border-t border-espresso-foreground/15 px-5 py-5 text-xs text-espresso-foreground/65 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SifatMart. All rights reserved. · {BRAND.tagline}</p>
          <div className="flex gap-4 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center sm:[&_a]:min-h-0">
            <Link to="/privacy" className="hover:text-gold-soft">Privacy</Link>
            <Link to="/terms" className="hover:text-gold-soft">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

const BLOOMS = [
  { x: 6, h: 62, s: 1, petals: 6, tone: "gold" },
  { x: 19, h: 44, s: 0.8, petals: 5, tone: "red" },
  { x: 33, h: 70, s: 1.1, petals: 8, tone: "ivory" },
  { x: 50, h: 52, s: 0.9, petals: 6, tone: "gold" },
  { x: 66, h: 66, s: 1, petals: 5, tone: "red" },
  { x: 81, h: 48, s: 0.85, petals: 8, tone: "ivory" },
  { x: 94, h: 60, s: 1, petals: 6, tone: "gold" },
];
const TONES: Record<string, string> = {
  gold: "var(--ring)",
  red: "var(--accent)",
  ivory: "var(--gold-soft)",
};

function Wildflowers() {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setOpen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOpen(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} aria-hidden className={`bloom-field pointer-events-none absolute inset-x-0 bottom-0 h-full overflow-hidden ${open ? "is-open" : ""}`}>
      {BLOOMS.map((b, i) => (
        <svg key={i} className="absolute bottom-0 opacity-25 md:opacity-30" style={{ left: `${b.x}%`, height: `${b.h}%`, transform: `translateX(-50%) scale(${b.s})`, transformOrigin: "bottom center", ["--d" as string]: `${i * 0.18}s` }} viewBox="0 0 60 200" fill="none">
          <path className="bloom-stem" pathLength={1} d="M30 200 C26 160 34 120 30 60" stroke="var(--gold-soft)" strokeWidth="1.4" />
          <path className="bloom-leaf" d="M30 150 C18 140 12 146 8 138 C18 132 26 138 30 150Z" fill="var(--gold-soft)" />
          <path className="bloom-leaf bloom-leaf-r" d="M30 120 C42 110 48 116 52 108 C42 102 34 108 30 120Z" fill="var(--gold-soft)" />
          <g className="bloom-head" transform="translate(30 58)">
            {Array.from({ length: b.petals }).map((_, k) => (
              <ellipse key={k} cx="0" cy="-11" rx="6" ry="12" fill={TONES[b.tone]} fillOpacity="0.85" transform={`rotate(${(360 / b.petals) * k})`} />
            ))}
            {Array.from({ length: b.petals }).map((_, k) => (
              <ellipse key={`i${k}`} cx="0" cy="-6" rx="3.5" ry="7" fill="var(--gold-soft)" fillOpacity="0.7" transform={`rotate(${(360 / b.petals) * k + 180 / b.petals})`} />
            ))}
            <circle r="4" fill="var(--ring)" />
          </g>
        </svg>
      ))}
    </div>
  );
}
