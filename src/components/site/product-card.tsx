import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { formatTaka, type Product } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

export function ProductCard({ p, showStock, variants }: { p: Product; showStock?: boolean; variants?: string[] }) {
  const { add, wishlist, toggleWish } = useCart();
  const wished = wishlist.includes(p.slug);
  const soldOut = showStock && p.stock <= 0;
  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-soft">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link to="/product/$slug" params={{ slug: p.slug }}>
          <img src={p.image} alt={p.name} loading="lazy" width={816} height={816} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </Link>
        <button aria-label={wished ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={wished} onClick={() => toggleWish(p.slug)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-card/90">
          <Heart className={cn("h-4 w-4", wished ? "fill-accent text-accent" : "text-muted-foreground")} />
        </button>
        {p.oldPrice && p.oldPrice > p.price && <span className="absolute left-2 top-2 rounded-sm bg-accent px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent-foreground">Sale</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <Link to="/product/$slug" params={{ slug: p.slug }} className="text-sm font-medium hover:text-primary">{p.name}</Link>
        {variants && variants.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{variants.length} options: {variants.slice(0, 3).join(", ")}</p>}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-semibold text-primary">{formatTaka(p.price)}</span>
          {p.oldPrice && p.oldPrice > p.price && <span className="text-xs text-muted-foreground line-through">{formatTaka(p.oldPrice)}</span>}
        </div>
        {showStock && <p className={cn("mt-1 text-xs", soldOut ? "text-destructive" : "text-muted-foreground")}>{soldOut ? "Out of stock" : p.stock <= 5 ? `Only ${p.stock} left` : "In stock"}</p>}
        <button disabled={soldOut} onClick={() => { add(p.slug); toast.success(`${p.name} added to cart`); }} className="mt-4 flex items-center justify-center gap-2 rounded-md bg-primary py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
          <ShoppingCart className="h-3.5 w-3.5" /> {soldOut ? "Sold out" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
