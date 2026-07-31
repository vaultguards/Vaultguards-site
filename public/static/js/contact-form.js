/**
 * Contact Us form — posts to /contact/send (Hono API route), which relays
 * the message to paul@vaultguards.co via the Resend email API.
 */
(function () {
  'use strict';

  var form = document.getElementById('contact-form');
  if (!form) return;

  var statusEl = document.getElementById('contact-form-status');
  var submitBtn = document.getElementById('contact-submit-btn');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = document.getElementById('contact-name').value.trim();
    var email = document.getElementById('contact-email').value.trim();
    var message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !message) {
      statusEl.textContent = 'Please fill in every field.';
      statusEl.style.color = 'var(--vg-danger)';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
    statusEl.textContent = '';

    fetch('/contact/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, message: message }),
    })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (result) {
        if (result.ok && result.data && result.data.ok) {
          if (window.VG && VG.haptic && VG.haptic.success) VG.haptic.success();
          form.reset();
          submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Sent!';
          statusEl.textContent = 'Thanks — we\u2019ll get back to you by email shortly.';
          statusEl.style.color = 'var(--vg-success)';
          setTimeout(function () {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
          }, 2400);
        } else {
          throw new Error((result.data && result.data.error) || 'Something went wrong.');
        }
      })
      .catch(function (err) {
        if (window.VG && VG.haptic && VG.haptic.warn) VG.haptic.warn();
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
        statusEl.textContent = err.message || 'Could not send your message — please try again.';
        statusEl.style.color = 'var(--vg-danger)';
      });
  });
})();
