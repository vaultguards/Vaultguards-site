/**
 * Simple drag-to-compare image slider (TAG fit vs PSA fit hero comparison).
 */
(function () {
  'use strict';

  function init() {
    var wrap = document.getElementById('compare-slider');
    var leftWrap = document.getElementById('compare-left-wrap');
    var handle = document.getElementById('compare-handle');
    if (!wrap || !leftWrap || !handle) return;

    var dragging = false;

    function setPct(pct) {
      pct = Math.max(0, Math.min(100, pct));
      leftWrap.style.width = pct + '%';
      handle.style.left = pct + '%';
    }

    function fromEvent(e) {
      var rect = wrap.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      return (x / rect.width) * 100;
    }

    wrap.addEventListener('pointerdown', function (e) {
      dragging = true;
      setPct(fromEvent(e));
      if (window.VG && VG.haptic) VG.haptic.tap();
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      setPct(fromEvent(e));
    });
    window.addEventListener('pointerup', function () {
      if (dragging && window.VG && VG.haptic) VG.haptic.snap();
      dragging = false;
    });

    // Gentle auto-demo sweep on first reveal
    var demoed = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !demoed) {
          demoed = true;
          var t0 = performance.now();
          function step(t) {
            var elapsed = t - t0;
            var pct = 50 + Math.sin(elapsed / 420) * 18 * Math.max(0, 1 - elapsed / 1400);
            setPct(pct);
            if (elapsed < 1400) requestAnimationFrame(step);
            else setPct(50);
          }
          requestAnimationFrame(step);
        }
      });
    }, { threshold: 0.4 });
    io.observe(wrap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
