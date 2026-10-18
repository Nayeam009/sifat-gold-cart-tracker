import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

const phone = z
  .string()
  .trim()
  .regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number");

const orderSchema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  phone,
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  district: z.string().trim().min(2).max(60),
  upazila: z.string().trim().min(2).max(80),
  address: z.string().trim().min(8).max(300),
  zone: z.enum(["inside", "outside"]),
  notes: z.string().trim().max(500).optional(),
  coupon: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{3,30}$/)
    .optional()
    .or(z.literal("")),
  payment_method: z.literal("cod").default("cod"), // online payment disabled until a real provider is configured
  idempotency_key: z.string().regex(/^[A-Za-z0-9]{16,64}$/),
  items: z
    .array(
      z.object({
        slug: z.string().max(100),
        variant_sku: z.string().max(60).optional(),
        qty: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(50),
});

/** Maps database error codes to friendly messages. */
export function friendlyOrderError(raw: string): string {
  if (raw.includes("OUT_OF_STOCK:"))
    return `Sorry, "${(raw.split("OUT_OF_STOCK:")[1] ?? "").trim()}" doesn't have enough stock.`;
  if (raw.includes("PRODUCT_UNAVAILABLE") || raw.includes("VARIANT_UNAVAILABLE"))
    return "One of the items in your cart is no longer available.";
  if (raw.includes("INVALID_COUPON")) return "That coupon code isn't valid for this order.";
  if (raw.includes("INVALID_QTY") || raw.includes("INVALID_ITEMS"))
    return "Please check the quantities in your cart.";
  if (raw.includes("INVALID_ZONE")) return "Please choose a delivery area.";
  return "Could not place order. Please try again or call 01997974394.";
}

export type PlacedOrder = {
  order_number: string;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  items: {
    product_name: string;
    variant_name: string | null;
    unit_price: number;
    quantity: number;
    line_total: number | null;
  }[];
};

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => orderSchema.parse(d))
  .handler(async ({ data }): Promise<PlacedOrder> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Optional: link to a signed-in customer (guest checkout otherwise). Token verified server-side.
    let userId: string | null = null;
    const auth = getRequestHeader("authorization");
    if (auth?.startsWith("Bearer ")) {
      const { data: u } = await supabaseAdmin.auth.getUser(auth.slice(7));
      userId = u.user?.id ?? null;
    }

    const { items, coupon, idempotency_key, district, upazila, address, ...rest } = data;
    const customer = { ...rest, city: district, address: `${address}, ${upazila}, ${district}` };
    const { data: result, error } = await supabaseAdmin.rpc("place_order_once", {
      p_customer: customer as Json,
      p_items: items as Json,
      p_user_id: userId as string,
      p_coupon: coupon ?? "",
      p_idem: idempotency_key,
    });
    if (error || !result) {
      console.error("place_order failed", error?.message);
      throw new Error(friendlyOrderError(error?.message ?? ""));
    }
    const number = (result as { order_number: string }).order_number;
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select(
        "id, email, order_number, customer_name, phone, address, city, area, subtotal, delivery_fee, discount, total, order_items(product_name, variant_name, unit_price, quantity, line_total)",
      )
      .eq("order_number", number)
      .single();
    if (!order)
      throw new Error(
        "Your order was placed but we couldn't load it. Please note your order number: " + number,
      );
    const { order_items, id, email, ...o } = order;
    // Backend "order created" event: notifications only go out via configured providers; never throws.
    const { dispatchOrderCreated } = await import("@/lib/notifications.server");
    await dispatchOrderCreated({
      id,
      email,
      order_number: o.order_number,
      customer_name: o.customer_name,
      phone: o.phone,
      total: o.total,
      items: order_items,
    });
    return { ...o, items: order_items };
  });

/** Checks a coupon against a subtotal. Server-side only reveals the discount, never the coupon list. */
export const previewCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        code: z
          .string()
          .trim()
          .toUpperCase()
          .regex(/^[A-Z0-9]{3,30}$/),
        subtotal: z.number().int().min(0).max(10_000_000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: c } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", data.code)
      .eq("is_active", true)
      .maybeSingle();
    const now = Date.now();
    if (
      !c ||
      (c.starts_at && Date.parse(c.starts_at) > now) ||
      (c.expires_at && Date.parse(c.expires_at) < now) ||
      (c.usage_limit != null && c.times_used >= c.usage_limit) ||
      data.subtotal < c.min_subtotal
    )
      return { ok: false as const, message: "That coupon code isn't valid for this order." };
    let d =
      c.discount_type === "percent"
        ? Math.floor((data.subtotal * c.discount_value) / 100)
        : c.discount_value;
    if (c.max_discount != null) d = Math.min(d, c.max_discount);
    return { ok: true as const, code: data.code, discount: Math.min(d, data.subtotal) };
  });

export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ order_number: z.string().trim().min(3).max(30), phone }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select(
        "order_number, customer_name, status, subtotal, delivery_fee, discount, total, area, created_at, order_items(product_name, variant_name, unit_price, quantity, line_total)",
      )
      .eq("order_number", data.order_number.toUpperCase())
      .eq("phone", data.phone)
      .maybeSingle();
    return order ?? null;
  });
