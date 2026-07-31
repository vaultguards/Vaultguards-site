import { TAG_GUARDS, PSA_GUARDS, ALL_GUARDS, ACCESSORIES, GUARD_WINDOW, SLAB_RATIO } from '../data/products'

/**
 * Injects the full product catalog (from src/data/products.ts — the single
 * source of truth) into the page as `window.VaultguardsCatalog`, along with
 * the same helper functions previously hand-duplicated in
 * public/static/js/products-data.js.
 *
 * WHY THIS EXISTS: previously the catalog lived in TWO places — this
 * TypeScript file (used by server-rendered pages) and a hand-copied static
 * JS file (used by client-side scripts like The Vault + Smart Bundle).
 * Adding a new guard meant editing both and keeping them byte-for-byte in
 * sync, which is exactly the kind of manual, error-prone step Paul
 * shouldn't have to think about. Now the client-side data is generated FROM
 * this same products.ts at request time — add a guard once, and it shows up
 * everywhere (collection pages, homepage, PDP, AND The Vault/Smart Bundle)
 * automatically.
 *
 * NOTE FOR SHOPIFY HANDOFF: in Shopify this same idea maps to rendering the
 * catalog as a Liquid JSON blob (`{{ collections.all.products | json }}`-
 * style) directly into the theme, instead of maintaining a static array —
 * see the comment block in src/data/products.ts.
 */
export function CatalogScript() {
  const catalog = {
    GUARD_WINDOW,
    SLAB_RATIO,
    TAG_GUARDS,
    PSA_GUARDS,
    ALL_GUARDS,
    ACCESSORIES,
  }
  const json = JSON.stringify(catalog).replace(/</g, '\\u003c')

  const helperFns = `
(function (global) {
  'use strict';
  var DATA = ${json};

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) };
  }
  function colorDistance(hexA, hexB) {
    var a = hexToRgb(hexA), b = hexToRgb(hexB);
    var rMean = (a.r + b.r) / 2, dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
    return Math.sqrt((2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db);
  }
  function findClosestInStock(guard, catalog) {
    catalog = catalog || DATA.ALL_GUARDS;
    var sameBrand = catalog.filter(function (g) { return g.brand === guard.brand && g.handle !== guard.handle && g.stock > 0 && !g.mystery; });
    if (sameBrand.length === 0) return null;
    var closest = sameBrand[0], closestDist = colorDistance(guard.hex, closest.hex);
    for (var i = 1; i < sameBrand.length; i++) {
      var d = colorDistance(guard.hex, sameBrand[i].hex);
      if (d < closestDist) { closestDist = d; closest = sameBrand[i]; }
    }
    return closest;
  }
  function getGuardsByBrand(brand) {
    return (brand === 'TAG' ? DATA.TAG_GUARDS : DATA.PSA_GUARDS).filter(function (g) { return !g.mystery; });
  }
  function findComplementary(guard, catalog) {
    catalog = catalog || DATA.ALL_GUARDS;
    var sameBrand = catalog.filter(function (g) { return g.brand === guard.brand && g.handle !== guard.handle && !g.mystery; });
    if (sameBrand.length === 0) return null;
    var best = sameBrand[0], bestDist = colorDistance(guard.hex, best.hex);
    for (var i = 1; i < sameBrand.length; i++) {
      var d = colorDistance(guard.hex, sameBrand[i].hex);
      if (d > bestDist) { bestDist = d; best = sameBrand[i]; }
    }
    return best;
  }
  /** Suggest 1-2 OTHER products related to a given guard — used for
   * curated "other slab suggestions" (PDP) and contextual Smart Bundle.
   * Prefers: (1) a complementary same-brand colorway, (2) an accessory. */
  function suggestFor(guard, opts) {
    opts = opts || {};
    var out = [];
    var pair = findComplementary(guard);
    if (pair) out.push(pair);
    if (!opts.noAccessory && DATA.ACCESSORIES[0]) out.push(DATA.ACCESSORIES[0]);
    return out;
  }

  global.VaultguardsCatalog = {
    GUARD_WINDOW: DATA.GUARD_WINDOW,
    SLAB_RATIO: DATA.SLAB_RATIO,
    TAG_GUARDS: DATA.TAG_GUARDS,
    PSA_GUARDS: DATA.PSA_GUARDS,
    ALL_GUARDS: DATA.ALL_GUARDS,
    ACCESSORIES: DATA.ACCESSORIES,
    findClosestInStock: findClosestInStock,
    findComplementary: findComplementary,
    getGuardsByBrand: getGuardsByBrand,
    suggestFor: suggestFor,
    colorDistance: colorDistance,
  };
})(window);
`.trim()

  return <script dangerouslySetInnerHTML={{ __html: helperFns }}></script>
}
