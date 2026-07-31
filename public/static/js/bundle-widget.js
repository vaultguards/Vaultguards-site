/**
 * Suggested Item / Smart Bundle module.
 * Reads the real catalog from window.VaultguardsCatalog (generated at
 * request time from src/data/products.ts via CatalogScript.tsx — see that
 * file's header comment for why there's no separate hand-maintained data
 * file anymore).
 *
 * Context-aware: if this script tag has a `data-context="<handle>"`
 * attribute (set on Product Detail Pages to the guard the shopper is
 * currently viewing), the bundle is built AROUND that product — its
 * complementary colorway + the accessory. On the homepage, where there's
 * no single product being viewed, it falls back to a sensible in-stock
 * seed guard.
 */
(function () {
  'use strict';

  // Must capture this synchronously — document.currentScript is only valid
  // while this script is actually executing, not later inside a
  // DOMContentLoaded callback.
  var _scriptEl = document.currentScript;

  function fmt(n) { return '$' + n.toFixed(2); }

  function swatchCard(g, opts) {
    opts = opts || {};
    var stockPill = g.stock > 0
      ? '<span class="vg-pill vg-pill-in" style="font-size:10px;padding:3px 10px;">In stock</span>'
      : '<span class="vg-pill vg-pill-out" style="font-size:10px;padding:3px 10px;">Out of stock</span>';
    return (
      '<div class="vg-card" style="overflow:hidden;padding:0;flex:1;min-width:0;">' +
        '<div style="aspect-ratio:4/5;background:var(--vg-ivory-50);position:relative;">' +
          '<img src="' + g.image + '" alt="' + g.title + '" style="width:100%;height:100%;object-fit:cover;">' +
          (opts.badge ? '<span class="vg-pill vg-pill-gold" style="position:absolute;top:12px;left:12px;font-size:10px;">' + opts.badge + '</span>' : '') +
        '</div>' +
        '<div style="padding:16px 18px 20px;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
            '<span style="width:13px;height:13px;border-radius:50%;background:' + g.hex + ';box-shadow:var(--vg-shadow-xs);"></span>' +
            '<span style="font-weight:600;font-size:14.5px;">' + g.title + '</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;">' +
            '<span style="color:var(--vg-navy-400);font-size:13.5px;">' + fmt(g.price) + '</span>' + stockPill +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function render() {
    var root = document.getElementById('bundle-widget');
    if (!root || !window.VaultguardsCatalog) return;
    var Cat = window.VaultguardsCatalog;

    var scriptEl = _scriptEl || (function () {
      // Fallback in case currentScript wasn't available when this file
      // first ran (e.g. loaded via dynamic injection) — find our own
      // <script> tag by its src.
      var scripts = document.querySelectorAll('script[src*="bundle-widget.js"]');
      return scripts[scripts.length - 1];
    })();
    var contextHandle = scriptEl && scriptEl.getAttribute('data-context');
    var realGuards = Cat.ALL_GUARDS.filter(function (g) { return !g.mystery; });
    var contextGuard = contextHandle && realGuards.find(function (g) { return g.handle === contextHandle; });

    // No explicit context (e.g. on the homepage)? Fall back to the last
    // product the shopper actually viewed, so "suggested for you" reflects
    // real browsing behavior instead of a fixed hardcoded seed.
    if (!contextGuard) {
      try {
        var lastViewed = window.localStorage.getItem('vg_last_viewed');
        if (lastViewed) contextGuard = realGuards.find(function (g) { return g.handle === lastViewed; });
      } catch (e) { /* ignore */ }
    }

    var seed, seedBadge, heading;
    if (contextGuard) {
      // Build the bundle around the product the shopper is actually
      // viewing/just viewed, not a fixed hardcoded default.
      seed = contextGuard;
      seedBadge = scriptEl && scriptEl.getAttribute('data-context') ? 'You\u2019re viewing' : 'Based on your browsing';
      heading = seed.title + ' + ' + seed.brand + ' Pair + Founders Coin';
    } else {
      // True cold start (no context, nothing viewed yet): pick a sensible
      // in-stock guard as the seed.
      seed = realGuards.find(function (g) { return g.stock > 0; }) || realGuards[1];
      seedBadge = 'Suggested';
      heading = seed.brand + ' Duo + Founders Coin';
    }

    var pair = Cat.findComplementary(seed);
    var accessory = Cat.ACCESSORIES[0];
    var total = seed.price + (pair ? pair.price : 0) + (accessory ? accessory.price : 0);

    var html =
      '<div class="vg-card" style="padding:32px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:12px;">' +
          '<div>' +
            '<div class="vg-eyebrow">Smart Bundle</div>' +
            '<div style="font-size:19px;font-weight:600;margin-top:4px;">' + heading + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:18px;flex-wrap:wrap;">' +
          swatchCard(seed, { badge: seedBadge }) +
          (pair ? swatchCard(pair, { badge: 'Pairs well' }) : '') +
          (accessory ? swatchCard(Object.assign({}, accessory, { hex: '#B08D4F' }), { badge: 'Add-on' }) : '') +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:26px;flex-wrap:wrap;gap:16px;">' +
          '<div style="font-size:15px;color:var(--vg-navy-600);">Bundle total: <strong style="color:var(--vg-navy-900);">' + fmt(total) + '</strong></div>' +
          '<button class="vg-btn vg-btn-primary" data-vg-haptic="tap" id="bundle-add-btn">' +
            '<i class="fa-solid fa-bag-shopping"></i> Add Bundle' +
          '</button>' +
        '</div>' +
      '</div>';

    root.innerHTML = html;

    var btn = document.getElementById('bundle-add-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        if (window.VG && VG.haptic) VG.haptic.success();
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Added (demo)';
        btn.disabled = true;
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
