import { Hono } from 'hono'
import { renderer } from './renderer'
import { Nav } from './components/Nav'
import { Footer } from './components/Footer'
import { TAG_GUARDS, PSA_GUARDS } from './data/products'

const app = new Hono()

app.use(renderer)

const HERO_IMG = 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04243-Photoroom.jpg?v=1781079082'
const COMPARE_LEFT = 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04116-Photoroom_2.jpg?v=1779945779'
const COMPARE_RIGHT = 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04202-Photoroom.jpg?v=1780962288'

app.get('/', (c) => {
  const featuredTag = TAG_GUARDS.filter((g) => !g.mystery).slice(0, 4)
  const featuredPsa = PSA_GUARDS.filter((g) => !g.mystery).slice(0, 4)

  return c.render(
    <>
      <Nav active="home" />

      {/* ================= HERO ================= */}
      <section style="position:relative; padding:110px 0 90px; overflow:hidden;">
        <div class="vg-container vg-grid-2">
          <div class="vg-reveal vg-in">
            <div class="vg-eyebrow">Built for graded slabs</div>
            <h1 style="font-size:56px; line-height:1.05; margin:18px 0 22px;">
              A perfect fit,<br /><em style="color:var(--vg-gold-500); font-style:normal;">every angle.</em>
            </h1>
            <p style="font-size:18px; color:var(--vg-navy-400); max-width:440px; margin-bottom:34px;">
              Precision-molded colorway guards for TAG and PSA slabs — engineered edge protection
              that never covers the label you paid to see.
            </p>
            <div style="display:flex; gap:14px; flex-wrap:wrap;">
              <a href="#shop" class="vg-btn vg-btn-primary" data-vg-haptic="tap">Shop Guards <i class="fa-solid fa-arrow-right"></i></a>
              <a href="/vault" class="vg-btn vg-btn-ghost" data-vg-haptic="tap"><i class="fa-solid fa-vault"></i> Try It On in The Vault</a>
            </div>
            <div style="display:flex; gap:28px; margin-top:44px; flex-wrap:wrap;">
              <div><div style="font-family:var(--vg-font-display); font-size:26px;">29+</div><div style="font-size:12px; color:var(--vg-navy-400);">Colorways</div></div>
              <div><div style="font-family:var(--vg-font-display); font-size:26px;">2</div><div style="font-size:12px; color:var(--vg-navy-400);">Brand fits — TAG &amp; PSA</div></div>
              <div><div style="font-family:var(--vg-font-display); font-size:26px;">100%</div><div style="font-size:12px; color:var(--vg-navy-400);">Label visibility</div></div>
            </div>
          </div>
          <div class="vg-reveal" data-delay="1" data-vg-tilt>
            <div class="vg-card" style="padding:28px; border-radius:var(--vg-radius-xl);">
              <img src={HERO_IMG} alt="Vaultguards colorway guard" style="border-radius:26px;" />
            </div>
          </div>
        </div>
      </section>

      {/* ================= SCROLL-REVEAL FEATURES ================= */}
      <section class="vg-section" style="background:var(--vg-bg-alt);">
        <div class="vg-container">
          <div class="vg-reveal" style="text-align:center; max-width:640px; margin:0 auto 64px;">
            <div class="vg-eyebrow">Why collectors switch</div>
            <h2 style="font-size:38px; margin-top:14px;">Protection that respects the grade.</h2>
          </div>

          <div class="vg-grid-3">
            {[
              { icon: 'fa-solid fa-shield-halved', title: 'Edge-first armor', body: 'Guards wrap the slab\u2019s edges and corners only — the label, cert number, and card stay fully visible.' },
              { icon: 'fa-solid fa-palette', title: '29 real colorways', body: 'From Aura white to Curse purple-black — every finish is photographed on real slabs, not renders.' },
              { icon: 'fa-solid fa-vault', title: 'Try before you buy', body: 'Upload your own slab in The Vault and preview it inside any guard color before it ships.' },
            ].map((f, i) => (
              <div class="vg-reveal vg-card" data-delay={String(Math.min(i, 3))} style="padding:36px;">
                <div style="width:52px; height:52px; border-radius:16px; background:var(--vg-gold-050); display:flex; align-items:center; justify-content:center; color:var(--vg-gold-500); font-size:20px; margin-bottom:18px;">
                  <i class={f.icon}></i>
                </div>
                <h3 style="font-size:19px; margin-bottom:10px;">{f.title}</h3>
                <p style="color:var(--vg-navy-400); font-size:14.5px; margin:0;">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= IMAGE COMPARISON SLIDER ================= */}
      <section class="vg-section">
        <div class="vg-container vg-grid-2">
          <div class="vg-reveal" data-vg-tilt>
            <div id="compare-slider" class="vg-card" style="position:relative; overflow:hidden; border-radius:var(--vg-radius-xl); aspect-ratio:1/1; cursor:ew-resize; user-select:none;">
              <img src={COMPARE_RIGHT} alt="PSA guard" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />
              <div id="compare-left-wrap" style="position:absolute; inset:0; width:50%; overflow:hidden;">
                <img src={COMPARE_LEFT} alt="TAG guard" style="position:absolute; inset:0; width:200%; max-width:none; height:100%; object-fit:cover;" />
              </div>
              <div id="compare-handle" style="position:absolute; top:0; bottom:0; left:50%; width:3px; background:rgba(255,255,255,0.9); box-shadow:0 0 0 8px rgba(255,255,255,0.15);">
                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:44px; height:44px; border-radius:50%; background:#fff; box-shadow:var(--vg-shadow-lg); display:flex; align-items:center; justify-content:center; color:var(--vg-navy-900);">
                  <i class="fa-solid fa-arrows-left-right"></i>
                </div>
              </div>
              <div style="position:absolute; top:20px; left:20px;" class="vg-pill" >TAG fit</div>
              <div style="position:absolute; top:20px; right:20px;" class="vg-pill">PSA fit</div>
            </div>
          </div>
          <div class="vg-reveal" data-delay="1">
            <div class="vg-eyebrow">Two brands, two exact fits</div>
            <h2 style="font-size:34px; margin:14px 0 18px;">TAG and PSA slabs aren&rsquo;t the same shape.</h2>
            <p style="color:var(--vg-navy-400); font-size:16px; max-width:440px;">
              Drag the slider to compare. Every Vaultguards guard is molded to the exact slab
              dimensions of its brand — TAG at 3.125&Prime;&times;5.25&Prime;, PSA at 3.25&Prime;&times;5.375&Prime; —
              so there&rsquo;s never a wobble, gap, or overhang.
            </p>
          </div>
        </div>
      </section>

      {/* ================= SHOP GRID ================= */}
      <section id="shop" class="vg-section" style="background:var(--vg-bg-alt);">
        <div class="vg-container">
          <div class="vg-reveal" style="text-align:center; max-width:600px; margin:0 auto 50px;">
            <div class="vg-eyebrow">The Collection</div>
            <h2 style="font-size:38px; margin-top:14px;">Shop by brand fit.</h2>
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
            <h3 style="font-size:20px;">TAG Guards</h3>
            <span class="vg-pill vg-pill-gold">Fits 3.125&Prime; &times; 5.25&Prime; slabs</span>
          </div>
          <div class="vg-grid-4" style="margin-bottom:56px;">
            {featuredTag.map((g, i) => (
              <div class="vg-reveal vg-card" data-delay={String(i % 4)} style="overflow:hidden; padding:0;">
                <div style="aspect-ratio:1/1; background:var(--vg-ivory-50);">
                  <img src={g.image} alt={g.title} style="width:100%; height:100%; object-fit:cover;" />
                </div>
                <div style="padding:18px 20px 22px;">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                    <span style={`width:14px;height:14px;border-radius:50%;background:${g.hex};box-shadow:var(--vg-shadow-xs)`}></span>
                    <span style="font-weight:600; font-size:15px;">{g.title}</span>
                  </div>
                  <div style="display:flex; align-items:center; justify-content:space-between;">
                    <span style="color:var(--vg-navy-400); font-size:14px;">${g.price.toFixed(2)}</span>
                    <span class={g.stock > 0 ? 'vg-pill vg-pill-in' : 'vg-pill vg-pill-out'} style="font-size:10px; padding:3px 10px;">
                      {g.stock > 0 ? 'In stock' : 'Out of stock'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
            <h3 style="font-size:20px;">PSA Guards</h3>
            <span class="vg-pill vg-pill-gold">Fits 3.25&Prime; &times; 5.375&Prime; slabs</span>
          </div>
          <div class="vg-grid-4">
            {featuredPsa.map((g, i) => (
              <div class="vg-reveal vg-card" data-delay={String(i % 4)} style="overflow:hidden; padding:0;">
                <div style="aspect-ratio:1/1; background:var(--vg-ivory-50);">
                  <img src={g.image} alt={g.title} style="width:100%; height:100%; object-fit:cover;" />
                </div>
                <div style="padding:18px 20px 22px;">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                    <span style={`width:14px;height:14px;border-radius:50%;background:${g.hex};box-shadow:var(--vg-shadow-xs)`}></span>
                    <span style="font-weight:600; font-size:15px;">{g.title}</span>
                  </div>
                  <div style="display:flex; align-items:center; justify-content:space-between;">
                    <span style="color:var(--vg-navy-400); font-size:14px;">${g.price.toFixed(2)}</span>
                    <span class={g.stock > 0 ? 'vg-pill vg-pill-in' : 'vg-pill vg-pill-out'} style="font-size:10px; padding:3px 10px;">
                      {g.stock > 0 ? 'In stock' : 'Out of stock'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style="text-align:center; margin-top:48px;">
            <a href="/vault" class="vg-btn vg-btn-gold" data-vg-haptic="tap"><i class="fa-solid fa-vault"></i> Preview Your Slab in The Vault</a>
          </div>
        </div>
      </section>

      {/* ================= SUGGESTED / SMART BUNDLE ================= */}
      <section class="vg-section">
        <div class="vg-container" id="bundle-root">
          <div class="vg-reveal" style="text-align:center; max-width:600px; margin:0 auto 50px;">
            <div class="vg-eyebrow">Complete the set</div>
            <h2 style="font-size:38px; margin-top:14px;">Suggested for you.</h2>
            <p style="color:var(--vg-navy-400); margin-top:12px;">
              Pick a guard and we&rsquo;ll intelligently pair it with a complementary colorway and accessory.
            </p>
          </div>
          <div id="bundle-widget" class="vg-reveal"></div>
        </div>
      </section>

      {/* ================= FOUNDER STORY ================= */}
      <section id="story" class="vg-section" style="background:var(--vg-navy-900); color:var(--vg-ivory-100);">
        <div class="vg-container vg-grid-2">
          <div class="vg-reveal">
            <div style="width:100%; aspect-ratio:4/5; border-radius:var(--vg-radius-lg); overflow:hidden; box-shadow:var(--vg-shadow-lg);">
              <img src={HERO_IMG} alt="Founder" style="width:100%; height:100%; object-fit:cover; filter:grayscale(0.15);" />
            </div>
          </div>
          <div class="vg-reveal" data-delay="1">
            <div class="vg-eyebrow" style="color:var(--vg-gold-400);">Our Story</div>
            <h2 style="font-size:34px; margin:14px 0 20px; color:#fff;">Started with one bent corner.</h2>
            <p style="color:var(--vg-navy-300); font-size:16.5px; line-height:1.75; max-width:540px;">
              Vaultguards began the way most collector businesses do — with a slab that got chipped
              in transit. We built the first guard prototype to protect our own graded cards during
              shipping and shows, then kept refining the fit until it disappeared entirely against
              the slab. Every colorway since has been designed the same way: protect the corners,
              never touch the label, and make it look like it belongs in your collection, not on top
              of it.
            </p>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section id="reviews" class="vg-section" style="background:var(--vg-bg-alt);">
        <div class="vg-container">
          <div class="vg-reveal" style="text-align:center; max-width:600px; margin:0 auto 50px;">
            <div class="vg-eyebrow">Trusted by collectors</div>
            <h2 style="font-size:38px; margin-top:14px;">What the vault says.</h2>
          </div>
          <div class="vg-grid-3">
            {[
              { name: 'D. Alvarez', tag: 'PSA collector', quote: 'Fits my PSA slabs like it was molded for them — because it was. The label is still perfectly readable through the window.' },
              { name: 'M. Chen', tag: 'TAG collector', quote: 'Used The Vault to preview colors before buying. Picked Voidshift and it matched exactly what I saw on screen.' },
              { name: 'R. Osei', tag: 'Show dealer', quote: 'I run a booth every weekend — these corners take the hits so my slabs don\u2019t have to.' },
            ].map((t, i) => (
              <div class="vg-reveal vg-card" data-delay={String(i)} style="padding:32px;">
                <div style="color:var(--vg-gold-500); margin-bottom:14px; font-size:14px;">
                  <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                </div>
                <p style="font-size:15px; color:var(--vg-navy-700); line-height:1.65; margin-bottom:20px;">&ldquo;{t.quote}&rdquo;</p>
                <div style="font-weight:600; font-size:14px;">{t.name}</div>
                <div style="color:var(--vg-navy-400); font-size:12.5px;">{t.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section class="vg-section" style="text-align:center;">
        <div class="vg-container vg-reveal" style="max-width:640px;">
          <h2 style="font-size:36px; margin-bottom:16px;">See your slab in every color first.</h2>
          <p style="color:var(--vg-navy-400); margin-bottom:30px;">No commitment. Upload a photo, try every colorway, then decide.</p>
          <a href="/vault" class="vg-btn vg-btn-primary" data-vg-haptic="tap" style="padding:18px 40px; font-size:16px;">
            Enter The Vault <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </section>

      <Footer />

      <script src="/static/js/products-data.js"></script>
      <script src="/static/js/haptic-scroll.js"></script>
      <script src="/static/js/bundle-widget.js"></script>
      <script src="/static/js/compare-slider.js"></script>
      <script>{`VG.initHapticScroll();`}</script>
    </>
  )
})

import vault from './routes/vault'
app.route('/vault', vault)

export default app
