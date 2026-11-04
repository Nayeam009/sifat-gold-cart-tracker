# SifatMart — Production Audit Round (from uploaded master brief)

Much of the brief was already done and tested in earlier rounds (server-side pricing, duplicate-order protection, RLS, admin roles, SEO, sitemap, image optimisation, mobile layout). This round covers the gaps that are still open, re-runs the full test pass, and ends with a written report. Nothing gets rebuilt from scratch, and the brand look stays as it is.

## 1. Re-check what already works (quick regression)
- Run all automated checks, the type check and the build.
- Run the security scan and the database linter, and fix anything new they find.
- Use Playwright to open every shop page and every dashboard page on phone (390px), tablet (768px) and computer (1280px) screens. Look for errors, text or layout spilling off the side, broken images and buttons without a name.

## 2. Ordering under heavy load (Phase 11)
- **Overselling test:** set up a test product with only 2 in stock, then send 10 orders for it at the same time. Exactly 2 should succeed and stock should never go below zero.
- **Duplicate test:** send the same checkout 5 times at once. Only one order should be created.
- **Speed check:** look at how fast the database handles the busiest admin lists (orders by status and date, search by phone). Add missing indexes where they're needed, including GIN indexes for product search.
- Remove every test order and product afterwards, using the same cancel-and-restock steps the shop already uses.

## 3. Security hardening (Phase 7)
- Add security headers to every page response: content security policy (CSP) that still allows analytics and Meta Pixel, frame-ancestors, nosniff, referrer-policy and permissions-policy.
- Add rate limits on order placement, the incomplete-checkout recorder, Track Order and newsletter sign-up, so bots can't flood them. These limits run in the database.
- Re-test, signed in as a customer: they can't read other customers' orders, notes, store credit or cost prices, and can't make themselves admin.
- Check that uploads only accept image types and sizes.

## 4. Stability (Phase 16)
- Error screens: confirm every page has a friendly error and "not found" screen with a Retry button. Add the missing ones.
- Offline: show a clear "You're offline" banner, and keep the cart when the connection drops.

## 5. Waiting on your accounts (prepared only, nothing faked)
- **Online payment (bKash/SSLCommerz):** no provider is connected. It stays off and Cash on Delivery stays on.
- **Meta Pixel and Conversions API:** the events (ViewContent, AddToCart, InitiateCheckout, Purchase) get wired in with a shared event ID, so the same purchase isn't counted twice. They only switch on once you give the Pixel ID and access token, and only after visitors accept cookies.
- **Couriers, email and SMS:** these stay as built and are marked as not connected.

## 6. Backups (Phase 12)
- The admin side gets a one-tap export of orders, customers and products as spreadsheet files. The final report explains how Lovable Cloud backups work.

## 7. Final report
A plain-language report following the brief's required format: each test marked PASS / FAIL / BLOCKED / NOT TESTED with evidence, what was fixed, what's still blocked and who needs to act, and a launch checklist.

## Technical details
- Load test: a bun script calls the `place_order_once` RPC in parallel with a publishable client. The existing row locks in `place_order` should hold; if they don't, change to `SELECT ... FOR UPDATE` on the product and variant rows.
- Headers: done through TanStack Start request middleware in `src/start.ts`.
- Rate limits: a `rate_limits` table (key and time window), checked inside the SECURITY DEFINER RPCs, with RLS on and no client access.
- Indexes: `orders(status, created_at desc)`, `orders(phone)`, and a pg_trgm GIN index on `products.name`.
- Meta events: client `fbq` plus a server function for CAPI, gated by env secrets and consent.
- Tests: a Vitest case for each new rule (rate-limit window, event-ID dedupe).
