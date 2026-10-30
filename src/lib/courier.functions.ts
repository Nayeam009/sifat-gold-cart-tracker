import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CourierId = "steadfast" | "pathao" | "redx";

/** Which env secrets each courier needs. Values are never sent to the browser. */
const REQUIRED: Record<CourierId, string[]> = {
  steadfast: ["STEADFAST_API_KEY", "STEADFAST_SECRET_KEY"],
  pathao: [
    "PATHAO_CLIENT_ID",
    "PATHAO_CLIENT_SECRET",
    "PATHAO_USERNAME",
    "PATHAO_PASSWORD",
    "PATHAO_STORE_ID",
    "PATHAO_CITY_ID",
    "PATHAO_ZONE_ID",
  ],
  redx: ["REDX_API_TOKEN", "REDX_AREA_ID", "REDX_AREA_NAME"],
};

const env = (k: string) => process.env[k]?.trim() || "";

async function assertAdmin(context: {
  supabase: { rpc: (fn: "has_role", a: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: unknown }> };
  userId: string;
}) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Only admins can do this.");
}

export const courierStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    return (Object.keys(REQUIRED) as CourierId[]).map((id) => {
      const missing = REQUIRED[id].filter((k) => !env(k));
      return { id, configured: missing.length === 0, missing };
    });
  });

type Sent = { consignment_id: string; tracking_code: string; tracking_url: string | null };

async function sendSteadfast(o: OrderRow): Promise<Sent> {
  const r = await fetch("https://portal.packzy.com/api/v1/create_order", {
    method: "POST",
    headers: {
      "Api-Key": env("STEADFAST_API_KEY"),
      "Secret-Key": env("STEADFAST_SECRET_KEY"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      invoice: o.order_number,
      recipient_name: o.customer_name,
      recipient_phone: o.phone,
      recipient_address: `${o.address}, ${o.city}`.slice(0, 250),
      cod_amount: o.payment_status === "collected" ? 0 : o.total,
      note: o.notes ?? "",
    }),
  });
  const j = (await r.json().catch(() => ({}))) as {
    status?: number;
    consignment?: { consignment_id?: number | string; tracking_code?: string };
  };
  if (!r.ok || !j.consignment?.tracking_code) throw new Error(`Steadfast rejected the parcel (${r.status}).`);
  const code = j.consignment.tracking_code;
  return {
    consignment_id: String(j.consignment.consignment_id ?? code),
    tracking_code: code,
    tracking_url: `https://steadfast.com.bd/t/${encodeURIComponent(code)}`,
  };
}

async function sendPathao(o: OrderRow): Promise<Sent> {
  const base = "https://api-hermes.pathao.com";
  const t = await fetch(`${base}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env("PATHAO_CLIENT_ID"),
      client_secret: env("PATHAO_CLIENT_SECRET"),
      username: env("PATHAO_USERNAME"),
      password: env("PATHAO_PASSWORD"),
      grant_type: "password",
    }),
  });
  const tj = (await t.json().catch(() => ({}))) as { access_token?: string };
  if (!t.ok || !tj.access_token) throw new Error("Pathao sign-in failed. Check the Pathao keys.");
  const qty = o.order_items.reduce((s, i) => s + i.quantity, 0) || 1;
  const r = await fetch(`${base}/aladdin/api/v1/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tj.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      store_id: Number(env("PATHAO_STORE_ID")),
      merchant_order_id: o.order_number,
      recipient_name: o.customer_name,
      recipient_phone: o.phone,
      recipient_address: `${o.address}, ${o.city}`.slice(0, 220),
      recipient_city: Number(env("PATHAO_CITY_ID")),
      recipient_zone: Number(env("PATHAO_ZONE_ID")),
      delivery_type: 48,
      item_type: 2,
      item_quantity: qty,
      item_weight: 0.5,
      amount_to_collect: o.payment_status === "collected" ? 0 : o.total,
      special_instruction: o.notes ?? "",
    }),
  });
  const j = (await r.json().catch(() => ({}))) as { data?: { consignment_id?: string } };
  const id = j.data?.consignment_id;
  if (!r.ok || !id) throw new Error(`Pathao rejected the parcel (${r.status}).`);
  return { consignment_id: id, tracking_code: id, tracking_url: null };
}

async function sendRedx(o: OrderRow): Promise<Sent> {
  const r = await fetch("https://openapi.redx.com.bd/v1.0.0-beta/parcel", {
    method: "POST",
    headers: { "API-ACCESS-TOKEN": `Bearer ${env("REDX_API_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: o.customer_name,
      customer_phone: o.phone,
      delivery_area: env("REDX_AREA_NAME"),
      delivery_area_id: Number(env("REDX_AREA_ID")),
      customer_address: `${o.address}, ${o.city}`.slice(0, 250),
      merchant_invoice_id: o.order_number,
      cash_collection_amount: String(o.payment_status === "collected" ? 0 : o.total),
      parcel_weight: 500,
      value: String(o.total),
      instruction: o.notes ?? "",
    }),
  });
  const j = (await r.json().catch(() => ({}))) as { tracking_id?: string };
  if (!r.ok || !j.tracking_id) throw new Error(`RedX rejected the parcel (${r.status}).`);
  return {
    consignment_id: j.tracking_id,
    tracking_code: j.tracking_id,
    tracking_url: `https://redx.com.bd/track-parcel/?trackingId=${encodeURIComponent(j.tracking_id)}`,
  };
}

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  notes: string | null;
  total: number;
  status: string;
  payment_status: string;
  courier_consignment_id: string | null;
  order_items: { quantity: number }[];
};

const NAMES: Record<CourierId, string> = { steadfast: "Steadfast", pathao: "Pathao", redx: "RedX" };

export const sendToCourier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ orderId: z.string().uuid(), courier: z.enum(["steadfast", "pathao", "redx"]) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const missing = REQUIRED[data.courier].filter((k) => !env(k));
    if (missing.length) return { ok: false as const, error: `${NAMES[data.courier]} isn't connected yet. Add its keys first.` };
    // Read and write as the admin (RLS applies), never with the service role.
    const { data: o, error } = await context.supabase
      .from("orders")
      .select("id, order_number, customer_name, phone, address, city, notes, total, status, payment_status, courier_consignment_id, order_items(quantity)")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error || !o) return { ok: false as const, error: "Order not found." };
    const row = o as unknown as OrderRow;
    if (row.courier_consignment_id) return { ok: false as const, error: "This order was already sent to a courier." };
    if (["cancelled", "returned", "delivered"].includes(row.status))
      return { ok: false as const, error: `A ${row.status} order can't be sent to a courier.` };
    let sent: Sent;
    try {
      sent = await (data.courier === "steadfast" ? sendSteadfast : data.courier === "pathao" ? sendPathao : sendRedx)(row);
    } catch (e) {
      console.error("courier dispatch failed", data.courier, e instanceof Error ? e.message : e);
      return { ok: false as const, error: e instanceof Error ? e.message : "Courier could not be reached." };
    }
    const { error: upErr } = await context.supabase
      .from("orders")
      .update({
        courier_name: NAMES[data.courier],
        tracking_code: sent.tracking_code,
        tracking_url: sent.tracking_url,
        courier_consignment_id: sent.consignment_id,
        courier_dispatched_at: new Date().toISOString(),
        status: row.status === "pending" || row.status === "confirmed" || row.status === "processing" ? "shipped" : row.status,
      })
      .eq("id", row.id);
    if (upErr) return { ok: false as const, error: `Parcel booked (${sent.tracking_code}) but saving failed — note this code.` };
    return { ok: true as const, tracking_code: sent.tracking_code };
  });
