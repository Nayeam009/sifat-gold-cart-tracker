import { Link, useNavigate } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
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

const icon =
  "grid h-11 w-11 place-items-center rounded-md hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SiteHeader() {
  const { count, wishlist } = useCart();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:h-20 sm:px-4">
        <Link to="/" aria-label="SifatMart home" className="flex shrink-0 items-center gap-2">
          <img
            src={logo.url}
            alt="SifatMart"
            width={160}
            height={64}
            className="h-12 w-auto sm:h-16"
          />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="border-b-2 border-transparent py-1 text-sm text-foreground/80 transition-colors hover:text-primary"
              activeProps={{ className: "border-primary text-primary" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-0.5 text-foreground sm:gap-1">
          <button
            aria-label={searchOpen ? "Close search" : "Search"}
            aria-expanded={searchOpen}
            aria-controls="site-search"
            onClick={() => setSearchOpen((s) => !s)}
            className={icon}
          >
            <Search className="h-5 w-5" />
          </button>
          <Link to="/account" aria-label="My account" className={icon}>
            <User className="h-5 w-5" />
          </Link>
          <Link
            to="/wishlist"
            aria-label={`Wishlist${wishlist.length ? `, ${wishlist.length} items` : ""}`}
            className={`relative ${icon}`}
          >
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && (
              <span
                aria-hidden
                className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] text-accent-foreground"
              >
                {wishlist.length}
              </span>
            )}
          </Link>
          <Link
            to="/cart"
            aria-label={`Cart${count ? `, ${count} items` : ""}`}
            className={`relative ${icon}`}
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span
                aria-hidden
                className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground"
              >
                {count}
              </span>
            )}
          </Link>
          <button
            className={`md:hidden ${icon}`}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {searchOpen && (
        <form
          id="site-search"
          role="search"
          className="mx-auto flex max-w-7xl gap-2 px-4 pb-4"
          onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
          onSubmit={(e) => {
            e.preventDefault();
            setSearchOpen(false);
            navigate({ to: "/search", search: { q } });
          }}
        >
          <label htmlFor="site-search-input" className="sr-only">
            Search products
          </label>
          <input
            id="site-search-input"
            type="search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sarees, jewellery, makeup…"
            className="min-w-0 flex-1 rounded-md border border-input bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button className="rounded-md bg-primary px-5 text-sm text-primary-foreground">
            Search
          </button>
        </form>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[80%] max-w-xs border-border bg-background p-0">
          <SheetTitle className="border-b border-border px-6 py-5 font-serif text-2xl text-foreground">
            Menu
          </SheetTitle>
          <nav id="mobile-nav" aria-label="Main" className="flex flex-col px-6 py-2">
            {[...nav, { to: "/account", label: "My Account" }, { to: "/track-order", label: "Track Order" }].map(
              (n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="border-b border-border/60 py-3.5 text-base text-foreground"
                  activeOptions={{ exact: n.to === "/" }}
                  activeProps={{ className: "text-primary" }}
                >
                  {n.label}
                </Link>
              ),
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
