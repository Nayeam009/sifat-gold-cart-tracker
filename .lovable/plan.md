# New footer: rolling hills scene

Rebuild the site footer to match your reference image (soft sky, layered rolling hills, big headline, links set on the darkest hill). It uses SifatMart's colours (ivory, champagne gold, espresso, bridal red), not green.

## What visitors will see
- **Top:** a pale ivory sky with a soft gold glow. A big serif headline, "Make your special day *unforgettable.*", with the last word in gold italic. Under it, one short line and a round "Start shopping" button with an arrow.
- **Hills:** six layers of hills, from pale champagne in the distance down to warm brown and espresso up close. When the footer scrolls into view, the hills rise one after another and a light mist drifts across them. On computers they move slightly with the mouse.
- **Footer content on the darkest hill:**
  - your logo, address, tap-to-call hotline 01997974394, and email sign-up (one line with a round arrow button)
  - link columns: Shop, Help, Policies
  - social icons, shown only when they're set in Settings (same rule as now)
  - faint line-drawn wildflowers in the background
- **Bottom line:** © year SifatMart, your tagline, and Privacy and Terms links.

## Phones and tablets
- **Phone:** the hill scene is shorter and the headline shrinks to fit. Logo and email sign-up come first, then the link columns two side by side, then socials. Every link and button is at least finger-sized (44px), and nothing runs off the edge.
- **Tablet:** brand and sign-up across the top, the three link columns in a row below.
- **Computer:** the same layout as your reference image.

## Speed and accessibility
- The hills are drawn on the visitor's own device, so there are no extra photos to download.
- Drawing starts only when the footer comes near the screen and pauses when it scrolls away.
- Visitors who have turned off motion see still hills with no animation.
- The headline, links and form are normal text that screen readers and Google can read. The hills are decoration only.
- The email sign-up still goes to your subscriber list, with the same success and error messages.

## Technical details
- New `src/components/site/meadow-footer.tsx`, rewritten from the uploaded idea (not pasted), with a SifatMart colour palette taken from styles.css tokens. Canvas layers are drawn once per size, then composited inside requestAnimationFrame. An IntersectionObserver gates drawing; `prefers-reduced-motion` turns the animation off.
- Only the canvas is client-only (it is drawn in an effect), so the server still renders all the text and there's no hydration mismatch.
- `site-footer.tsx` renders the new component and keeps the existing queries (social links, store contact, subscribeNewsletter). Link targets stay the same.
- Verify with Playwright at 360, 390, 768 and 1280 widths: no horizontal overflow, the canvas draws, and the subscribe form shows its message.
