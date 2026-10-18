# SifatMart backend

## Money
All amounts are `integer` **whole Taka (BDT)**. The store has no paisa prices, so whole Taka is exact
(no floats). Format with `formatTaka()` → `৳ 1,850`.

## Tables
| Table | Purpose | Public read | Customer | Admin |
|---|---|---|---|---|
| categories, products, product_images, product_variants | Catalog (slug, SKU, price, compare_at_price, stock, is_published, is_featured, timestamps) | published only | — | full CRUD |
| homepage_banners, testimonials, faqs | Site content | published only | — | full CRUD |
| site_settings | key/value (delivery_fees, payment_methods, store_contact) | `is_public` rows | — | full CRUD |
| coupons | Discount codes | **never** | — | full CRUD |
| profiles | Auto-created on signup | — | own row | read |
| customer_addresses | Saved addresses | — | own rows CRUD | — |
| orders | Customer, phone, address, zone, payment_method (`cod` only), subtotal, delivery_fee, discount, total, notes, status | — | own (user_id) read | read/update |
| order_items | Immutable snapshot: name, slug, SKU, variant, unit_price, quantity, line_total | — | own read | read |
| user_roles | `admin` / `customer` | — | own read | read |

## Security rules
- Every table has RLS. Nobody can insert orders directly; there are no insert policies on orders/order_items.
- Orders are created only by `public.place_order()` (EXECUTE granted to service_role only), called from the
  `placeOrder` server function. It re-reads prices from the database, locks rows, checks and decrements
  stock, validates coupons, applies the delivery fee from `site_settings`, and writes snapshots in one transaction.
- `order_items` rows cannot be updated (trigger) — later product edits never change history.
- Guest orders have `user_id = NULL`; tracking requires order number + phone (server function).
- Roles live in `user_roles`, which has no insert/update/delete policies — admin can't be self-assigned.
  Signup only ever grants `customer`.
- Service-role key is used only inside server handlers, never in browser code.
- Online payment is disabled (`payment_methods.online = false`, DB constraint allows only `cod`).
  Enabling it requires a real provider + credentials and relaxing `orders_payment_check`.

## Provisioning the first administrator
1. Owner creates a normal account with the sign-up form.
2. In Lovable Cloud → Database → SQL, run (replace the email):
```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'owner@example.com'
on conflict do nothing;
```
Remove with `delete from public.user_roles where role='admin' and user_id = '<uuid>';`
