import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getProduct } from "./catalog";

export type CartLine = { slug: string; qty: number };
type Ctx = {
  lines: CartLine[];
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
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
      setLines(JSON.parse(localStorage.getItem("sm-cart") || "[]"));
      setWishlist(JSON.parse(localStorage.getItem("sm-wish") || "[]"));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("sm-cart", JSON.stringify(lines));
  }, [lines, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem("sm-wish", JSON.stringify(wishlist));
  }, [wishlist, ready]);

  const add = (slug: string, qty = 1) =>
    setLines((ls) => {
      const f = ls.find((l) => l.slug === slug);
      return f ? ls.map((l) => (l.slug === slug ? { ...l, qty: l.qty + qty } : l)) : [...ls, { slug, qty }];
    });
  const setQty = (slug: string, qty: number) =>
    setLines((ls) => (qty <= 0 ? ls.filter((l) => l.slug !== slug) : ls.map((l) => (l.slug === slug ? { ...l, qty } : l))));
  const remove = (slug: string) => setLines((ls) => ls.filter((l) => l.slug !== slug));
  const clear = () => setLines([]);
  const toggleWish = (slug: string) =>
    setWishlist((w) => (w.includes(slug) ? w.filter((s) => s !== slug) : [...w, slug]));

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + (getProduct(l.slug)?.price ?? 0) * l.qty, 0);

  return (
    <CartContext.Provider value={{ lines, add, setQty, remove, clear, count, subtotal, wishlist, toggleWish }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
