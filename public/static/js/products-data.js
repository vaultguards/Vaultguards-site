/**
 * Vaultguards — Product Catalog (client-side)
 * Mirrors src/data/products.ts. This is the single source of truth used by
 * both the homepage bundle widget and The Vault page.
 *
 * NOTE FOR SHOPIFY HANDOFF: when pasted into Shopify, replace this static
 * array with a Liquid-rendered JSON blob (see /vault section comments) so
 * prices/stock/images always match the live Shopify catalog automatically.
 */
(function (global) {
  'use strict';

  // Measured via pixel-threshold analysis of real product photos (1920x2400).
  // See src/data/products.ts for full methodology notes.
  var GUARD_WINDOW = {
    TAG: { top: 13.7, left: 22.5, right: 22.1, bottom: 13.8 },
    PSA: { top: 13.2, left: 21.9, right: 21.8, bottom: 13.0 },
  };

  var SLAB_RATIO = {
    TAG: 3.125 / 5.25,
    PSA: 3.25 / 5.375,
  };

  var TAG_GUARDS = [
    { handle: 'aura', title: 'Aura', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04243-Photoroom.jpg?v=1781079082', hex: '#F4F6F8', glitter: false, stock: 0 },
    { handle: 'aquavolt', title: 'Aquavolt', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04234-Photoroom.jpg?v=1781079036', hex: '#3FBFA6', glitter: true, stock: 0 },
    { handle: 'psywave', title: 'Psywave', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04222-Photoroom.jpg?v=1781079116', hex: '#D36C9E', glitter: true, stock: 0 },
    { handle: 'shadowburn', title: 'Shadowburn', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04227-Photoroom.jpg?v=1781079150', hex: '#5A1F1F', glitter: true, stock: 0 },
    { handle: 'shadowphase', title: 'Shadowphase', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04239-Photoroom.jpg?v=1781079186', hex: '#C9C9CE', glitter: true, stock: 0 },
    { handle: 'smokescreen', title: 'Smokescreen', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04247-Photoroom.jpg?v=1781079227', hex: '#1F1F1F', glitter: true, stock: 0 },
    { handle: 'voidshift', title: 'Voidshift', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04218-Photoroom.jpg?v=1781079259', hex: '#4D2B66', glitter: true, stock: 0 },
    { handle: 'aquafrost', title: 'Aquafrost', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/image_205f5a25-a8f2-46ee-86ea-725c25c27708.png?v=1781086114', hex: '#8C8C8C', glitter: false, stock: 0, mystery: true },
    { handle: 'solarshade', title: 'Solarshade', brand: 'TAG', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/image_d8b83a88-f4c7-40bb-a895-941077cc1259.png?v=1781086045', hex: '#8C8C8C', glitter: false, stock: 0, mystery: true },
  ];

  var PSA_GUARDS = [
    { handle: 'litescreen', title: 'Litescreen', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04167-Photoroom.jpg?v=1780112367', hex: '#E0B23C', glitter: true, stock: 0 },
    { handle: 'astral', title: 'Astral', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04116-Photoroom_2.jpg?v=1779945779', hex: '#8A5FBF', glitter: true, stock: 0 },
    { handle: 'curse', title: 'Curse', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04122-Photoroom_2.jpg?v=1779946012', hex: '#3C1C52', glitter: true, stock: 0 },
    { handle: 'lunarblast', title: 'Lunarblast', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04135-Photoroom_2.jpg?v=1779946644', hex: '#B52F6B', glitter: true, stock: 0 },
    { handle: 'solarwind', title: 'Solarwind', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04160-Photoroom.jpg?v=1779993741', hex: '#E14E2C', glitter: true, stock: 0 },
    { handle: 'futuresite', title: 'Futuresite', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04207-Photoroom.jpg?v=1781078236', hex: '#1A1A1A', glitter: true, stock: 0 },
    { handle: 'nightfall', title: 'Nightfall', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04202-Photoroom.jpg?v=1780962288', hex: '#123C73', glitter: true, stock: 0 },
    { handle: 'waterfall', title: 'Waterfall', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04196-Photoroom.jpg?v=1780961671', hex: '#0050A1', glitter: true, stock: 0 },
    { handle: 'mist', title: 'Mist', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04191-Photoroom.jpg?v=1780961119', hex: '#00A2B9', glitter: true, stock: 0 },
    { handle: 'flashpoint', title: 'Flashpoint', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04186-Photoroom.jpg?v=1780700977', hex: '#3A3A3C', glitter: true, stock: 0 },
    { handle: 'frostbeam', title: 'Frostbeam', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04182-Photoroom.jpg?v=1780116180', hex: '#3CA7CC', glitter: true, stock: 0 },
    { handle: 'leafstorm', title: 'Leafstorm', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04177-Photoroom.jpg?v=1780115263', hex: '#4BC29D', glitter: true, stock: 0 },
    { handle: 'voltshift', title: 'Voltshift', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04172-Photoroom.jpg?v=1780113911', hex: '#89B33A', glitter: true, stock: 0 },
    { handle: 'flameburst', title: 'Flameburst', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04155-Photoroom2.jpg?v=1779988285', hex: '#E35722', glitter: true, stock: 0 },
    { handle: 'arclight', title: 'Arclight', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04150-Photoroom.jpg?v=1779987901', hex: '#7FA8D9', glitter: true, stock: 0 },
    { handle: 'halo', title: 'Halo', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04111-Photoroom_2.jpg?v=1779946458', hex: '#AE6CA8', glitter: true, stock: 0 },
    { handle: 'shockwave', title: 'Shockwave', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04145-Photoroom.jpg?v=1779945444', hex: '#BDA038', glitter: true, stock: 0 },
    { handle: 'firebreath', title: 'Firebreath', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04140-Photoroom_f119ab1a-52ed-4c3e-83f3-5e08759efd9e.jpg?v=1779944658', hex: '#FF8A00', glitter: true, stock: 0 },
    { handle: 'rageclaw', title: 'Rageclaw', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04130-Photoroom_2.jpg?v=1779947127', hex: '#FF9D00', glitter: true, stock: 0 },
    { handle: 'aquapulse', title: 'Aquapulse', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04090-Photoroom_3.jpg?v=1779946921', hex: '#9B4FBF', glitter: true, stock: 0 },
    { handle: 'aquashade', title: 'Aquashade', brand: 'PSA', price: 14.99, image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/image_3c55937b-ae3f-4b9d-86a5-7869b3f240a5.png?v=1781086428', hex: '#8C8C8C', glitter: false, stock: 0, mystery: true },
  ];

  var ALL_GUARDS = TAG_GUARDS.concat(PSA_GUARDS);

  var ACCESSORIES = [
    {
      handle: 'founders-challenge-coin',
      title: 'Founders Challenge Coin',
      price: 10.0,
      image: 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04254-Photoroom.jpg?v=1781081337',
      stock: 0,
    },
  ];

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  }

  function colorDistance(hexA, hexB) {
    var a = hexToRgb(hexA);
    var b = hexToRgb(hexB);
    var rMean = (a.r + b.r) / 2;
    var dr = a.r - b.r;
    var dg = a.g - b.g;
    var db = a.b - b.b;
    return Math.sqrt((2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db);
  }

  /** Find closest in-stock guard of the SAME brand only (TAG->TAG, PSA->PSA). */
  function findClosestInStock(guard, catalog) {
    catalog = catalog || ALL_GUARDS;
    var sameBrand = catalog.filter(function (g) {
      return g.brand === guard.brand && g.handle !== guard.handle && g.stock > 0 && !g.mystery;
    });
    if (sameBrand.length === 0) return null;
    var closest = sameBrand[0];
    var closestDist = colorDistance(guard.hex, closest.hex);
    for (var i = 1; i < sameBrand.length; i++) {
      var d = colorDistance(guard.hex, sameBrand[i].hex);
      if (d < closestDist) {
        closestDist = d;
        closest = sameBrand[i];
      }
    }
    return closest;
  }

  function getGuardsByBrand(brand) {
    return (brand === 'TAG' ? TAG_GUARDS : PSA_GUARDS).filter(function (g) {
      return !g.mystery;
    });
  }

  /** Smart bundle pairing: most-CONTRASTING same-brand colorway (cross-sell). */
  function findComplementary(guard, catalog) {
    catalog = catalog || ALL_GUARDS;
    var sameBrand = catalog.filter(function (g) {
      return g.brand === guard.brand && g.handle !== guard.handle && !g.mystery;
    });
    if (sameBrand.length === 0) return null;
    var best = sameBrand[0];
    var bestDist = colorDistance(guard.hex, best.hex);
    for (var i = 1; i < sameBrand.length; i++) {
      var d = colorDistance(guard.hex, sameBrand[i].hex);
      if (d > bestDist) {
        bestDist = d;
        best = sameBrand[i];
      }
    }
    return best;
  }

  global.VaultguardsCatalog = {
    GUARD_WINDOW: GUARD_WINDOW,
    SLAB_RATIO: SLAB_RATIO,
    TAG_GUARDS: TAG_GUARDS,
    PSA_GUARDS: PSA_GUARDS,
    ALL_GUARDS: ALL_GUARDS,
    ACCESSORIES: ACCESSORIES,
    findClosestInStock: findClosestInStock,
    findComplementary: findComplementary,
    getGuardsByBrand: getGuardsByBrand,
    colorDistance: colorDistance,
  };
})(window);
