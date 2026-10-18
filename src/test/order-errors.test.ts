import { describe, it, expect } from "vitest";
import { friendlyOrderError } from "@/lib/orders.functions";

describe("friendlyOrderError", () => {
  it("names the out-of-stock product", () => {
    expect(friendlyOrderError("OUT_OF_STOCK:Pastel Reception Lehenga")).toContain(
      "Pastel Reception Lehenga",
    );
  });
  it("explains invalid coupons", () => {
    expect(friendlyOrderError("INVALID_COUPON")).toMatch(/coupon/i);
  });
  it("falls back to the hotline", () => {
    expect(friendlyOrderError("boom")).toContain("01997974394");
  });
});
