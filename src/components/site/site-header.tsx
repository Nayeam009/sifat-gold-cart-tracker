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
          <img src={logo.url} alt="SifatMart" className="h-12 w-auto" />
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
        <div className="flex items-center gap-4 text-foreground">
          <button aria-label="Search" onClick={() => setSearchOpen((s) => !s)} className="hover:text-primary"><Search className="h-5 w-5" /></button>
          <Link to="/track-order" aria-label="Track order" className="hover:text-primary"><User className="h-5 w-5" /></Link>
          <Link to="/wishlist" aria-label="Wishlist" className="relative hover:text-primary">
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && <span className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full bg-accent text-[10px] text-accent-foreground">{wishlist.length}</span>}
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative hover:text-primary">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && <span className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{count}</span>}
          </Link>
          <button className="md:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {searchOpen && (
        <form className="mx-auto flex max-w-7xl gap-2 px-4 pb-4" onSubmit={(e) => { e.preventDefault(); setSearchOpen(false); navigate({ to: "/search", search: { q } }); }}>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sarees, jewellery, makeup…" className="flex-1 rounded-md border border-input bg-card px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <button className="rounded-md bg-primary px-5 text-sm text-primary-foreground">Search</button>
        </form>
      )}
      {open && (
        <nav className="flex flex-col border-t border-border px-4 py-3 md:hidden">
          {nav.map((n) => <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2 text-sm">{n.label}</Link>)}
          <Link to="/track-order" onClick={() => setOpen(false)} className="py-2 text-sm">Track Order</Link>
        </nav>
      )}
    </header>
  );
}
