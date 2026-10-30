# Admin panel upgrade (inspired by the reference kit, written fresh for SifatMart)

The reference kit is a pet-store admin with many extra tools. SifatMart already has Overview, Orders, Customers, Products, Inventory, Categories, Coupons, Homepage & FAQs and Settings. The plan adds the useful missing tools, rebuilt in SifatMart's own style and rules (COD only, ৳ BDT, ivory/gold/espresso). No code is copied. Pet, vet and social parts are skipped.

## 1. New admin shell (mobile first)
- Grouped side menu on computers: Store (Overview, Orders, Incomplete checkouts, Returns, Products, Inventory, Categories, Customers) and Growth (Coupons, Delivery fees, Homepage & FAQs, Reports), with Settings pinned at the bottom. Collapsible, fits short laptop screens.
- Phones: top bar with a menu that slides in from the left, plus a bottom tab bar (Home, Orders, Products, Customers, More). All taps at least 44px.
- Every table (orders, products, customers, coupons, inventory, returns) turns into stacked cards on phones.
- Loading skeletons, empty states and toast messages on every page.

## 2. Orders upgrades
- Status filter chips with counts, date range, search, "load more" in groups of 50.
- Bulk select: mark as a status, print invoices or 4x6 shipping labels.
- Printable invoice and packing slip page (plain page, no menu).
- Manual order creation by the owner (for phone orders), with the server still checking prices and stock.
- Order timeline built from the existing status history.
- Courier tracking: courier name + tracking code + tracking link saved on the order and shown to the customer on Track Order. (Direct Steadfast/Pathao/RedX connections need their accounts and keys; left off until you give them.)

## 3. Returns & exchanges (new)
- Return requests per order: requested, approved or rejected, received, completed.
- Receiving a return can put stock back (logged through the existing stock audit).
- Refund can never exceed what was paid. Records can't be deleted (audit trail).
- Optional store credit for the customer when a return is completed.

## 4. Customers upgrades
- Groups: VIP (4+ orders), High spender (৳10,000+), At risk (no order in 60+ days), New (one order). Filter chips and CSV export.
- Customer detail page: their orders, totals, private owner notes, and store credit ledger (add or remove with a reason; can't go below zero).

## 5. Inventory and products
- Inventory: stock filters (all, low, out), inline edits saved together, CSV export and CSV import with a preview of changes before saving (negative stock rejected; all changes go through the audited stock function).
- Products: reorder and remove multiple images, cost price field for profit in reports.

## 6. Incomplete checkouts (new)
- When a visitor fills in a phone number on checkout but doesn't place the order, save it (only with the cookie/consent rules already in place).
- Owner list with WhatsApp and call buttons to follow up, and a simple recovery count.

## 7. Delivery fees
- Replace the two fixed fees with an editable list of zones/rules (inside Saidpur, elsewhere, optional free delivery above an amount). Checkout reads the same rules on the server.

## 8. Reports
- Sales, orders and average order value over time, top products, orders by status, with date filter and CSV export. Charts load only when opened.

## 9. Settings additions
- Invoice prefix and footer text, store logo for invoices.

## 10. Whole-site mobile pass and testing
- Re-check every storefront and admin page at 360, 390, 768, 1024 and 1440 widths for overflow, clipped text, tap sizes and broken menus; fix what's found.
- Playwright run signed in as your admin account covering every admin page and action above, plus storefront checkout, cart, account and track order. Unit tests for the new rules (customer groups, return steps, refund limit, store credit floor, delivery rule matching, CSV import checks).
- Remove all test records afterwards.

## Not included
- Support chat, AI fraud check, Meta Conversions API, live courier API connections, online payment: these need outside accounts or keys. Can be added later when you have them.

## Technical details
- New tables: order_returns, store_credits, customer_notes, incomplete_checkouts, shipping_rules (or site_settings key), plus courier fields and cost_price columns. Each with GRANTs, RLS using has_role(admin); customers read only their own credits. Foreign-key indexes.
- Return transitions, restock, store credit and manual orders run in SECURITY DEFINER SQL functions that check has_role first; place_order fee logic reads shipping rules.
- Shell: src/components/admin/ (nav config, sidebar, bottom nav, mobile sheet, responsive data-list). New routes: admin.returns, admin.incomplete, admin.reports, admin.delivery, admin.customers.$id, admin.orders_.new, admin.orders_.print, admin.orders_.$id.invoice.
- Zod validation for all forms; recharts lazy-loaded; Vitest for pure rule functions in src/lib.
