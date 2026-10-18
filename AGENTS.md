<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Shop, category and product pages read published products from the DB (src/lib/catalogue-data.ts); filtering/sorting/stock validation are pure functions in src/lib/catalogue.ts so they stay testable.
- src/lib/catalog.ts still holds categories, sample images (fallback when a DB product has no product_images) and cart/homepage prices; keep DB slugs in sync with it until cart pricing reads from the DB.
- Cart lines are keyed by slug + variant SKU; checkout sends variant_sku so place_order checks variant stock.
- Admin rights come only from public.user_roles (no write policies); see docs/BACKEND.md for schema, RLS and admin provisioning.
- /admin talks to the database from the browser under RLS (has_role admin); the layout's role check is UX only, so every new admin table, bucket or function must carry its own has_role policy/check.
- Stock is changed only via admin_adjust_stock() (audited) or place_order; never update stock_quantity directly from admin UI.
- Customer account pages live under /account (ssr:false layout showing a sign-in prompt when signed out); order access relies on orders RLS (user_id = auth.uid()), never on URL ids. Wishlist syncs to wishlist_items when signed in, localStorage for guests.
- Order notifications go through src/lib/notifications.server.ts after place_order and are logged in order_notifications; mark "sent" only on provider confirmation, never throw into checkout. Integration env vars are documented in docs/INTEGRATIONS.md.
- Page metadata uses seo()/jsonLd()/breadcrumbLd() from src/lib/seo.ts (canonical from VITE_SITE_URL); /sitemap.xml and /robots.txt are server routes, so don't add public/robots.txt.
