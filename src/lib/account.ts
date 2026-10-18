import type { CartLine } from "./cart";
import type { CatalogueItem } from "./catalogue";
import { reviewCart } from "./checkout";

/** Union of guest and saved wishlists; returns which guest items still need saving to the account. */
export function mergeWishlists(local: string[], remote: string[]) {
  const toUpload = [...new Set(local)].filter((s) => !remote.includes(s)).slice(0, 200);
  return { merged: [...new Set([...remote, ...local])], toUpload };
}

/** After sign-in: drop unavailable items, cap quantities to live stock. Prices always come from the live catalogue. */
export function reconcileCart(lines: CartLine[], catalogue: CatalogueItem[]) {
  const changes: string[] = [];
  const next: CartLine[] = [];
  for (const r of reviewCart(lines, catalogue)) {
    const name = r.product?.name ?? "An item";
    if (!r.product || r.maxQty <= 0) {
      changes.push(`${name} is no longer available and was removed.`);
      continue;
    }
    if (r.line.qty > r.maxQty) {
      changes.push(`${name} reduced to ${r.maxQty} (stock limit).`);
      next.push({ ...r.line, qty: r.maxQty });
      continue;
    }
    next.push(r.line);
  }
  return { lines: next, changes };
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Order received",
  confirmed: "Confirmed",
  processing: "Being prepared",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};
export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: "Cash on delivery — not yet paid",
  collected: "Paid (cash collected)",
  refunded: "Refunded",
};
