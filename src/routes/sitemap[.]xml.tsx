import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { occasions } from "@/lib/catalog";
import { absUrl } from "@/lib/seo";

const STATIC = ["/", "/shop", "/collections", "/about", "/contact", "/faq", "/track-order", "/shipping-policy", "/returns", "/privacy", "/terms"];
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"] ?? "";
        const db = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } },
        });
        const [{ data: products }, { data: cats }] = await Promise.all([
          db.from("products").select("slug, updated_at").eq("is_published", true).limit(5000),
          db.from("categories").select("slug, updated_at").eq("is_published", true),
        ]);
        const urls = [
          ...STATIC.map((p) => ({ loc: absUrl(p) })),
          ...(cats ?? []).map((c) => ({ loc: absUrl(`/category/${c.slug}`), lastmod: c.updated_at })),
          ...occasions.map((o) => ({ loc: absUrl(`/occasion/${o.slug}`) })),
          ...(products ?? []).map((p) => ({ loc: absUrl(`/product/${p.slug}`), lastmod: p.updated_at })),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${esc(u.loc)}</loc>${"lastmod" in u && u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ""}</url>`)
          .join("\n")}\n</urlset>\n`;
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
