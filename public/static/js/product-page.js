/**
 * Product Detail Page — demo "Add to Cart" interaction.
 * SHOPIFY HANDOFF: replace this with a real form POST to /cart/add.js using
 * the product's actual Shopify variant ID.
 */
(function () {
  'use strict';

  var btn = document.getElementById('add-to-cart-btn');
  if (!btn || btn.disabled) return;

  btn.addEventListener('click', function () {
    if (window.VG && VG.haptic && VG.haptic.success) VG.haptic.success();
    var note = document.getElementById('add-to-cart-note');
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Added to Cart';
    btn.disabled = true;
    if (note) note.textContent = 'Added! (demo — connects to Shopify cart on launch)';
  });
})();
