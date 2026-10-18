import { describe, it, expect } from "vitest";
import { normalizeBdPhone, reviewCart } from "@/lib/checkout";
import type { CatalogueItem } from "@/lib/catalogue";

const base = { id: "1", sku: "S", summary: null, description: null, categorySlug: null, categoryName: null, createdAt: "", images: [], image: "", isSample: true };
const cat: CatalogueItem[] = [
  { ...base, slug: "a", name: "A", price: 1000, stock: 2, variants: [] },
  { ...base, slug: "b", name: "B", price: 500, stock: 0, variants: [{ sku: "B36", name: "36", price: 700, stock: 3 }] },
];

describe("checkout rules", () => {
  it("accepts BD mobile numbers with +88", () => expect(normalizeBdPhone("+880 1712-345678")).toBe("01712345678"));
  it("rejects non-mobile numbers", () => expect(normalizeBdPhone("01212345678")).toBeNull());
  it("flags quantity over stock", () => expect(reviewCart([{ slug: "a", qty: 3 }], cat)[0]!.issue).toMatch(/Only 2/));
  it("uses variant price", () => expect(reviewCart([{ slug: "b", qty: 2, sku: "B36" }], cat)[0]!.lineTotal).toBe(1400));
  it("flags removed products", () => expect(reviewCart([{ slug: "zzz", qty: 1 }], cat)[0]!.issue).not.toBeNull());
});
