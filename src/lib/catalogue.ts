import { products as localCatalog } from "@/lib/catalog";

/** A published product as read from the database. Prices are whole taka (integers). */
export type Variant = { sku: string; name: string; price: number | null; stock: number };
export type CatalogueItem = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  summary: string | null;
  description: string | null;
  price: number;
  oldPrice?: number;
  stock: number;
  categorySlug: string | null;
  categoryName: string | null;
  createdAt: string;
  images: { url: string; alt: string }[];
  image: string;
  variants: Variant[];
  /** Development-only sample record (matches the bundled sample catalogue) — replace before launch. */
  isSample: boolean;
};

export type Sort = "newest" | "price-asc" | "price-desc";
export type Filters = { q?: string; category?: string; min?: number; max?: number; inStock?: boolean; sort?: Sort };

/** Total units available: variant stock when the product has options, otherwise product stock. */
export const availableStock = (p: Pick<CatalogueItem, "stock" | "variants">) =>
  p.variants.length ? p.variants.reduce((s, v) => s + Math.max(0, v.stock), 0) : Math.max(0, p.stock);

export const variantPrice = (p: Pick<CatalogueItem, "price">, v?: Variant | null) => v?.price ?? p.price;

type Row = {
  id: string; slug: string; sku: string; name: string; short_description: string | null; description: string | null;
  price: number; compare_at_price: number | null; stock_quantity: number; created_at: string;
  categories: { slug: string; name: string } | null;
  product_images: { image_url: string; alt_text: string | null; sort_order: number }[] | null;
  product_variants: { sku: string; name: string; price: number | null; stock_quantity: number; sort_order: number }[] | null;
};

export function mapRow(r: Row): CatalogueItem {
  const local = localCatalog.find((p) => p.slug === r.slug);
  const dbImages = [...(r.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((i) => ({ url: i.image_url, alt: i.alt_text ?? r.name }));
  const images = dbImages.length ? dbImages : local ? [{ url: local.image, alt: r.name }] : [];
  return {
    id: r.id, slug: r.slug, sku: r.sku, name: r.name, summary: r.short_description, description: r.description ?? local?.description ?? null,
    price: r.price, oldPrice: r.compare_at_price && r.compare_at_price > r.price ? r.compare_at_price : undefined,
    stock: r.stock_quantity, categorySlug: r.categories?.slug ?? null, categoryName: r.categories?.name ?? null, createdAt: r.created_at,
    images, image: images[0]?.url ?? "",
    variants: [...(r.product_variants ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((v) => ({ sku: v.sku, name: v.name, price: v.price, stock: v.stock_quantity })),
    isSample: !!local || r.sku.startsWith("DEV-"),
  };
}

export function applyFilters(list: CatalogueItem[], f: Filters): CatalogueItem[] {
  const q = f.q?.trim().toLowerCase();
  const out = list.filter((p) => {
    if (f.category && p.categorySlug !== f.category) return false;
    if (f.min != null && p.price < f.min) return false;
    if (f.max != null && p.price > f.max) return false;
    if (f.inStock && availableStock(p) <= 0) return false;
    if (q && ![p.name, p.summary, p.description, p.categoryName].some((t) => t?.toLowerCase().includes(q))) return false;
    return true;
  });
  const sort = f.sort ?? "newest";
  return out.sort((a, b) =>
    sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name),
  );
}

/** Validates an add-to-cart request against real stock. Returns an error message or null. */
export function validateAdd(p: Pick<CatalogueItem, "stock" | "variants">, sku: string | undefined, qty: number, alreadyInCart = 0): string | null {
  if (!Number.isInteger(qty) || qty < 1) return "Please choose a quantity.";
  if (p.variants.length) {
    if (!sku) return "Please choose an option first.";
    const v = p.variants.find((x) => x.sku === sku);
    if (!v) return "That option is no longer available.";
    if (v.stock <= 0) return "That option is out of stock.";
    if (qty + alreadyInCart > v.stock) return `Only ${v.stock} available for ${v.name}.`;
    return null;
  }
  if (p.stock <= 0) return "This product is out of stock.";
  if (qty + alreadyInCart > p.stock) return `Only ${p.stock} available.`;
  return null;
}

export const PAGE_SIZE = 9;
