import { describe, it, expect } from "vitest";
import { priceOrder } from "@/lib/orders.functions";

describe("order pricing", () => {
  it("charges ৳60 delivery inside Saidpur", () => {
    expect(priceOrder([{ slug: "bridal-flower-set", qty: 2 }], "inside")).toMatchObject({ subtotal: 3700, delivery: 60, total: 3760 });
  });
  it("charges ৳120 delivery outside Saidpur", () => {
    expect(priceOrder([{ slug: "skincare-bundle", qty: 1 }], "outside").total).toBe(1870);
  });
  it("rejects unknown products", () => {
    expect(() => priceOrder([{ slug: "nope", qty: 1 }], "inside")).toThrow();
  });
});
