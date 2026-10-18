import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AdminState =
  | { status: "loading" }
  | { status: "signed_out" }
  | { status: "forbidden"; user: User }
  | { status: "admin"; user: User };

/**
 * UI gate only. Real enforcement is row-level security (has_role) on every table,
 * storage bucket and the admin_adjust_stock function, so a tampered browser gains nothing.
 */
export function useAdminAuth(): AdminState {
  const [state, setState] = useState<AdminState>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return alive && setState({ status: "signed_out" });
      const { data: isAdmin, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (!alive) return;
      setState(isAdmin && !error ? { status: "admin", user } : { status: "forbidden", user });
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // Defer: awaiting auth calls inside this callback can deadlock the auth client.
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED")
        setTimeout(check, 0);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return state;
}

export function errMsg(e: unknown): string {
  const err = e as { code?: string; message?: string } | null;
  const m = err?.message ?? "";
  if (err?.code === "23505")
    return "That value is already used by another record (slug, SKU or code must be unique).";
  if (err?.code === "23514")
    return "Some values aren't allowed (for example, the compare-at price must be higher than the price, and amounts can't be negative).";
  if (err?.code === "23503") return "This item is still linked to other records.";
  if (err?.code === "42501" || m.includes("FORBIDDEN") || m.includes("row-level security"))
    return "You don't have permission to do that.";
  if (m.includes("NEGATIVE_STOCK")) return "Stock can't go below zero.";
  if (m.includes("cannot be edited")) return m;
  return m || "Something went wrong. Please try again.";
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** Strip characters that would break a PostgREST or() filter. */
export const safeSearch = (q: string) =>
  q
    .replace(/[,()*%\\]/g, " ")
    .trim()
    .slice(0, 60);

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImage(file: { type: string; size: number }): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Please use a JPG, PNG or WebP image.";
  if (file.size > MAX_IMAGE_BYTES) return "Images must be 5 MB or smaller.";
  if (file.size === 0) return "That file is empty.";
  return null;
}

export async function uploadImage(file: File, folder = "products"): Promise<string> {
  const bad = validateImage(file);
  if (bad) throw new Error(bad);
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("product-media")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(errMsg(error));
  return supabase.storage.from("product-media").getPublicUrl(path).data.publicUrl;
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;
export const PAYMENT_STATUSES = ["unpaid", "collected", "refunded"] as const;
export const LOW_STOCK = 5;
export const ADMIN_PAGE = 20;

/** Revenue = total of orders whose cash has been collected. Pipeline = open orders not yet collected. */
export function orderMetrics(
  rows: { total: number; status: string; payment_status: string; created_at: string }[],
  now = new Date(),
) {
  const today = now.toISOString().slice(0, 10);
  const open = (r: { status: string }) => r.status !== "cancelled" && r.status !== "returned";
  return {
    totalOrders: rows.length,
    todayOrders: rows.filter((r) => r.created_at.slice(0, 10) === today).length,
    pending: rows.filter((r) => r.status === "pending").length,
    collectedRevenue: rows
      .filter((r) => r.payment_status === "collected")
      .reduce((s, r) => s + r.total, 0),
    pipeline: rows
      .filter((r) => open(r) && r.payment_status === "unpaid")
      .reduce((s, r) => s + r.total, 0),
  };
}
