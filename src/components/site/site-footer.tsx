import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/sifatmart-logo.png.asset.json";
import { BRAND } from "@/lib/catalog";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  return (
    <footer className="bg-espresso text-espresso-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="inline-block rounded-md bg-background px-3 py-2"><img src={logo.url} alt="SifatMart" className="h-12 w-auto" /></div>
          <p className="mt-4 text-sm opacity-80">Bridal essentials, beauty favourites, elegant fashion and more — all in one place for your special moments.</p>
          <div className="mt-4 flex gap-3">
            <a href={BRAND.facebook} aria-label="Facebook" className="hover:text-primary"><Facebook className="h-5 w-5" /></a>
            <a href="#" aria-label="Instagram" className="hover:text-primary"><Instagram className="h-5 w-5" /></a>
            <a href="#" aria-label="YouTube" className="hover:text-primary"><Youtube className="h-5 w-5" /></a>
          </div>
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
          <p className="mt-4 text-sm opacity-80">Get the latest updates on new arrivals, exclusive offers and more.</p>
          <form className="mt-4 space-y-2" onSubmit={(e) => { e.preventDefault(); if (!/^\S+@\S+\.\S+$/.test(email)) { toast.error("Please enter a valid email"); return; } setEmail(""); toast.success("Thank you for subscribing!"); }}>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" className="w-full border-b border-espresso-foreground/30 bg-transparent py-2 text-sm outline-none placeholder:text-espresso-foreground/50" />
            <button className="w-full rounded-md bg-primary py-2 text-sm text-primary-foreground hover:opacity-90">Subscribe</button>
          </form>
        </div>
      </div>
      <div className="border-t border-espresso-foreground/15 py-4 text-center text-xs opacity-70">
        © {new Date().getFullYear()} SifatMart. All rights reserved. | {BRAND.tagline} | Made with love in Bangladesh
      </div>
    </footer>
  );
}
