# Full audit: storefront + admin (function, mobile/native feel, speed, security, SEO)

## 1. Automated health checks
- Type check, all unit tests, production build, code-style check.
- Database security linter + quick security scan; deep security scan started in the background.
- SEO foundations scan (titles, descriptions, sitemap, robots, structured data).

## 2. Browser testing (Playwright) at phone 390px, tablet 820px, desktop 1280px
Storefront: home, shop (search, filters, sort, load more), categories, product page (gallery, options, stock limits), wishlist, cart persistence, guest Cash on Delivery checkout (including free-delivery threshold and double-tap protection), order confirmation, track order, sign up / sign in / account / addresses / my orders, About, Contact, policy pages, FAQ, 404.

Admin (signed in as the owner): overview, orders (filters, bulk status, courier fields, invoice/label print), products (create with multiple photos, edit, reorder, delete), inventory (adjust, CSV), categories, customers + notes + credit, coupons, returns, incomplete checkouts, reports, content, settings (delivery fees, invoice prefix).

Each page checked for: no sideways scrolling, clipped text, tap targets of at least 44px, readable contrast, working menus/dialogs by keyboard, no console errors, loading/empty/error states.

## 3. Native-app feel and speed
- Measure load time, layout shift and largest image paint on key pages (phone throttled).
- Check image sizes, lazy loading, link prefetching, sticky header/bottom bar behaviour, tap feedback, page-change smoothness.

## 4. Security review
- Customer cannot read other orders, change prices/totals, promote to admin, write products/stock/media.
- Review the open concerns from earlier: incomplete-checkout "recovered" marking without proof, repeated restocking from duplicate returns, courier key handling, upload type/size limits.

## 5. Fix and re-test
- Fix every defect found, re-run the affected tests, remove all test data created.

## 6. Report
PASS / FAIL / NOT TESTED list with evidence, plus what still needs outside accounts (email/SMS, couriers, payment, Meta Pixel).

## Technical details
- Scripts in /tmp/browser/audit; session restored from injected auth.
- Likely fixes: SECURITY DEFINER guards in new migrations for return restock caps and incomplete-checkout completion bound to the order's idempotency key.
