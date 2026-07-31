# Vaultguards — Prototype

## Project Overview
- **Name**: Vaultguards
- **Goal**: Marketing site + "The Vault" virtual try-on for colorway guards fitting TAG and PSA graded card slabs.
- **Final deliverable target**: Shopify Liquid theme sections (this sandbox build is a prototyping environment only — not the final deploy target).

## Current Feature Set
- Homepage: hero, Shop grid (TAG + PSA, moved near top), feature highlights, Smart Bundle cross-sell, "Watch Once You Buy" YouTube embed, CTA, footer.
- Product Detail Page (`/product/:handle`): image, price, stock pill, same-brand colorway swatches, Add to Cart (demo), link into The Vault.
- The Vault (`/vault`): brand select → upload + auto background removal → pinch/zoom align → live composite preview across every real colorway (swatches now show the guard's name + real product photo, compositing the customer's own uploaded slab into each thumbnail) → Add to Cart (blocked when out of stock).
- Steel/gunmetal/chrome visual theme, Space Grotesk display font, real Vaultguards metallic logo mark in the header/footer.
- Mobile-first responsive layout throughout (grids, typography, touch targets, canvases).

## Removed (per latest feedback)
- "Our Story" section, Reviews/testimonials section, TAG-vs-PSA image comparison slider, and on-screen inch dimensions for TAG/PSA slabs.

## URLs (sandbox preview only)
- Home: https://3000-id1b84usa1zcsydiiemog-583b4d74.sandbox.novita.ai/
- The Vault: https://3000-id1b84usa1zcsydiiemog-583b4d74.sandbox.novita.ai/vault
- Sample PDP: https://3000-id1b84usa1zcsydiiemog-583b4d74.sandbox.novita.ai/product/aura

## Data
- `src/data/products.ts` / `public/static/js/products-data.js` mirror the real vaultguards.co catalog (handles, prices, images, stock, GUARD_WINDOW compositing geometry).

## Not Yet Done
- Swap `HOW_TO_OPEN_YOUTUBE_ID` placeholder in `src/index.tsx` for the real unboxing video ID.
- Final packaging as Shopify Liquid section files for copy-paste into the theme editor.
- Full interactive mobile QA on a physical device.

## Deployment
- **Platform (prototype)**: Cloudflare Pages via Wrangler (sandbox only)
- **Tech Stack**: Hono + TypeScript + vanilla JS + CSS custom properties
- **Last Updated**: 2026-07-31
