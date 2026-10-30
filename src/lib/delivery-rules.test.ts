import { describe, expect, it } from "vitest";
import { deliveryFeeFor, freeDeliveryGap, invoiceNumber } from "./checkout";

describe("free delivery rule", () => {
  it("charges zone fee below threshold", () => expect(deliveryFeeFor(120, 1999, 2000)).toBe(120));
  it("is free at or above threshold", () => expect(deliveryFeeFor(120, 2000, 2000)).toBe(0));
  it("no threshold keeps fee", () => expect(deliveryFeeFor(60, 99999, null)).toBe(60));
  it("reports remaining gap", () => expect(freeDeliveryGap(1650, 2000)).toBe(350));
});
describe("invoice prefix", () => {
  it("adds prefix with dash", () => expect(invoiceNumber("SM261030123456", "INV")).toBe("INV-SM261030123456"));
  it("strips unsafe characters", () => expect(invoiceNumber("SM1", "<b>")).toBe("b-SM1"));
  it("no prefix keeps order number", () => expect(invoiceNumber("SM1", "")).toBe("SM1"));
});
