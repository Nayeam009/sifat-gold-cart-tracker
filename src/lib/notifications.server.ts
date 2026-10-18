// Server-only: order notifications. A message is recorded as "sent" ONLY when the provider
// confirms acceptance (returns an id / success code). Missing credentials => "skipped_unconfigured".
import { BRAND } from "@/lib/catalog";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  email: string | null;
  total: number;
  items: { product_name: string; variant_name: string | null; quantity: number }[];
};
type Result = { status: "sent" | "failed" | "skipped_unconfigured" | "skipped_no_recipient"; provider?: string; id?: string; error?: string };

const taka = (n: number) => `৳${n.toLocaleString("en-US")}`;
const env = (k: string) => (process.env[k] ?? "").trim();

async function sendEmail(to: string | null, subject: string, text: string): Promise<Result> {
  const key = env("RESEND_API_KEY");
  const from = env("NOTIFY_FROM_EMAIL");
  if (!key || !from) return { status: "skipped_unconfigured" };
  if (!to) return { status: "skipped_no_recipient" };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    const j = (await r.json().catch(() => ({}))) as { id?: string; message?: string };
    return r.ok && j.id ? { status: "sent", provider: "resend", id: j.id } : { status: "failed", provider: "resend", error: `HTTP ${r.status} ${j.message ?? ""}`.slice(0, 200) };
  } catch (e) {
    return { status: "failed", provider: "resend", error: String(e).slice(0, 200) };
  }
}

/** BulkSMSBD-compatible API (common Bangladeshi gateway). Success = response_code 202. */
async function sendSms(phone: string, text: string): Promise<Result> {
  const key = env("SMS_API_KEY");
  const sender = env("SMS_SENDER_ID");
  if (!key || !sender) return { status: "skipped_unconfigured" };
  const base = env("SMS_API_URL") || "https://bulksmsbd.net/api/smsapi";
  try {
    const r = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ api_key: key, type: "text", senderid: sender, number: `88${phone}`, message: text }),
    });
    const j = (await r.json().catch(() => ({}))) as { response_code?: number; success_message?: string; error_message?: string };
    return j.response_code === 202
      ? { status: "sent", provider: "bulksmsbd", id: j.success_message?.slice(0, 100) ?? "accepted" }
      : { status: "failed", provider: "bulksmsbd", error: `code ${j.response_code ?? r.status} ${j.error_message ?? ""}`.slice(0, 200) };
  } catch (e) {
    return { status: "failed", provider: "bulksmsbd", error: String(e).slice(0, 200) };
  }
}

/** Fired after a successful order. Never throws — order success must not depend on notifications. */
export async function dispatchOrderCreated(order: Order) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Idempotent: duplicate submissions return the same order; skip if already logged.
    const { data: existing } = await supabaseAdmin.from("order_notifications" as never).select("id").eq("order_id", order.id).limit(1);
    if (existing && (existing as unknown[]).length) return;

    const lines = order.items.map((i) => `• ${i.product_name}${i.variant_name ? ` (${i.variant_name})` : ""} × ${i.quantity}`).join("\n");
    const body = `Dear ${order.customer_name},\n\nThank you for your SifatMart order ${order.order_number}.\n\n${lines}\n\nTotal (Cash on Delivery): ${taka(order.total)}\n\nWe will call you to confirm before delivery. Questions? Call ${BRAND.hotline}.\n\nSifatMart — Beauty for Your Special Moments`;
    const sms = `SifatMart: Order ${order.order_number} received. Total ${taka(order.total)} (COD). We'll call to confirm. ${BRAND.hotline}`;
    const owner = env("OWNER_NOTIFY_EMAIL");

    const [email, text, ownerMail] = await Promise.all([
      sendEmail(order.email, `Your SifatMart order ${order.order_number}`, body),
      sendSms(order.phone, sms),
      owner ? sendEmail(owner, `New order ${order.order_number} — ${taka(order.total)}`, `New COD order ${order.order_number}\n\n${lines}\n\nTotal: ${taka(order.total)}\nOpen the admin dashboard for customer details.`) : Promise.resolve<Result>({ status: "skipped_unconfigured" }),
    ]);
    const rows = ([["email", email], ["sms", text], ["owner_email", ownerMail]] as const).map(([channel, r]) => ({
      order_id: order.id, event: "order_created", channel, status: r.status, provider: r.provider ?? null, provider_message_id: r.id ?? null, error: r.error ?? null,
    }));
    await supabaseAdmin.from("order_notifications" as never).upsert(rows as never, { onConflict: "order_id,event,channel", ignoreDuplicates: true });
  } catch (e) {
    console.error("order notification dispatch failed", String(e));
  }
}
