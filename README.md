# Vaultguards — Prototype

## Project Overview
- **Name**: Vaultguards
- **Goal**: Marketing site + "The Vault" virtual try-on for colorway guards fitting TAG and PSA graded card slabs.
- **Final deliverable target**: Shopify Liquid theme sections (this sandbox build is a prototyping environment only — not the final deploy target).

## Current Feature Set
- Sitewide announcement bar: "Free US Shipping On Orders Over $50."
- Homepage: hero, Shop grid (TAG + PSA), **Aura colorway spotlight section** (completely-clear, "purist collector" positioning), feature highlights (incl. acrylic-backing callout), contextual Smart Bundle cross-sell, "Watch Once You Buy" YouTube embed, CTA, footer.
- Product Detail Page (`/product/:handle`): image with **Front/Back photo toggle** (shows the acrylic backing shot), price, stock pill, "Clear acrylic backing included" info card, curated **"Goes well with"** suggestions (complementary colorway + accessory — replaces the old full colorway circle-row to avoid information overload), contextual Smart Bundle module, Add to Cart (demo), link into The Vault.
- **Contact Us page** (`/contact`): name + email + message form, submits to `POST /contact/send` (Hono API route) which relays the message to **paul@vaultguards.co** via the Resend email API. Linked from the Nav and Footer.
- The Vault (`/vault`): brand select → upload + auto background removal → pinch/zoom align (guide box now derived from the exact same geometry used at composite time, for accurate fit) → live composite preview across every real colorway → Add to Cart (blocked when out of stock). Preview panel is CSS `position:sticky` instead of auto-scrolling the page on every color tap.
- All guard photos use a verified 4:5 aspect ratio (`PRODUCT_PHOTO_ASPECT`) everywhere — no more top/bottom cropping on PSA (or any) guard photos.
- Steel/gunmetal/chrome visual theme, Space Grotesk display font, real Vaultguards metallic logo mark in the header/footer.
- Mobile-first responsive layout throughout (grids, typography, touch targets, canvases).

## Removed (per feedback)
- "Our Story" section, Reviews/testimonials section, TAG-vs-PSA image comparison slider, on-screen inch dimensions for TAG/PSA slabs.
- Jarring auto-scroll-to-preview in The Vault (replaced with sticky preview panel).
- Inaccurate "Save ~$X bundled" claim in the Smart Bundle module.

## URLs (sandbox preview only)
- Home: https://3000-id1b84usa1zcsydiiemog-583b4d74.sandbox.novita.ai/
- The Vault: https://3000-id1b84usa1zcsydiiemog-583b4d74.sandbox.novita.ai/vault
- Sample PDP: https://3000-id1b84usa1zcsydiiemog-583b4d74.sandbox.novita.ai/product/aura

## Data — Single Source of Truth
- `src/data/products.ts` is the ONLY file to edit when adding a new guard/colorway (see the "HOW TO ADD A NEW GUARD" checklist at the top of that file). Every page — homepage, collection pages, PDP, The Vault, and Smart Bundle — reads from it automatically.
- `src/components/CatalogScript.tsx` injects this same data (plus helper functions) into every page at request time as `window.VaultguardsCatalog`, so client-side scripts (Vault, Bundle) never fall out of sync with the server-rendered pages. The old hand-duplicated `public/static/js/products-data.js` has been removed.
- Each guard now has a verified `backImage` (Shopify position-2 photo) used by the Front/Back toggle; omitted only for unrevealed "mystery drop" guards.

## Contact Form Setup (action needed before it can actually send)
The `/contact` page and `/contact/send` API route are built and tested (validation, error handling, and success flow all work). The ONLY missing piece is a **Resend API key**:
1. Create a free account at https://resend.com and generate an API key.
2. Set it as a secret: `npx wrangler pages secret put RESEND_API_KEY` (production) — for local sandbox testing, add `RESEND_API_KEY=re_xxx` to a `.dev.vars` file in the project root (already git-ignored) and restart the dev server.
3. By default the "from" address is Resend's shared `onboarding@resend.dev` sender, which works immediately without any domain verification. Once you verify `vaultguards.co` in the Resend dashboard, update `CONTACT_FROM_EMAIL` in `src/routes/contact.tsx` to send from your own domain (e.g. `contact@vaultguards.co`) for better deliverability/branding.
- Without the key set, the form fails gracefully with a friendly "try again later" message instead of crashing.

## Not Yet Done
- Set the `RESEND_API_KEY` secret (see above) so the Contact form actually sends email.
- Swap `HOW_TO_OPEN_YOUTUBE_ID` placeholder in `src/index.tsx` for the real unboxing video ID.
- Final packaging as Shopify Liquid section files for copy-paste into the theme editor.
- Full interactive mobile QA on a physical device.

## Deployment
- **Platform (prototype)**: Cloudflare Pages via Wrangler (sandbox only)
- **Tech Stack**: Hono + TypeScript + vanilla JS + CSS custom properties
- **Last Updated**: 2026-07-31
