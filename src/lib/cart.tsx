import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getProduct } from "./catalog";

export type CartLine = { slug: string; qty: number; sku?: string; variant?: string };
export const lineKey = (l: { slug: string; sku?: string | undefined }) => (l.sku ? `${l.slug}|${l.sku}` : l.slug);

type Ctx = {
  lines: CartLine[];
  add: (slug: string, qty?: number, variant?: { sku: string; name: string }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  qtyInCart: (slug: string, sku?: string) => number;
  count: number;
  subtotal: number;
  wishlist: string[];
  toggleWish: (slug: string) => void;
};
const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("sm-cart") || "[]");
      if (Array.isArray(raw)) setLines(raw.filter((l) => l && typeof l.slug === "string" && Number.isInteger(l.qty) && l.qty > 0));
      const w = JSON.parse(localStorage.getItem("sm-wish") || "[]");
      if (Array.isArray(w)) setWishlist(w.filter((s) => typeof s === "string"));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("sm-cart", JSON.stringify(lines));
  }, [lines, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem("sm-wish", JSON.stringify(wishlist));
  }, [wishlist, ready]);

  const add: Ctx["add"] = (slug, qty = 1, variant) =>
    setLines((ls) => {
      const key = lineKey({ slug, sku: variant?.sku });
      const f = ls.find((l) => lineKey(l) === key);
      return f
        ? ls.map((l) => (lineKey(l) === key ? { ...l, qty: l.qty + qty } : l))
        : [...ls, { slug, qty, ...(variant ? { sku: variant.sku, variant: variant.name } : {}) }];
    });
  const setQty = (key: string, qty: number) =>
    setLines((ls) => (qty <= 0 ? ls.filter((l) => lineKey(l) !== key) : ls.map((l) => (lineKey(l) === key ? { ...l, qty } : l))));
  const remove = (key: string) => setLines((ls) => ls.filter((l) => lineKey(l) !== key));
  const clear = () => setLines([]);
  const qtyInCart = (slug: string, sku?: string) => lines.find((l) => lineKey(l) === lineKey({ slug, sku }))?.qty ?? 0;
  const toggleWish = (slug: string) => setWishlist((w) => (w.includes(slug) ? w.filter((s) => s !== slug) : [...w, slug]));

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + (getProduct(l.slug)?.price ?? 0) * l.qty, 0);

  return (
    <CartContext.Provider value={{ lines, add, setQty, remove, clear, qtyInCart, count, subtotal, wishlist, toggleWish }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
