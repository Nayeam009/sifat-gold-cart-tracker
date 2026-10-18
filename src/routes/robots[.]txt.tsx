import { createFileRoute } from "@tanstack/react-router";
import { absUrl } from "@/lib/seo";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /cart\nDisallow: /checkout\nDisallow: /order-confirmation/\nDisallow: /wishlist\nDisallow: /search\n\nSitemap: ${absUrl("/sitemap.xml")}\n`,
          { headers: { "Content-Type": "text/plain; charset=utf-8" } },
        ),
    },
  },
});
