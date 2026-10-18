import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { formatTaka, type Product } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

export function ProductCard({ p }: { p: Product }) {
  const { add, wishlist, toggleWish } = useCart();
  const wished = wishlist.includes(p.slug);
  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-soft">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link to="/product/$slug" params={{ slug: p.slug }}>
          <img src={p.image} alt={p.name} loading="lazy" width={816} height={816} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </Link>
        <button aria-label="Add to wishlist" onClick={() => toggleWish(p.slug)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-card/90">
          <Heart className={cn("h-4 w-4", wished ? "fill-accent text-accent" : "text-muted-foreground")} />
        </button>
        {p.oldPrice && <span className="absolute left-2 top-2 rounded-sm bg-accent px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent-foreground">Sale</span>}
      </div>
      <div className="flex flex-1 flex-col gap-0 p-4 pb-4 [&>button]:mt-4">
        <Link to="/product/$slug" params={{ slug: p.slug }} className="text-sm font-medium hover:text-primary">{p.name}</Link>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3 w-3 fill-star text-star" /> {p.rating} ({p.reviews}+)
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-semibold text-primary">{formatTaka(p.price)}</span>
          {p.oldPrice && <span className="text-xs text-muted-foreground line-through">{formatTaka(p.oldPrice)}</span>}
        </div>
        <button onClick={() => { add(p.slug); toast.success(`${p.name} added to cart`); }} className="mt-auto translate-y-0 flex items-center justify-center gap-2 rounded-md bg-primary py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90">
          <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
        </button>
      </div>
    </div>
  );
}
