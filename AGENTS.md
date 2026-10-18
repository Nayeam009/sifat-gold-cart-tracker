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

- Product catalog lives in src/lib/catalog.ts (static) — keeps pages fast and SSR-friendly until an admin area exists.
- Orders are created only by the DB function place_order (service_role only), called from src/lib/orders.functions.ts — it re-prices, checks stock and snapshots items atomically; never trust client prices.
- Database products mirror src/lib/catalog.ts by slug; keep both in sync until the storefront reads from the DB.
- Admin rights come only from public.user_roles (no write policies); see docs/BACKEND.md for schema, RLS and admin provisioning.
