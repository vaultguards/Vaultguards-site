import { Hono } from 'hono'
import { renderer } from '../renderer'
import { Nav } from '../components/Nav'
import { Footer } from '../components/Footer'

// The address every Contact form submission is sent to.
const CONTACT_TO_EMAIL = 'paul@vaultguards.co'
// Resend requires the "from" address to be on a domain you've verified with
// them. Until vaultguards.co (or a subdomain) is verified in the Resend
// dashboard, their shared onboarding@resend.dev sender works for testing —
// swap this for e.g. "Vaultguards <contact@vaultguards.co>" once verified.
const CONTACT_FROM_EMAIL = 'Vaultguards Contact Form <onboarding@resend.dev>'

type Bindings = {
  RESEND_API_KEY?: string
}

const contact = new Hono<{ Bindings: Bindings }>()

contact.use(renderer)

contact.get('/', (c) => {
  return c.render(
    <>
      <Nav active="contact" />
      <section class="vg-section" style="padding-top:56px;">
        <div class="vg-container" style="max-width:560px;">
          <div class="vg-eyebrow" style="text-align:center;">Get in touch</div>
          <h1 style="font-size:36px; margin:14px 0 12px; text-align:center;">Contact Us</h1>
          <p style="color:var(--vg-navy-400); text-align:center; margin-bottom:36px;">
            Question about an order, a colorway, or The Vault? Send us a message and we&rsquo;ll reply by email.
          </p>

          <form id="contact-form" class="vg-card" style="padding:32px; display:flex; flex-direction:column; gap:18px;">
            <div>
              <label for="contact-name" style="display:block; font-size:13px; font-weight:600; margin-bottom:7px; color:var(--vg-navy-700);">Name</label>
              <input
                type="text"
                id="contact-name"
                name="name"
                required
                placeholder="Your name"
                style="width:100%; padding:13px 16px; border-radius:12px; border:none; background:var(--vg-ivory-100); font-family:inherit; font-size:15px; color:var(--vg-text);"
              />
            </div>
            <div>
              <label for="contact-email" style="display:block; font-size:13px; font-weight:600; margin-bottom:7px; color:var(--vg-navy-700);">Email</label>
              <input
                type="email"
                id="contact-email"
                name="email"
                required
                placeholder="you@example.com"
                style="width:100%; padding:13px 16px; border-radius:12px; border:none; background:var(--vg-ivory-100); font-family:inherit; font-size:15px; color:var(--vg-text);"
              />
            </div>
            <div>
              <label for="contact-message" style="display:block; font-size:13px; font-weight:600; margin-bottom:7px; color:var(--vg-navy-700);">What do you need help with?</label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={6}
                placeholder="Tell us what's going on…"
                style="width:100%; padding:13px 16px; border-radius:12px; border:none; background:var(--vg-ivory-100); font-family:inherit; font-size:15px; color:var(--vg-text); resize:vertical;"
              ></textarea>
            </div>

            <button
              type="submit"
              class="vg-btn vg-btn-primary"
              id="contact-submit-btn"
              data-vg-haptic="tap"
              style="width:100%; padding:16px; margin-top:6px;"
            >
              <i class="fa-solid fa-paper-plane"></i> Send Message
            </button>
            <div id="contact-form-status" style="font-size:13px; text-align:center; min-height:18px;"></div>
          </form>
        </div>
      </section>
      <Footer />
      <script src="/static/js/haptic-scroll.js"></script>
      <script src="/static/js/contact-form.js"></script>
      <script>{`VG.initHapticScroll();`}</script>
    </>
  )
})

// POST /contact/send — receives the form payload and relays it to Resend's
// email API. Requires a RESEND_API_KEY secret to be set:
//   npx wrangler pages secret put RESEND_API_KEY
// (locally: add RESEND_API_KEY=re_xxx to .dev.vars, which is git-ignored)
contact.post('/send', async (c) => {
  let body: { name?: string; email?: string; message?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ ok: false, error: 'Invalid request body.' }, 400)
  }

  const name = (body.name || '').trim()
  const email = (body.email || '').trim()
  const message = (body.message || '').trim()

  if (!name || !email || !message) {
    return c.json({ ok: false, error: 'Name, email, and message are all required.' }, 400)
  }
  // Basic email sanity check — real validation happens on Resend's side too.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ ok: false, error: 'That email address doesn\u2019t look right.' }, 400)
  }

  const apiKey = c.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured.')
    return c.json(
      { ok: false, error: 'Contact form is not fully configured yet — please try again later.' },
      500
    )
  }

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: [CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `Vaultguards contact form — ${name}`,
        html: `
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        `,
      }),
    })

    if (!resendRes.ok) {
      const errText = await resendRes.text()
      console.error('Resend API error:', resendRes.status, errText)
      return c.json({ ok: false, error: 'Could not send your message right now. Please try again shortly.' }, 502)
    }

    return c.json({ ok: true })
  } catch (err) {
    console.error('Failed to reach Resend API:', err)
    return c.json({ ok: false, error: 'Could not send your message right now. Please try again shortly.' }, 502)
  }
})

export default contact
