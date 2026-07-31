/**
 * Suggested Item / Smart Bundle module.
 * Picks a "hero" guard, cross-sells a complementary same-brand colorway,
 * plus the accessory — all built from the real catalog in products-data.js.
 */
(function () {
  'use strict';

  function fmt(n) { return '$' + n.toFixed(2); }

  function swatchCard(g, opts) {
    opts = opts || {};
    var stockPill = g.stock > 0
      ? '<span class="vg-pill vg-pill-in" style="font-size:10px;padding:3px 10px;">In stock</span>'
      : '<span class="vg-pill vg-pill-out" style="font-size:10px;padding:3px 10px;">Out of stock</span>';
    return (
      '<div class="vg-card" style="overflow:hidden;padding:0;flex:1;min-width:0;">' +
        '<div style="aspect-ratio:1/1;background:var(--vg-ivory-50);position:relative;">' +
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

    // Pick a seed: prefer an in-stock guard, else just take a nice popular one.
    var candidates = Cat.ALL_GUARDS.filter(function (g) { return !g.mystery; });
    var seed = candidates.find(function (g) { return g.stock > 0; }) || candidates[1]; // aquavolt as default hero
    var pair = Cat.findComplementary(seed);
    var accessory = Cat.ACCESSORIES[0];

    var total = seed.price + (pair ? pair.price : 0) + (accessory ? accessory.price : 0);
    var savings = (total * 0.1).toFixed(2);

    var html =
      '<div class="vg-card" style="padding:32px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:12px;">' +
          '<div>' +
            '<div class="vg-eyebrow">Smart Bundle</div>' +
            '<div style="font-size:19px;font-weight:600;margin-top:4px;">' + seed.brand + ' Duo + Founders Coin</div>' +
          '</div>' +
          '<span class="vg-pill vg-pill-gold">Save ~$' + savings + ' bundled</span>' +
        '</div>' +
        '<div style="display:flex;gap:18px;flex-wrap:wrap;">' +
          swatchCard(seed, { badge: 'Suggested' }) +
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
