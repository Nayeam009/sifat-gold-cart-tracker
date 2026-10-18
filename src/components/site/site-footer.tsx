import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, MapPin, MessageCircle, Phone, Youtube } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/sifatmart-logo.png.asset.json";
import { BRAND } from "@/lib/catalog";
import { socialLinksQuery, subscribeNewsletter } from "@/lib/store-data";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: social } = useQuery(socialLinksQuery);
  const links = [
    { href: social?.facebook, label: "Facebook", Icon: Facebook },
    { href: social?.instagram, label: "Instagram", Icon: Instagram },
    { href: social?.youtube, label: "YouTube", Icon: Youtube },
    { href: social?.whatsapp, label: "WhatsApp", Icon: MessageCircle },
  ].filter((l) => l.href);

  return (
    <footer className="bg-espresso text-espresso-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="inline-block rounded-md bg-background px-3 py-2"><img src={logo.url} alt="SifatMart" className="h-12 w-auto" /></div>
          <ul className="mt-4 space-y-2 text-sm opacity-80">
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0" /> SifatMart, {BRAND.location}</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0" /> <a href={`tel:${BRAND.hotline}`} className="hover:text-primary">{BRAND.hotline}</a></li>
          </ul>
          {links.length > 0 && (
            <div className="mt-4 flex gap-3">
              {links.map(({ href, label, Icon }) => <a key={label} href={href!} target="_blank" rel="noreferrer" aria-label={label} className="hover:text-primary"><Icon className="h-5 w-5" /></a>)}
            </div>
          )}
        </div>
        <div>
          <h4 className="text-lg text-gold-soft">Quick Links</h4>
          <ul className="mt-4 space-y-2 text-sm opacity-80">
            <li><Link to="/">Home</Link></li><li><Link to="/shop">Shop</Link></li><li><Link to="/collections">Collections</Link></li><li><Link to="/about">About Us</Link></li><li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg text-gold-soft">Customer Service</h4>
          <ul className="mt-4 space-y-2 text-sm opacity-80">
            <li><Link to="/faq">FAQs</Link></li><li><Link to="/track-order">Track Order</Link></li><li><Link to="/shipping-policy">Shipping Policy</Link></li><li><Link to="/returns">Returns & Exchanges</Link></li><li><Link to="/terms">Terms & Conditions</Link></li><li><Link to="/privacy">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg text-gold-soft">Newsletter</h4>
          <p className="mt-4 text-sm opacity-80">Get updates on new arrivals and offers.</p>
          <form className="mt-4 space-y-2" onSubmit={async (e) => {
            e.preventDefault(); setBusy(true);
            const r = await subscribeNewsletter(email); setBusy(false);
            if (!r.ok) { toast.error(r.message); return; }
            setEmail(""); toast.success("Thank you for subscribing!");
          }}>
            <input type="email" required aria-label="Email address" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" className="w-full border-b border-espresso-foreground/30 bg-transparent py-2 text-sm outline-none placeholder:text-espresso-foreground/50" />
            <button disabled={busy} className="w-full rounded-md bg-primary py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-60">{busy ? "Subscribing…" : "Subscribe"}</button>
          </form>
        </div>
      </div>
      <div className="border-t border-espresso-foreground/15 py-4 text-center text-xs opacity-70">
        © {new Date().getFullYear()} SifatMart. All rights reserved. | {BRAND.tagline}
      </div>
    </footer>
  );
}
