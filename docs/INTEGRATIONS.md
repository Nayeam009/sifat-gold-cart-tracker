# Integrations, notifications & SEO

Everything below is **optional**. With nothing configured the shop works fully: orders are confirmed on the website only, and no analytics load.

## Order notifications (server secrets — never `VITE_`)
After every successful order the server fires an `order_created` event and writes one row per channel to `order_notifications` (admins can read it). Status is `sent` only when the provider confirms acceptance; otherwise `failed`, `skipped_unconfigured` or `skipped_no_recipient`. Order placement never fails because of a notification.

| Secret | Purpose | External account |
|---|---|---|
| `RESEND_API_KEY` | Customer confirmation email (only if the customer entered an email) | resend.com, with a verified sending domain |
| `NOTIFY_FROM_EMAIL` | Sender, e.g. `SifatMart <orders@yourdomain.com>` | Must be on the verified domain |
| `OWNER_NOTIFY_EMAIL` | Optional: owner receives a "new order" email (no customer address/phone in it) | — |
| `SMS_API_KEY`, `SMS_SENDER_ID` | Customer SMS via a BulkSMSBD-compatible gateway (success = `response_code 202`) | Bangladeshi SMS provider with approved sender ID |
| `SMS_API_URL` | Optional override of the gateway endpoint | — |

## Contact links
Facebook, Instagram, YouTube and WhatsApp are set in **Admin → Settings → Social links** (https URLs, or WhatsApp as `8801XXXXXXXXX`). A link only appears on the site once configured. Hotline is click-to-call everywhere.

## Analytics (public build variables — consent required)
| Variable | Format |
|---|---|
| `VITE_GA_MEASUREMENT_ID` | `G-XXXXXXX` (Google Analytics 4 property) |
| `VITE_META_PIXEL_ID` | numeric Pixel ID (Meta Events Manager) |

Scripts load only after the visitor taps **Allow**. Only page paths are sent; admin, account, checkout, confirmation and tracking pages are never tracked; no names, phones, addresses or order data are sent. IP anonymisation and ad-personalisation signals are off for GA4.

## SEO
| Variable | Purpose |
|---|---|
| `VITE_SITE_URL` | Public origin (e.g. `https://sifatmart.com`) used for canonical URLs, `/sitemap.xml`, `/robots.txt` and structured data. Defaults to the preview URL — **set it when a domain is connected.** |

- `/sitemap.xml` lists static pages, published categories, occasions and published products (live from the database).
- `/robots.txt` blocks admin/account/cart/checkout and points to the sitemap.
- Product pages emit `Product` JSON-LD with the current BDT price, SKU and in-stock/out-of-stock per variant; no ratings or reviews are emitted. Category pages emit `CollectionPage`; both emit `BreadcrumbList`. Homepage emits `Store`.
- Submit the sitemap in Google Search Console after publishing.
