# SifatMart — Customer Storefront

The uploaded brief has only the overview (brand settings and the 31-route outline); the step-by-step prompts weren't included. This plan builds it in phases, starting with the homepage from your screenshot.

## Brand
- SifatMart — "Beauty for Your Special Moments", Saidpur, Nilphamari. Hotline 01997974394. Prices in ৳ (BDT), Cash on Delivery, English.
- Colours: Ivory #FFF8EE, Gold #C29A52, Espresso #321F16, Bridal red #7C202B.
- Fonts: elegant serif headings (Cormorant Garamond / Playfair style) and a clean sans for body text.
- Uploaded gold logo used in the header, footer and browser tab.

## Phase 1 (this build)
1. **Homepage**, matching the screenshot section by section: header with menu, search, account, wishlist and cart icons; bridal hero; "Our Collections" (6 categories); Bridal Collection banner; "Most Loved Products"; Why Choose SifatMart; For Every Special Occasion (Wedding, Gaye Holud, Reception, Engagement); reviews; FAQ and WhatsApp/Facebook help card; dark espresso footer with newsletter.
2. **Shopping pages**: Shop (all products, with filters and sorting), Category pages, Product detail, Collections, Occasion pages, Search, About, Contact, FAQ, Shipping, Returns & Exchanges, Terms, Privacy, and a branded 404.
3. **Cart, Checkout (Cash on Delivery), Order confirmation, Track order.** The cart is saved on the device. Orders are saved in Lovable Cloud.
4. Products and categories are stored in Lovable Cloud and pre-filled with sample items and generated product photos.

## Phase 2 (next)
Customer accounts: sign up / sign in / forgot password, account dashboard, profile, saved addresses, order history and order details, wishlist.

## Technical details
- TanStack routes for each page, with their own page titles and descriptions. Shared header and footer in the root layout.
- Lovable Cloud tables: categories, products, orders, order_items. Products are public read-only. Orders are created through a server function that recalculates prices on the server. Tracking uses order number + phone.
- Design tokens in styles.css (oklch versions of the brand colours). Logo stored as a CDN asset, favicon in public/.
- Sample product details, reviews and FAQ text are placeholders that can be swapped for your real content.
