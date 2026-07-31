import { Hono } from 'hono'
import { renderer } from './renderer'
import { Nav } from './components/Nav'
import { Footer } from './components/Footer'
import { TAG_GUARDS, PSA_GUARDS } from './data/products'
import { ProductCard } from './components/ProductCard'

const app = new Hono()

app.use(renderer)

const HERO_IMG = 'https://cdn.shopify.com/s/files/1/1003/1035/2165/files/DSC04243-Photoroom.jpg?v=1781079082'

// "Watch Once You Buy" unboxing video — swap this ID for the real how-to-open video.
const HOW_TO_OPEN_YOUTUBE_ID = 'dQw4w9WgXcQ'

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

      {/* ================= SHOP GRID (moved up, near top) ================= */}
      <section id="shop" class="vg-section" style="background:var(--vg-bg-alt); padding-top:56px;">
        <div class="vg-container">
          <div class="vg-reveal" style="text-align:center; max-width:600px; margin:0 auto 50px;">
            <div class="vg-eyebrow">The Collection</div>
            <h2 style="font-size:38px; margin-top:14px;">Shop by brand fit.</h2>
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
            <h3 style="font-size:20px;">TAG Guards</h3>
            <a href="/collection/tag" class="vg-pill vg-pill-gold" style="text-decoration:none;">Shop TAG Collection <i class="fa-solid fa-arrow-right" style="font-size:10px; margin-left:2px;"></i></a>
          </div>
          <div class="vg-grid-4" style="margin-bottom:56px;" id="shop-tag">
            {featuredTag.map((g, i) => (
              <ProductCard g={g} delay={i % 4} />
            ))}
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
            <h3 style="font-size:20px;">PSA Guards</h3>
            <a href="/collection/psa" class="vg-pill vg-pill-gold" style="text-decoration:none;">Shop PSA Collection <i class="fa-solid fa-arrow-right" style="font-size:10px; margin-left:2px;"></i></a>
          </div>
          <div class="vg-grid-4" id="shop-psa">
            {featuredPsa.map((g, i) => (
              <ProductCard g={g} delay={i % 4} />
            ))}
          </div>

          <div style="text-align:center; margin-top:48px;">
            <a href="/vault" class="vg-btn vg-btn-gold" data-vg-haptic="tap"><i class="fa-solid fa-vault"></i> Preview Your Slab in The Vault</a>
          </div>
        </div>
      </section>

      {/* ================= SCROLL-REVEAL FEATURES ================= */}
      <section class="vg-section">
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

      {/* ================= SUGGESTED / SMART BUNDLE ================= */}
      <section class="vg-section" style="background:var(--vg-bg-alt);">
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

      {/* ================= WATCH ONCE YOU BUY ================= */}
      <section id="watch" class="vg-section" style="background:var(--vg-navy-900);">
        <div class="vg-container">
          <div class="vg-reveal" style="text-align:center; max-width:600px; margin:0 auto 40px;">
            <div class="vg-eyebrow" style="color:var(--vg-gold-400);">How it opens</div>
            <h2 style="font-size:36px; margin-top:14px; color:#fff;">Watch once you buy.</h2>
            <p style="color:var(--vg-navy-300); margin-top:12px; font-size:15.5px;">
              A quick look at Vaultguards&rsquo; unique pull-tab unboxing — two pulls, press the
              perforated edge, and your guard is ready.
            </p>
          </div>
          <div class="vg-reveal" style="max-width:900px; margin:0 auto;">
            <div class="vg-video-frame">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${HOW_TO_OPEN_YOUTUBE_ID}`}
                title="How to open your Vaultguards guard"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
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
      <script>{`VG.initHapticScroll();`}</script>
    </>
  )
})

import vault from './routes/vault'
import product from './routes/product'
import collection from './routes/collection'
app.route('/vault', vault)
app.route('/product', product)
app.route('/collection', collection)

export default app
