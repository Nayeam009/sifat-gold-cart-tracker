import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DELIVERY, getProduct } from "./catalog";

const orderSchema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number"),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(80),
  zone: z.enum(["inside", "outside"]),
  notes: z.string().trim().max(500).optional(),
  items: z.array(z.object({ slug: z.string().max(100), qty: z.number().int().min(1).max(20) })).min(1).max(50),
});

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

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => orderSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const priced = priceOrder(data.items, data.zone);
    const order_number = "SM" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 10);
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number,
        customer_name: data.customer_name,
        phone: data.phone,
        email: data.email || null,
        address: data.address,
        city: data.city,
        area: data.zone === "inside" ? "Inside Saidpur" : "Outside Saidpur",
        notes: data.notes || null,
        subtotal: priced.subtotal,
        delivery_fee: priced.delivery,
        total: priced.total,
      })
      .select("id")
      .single();
    if (error || !order) throw new Error("Could not place order. Please try again.");
    const { error: e2 } = await supabaseAdmin.from("order_items").insert(
      priced.lines.map((l) => ({ order_id: order.id, product_slug: l.slug, product_name: l.name, unit_price: l.price, quantity: l.qty })),
    );
    if (e2) throw new Error("Could not save order items.");
    return { order_number, total: priced.total };
  });

export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ order_number: z.string().trim().min(3).max(30), phone: z.string().trim().min(6).max(20) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("order_number, customer_name, status, subtotal, delivery_fee, total, area, created_at, order_items(product_name, unit_price, quantity)")
      .eq("order_number", data.order_number.toUpperCase())
      .eq("phone", data.phone)
      .maybeSingle();
    return order ?? null;
  });
