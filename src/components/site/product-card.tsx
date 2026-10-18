import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { formatTaka } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { validateAdd, type Variant } from "@/lib/catalogue";
import { SafeImage } from "@/components/site/safe-image";
import { cn } from "@/lib/utils";

type CardProduct = { slug: string; name: string; price: number; oldPrice?: number; image: string; stock: number; variants?: Variant[] };

export function ProductCard({ p, showStock, variants }: { p: CardProduct; showStock?: boolean; variants?: string[] }) {
  const { add, qtyInCart, wishlist, toggleWish } = useCart();
  const wished = wishlist.includes(p.slug);
  const opts = p.variants ?? [];
  const optionNames = opts.length ? opts.map((v) => v.name) : (variants ?? []);
  const hasOptions = optionNames.length > 0;
  const stock = opts.length ? opts.reduce((s, v) => s + Math.max(0, v.stock), 0) : p.stock;
  const soldOut = (showStock || opts.length > 0) && stock <= 0;
  const onSale = p.oldPrice != null && p.oldPrice > p.price;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-soft">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link to="/product/$slug" params={{ slug: p.slug }} tabIndex={-1} aria-hidden>
          <SafeImage src={p.image} alt={p.name} loading="lazy" width={816} height={816} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </Link>
        <button aria-label={wished ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`} aria-pressed={wished} onClick={() => toggleWish(p.slug)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-card/90">
          <Heart className={cn("h-4 w-4", wished ? "fill-accent text-accent" : "text-muted-foreground")} />
        </button>
        {onSale && <span className="absolute left-2 top-2 rounded-sm bg-accent px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent-foreground">Sale</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <Link to="/product/$slug" params={{ slug: p.slug }} className="text-sm font-medium hover:text-primary">{p.name}</Link>
        {hasOptions && (
          <p className="mt-1 text-xs text-muted-foreground">
            {opts.length ? `${opts.filter((v) => v.stock > 0).length} of ${opts.length} options available` : `${optionNames.length} options: ${optionNames.slice(0, 3).join(", ")}`}
          </p>
        )}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-semibold text-primary">{formatTaka(p.price)}</span>
          {onSale && <span className="text-xs text-muted-foreground line-through">{formatTaka(p.oldPrice!)}</span>}
        </div>
        {showStock && <p className={cn("mt-1 text-xs", soldOut ? "text-destructive" : "text-muted-foreground")}>{soldOut ? "Out of stock" : stock <= 5 ? `Only ${stock} left` : "In stock"}</p>}
        <div className="mt-auto pt-4">
          {hasOptions && !soldOut ? (
            <Link to="/product/$slug" params={{ slug: p.slug }} className="flex items-center justify-center gap-2 rounded-md border border-primary py-2 text-xs font-medium text-primary hover:bg-secondary">
              Choose option
            </Link>
          ) : (
            <button
              disabled={soldOut}
              onClick={() => {
                const err = showStock ? validateAdd({ stock: p.stock, variants: [] }, undefined, 1, qtyInCart(p.slug)) : null;
                if (err) return void toast.error(err);
                add(p.slug);
                toast.success(`${p.name} added to cart`);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <ShoppingCart className="h-3.5 w-3.5" /> {soldOut ? "Sold out" : "Add to Cart"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
