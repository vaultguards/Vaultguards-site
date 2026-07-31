/**
 * Vaultguards — Haptic-style scroll feedback
 * -------------------------------------------------------------------------
 * Browsers cannot trigger real hardware haptics from scroll input. This
 * module simulates the *feel* of haptic feedback with two layers:
 *
 *   1. Mobile (supported browsers only): navigator.vibrate() short pulses
 *      fired at meaningful scroll "events" (section entering view, snap
 *      point reached, out-of-stock swatch tapped, etc). Silently no-ops
 *      where Vibration API is unsupported (iOS Safari, desktop).
 *
 *   2. All devices: complementary micro-animations — scroll-reveal
 *      "settle" easing, a subtle scale/tilt pulse on cards as they cross
 *      the viewport center, and momentum-based snap easing — so the
 *      experience still *feels* tactile even without real vibration.
 *
 * Usage: include this file, then call VG.initHapticScroll() once DOM is
 * ready. It self-registers IntersectionObservers for [data-vg-reveal] and
 * [data-vg-haptic] elements.
 */
(function (global) {
  'use strict';

  var supportsVibration = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

  function pulse(pattern) {
    if (!supportsVibration) return;
    try { navigator.vibrate(pattern); } catch (e) { /* no-op */ }
  }

  var VG = global.VG || {};

  VG.haptic = {
    tick: function () { pulse(8); },
    tap: function () { pulse(12); },
    success: function () { pulse([10, 40, 16]); },
    warn: function () { pulse([14, 30, 14, 30, 14]); },
    snap: function () { pulse(6); },
  };

  function initRevealObserver() {
    var els = document.querySelectorAll('.vg-reveal');
    if (!els.length) return;

    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !seen.has(entry.target)) {
          seen.add(entry.target);
          entry.target.classList.add('vg-in');
          VG.haptic.tick();
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  function initSnapHaptics() {
    var sections = document.querySelectorAll('[data-vg-snap-fire]');
    if (!sections.length) return;

    var fired = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6 && !fired.has(entry.target)) {
          fired.add(entry.target);
          VG.haptic.snap();
          entry.target.classList.add('vg-snap-settled');
        } else if (!entry.isIntersecting) {
          fired.delete(entry.target);
          entry.target.classList.remove('vg-snap-settled');
        }
      });
    }, { threshold: [0, 0.6, 1] });

    sections.forEach(function (el) { io.observe(el); });
  }

  /** Desktop momentum-feel: subtle parallax/tilt driven by scroll velocity. */
  function initMomentumTilt() {
    var els = document.querySelectorAll('[data-vg-tilt]');
    if (!els.length) return;
    var lastY = window.scrollY;
    var velocity = 0;
    var ticking = false;

    function onScroll() {
      var y = window.scrollY;
      velocity = y - lastY;
      lastY = y;
      if (!ticking) {
        window.requestAnimationFrame(function () {
          var clamped = Math.max(-14, Math.min(14, velocity * 0.6));
          els.forEach(function (el) {
            var rect = el.getBoundingClientRect();
            var inView = rect.top < window.innerHeight && rect.bottom > 0;
            if (inView) {
              el.style.transform = 'translateY(' + (-clamped * 0.4) + 'px) rotate(' + (clamped * 0.05) + 'deg)';
            }
          });
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /** Tap/click haptic wiring for interactive elements. */
  function initTapHaptics() {
    document.addEventListener('click', function (e) {
      var target = e.target.closest('[data-vg-haptic]');
      if (!target) return;
      var kind = target.getAttribute('data-vg-haptic') || 'tap';
      if (VG.haptic[kind]) VG.haptic[kind]();
    });
  }

  VG.initHapticScroll = function () {
    initRevealObserver();
    initSnapHaptics();
    initMomentumTilt();
    initTapHaptics();
  };

  global.VG = VG;
})(window);
