import { describe, it, expect } from "vitest";
import { applyFilters, availableStock, validateAdd, type CatalogueItem } from "@/lib/catalogue";

const item = (o: Partial<CatalogueItem>): CatalogueItem => ({
  id: o.slug ?? "x", slug: "x", sku: "X", name: "Item", summary: null, description: null, price: 1000, stock: 5,
  categorySlug: "jewellery", categoryName: "Jewellery", createdAt: "2026-01-01", images: [], image: "", variants: [], isSample: true, ...o,
});
const list = [
  item({ slug: "a", name: "Kundan Necklace", price: 3200, createdAt: "2026-01-03" }),
  item({ slug: "b", name: "Red Saree", price: 2450, categorySlug: "sarees-dresses", createdAt: "2026-01-02" }),
  item({ slug: "c", name: "Pearl Ring", price: 850, stock: 0, createdAt: "2026-01-01" }),
];

describe("catalogue filters", () => {
  it("combines keyword, category and in-stock", () => {
    expect(applyFilters(list, { q: "ring", category: "jewellery" }).map((p) => p.slug)).toEqual(["c"]);
    expect(applyFilters(list, { q: "ring", category: "jewellery", inStock: true })).toEqual([]);
  });
  it("filters by price range in taka", () => {
    expect(applyFilters(list, { min: 1000, max: 2500 }).map((p) => p.slug)).toEqual(["b"]);
  });
  it("sorts by price low-high, high-low and newest", () => {
    expect(applyFilters(list, { sort: "price-asc" }).map((p) => p.slug)).toEqual(["c", "b", "a"]);
    expect(applyFilters(list, { sort: "price-desc" }).map((p) => p.slug)).toEqual(["a", "b", "c"]);
    expect(applyFilters(list, {}).map((p) => p.slug)).toEqual(["a", "b", "c"]);
  });
});

describe("add-to-cart validation", () => {
  const shoes = item({ stock: 99, variants: [{ sku: "S36", name: "Size 36", price: null, stock: 3 }, { sku: "S38", name: "Size 38", price: null, stock: 0 }] });
  it("requires a variant when the product has options", () => expect(validateAdd(shoes, undefined, 1)).toMatch(/choose an option/));
  it("rejects a sold-out variant", () => expect(validateAdd(shoes, "S38", 1)).toMatch(/out of stock/));
  it("rejects more than the variant's stock including cart", () => expect(validateAdd(shoes, "S36", 2, 2)).toMatch(/Only 3/));
  it("accepts a valid variant and quantity", () => expect(validateAdd(shoes, "S36", 3)).toBeNull());
  it("uses variant stock, not product stock, for availability", () => expect(availableStock(shoes)).toBe(3));
  it("rejects out-of-stock simple products", () => expect(validateAdd(list[2], undefined, 1)).toMatch(/out of stock/));
});
