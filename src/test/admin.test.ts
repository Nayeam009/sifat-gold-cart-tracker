import { describe, expect, it } from "vitest";
import { validateFees, validateProduct, type ProductForm } from "@/lib/admin-validation";
import { orderMetrics, validateImage } from "@/lib/admin";

const base: ProductForm = { name: "Red Banarasi Saree", slug: "red-banarasi-saree", sku: "SAR-001", category_id: "", short_description: "", description: "", price: "4500", compare_at_price: "", stock_quantity: "3", is_published: false, is_featured: false, occasions: [], seo_title: "", seo_description: "" };

describe("product validation", () => {
  it("accepts a valid product", () => expect(validateProduct(base, true).ok).toBe(true));
  it("rejects compare-at price not above price", () => expect(validateProduct({ ...base, compare_at_price: "4500" }, true).ok).toBe(false));
  it("rejects fractional Taka prices", () => expect(validateProduct({ ...base, price: "99.5" }, true).ok).toBe(false));
  it("rejects bad slugs", () => expect(validateProduct({ ...base, slug: "Red Saree" }, true).ok).toBe(false));
  it("rejects negative starting stock", () => expect(validateProduct({ ...base, stock_quantity: "-1" }, true).ok).toBe(false));
});

describe("delivery fees", () => {
  it("accepts whole Taka", () => expect(validateFees(60, 120)).toBeNull());
  it("rejects negative or fractional", () => { expect(validateFees(-1, 120)).not.toBeNull(); expect(validateFees(60, 12.5)).not.toBeNull(); });
});

describe("image uploads", () => {
  it("rejects non-images and files over 5 MB", () => {
    expect(validateImage({ type: "application/pdf", size: 100 })).not.toBeNull();
    expect(validateImage({ type: "image/jpeg", size: 6 * 1024 * 1024 })).not.toBeNull();
    expect(validateImage({ type: "image/webp", size: 1000 })).toBeNull();
  });
});

describe("dashboard metrics", () => {
  it("counts collected cash as revenue and open unpaid orders as cash to collect", () => {
    const m = orderMetrics([
      { total: 1000, status: "delivered", payment_status: "collected", created_at: "2026-10-18T05:00:00Z" },
      { total: 500, status: "pending", payment_status: "unpaid", created_at: "2026-10-18T06:00:00Z" },
      { total: 700, status: "cancelled", payment_status: "unpaid", created_at: "2026-10-01T06:00:00Z" },
    ], new Date("2026-10-18T12:00:00Z"));
    expect(m).toEqual({ totalOrders: 3, todayOrders: 2, pending: 1, collectedRevenue: 1000, pipeline: 500 });
  });
});
