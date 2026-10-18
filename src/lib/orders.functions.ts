import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { DELIVERY, getProduct } from "./catalog";
import type { Json } from "@/integrations/supabase/types";

const orderSchema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number"),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(80),
  zone: z.enum(["inside", "outside"]),
  notes: z.string().trim().max(500).optional(),
  coupon: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,30}$/).optional().or(z.literal("")),
  payment_method: z.literal("cod").default("cod"), // online payment disabled until a provider is configured
  items: z
    .array(z.object({ slug: z.string().max(100), variant_sku: z.string().max(60).optional(), qty: z.number().int().min(1).max(20) }))
    .min(1)
    .max(50),
});

/** Client-side estimate only (cart display). The database function place_order is the source of truth. */
export function priceOrder(items: { slug: string; qty: number }[], zone: "inside" | "outside") {
  const lines = items.map((i) => {
    const p = getProduct(i.slug);
    if (!p) throw new Error(`Unknown product: ${i.slug}`);
    return { slug: p.slug, name: p.name, price: p.price, qty: i.qty };
  });
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const delivery = DELIVERY[zone];
  return { lines, subtotal, delivery, total: subtotal + delivery };
}

/** Maps database error codes to friendly messages. */
export function friendlyOrderError(raw: string): string {
  if (raw.includes("OUT_OF_STOCK:")) return `Sorry, "${(raw.split("OUT_OF_STOCK:")[1] ?? "").trim()}" doesn't have enough stock.`;
  if (raw.includes("PRODUCT_UNAVAILABLE") || raw.includes("VARIANT_UNAVAILABLE")) return "One of the items in your cart is no longer available.";
  if (raw.includes("INVALID_COUPON")) return "That coupon code isn't valid for this order.";
  if (raw.includes("INVALID_QTY") || raw.includes("INVALID_ITEMS")) return "Please check the quantities in your cart.";
  return "Could not place order. Please try again or call 01997974394.";
}

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => orderSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Optional: link to the signed-in customer (guest checkout otherwise). Token is verified server-side.
    let userId: string | null = null;
    const auth = getRequestHeader("authorization");
    if (auth?.startsWith("Bearer ")) {
      const { data: u } = await supabaseAdmin.auth.getUser(auth.slice(7));
      userId = u.user?.id ?? null;
    }

    const { items, coupon, ...customer } = data;
    const args: { p_customer: Json; p_items: Json; p_user_id?: string; p_coupon?: string } = { p_customer: customer as Json, p_items: items as Json };
    if (userId) args.p_user_id = userId;
    if (coupon) args.p_coupon = coupon;
    const { data: result, error } = await supabaseAdmin.rpc("place_order", args);
    if (error || !result) {
      console.error("place_order failed", error?.message);
      throw new Error(friendlyOrderError(error?.message ?? ""));
    }
    return result as unknown as { order_number: string; subtotal: number; delivery_fee: number; discount: number; total: number };
  });

export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ order_number: z.string().trim().min(3).max(30), phone: z.string().trim().regex(/^01[3-9]\d{8}$/) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("order_number, customer_name, status, subtotal, delivery_fee, discount, total, area, created_at, order_items(product_name, variant_name, unit_price, quantity, line_total)")
      .eq("order_number", data.order_number.toUpperCase())
      .eq("phone", data.phone)
      .maybeSingle();
    return order ?? null;
  });
