// ============================================================================
// Vaultguards Catalog — SINGLE SOURCE OF TRUTH
// ----------------------------------------------------------------------------
// This is the ONLY file that needs editing when Paul adds a new colorway or
// product. Every UI on the site (homepage grid, /collection/tag & /psa,
// individual /product/:handle pages, The Vault swatches + compositing, and
// the Smart Bundle module) reads from the arrays below — nothing is
// hardcoded per-product anywhere else in the codebase. The client-side
// catalog (used by The Vault + bundle widget JS) is generated FROM this file
// automatically at request time (see `src/components/CatalogScript.tsx`),
// so there is no second file to keep in sync.
//
// ---- HOW TO ADD A NEW GUARD (checklist for Paul) ----
//   1. Add a new object to TAG_GUARDS or PSA_GUARDS below with:
//      - handle: the exact Shopify product handle (from the product URL)
//      - title: display name shown everywhere
//      - brand: 'TAG' or 'PSA'
//      - price: number, no $ sign
//      - image: the FRONT product photo URL (Shopify "position 1" image)
//      - backImage: the BACK product photo URL (Shopify "position 2" image —
//        every real Vaultguards product photo set has front at position 1
//        and the acrylic-backing/back-of-slab shot at position 2). Leave
//        undefined only for "mystery drop" placeholders with no real photos.
//      - hex: the dominant frame color as a hex string (eyeball it from the
//        photo, or use any color-picker on the image) — only used to pick
//        "closest in stock" / "complementary" suggestions, doesn't need to
//        be pixel-perfect.
//      - glitter: true/false, cosmetic only (no UI currently branches on it,
//        reserved for future use).
//      - stock: current inventory count (0 = shown everywhere as "Out of
//        stock" but still previewable in The Vault).
//      - mystery: only set to `true` for unrevealed drops — mystery guards
//        are automatically excluded from collection pages, the homepage
//        grid, and The Vault swatch picker (see getGuardsByBrand below).
//   2. That's it — no other file needs to change. The guard will
//      automatically appear on its collection page, in the homepage
//      featured grid (if within the first 4), in The Vault swatch picker,
//      and get its own /product/:handle page.
// ============================================================================

export type Brand = 'TAG' | 'PSA';

export interface Guard {
  handle: string;
  title: string;
  brand: Brand;
  price: number;
  image: string; // real product photo, FRONT of guard (Shopify image position 1)
  backImage?: string; // real product photo, BACK of guard showing the acrylic backing (Shopify image position 2) — omit only for mystery drops
  hex: string; // dominant frame color, sampled from real photo — used for similarity matching
  glitter: boolean;
  stock: number; // 0 = out of stock (preview allowed, checkout blocked)
  mystery?: boolean; // true = "mystery drop", no real photo revealed yet, excluded from Vault preview
}

// Card-window geometry, measured as % of the full product image (1920x2400 px).
// Method: pixel-threshold white-background detection (not visual estimate) run
// against 4 real product photos across both brands — outer product bbox was
// consistently left/right ~19%, top/bottom ~9.4% (ratio ~0.61, matching real
// slab ratios almost exactly, confirming the frame hugs the slab tightly).
// The composite "window" below is that outer box inset by the frame's own
// border thickness (~4% of the box) so the colored frame ring stays visible
// around the customer's composited slab photo. Verified consistent across
// the sampled catalog; single flat straight-on shots make this reliable.
export const GUARD_WINDOW = {
  TAG: { top: 13.7, left: 22.5, right: 22.1, bottom: 13.8 },
  PSA: { top: 13.2, left: 21.9, right: 21.8, bottom: 13.0 },
};

// Real slab proportions (width:height) used to size the alignment guide per brand
export const SLAB_RATIO = {
  TAG: 3.125 / 5.25,
  PSA: 3.25 / 5.375,
};

export const TAG_GUARDS: Guard[] = [
  { handle: 'aura', title: 'Aura', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04243-Photoroom.jpg?v=1781079082', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04244-Photoroom.jpg?v=1781079081', hex: '#F4F6F8', glitter: false, stock: 0 },
  { handle: 'aquavolt', title: 'Aquavolt', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04234-Photoroom.jpg?v=1781079036', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04235-Photoroom.jpg?v=1781079036', hex: '#3FBFA6', glitter: true, stock: 0 },
  { handle: 'psywave', title: 'Psywave', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04222-Photoroom.jpg?v=1781079116', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04223-Photoroom.jpg?v=1781079116', hex: '#D36C9E', glitter: true, stock: 0 },
  { handle: 'shadowburn', title: 'Shadowburn', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04227-Photoroom.jpg?v=1781079150', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04229-Photoroom.jpg?v=1781079150', hex: '#5A1F1F', glitter: true, stock: 0 },
  { handle: 'shadowphase', title: 'Shadowphase', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04239-Photoroom.jpg?v=1781079186', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04240-Photoroom.jpg?v=1781079186', hex: '#C9C9CE', glitter: true, stock: 0 },
  { handle: 'smokescreen', title: 'Smokescreen', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04247-Photoroom.jpg?v=1781079227', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04248-Photoroom.jpg?v=1781079227', hex: '#1F1F1F', glitter: true, stock: 0 },
  { handle: 'voidshift', title: 'Voidshift', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04218-Photoroom.jpg?v=1781079259', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04219-Photoroom.jpg?v=1781079259', hex: '#4D2B66', glitter: true, stock: 0 },
  { handle: 'aquafrost', title: 'Aquafrost', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/image_205f5a25-a8f2-46ee-86ea-725c25c27708.png?v=1781086114', hex: '#8C8C8C', glitter: false, stock: 0, mystery: true },
  { handle: 'solarshade', title: 'Solarshade', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/image_d8b83a88-f4c7-40bb-a895-941077cc1259.png?v=1781086045', hex: '#8C8C8C', glitter: false, stock: 0, mystery: true },
];

export const PSA_GUARDS: Guard[] = [
  { handle: 'litescreen', title: 'Litescreen', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04167-Photoroom.jpg?v=1780112367', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04168-Photoroom.jpg?v=1780112367', hex: '#E0B23C', glitter: true, stock: 0 },
  { handle: 'astral', title: 'Astral', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04116-Photoroom_2.jpg?v=1779945779', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04118-Photoroom_2.jpg?v=1779945779', hex: '#8A5FBF', glitter: true, stock: 0 },
  { handle: 'curse', title: 'Curse', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04122-Photoroom_2.jpg?v=1779946012', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04123-Photoroom_2.jpg?v=1779946011', hex: '#3C1C52', glitter: true, stock: 0 },
  { handle: 'lunarblast', title: 'Lunarblast', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04135-Photoroom_2.jpg?v=1779946644', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04136-Photoroom_2.jpg?v=1779946641', hex: '#B52F6B', glitter: true, stock: 0 },
  { handle: 'solarwind', title: 'Solarwind', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04160-Photoroom.jpg?v=1779993741', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04161-Photoroom.jpg?v=1779993740', hex: '#E14E2C', glitter: true, stock: 0 },
  { handle: 'futuresite', title: 'Futuresite', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04207-Photoroom.jpg?v=1781078236', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04208-Photoroom.jpg?v=1781078236', hex: '#1A1A1A', glitter: true, stock: 0 },
  { handle: 'nightfall', title: 'Nightfall', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04202-Photoroom.jpg?v=1780962288', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04203-Photoroom.jpg?v=1780962288', hex: '#123C73', glitter: true, stock: 0 },
  { handle: 'waterfall', title: 'Waterfall', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04196-Photoroom.jpg?v=1780961671', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04197-Photoroom.jpg?v=1780961671', hex: '#0050A1', glitter: true, stock: 0 },
  { handle: 'mist', title: 'Mist', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04191-Photoroom.jpg?v=1780961119', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04192-Photoroom.jpg?v=1780961119', hex: '#00A2B9', glitter: true, stock: 0 },
  { handle: 'flashpoint', title: 'Flashpoint', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04186-Photoroom.jpg?v=1780700977', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04187-Photoroom.jpg?v=1780700977', hex: '#3A3A3C', glitter: true, stock: 0 },
  { handle: 'frostbeam', title: 'Frostbeam', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04182-Photoroom.jpg?v=1780116180', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04183-Photoroom.jpg?v=1780116180', hex: '#3CA7CC', glitter: true, stock: 0 },
  { handle: 'leafstorm', title: 'Leafstorm', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04177-Photoroom.jpg?v=1780115263', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04178-Photoroom.jpg?v=1780115263', hex: '#4BC29D', glitter: true, stock: 0 },
  { handle: 'voltshift', title: 'Voltshift', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04172-Photoroom.jpg?v=1780113911', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04173-Photoroom.jpg?v=1780113911', hex: '#89B33A', glitter: true, stock: 0 },
  { handle: 'flameburst', title: 'Flameburst', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04155-Photoroom2.jpg?v=1779988285', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04156-Photoroom2.jpg?v=1779988286', hex: '#E35722', glitter: true, stock: 0 },
  { handle: 'arclight', title: 'Arclight', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04150-Photoroom.jpg?v=1779987901', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04151-Photoroom.jpg?v=1779987901', hex: '#7FA8D9', glitter: true, stock: 0 },
  { handle: 'halo', title: 'Halo', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04111-Photoroom_2.jpg?v=1779946458', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04112-Photoroom_2.jpg?v=1779946458', hex: '#AE6CA8', glitter: true, stock: 0 },
  { handle: 'shockwave', title: 'Shockwave', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04145-Photoroom.jpg?v=1779945444', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04146-Photoroom.jpg?v=1779945444', hex: '#BDA038', glitter: true, stock: 0 },
  { handle: 'firebreath', title: 'Firebreath', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04140-Photoroom_f119ab1a-52ed-4c3e-83f3-5e08759efd9e.jpg?v=1779944658', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04141-Photoroom_41ec0c8a-de46-4d37-a537-422eda9d8f5a.jpg?v=1779944657', hex: '#FF8A00', glitter: true, stock: 0 },
  { handle: 'rageclaw', title: 'Rageclaw', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04130-Photoroom_2.jpg?v=1779947127', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04131-Photoroom_2.jpg?v=1779947127', hex: '#FF9D00', glitter: true, stock: 0 },
  { handle: 'aquapulse', title: 'Aquapulse', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04090-Photoroom_3.jpg?v=1779946921', backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04091-Photoroom_3.jpg?v=1779946921', hex: '#9B4FBF', glitter: true, stock: 0 },
  { handle: 'aquashade', title: 'Aquashade', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/image_3c55937b-ae3f-4b9d-86a5-7869b3f240a5.png?v=1781086428', hex: '#8C8C8C', glitter: false, stock: 0, mystery: true },
];

export const ALL_GUARDS: Guard[] = [...TAG_GUARDS, ...PSA_GUARDS];

export const ACCESSORIES = [
  {
    handle: 'founders-challenge-coin',
    title: 'Founders Challenge Coin',
    price: 10.0,
    image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04254-Photoroom.jpg?v=1781081337',
    backImage: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04255-Photoroom.jpg?v=1781081337',
    stock: 0,
  },
];

// Every real (non-mystery) product photo across the whole catalog — TAG and
// PSA alike — shares this exact aspect ratio (confirmed directly against
// the live Shopify catalog: 1920x2400 for most, and even the few outliers
// with different pixel counts, e.g. Futuresite's 1707x2133, work out to the
// same ~0.8 ratio). ALWAYS use this ratio (not 1:1) for any container that
// crops/frames a guard photo, so no photo ever gets its top/bottom cut off.
export const PRODUCT_PHOTO_ASPECT = '4/5';

// ---- Color similarity (for "out of stock? try this instead") ----
function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function colorDistance(hexA: string, hexB: string) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  // weighted Euclidean distance (perceptual-ish weighting)
  const rMean = (a.r + b.r) / 2;
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db
  );
}

/**
 * Given an out-of-stock guard, find the closest in-stock guard of the SAME brand
 * (TAG -> TAG, PSA -> PSA only — never cross-recommend between brands).
 */
export function findClosestInStock(guard: Guard, catalog: Guard[] = ALL_GUARDS): Guard | null {
  const sameBrand = catalog.filter(
    (g) => g.brand === guard.brand && g.handle !== guard.handle && g.stock > 0 && !g.mystery
  );
  if (sameBrand.length === 0) return null;
  let closest = sameBrand[0];
  let closestDist = colorDistance(guard.hex, closest.hex);
  for (const g of sameBrand.slice(1)) {
    const d = colorDistance(guard.hex, g.hex);
    if (d < closestDist) {
      closestDist = d;
      closest = g;
    }
  }
  return closest;
}

export function getGuardsByBrand(brand: Brand): Guard[] {
  return (brand === 'TAG' ? TAG_GUARDS : PSA_GUARDS).filter((g) => !g.mystery);
}

/**
 * Smart bundle pairing: given a seed guard, suggest a visually complementary
 * (high-contrast, same-brand) second colorway plus the accessory — used by
 * the homepage "Suggested for you" cross-sell module. Contrast is the
 * opposite goal of findClosestInStock (which finds a *similar* substitute).
 */
export function findComplementary(guard: Guard, catalog: Guard[] = ALL_GUARDS): Guard | null {
  const sameBrand = catalog.filter((g) => g.brand === guard.brand && g.handle !== guard.handle && !g.mystery);
  if (sameBrand.length === 0) return null;
  let best = sameBrand[0];
  let bestDist = colorDistance(guard.hex, best.hex);
  for (const g of sameBrand.slice(1)) {
    const d = colorDistance(guard.hex, g.hex);
    if (d > bestDist) {
      bestDist = d;
      best = g;
    }
  }
  return best;
}
