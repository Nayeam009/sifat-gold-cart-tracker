import { describe, expect, it } from "vitest";
import {
  creditChangeAllowed,
  customerSegments,
  nextReturnStatuses,
  parseStockCsv,
  refundAllowed,
  toCsv,
  trackingLink,
} from "./admin-rules";

const now = new Date("2026-10-30T00:00:00Z");

describe("customer segments", () => {
  it("VIP at 4 orders", () => {
    expect(customerSegments({ orders: 4, spent: 0, last: "2026-10-29" }, now)).toContain("vip");
    expect(customerSegments({ orders: 3, spent: 0, last: "2026-10-29" }, now)).not.toContain("vip");
  });
  it("high spender at ৳10,000", () => {
    expect(customerSegments({ orders: 2, spent: 10000, last: "2026-10-29" }, now)).toContain(
      "high_spender",
    );
    expect(customerSegments({ orders: 2, spent: 9999, last: "2026-10-29" }, now)).not.toContain(
      "high_spender",
    );
  });
  it("at risk after more than 60 days", () => {
    expect(customerSegments({ orders: 2, spent: 0, last: "2026-08-30" }, now)).toContain("at_risk");
    expect(customerSegments({ orders: 2, spent: 0, last: "2026-09-01" }, now)).not.toContain(
      "at_risk",
    );
  });
  it("new with exactly one order", () => {
    expect(customerSegments({ orders: 1, spent: 0, last: "2026-10-29" }, now)).toContain("new");
  });
});

describe("returns", () => {
  it("follows the allowed steps", () => {
    expect(nextReturnStatuses("requested")).toEqual(["approved", "rejected"]);
    expect(nextReturnStatuses("approved")).toEqual(["received", "rejected"]);
    expect(nextReturnStatuses("received")).toEqual(["completed"]);
    expect(nextReturnStatuses("completed")).toEqual([]);
  });
  it("refund never exceeds order total", () => {
    expect(refundAllowed(1000, 400, 600)).toBe(true);
    expect(refundAllowed(1000, 400, 601)).toBe(false);
  });
});

describe("store credit", () => {
  it("cannot go below zero", () => {
    expect(creditChangeAllowed(500, -500)).toBe(true);
    expect(creditChangeAllowed(500, -501)).toBe(false);
  });
});

describe("stock CSV import", () => {
  const cur = [
    { id: "a", kind: "product" as const, label: "A", stock: 5 },
    { id: "b", kind: "variant" as const, label: "B", stock: 2 },
  ];
  it("empty cell is unchanged and negatives rejected", () => {
    const r = parseStockCsv("id,kind,label,stock\na,product,A,\nb,variant,B,-1", cur);
    expect(r.changes).toEqual([]);
    expect(r.errors).toHaveLength(1);
  });
  it("detects changes", () => {
    const r = parseStockCsv("id,kind,label,stock\na,product,A,9", cur);
    expect(r.changes[0]?.next).toBe(9);
  });
});

it("CSV export neutralises formulas", () => {
  expect(toCsv([["=SUM(A1)"]])).toBe("'=SUM(A1)");
});

it("tracking links must be https", () => {
  expect(trackingLink("https://x.com/t/{code}", "AB 1")).toBe("https://x.com/t/AB%201");
  expect(trackingLink("http://x.com/{code}", "A")).toBeNull();
});
