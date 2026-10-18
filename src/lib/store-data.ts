import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { products as catalog, type Product } from "@/lib/catalog";

export type SocialLinks = {
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  whatsapp: string | null;
};
const validUrl = (v: unknown) => (typeof v === "string" && /^https:\/\/\S+$/.test(v) ? v : null);

export const bestsellersQuery = queryOptions({
  queryKey: ["bestsellers"],
  queryFn: async (): Promise<(Product & { variantNames: string[] })[]> => {
    const { data, error } = await supabase
      .from("products")
      .select(
        "slug, name, price, compare_at_price, stock_quantity, product_variants(name), product_images(image_url, sort_order), categories(slug)",
      )
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("created_at")
      .limit(8);
    if (error) throw new Error("Could not load bestsellers");
    return (data ?? []).map((row) => {
      const local = catalog.find((p) => p.slug === row.slug);
      const imgs = [...(row.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
      return {
        ...(local ?? { slug: row.slug, category: row.categories?.slug ?? "", image: "" }),
        image: imgs[0]?.image_url ?? local?.image ?? "",
        oldPrice: row.compare_at_price ?? undefined,
        name: row.name,
        price: row.price,
        stock: row.stock_quantity,
        variantNames: (row.product_variants ?? []).map((v: { name: string }) => v.name),
      } as unknown as Product & { variantNames: string[] };
    });
  },
});

export const testimonialsQuery = queryOptions({
  queryKey: ["testimonials"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("id, customer_name, location, body, rating")
      .eq("is_published", true)
      .order("sort_order");
    if (error) throw new Error("Could not load reviews");
    return data ?? [];
  },
});

export const faqsQuery = queryOptions({
  queryKey: ["faqs"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("faqs")
      .select("id, question, answer")
      .eq("is_published", true)
      .order("sort_order");
    if (error) throw new Error("Could not load FAQs");
    return data ?? [];
  },
});

export const socialLinksQuery = queryOptions({
  queryKey: ["social_links"],
  queryFn: async (): Promise<SocialLinks> => {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "social_links")
      .maybeSingle();
    const v = (data?.value ?? {}) as Partial<Record<keyof SocialLinks, unknown>>;
    const wa =
      typeof v.whatsapp === "string" && /^8801[3-9]\d{8}$/.test(v.whatsapp)
        ? `https://wa.me/${v.whatsapp}`
        : validUrl(v.whatsapp);
    return {
      facebook: validUrl(v.facebook),
      instagram: validUrl(v.instagram),
      youtube: validUrl(v.youtube),
      whatsapp: wa,
    };
  },
  staleTime: 5 * 60_000,
});

export async function subscribeNewsletter(email: string) {
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean) || clean.length > 254)
    return { ok: false as const, message: "Please enter a valid email" };
  const { error } = await supabase.from("newsletter_subscribers").insert({ email: clean });
  if (error && error.code !== "23505")
    return { ok: false as const, message: "Could not subscribe right now. Please try again." };
  return { ok: true as const };
}

/** Any public site_settings row edited from the admin dashboard (store_contact, policies, newsletter, homepage). */
export const siteSettingQuery = (key: string) =>
  queryOptions({
    queryKey: ["site_setting", key],
    queryFn: async (): Promise<Record<string, unknown>> => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      return (data?.value ?? {}) as Record<string, unknown>;
    },
    staleTime: 60_000,
  });
