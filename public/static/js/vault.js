/**
 * THE VAULT — Virtual Try-On
 * -------------------------------------------------------------------------
 * Flow: pick brand (TAG/PSA, mutually exclusive) -> upload slab photo ->
 * auto background removal (client-side, @imgly/background-removal) ->
 * pinch/drag alignment against a brand-accurate window guide -> live
 * composite preview against REAL guard product photos, cycling through
 * every colorway of the chosen brand (in-stock or not) -> Add to Cart
 * (blocked for out-of-stock colors; captures the composite as a line-item
 * file property in the real Shopify integration).
 *
 * NOTE FOR SHOPIFY HANDOFF: the "Add to Cart" handler below currently
 * demos the flow locally. In Shopify, POST the composed PNG blob to
 * `/cart/add.js` using a hidden file input bound to the variant's line
 * item properties (Shopify's native file-type line item property), e.g.
 * `properties[Your Preview]` -> uploaded file. See vault-shopify-notes.md.
 *
 * IMPORTANT: all UI wiring (brand select, upload, align, preview) below is
 * synchronous and runs immediately on script load. The background-removal
 * library is loaded LAZILY via dynamic import() only when the user actually
 * uploads a photo — this is intentional so a slow/blocked/failed CDN import
 * of that library can NEVER break the rest of the page's interactivity
 * (a previous version used a static top-level `import ... from` here; since
 * that module has no default export, the static import threw at parse time
 * and silently killed every click handler on the page, including brand
 * selection — this file must never repeat that pattern).
 */
(function () {
  'use strict';

  var _bgRemovalModulePromise = null;
  function loadBgRemoval() {
    if (!_bgRemovalModulePromise) {
      _bgRemovalModulePromise = import(
        'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/dist/index.mjs'
      );
    }
    return _bgRemovalModulePromise;
  }

  var Cat = window.VaultguardsCatalog;
  var haptic = (window.VG && window.VG.haptic) || {};

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  var state = {
    brand: null,           // 'TAG' | 'PSA'
    slabImage: null,       // HTMLImageElement of the background-removed slab (transparent PNG)
    slabNaturalAspect: 1,  // width/height of the removed-bg image
    align: { x: 0, y: 0, scale: 1 }, // x/y in guide-relative px offset, scale multiplier
    guards: [],            // catalog guards for chosen brand
    activeGuard: null,     // currently previewed guard object
  };

  // ---------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------
  var STEP_ORDER = ['brand', 'upload', 'align', 'preview'];

  function goToStep(name) {
    STEP_ORDER.forEach(function (s) {
      var panel = document.getElementById('panel-' + s);
      if (panel) panel.style.display = s === name ? '' : 'none';
    });
    document.querySelectorAll('.vault-step').forEach(function (el) {
      var idx = parseInt(el.getAttribute('data-step'), 10) - 1;
      el.classList.remove('vault-step-active', 'vault-step-done');
      var curIdx = STEP_ORDER.indexOf(name);
      if (idx < curIdx) el.classList.add('vault-step-done');
      else if (idx === curIdx) el.classList.add('vault-step-active');
    });
    if (haptic.snap) haptic.snap();
  }

  document.querySelectorAll('[data-vault-back]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = parseInt(btn.getAttribute('data-vault-back'), 10);
      goToStep(STEP_ORDER[target - 1]);
    });
  });

  // ---------------------------------------------------------------------
  // Step 1: brand select (mutually exclusive)
  // ---------------------------------------------------------------------
  document.querySelectorAll('.vault-brand-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.vault-brand-btn').forEach(function (b) {
        b.classList.remove('vault-brand-selected');
      });
      btn.classList.add('vault-brand-selected');
      state.brand = btn.getAttribute('data-brand');
      state.guards = Cat.getGuardsByBrand(state.brand);
      if (haptic.success) haptic.success();
      setTimeout(function () { goToStep('upload'); }, 220);
    });
  });

  // ---------------------------------------------------------------------
  // Step 2: upload + client-side background removal
  // ---------------------------------------------------------------------
  var dropzone = document.getElementById('upload-dropzone');
  var fileInput = document.getElementById('upload-input');
  var progressEl = document.getElementById('upload-progress');
  var progressLabel = document.getElementById('upload-progress-label');

  dropzone.addEventListener('click', function () { fileInput.click(); });
  ['dragover', 'dragleave', 'drop'].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) {
      e.preventDefault();
      dropzone.classList.toggle('vault-drag-over', evt === 'dragover');
    });
  });
  dropzone.addEventListener('drop', function (e) {
    var f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  });
  fileInput.addEventListener('change', function () {
    if (fileInput.files && fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  function useImageAsIs(objectUrl, note) {
    var img = new Image();
    img.onload = function () {
      state.slabImage = img;
      state.slabNaturalAspect = img.naturalWidth / img.naturalHeight;
      state.align = { x: 0, y: 0, scale: 1 };
      progressEl.style.display = 'none';
      dropzone.style.display = '';
      if (note) progressLabel.textContent = note;
      goToStep('align');
      initAlignStage();
    };
    img.onerror = function () {
      progressLabel.textContent = 'Could not load that photo — please try another.';
      progressEl.style.display = 'none';
      dropzone.style.display = '';
    };
    img.src = objectUrl;
  }

  function handleFile(file) {
    dropzone.style.display = 'none';
    progressEl.style.display = '';
    progressLabel.textContent = 'Removing background…';

    var objectUrl = URL.createObjectURL(file);

    loadBgRemoval()
      .then(function (mod) {
        var removeBackground = mod.removeBackground || mod.default;
        if (typeof removeBackground !== 'function') {
          throw new Error('removeBackground export not found on module');
        }
        return removeBackground(objectUrl, {
          progress: function (key, current, total) {
            if (total > 0) {
              var pct = Math.round((current / total) * 100);
              progressLabel.textContent = 'Preparing on-device model… ' + pct + '%';
            }
          },
        });
      })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        if (haptic.success) haptic.success();
        useImageAsIs(url);
      })
      .catch(function (err) {
        console.error('Background removal failed, falling back to original image', err);
        // Graceful fallback: use the original photo un-removed rather than blocking the flow.
        useImageAsIs(objectUrl, 'Background removal unavailable — using original photo.');
      });
  }

  // ---------------------------------------------------------------------
  // Step 3: pinch-to-zoom / drag alignment
  // ---------------------------------------------------------------------
  var alignCanvas = document.getElementById('align-canvas');
  var alignCtx = alignCanvas.getContext('2d');
  var alignGuideEl = document.getElementById('align-guide');
  var alignZoomSlider = document.getElementById('align-zoom');
  var alignStage = document.getElementById('align-stage');

  function guideRectForBrand() {
    // IMPORTANT: this guide box must be the EXACT same rectangle (as a % of
    // the frame) that drawGuardComposite() below cuts the customer's slab
    // into on the real guard photo. Previously this used a separately
    // measured SLAB_RATIO to size a centered box, which was close but not
    // identical to the true GUARD_WINDOW used at composite time — that tiny
    // mismatch is why the guard sometimes didn't fit the uploaded slab photo
    // perfectly. Deriving the guide directly from GUARD_WINDOW (the same
    // source of truth used when compositing) guarantees whatever the
    // customer lines up against the dashed guide here maps 1:1 onto the
    // guard window later, for every colorway of that brand.
    var win = Cat.GUARD_WINDOW[state.brand];
    var stageW = alignCanvas.width;
    var stageH = alignCanvas.height;
    var x = (win.left / 100) * stageW;
    var y = (win.top / 100) * stageH;
    var w = stageW - x - (win.right / 100) * stageW;
    var h = stageH - y - (win.bottom / 100) * stageH;
    return { x: x, y: y, w: w, h: h };
  }

  function positionGuideOverlay() {
    var rect = guideRectForBrand();
    var stageRect = alignStage.getBoundingClientRect();
    var scaleX = stageRect.width / alignCanvas.width;
    var scaleY = stageRect.height / alignCanvas.height;
    alignGuideEl.style.left = (rect.x * scaleX) + 'px';
    alignGuideEl.style.top = (rect.y * scaleY) + 'px';
    alignGuideEl.style.width = (rect.w * scaleX) + 'px';
    alignGuideEl.style.height = (rect.h * scaleY) + 'px';
  }

  function drawAlignStage() {
    alignCtx.clearRect(0, 0, alignCanvas.width, alignCanvas.height);
    alignCtx.fillStyle = '#EFEAE0';
    alignCtx.fillRect(0, 0, alignCanvas.width, alignCanvas.height);

    if (state.slabImage) {
      var cx = alignCanvas.width / 2 + state.align.x;
      var cy = alignCanvas.height / 2 + state.align.y;
      var baseH = alignCanvas.height * 0.5 * state.align.scale;
      var baseW = baseH * state.slabNaturalAspect;
      alignCtx.drawImage(state.slabImage, cx - baseW / 2, cy - baseH / 2, baseW, baseH);
    }
  }

  var dragging = false;
  var lastPointer = null;
  var pinchStartDist = null;
  var pinchStartScale = 1;
  var activePointers = new Map();

  function distBetween(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  function initAlignStage() {
    positionGuideOverlay();
    drawAlignStage();
  }

  alignStage.addEventListener('pointerdown', function (e) {
    alignStage.setPointerCapture(e.pointerId);
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.size === 1) {
      dragging = true;
      lastPointer = { x: e.clientX, y: e.clientY };
    } else if (activePointers.size === 2) {
      dragging = false;
      var pts = Array.from(activePointers.values());
      pinchStartDist = distBetween(pts[0], pts[1]);
      pinchStartScale = state.align.scale;
    }
  });

  alignStage.addEventListener('pointermove', function (e) {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 2) {
      var pts = Array.from(activePointers.values());
      var d = distBetween(pts[0], pts[1]);
      if (pinchStartDist) {
        var next = pinchStartScale * (d / pinchStartDist);
        state.align.scale = Math.max(0.5, Math.min(3, next));
        alignZoomSlider.value = Math.round(state.align.scale * 100);
        drawAlignStage();
      }
      return;
    }

    if (dragging && lastPointer) {
      var stageRect = alignStage.getBoundingClientRect();
      var scaleX = alignCanvas.width / stageRect.width;
      var scaleY = alignCanvas.height / stageRect.height;
      var dx = (e.clientX - lastPointer.x) * scaleX;
      var dy = (e.clientY - lastPointer.y) * scaleY;
      state.align.x += dx;
      state.align.y += dy;
      lastPointer = { x: e.clientX, y: e.clientY };
      drawAlignStage();
    }
  });

  function endPointer(e) {
    activePointers.delete(e.pointerId);
    if (activePointers.size < 2) pinchStartDist = null;
    if (activePointers.size === 0) dragging = false;
  }
  alignStage.addEventListener('pointerup', endPointer);
  alignStage.addEventListener('pointercancel', endPointer);
  alignStage.addEventListener('pointerleave', function (e) {
    if (activePointers.size <= 1) dragging = false;
  });

  // Desktop wheel = zoom
  alignStage.addEventListener('wheel', function (e) {
    e.preventDefault();
    var delta = e.deltaY > 0 ? -0.05 : 0.05;
    state.align.scale = Math.max(0.5, Math.min(3, state.align.scale + delta));
    alignZoomSlider.value = Math.round(state.align.scale * 100);
    drawAlignStage();
  }, { passive: false });

  alignZoomSlider.addEventListener('input', function () {
    state.align.scale = parseInt(alignZoomSlider.value, 10) / 100;
    drawAlignStage();
  });

  window.addEventListener('resize', function () {
    if (document.getElementById('panel-align').style.display !== 'none') {
      positionGuideOverlay();
    }
  });

  document.getElementById('align-confirm-btn').addEventListener('click', function () {
    goToStep('preview');
    initPreviewPanel();
  });

  // ---------------------------------------------------------------------
  // Step 4: colorway compositing + preview + add to cart
  // ---------------------------------------------------------------------
  var previewCanvas = document.getElementById('preview-canvas');
  var previewCtx = previewCanvas.getContext('2d');
  var guardImageCache = {};

  function loadGuardImage(guard) {
    if (guardImageCache[guard.handle]) return Promise.resolve(guardImageCache[guard.handle]);
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        guardImageCache[guard.handle] = img;
        resolve(img);
      };
      img.onerror = reject;
      img.src = guard.image;
    });
  }

  /**
   * Composite the customer's slab into the guard's window region, on any
   * target canvas context (used for both the big preview canvas AND the
   * small swatch-grid thumbnails — the math is purely percentage-based so
   * it scales cleanly to any W/H).
   *
   * Real guard product photos are opaque (single flat shot with a demo card
   * already inside), not pre-cut transparent frame assets. To make the
   * customer's slab appear "inside" the frame we:
   *   1. Draw the customer's background-removed slab first, scaled/positioned
   *      per the alignment step, clipped to the brand's window rectangle
   *      (GUARD_WINDOW %) so it sits exactly where the real card would.
   *   2. Draw the guard product photo on TOP, but only its outer frame ring —
   *      the pixels outside the window rectangle — using a canvas
   *      "destination-out"-based ring mask so the center is transparent and
   *      the customer's slab shows through, while the colored frame plastic,
   *      shadow, and background from the real photo remain fully intact.
   */
  function drawGuardComposite(ctx, W, H, guard, guardImg) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    var win = Cat.GUARD_WINDOW[guard.brand];
    var winX = (win.left / 100) * W;
    var winY = (win.top / 100) * H;
    var winW = W - winX - (win.right / 100) * W;
    var winH = H - winY - (win.bottom / 100) * H;
    var r = Math.max(2, Math.round(W * 0.0125));

    // 1) customer slab, clipped to window (only if the customer has uploaded one)
    if (state.slabImage) {
      ctx.save();
      ctx.beginPath();
      roundRectPath(ctx, winX, winY, winW, winH, r);
      ctx.clip();

      // Map align-stage coordinates proportionally into the window rect.
      var guide = guideRectForBrand();
      var relX = (alignCanvas.width / 2 + state.align.x - guide.x) / guide.w;
      var relY = (alignCanvas.height / 2 + state.align.y - guide.y) / guide.h;
      var baseHRatio = (alignCanvas.height * 0.5 * state.align.scale) / guide.h;
      var slabH = winH * baseHRatio;
      var slabW = slabH * state.slabNaturalAspect;
      var slabCx = winX + relX * winW;
      var slabCy = winY + relY * winH;

      ctx.drawImage(state.slabImage, slabCx - slabW / 2, slabCy - slabH / 2, slabW, slabH);
      ctx.restore();
    }

    // 2) guard frame photo, masked to hide its center window so step-1 shows through
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    roundRectPath(ctx, winX, winY, winW, winH, r);
    ctx.clip('evenodd');
    ctx.drawImage(guardImg, 0, 0, W, H);
    ctx.restore();
  }

  function compositeGuard(guard) {
    var W = previewCanvas.width, H = previewCanvas.height;
    return loadGuardImage(guard).then(function (guardImg) {
      drawGuardComposite(previewCtx, W, H, guard, guardImg);
      return true;
    });
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Small swatch-card thumbnails: each shows the guard's own name + real
  // product photo. If the customer has already uploaded/aligned a slab, we
  // additionally composite THEIR slab into that thumbnail (same math as the
  // big preview canvas, just scaled down) so every option previews their
  // actual card, not just a flat color chip.
  var SWATCH_THUMB_W = 160, SWATCH_THUMB_H = 200;

  function renderSwatchThumb(canvas, guard) {
    var ctx = canvas.getContext('2d');
    loadGuardImage(guard).then(function (guardImg) {
      drawGuardComposite(ctx, SWATCH_THUMB_W, SWATCH_THUMB_H, guard, guardImg);
    }).catch(function () {
      // If the real photo fails to load for some reason, fall back to a flat
      // color chip so the swatch is never left blank.
      ctx.fillStyle = guard.hex;
      ctx.fillRect(0, 0, SWATCH_THUMB_W, SWATCH_THUMB_H);
    });
  }

  function renderSwatchGrid() {
    var grid = document.getElementById('swatch-grid');
    grid.innerHTML = '';
    state.guards.forEach(function (g) {
      var btn = document.createElement('button');
      btn.className = 'vault-swatch';
      btn.title = g.title + (g.stock > 0 ? '' : ' (out of stock — preview only)');
      btn.setAttribute('data-vg-haptic', 'tap');

      var thumbWrap = document.createElement('div');
      thumbWrap.className = 'vault-swatch-thumb';
      var canvas = document.createElement('canvas');
      canvas.width = SWATCH_THUMB_W;
      canvas.height = SWATCH_THUMB_H;
      thumbWrap.appendChild(canvas);
      if (g.stock <= 0) {
        var dot = document.createElement('span');
        dot.className = 'vault-swatch-oos-dot';
        dot.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        thumbWrap.appendChild(dot);
      }
      btn.appendChild(thumbWrap);

      var label = document.createElement('div');
      label.className = 'vault-swatch-label';
      label.textContent = g.title;
      btn.appendChild(label);

      renderSwatchThumb(canvas, g);

      btn.addEventListener('click', function () { selectGuard(g); });
      grid.appendChild(btn);
    });
  }

  function updateSwatchActiveState() {
    var grid = document.getElementById('swatch-grid');
    Array.from(grid.children).forEach(function (btn, i) {
      btn.classList.toggle('vault-swatch-active', state.guards[i] === state.activeGuard);
    });
  }

  function selectGuard(guard) {
    state.activeGuard = guard;
    updateSwatchActiveState();

    // NOTE: the preview image card is CSS `position: sticky` (see
    // #preview-image-card in theme.css), so it stays in view on its own
    // while the customer scrolls the swatch list — no JS-triggered
    // window.scrollTo() here anymore. A previous version smooth-scrolled
    // the page on every tap, which felt like the screen was refreshing.

    document.getElementById('preview-color-title').textContent = guard.title;
    document.getElementById('preview-color-price').textContent = '$' + guard.price.toFixed(2);

    var stockPill = document.getElementById('preview-color-stock');
    if (guard.stock > 0) {
      stockPill.textContent = 'In stock';
      stockPill.className = 'vg-pill vg-pill-in';
    } else {
      stockPill.textContent = 'Out of stock';
      stockPill.className = 'vg-pill vg-pill-out';
    }

    var addBtn = document.getElementById('add-to-cart-btn');
    var note = document.getElementById('add-to-cart-note');
    addBtn.disabled = guard.stock <= 0;
    note.textContent = guard.stock <= 0
      ? 'Preview available for out-of-stock colors — add to cart unlocks once restocked.'
      : 'Your approved preview image will be attached to this order.';

    renderSuggestionBanner(guard);
    compositeGuard(guard);

    if (haptic.tap) haptic.tap();
  }

  function renderSuggestionBanner(guard) {
    var banner = document.getElementById('suggestion-banner');
    if (guard.stock > 0) {
      banner.style.display = 'none';
      banner.innerHTML = '';
      return;
    }
    var alt = Cat.findClosestInStock(guard);
    if (!alt) {
      banner.style.display = 'flex';
      banner.innerHTML =
        '<i class="fa-solid fa-circle-info" style="color:var(--vg-navy-400);"></i>' +
        '<span>All ' + guard.brand + ' colorways are currently out of stock — check back soon for restock.</span>';
      if (haptic.warn) haptic.warn();
      return;
    }
    banner.style.display = 'flex';
    banner.innerHTML =
      '<span style="width:16px;height:16px;border-radius:50%;background:' + alt.hex + ';flex-shrink:0;"></span>' +
      '<span>Out of stock? Try <strong>' + alt.title + '</strong> instead — closest available ' + guard.brand + ' colorway.</span>' +
      '<button id="suggestion-swap-btn">Preview it</button>';
    var swapBtn = document.getElementById('suggestion-swap-btn');
    if (swapBtn) swapBtn.addEventListener('click', function () { selectGuard(alt); });
    if (haptic.warn) haptic.warn();
  }

  function initPreviewPanel() {
    document.getElementById('preview-brand-pill').textContent = state.brand + ' Guards';
    renderSwatchGrid();
    // Prefer an in-stock guard as the initial preview if one exists; else first guard.
    var initial = state.guards.find(function (g) { return g.stock > 0; }) || state.guards[0];
    selectGuard(initial);
  }

  // ---------------------------------------------------------------------
  // Add to cart (demo capture; see Shopify handoff note at top of file)
  // ---------------------------------------------------------------------
  document.getElementById('add-to-cart-btn').addEventListener('click', function () {
    if (!state.activeGuard || state.activeGuard.stock <= 0) return;
    previewCanvas.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      if (haptic.success) haptic.success();
      var note = document.getElementById('add-to-cart-note');
      note.innerHTML = 'Added! Your preview was captured and will be attached to the order. ' +
        '<a href="' + url + '" download="vaultguards-preview.png" style="color:var(--vg-gold-500); text-decoration:underline;">Download preview</a>';
    }, 'image/png');
  });
})();
