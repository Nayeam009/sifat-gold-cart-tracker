import type React from "react";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { getProduct } from "./catalog";
import { supabase } from "@/integrations/supabase/client";
import { mergeWishlists, reconcileCart } from "./account";
import { catalogueQueryFn } from "./catalogue-data";

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
// Keep one context object across hot reloads so the provider and hooks never get out of step.
const g = globalThis as { __smCartContext?: React.Context<Ctx | null> };
const CartContext = (g.__smCartContext ??= createContext<Ctx | null>(null));

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const userId = useRef<string | null>(null);
  const wishRef = useRef<string[]>([]);
  wishRef.current = wishlist;

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

  // On sign-in: merge the guest wishlist into the account and re-check the cart against live prices/stock.
  useEffect(() => {
    if (!ready) return;
    const sync = async (uid: string | null, isLogin: boolean) => {
      userId.current = uid;
      if (!uid) return;
      const { data } = await supabase.from("wishlist_items").select("product_slug");
      const remote = (data ?? []).map((r) => r.product_slug);
      const { merged, toUpload } = mergeWishlists(wishRef.current, remote);
      if (toUpload.length) await supabase.from("wishlist_items").upsert(toUpload.map((product_slug) => ({ user_id: uid, product_slug })), { onConflict: "user_id,product_slug", ignoreDuplicates: true });
      setWishlist(merged);
      if (isLogin) {
        try {
          const catalogue = await catalogueQueryFn();
          setLines((ls) => {
            const { lines: next, changes } = reconcileCart(ls, catalogue);
            if (changes.length) setTimeout(() => toast.info("We updated your cart", { description: changes.join(" ") }), 0);
            return next;
          });
        } catch {}
      }
    };
    supabase.auth.getUser().then(({ data }) => sync(data.user?.id ?? null, false));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user.id !== userId.current) setTimeout(() => sync(session?.user.id ?? null, true), 0);
      if (event === "SIGNED_OUT") { userId.current = null; setWishlist([]); }
    });
    return () => sub.subscription.unsubscribe();
  }, [ready]);

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
  const toggleWish = (slug: string) => {
    const has = wishlist.includes(slug);
    setWishlist((w) => (has ? w.filter((s) => s !== slug) : [...w, slug]));
    const uid = userId.current;
    if (!uid) return;
    const req = has
      ? supabase.from("wishlist_items").delete().eq("user_id", uid).eq("product_slug", slug)
      : supabase.from("wishlist_items").upsert({ user_id: uid, product_slug: slug }, { onConflict: "user_id,product_slug", ignoreDuplicates: true });
    req.then(({ error }) => {
      if (error) {
        setWishlist((w) => (has ? [...w, slug] : w.filter((s) => s !== slug)));
        toast.error("Couldn't update your wishlist. Please try again.");
      }
    });
  };

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
