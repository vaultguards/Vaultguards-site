/**
 * Product Detail Page — demo "Add to Cart" interaction.
 * SHOPIFY HANDOFF: replace this with a real form POST to /cart/add.js using
 * the product's actual Shopify variant ID.
 */
(function () {
  'use strict';

  // Remember the last guard colorway the shopper looked at so the homepage
  // Smart Bundle module can suggest things based on what they're actually
  // browsing/buying, even after they navigate away from this PDP.
  try {
    var pdpTitleEl = document.getElementById('pdp-title');
    var handle = window.location.pathname.split('/').filter(Boolean).pop();
    if (pdpTitleEl && handle) {
      window.localStorage.setItem('vg_last_viewed', handle);
    }
  } catch (e) { /* localStorage unavailable (privacy mode etc.) — ignore */ }

  var btn = document.getElementById('add-to-cart-btn');
  if (btn && !btn.disabled) {
    btn.addEventListener('click', function () {
      if (window.VG && VG.haptic && VG.haptic.success) VG.haptic.success();
      var note = document.getElementById('add-to-cart-note');
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Added to Cart';
      btn.disabled = true;
      if (note) note.textContent = 'Added! (demo — connects to Shopify cart on launch)';
    });
  }

  // ---- Front / Back photo toggle ----
  // Lets a shopper flip the main PDP photo to see the acrylic backing shot
  // (Shopify image position 2) without leaving the page.
  var fbButtons = document.querySelectorAll('[data-fb]');
  if (fbButtons.length) {
    var pdpImage = document.getElementById('pdp-image');
    fbButtons.forEach(function (b) {
      b.addEventListener('click', function () {
        var showBack = b.getAttribute('data-fb') === 'back';
        if (pdpImage) pdpImage.src = showBack ? b.getAttribute('data-back') : b.getAttribute('data-front');
        fbButtons.forEach(function (other) {
          other.classList.toggle('vg-fb-active', other === b);
        });
        if (window.VG && VG.haptic && VG.haptic.tap) VG.haptic.tap();
      });
    });
  }
})();
