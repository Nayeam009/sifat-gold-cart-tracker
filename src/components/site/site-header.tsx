import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/sifatmart-logo.png.asset.json";
import { useCart } from "@/lib/cart";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/collections", label: "Collections" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const { count, wishlist } = useCart();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo.url} alt="SifatMart logo" width={160} height={64} className="h-16 w-auto" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
              className="border-b-2 border-transparent py-1 text-sm text-foreground/80 transition-colors hover:text-primary"
              activeProps={{ className: "border-primary text-primary" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-0.5 text-foreground sm:gap-1">
          <button aria-label={searchOpen ? "Close search" : "Search"} aria-expanded={searchOpen} aria-controls="site-search" onClick={() => setSearchOpen((s) => !s)} className={icon}><Search className="h-5 w-5" /></button>
          <Link to="/account" aria-label="My account" className={icon}><User className="h-5 w-5" /></Link>
          <Link to="/wishlist" aria-label={`Wishlist${wishlist.length ? `, ${wishlist.length} items` : ""}`} className={`relative ${icon}`}>
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && <span aria-hidden className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] text-accent-foreground">{wishlist.length}</span>}
          </Link>
          <Link to="/cart" aria-label={`Cart${count ? `, ${count} items` : ""}`} className={`relative ${icon}`}>
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && <span aria-hidden className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{count}</span>}
          </Link>
          <button className={`md:hidden ${icon}`} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {searchOpen && (
        <form id="site-search" role="search" className="mx-auto flex max-w-7xl gap-2 px-4 pb-4" onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)} onSubmit={(e) => { e.preventDefault(); setSearchOpen(false); navigate({ to: "/search", search: { q } }); }}>
          <label htmlFor="site-search-input" className="sr-only">Search products</label>
          <input id="site-search-input" type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sarees, jewellery, makeup…" className="min-w-0 flex-1 rounded-md border border-input bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <button className="rounded-md bg-primary px-5 text-sm text-primary-foreground">Search</button>
        </form>
      )}
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="flex flex-col border-t border-border px-4 py-2 md:hidden" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
          {nav.map((n) => <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-3 text-sm" activeOptions={{ exact: n.to === "/" }} activeProps={{ className: "text-primary" }}>{n.label}</Link>)}
          <Link to="/account" onClick={() => setOpen(false)} className="py-3 text-sm">My Account</Link>
          <Link to="/track-order" onClick={() => setOpen(false)} className="py-3 text-sm">Track Order</Link>
        </nav>
      )}
    </header>
  );
}
