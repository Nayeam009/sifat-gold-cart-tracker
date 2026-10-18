export type ProductForm = {
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  short_description: string;
  description: string;
  price: string;
  compare_at_price: string;
  stock_quantity: string;
  is_published: boolean;
  is_featured: boolean;
  occasions: string[];
  seo_title: string;
  seo_description: string;
};

const int = (s: string) => (s.trim() === "" ? null : Number(s));
const opt = (s: string) => (s.trim() === "" ? null : s.trim());

/** Validates the admin product form. Amounts are whole Taka integers. */
export function validateProduct(f: ProductForm, isNew: boolean) {
  const fail = (error: string) => ({ ok: false as const, error });
  const name = f.name.trim();
  if (name.length < 2 || name.length > 150) return fail("Name must be 2–150 characters.");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug) || f.slug.length > 80)
    return fail("URL slug may only use lowercase letters, numbers and single dashes.");
  const sku = f.sku.trim().toUpperCase();
  if (!/^[A-Z0-9-]{2,60}$/.test(sku)) return fail("SKU must be 2–60 letters, numbers or dashes.");
  const price = int(f.price);
  if (price == null || !Number.isInteger(price) || price < 0 || price > 10_000_000)
    return fail("Price must be a whole Taka amount of 0 or more.");
  const compare = int(f.compare_at_price);
  if (compare != null && (!Number.isInteger(compare) || compare <= price))
    return fail("Compare-at price must be higher than the price (or left empty).");
  const stock = int(f.stock_quantity) ?? 0;
  if (isNew && (!Number.isInteger(stock) || stock < 0 || stock > 100_000))
    return fail("Stock must be a whole number of 0 or more.");
  if (f.seo_title.length > 70 || f.seo_description.length > 160)
    return fail("SEO title max 70 and description max 160 characters.");
  return {
    ok: true as const,
    value: {
      name,
      slug: f.slug,
      sku,
      category_id: f.category_id || null,
      short_description: opt(f.short_description),
      description: opt(f.description),
      price,
      compare_at_price: compare,
      stock_quantity: stock,
      is_published: f.is_published,
      is_featured: f.is_featured,
      occasions: f.occasions,
      seo_title: opt(f.seo_title),
      seo_description: opt(f.seo_description),
    },
  };
}

export const isHttpsUrl = (v: string) => /^https:\/\/[^\s]+$/.test(v);
export const isBdPhone = (v: string) => /^01[3-9]\d{8}$/.test(v);

export function validateFees(inside: number, outside: number): string | null {
  for (const n of [inside, outside])
    if (!Number.isInteger(n) || n < 0 || n > 5000)
      return "Delivery fees must be whole Taka amounts between 0 and 5000.";
  return null;
}
