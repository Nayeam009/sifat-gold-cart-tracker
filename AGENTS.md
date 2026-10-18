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
- Orders are written only via server functions in src/lib/orders.functions.ts, which re-price from the catalog — never trust client prices. Order tables have RLS on with no public policies.
