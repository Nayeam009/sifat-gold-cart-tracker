import type { CatalogueItem } from "./catalogue";
import type { CartLine } from "./cart";

export type ReviewedLine = {
  key: string;
  line: CartLine;
  product: CatalogueItem | null;
  unitPrice: number;
  maxQty: number;
  lineTotal: number;
  issue: string | null;
};

/** Checks cart lines against live catalogue data (display only; the server re-checks on order). */
export function reviewCart(lines: CartLine[], catalogue: CatalogueItem[]): ReviewedLine[] {
  return lines.map((line) => {
    const key = line.sku ? `${line.slug}|${line.sku}` : line.slug;
    const product = catalogue.find((p) => p.slug === line.slug) ?? null;
    if (!product)
      return {
        key,
        line,
        product,
        unitPrice: 0,
        maxQty: 0,
        lineTotal: 0,
        issue: "This item is no longer available.",
      };
    let unitPrice = product.price;
    let stock = product.stock;
    if (product.variants.length > 0) {
      const v = product.variants.find((x) => x.sku === line.sku);
      if (!v)
        return {
          key,
          line,
          product,
          unitPrice,
          maxQty: 0,
          lineTotal: 0,
          issue: "Please choose an available option for this item.",
        };
      unitPrice = v.price ?? product.price;
      stock = v.stock;
    }
    const maxQty = Math.min(stock, 20);
    const issue =
      stock <= 0
        ? "Out of stock."
        : line.qty > maxQty
          ? `Only ${maxQty} left — please reduce the quantity.`
          : null;
    return { key, line, product, unitPrice, maxQty, lineTotal: unitPrice * line.qty, issue };
  });
}

/** Bangladesh mobile: accepts +880 / 880 / spaces / dashes, returns 01XXXXXXXXX or null. */
export function normalizeBdPhone(raw: string): string | null {
  const p = raw.replace(/[\s-]/g, "").replace(/^\+?88(?=01)/, "");
  return /^01[3-9]\d{8}$/.test(p) ? p : null;
}

export const newIdempotencyKey = () =>
  (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
  ).replace(/-/g, "");

/** Delivery fee after the free-delivery rule. Mirrors place_order (server is the authority). */
export function deliveryFeeFor(baseFee: number, subtotal: number, freeOver?: number | null): number {
  if (freeOver && Number.isInteger(freeOver) && freeOver > 0 && subtotal >= freeOver) return 0;
  return baseFee;
}

/** Amount still needed for free delivery, or null when no rule / already reached. */
export function freeDeliveryGap(subtotal: number, freeOver?: number | null): number | null {
  if (!freeOver || freeOver <= 0 || subtotal >= freeOver) return null;
  return freeOver - subtotal;
}

/** Invoice number shown on printed invoices: optional admin prefix + order number. */
export function invoiceNumber(orderNumber: string, prefix?: string | null): string {
  const p = (prefix ?? "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 10);
  return p ? `${p}${p.endsWith("-") ? "" : "-"}${orderNumber}` : orderNumber;
}
