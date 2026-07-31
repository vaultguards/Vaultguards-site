import { Hono } from 'hono'
import { renderer } from '../renderer'
import { Nav } from '../components/Nav'
import { Footer } from '../components/Footer'
import { ALL_GUARDS, ACCESSORIES, getGuardsByBrand, type Guard } from '../data/products'

const product = new Hono()

product.use(renderer)

product.get('/:handle', (c) => {
  const handle = c.req.param('handle')
  const guard: Guard | undefined = ALL_GUARDS.find((g) => g.handle === handle)
  const accessory = ACCESSORIES.find((a) => a.handle === handle)

  if (!guard && !accessory) {
    return c.render(
      <>
        <Nav />
        <section class="vg-section" style="text-align:center;">
          <div class="vg-container">
            <h1 style="font-size:30px; margin-bottom:14px;">Product not found</h1>
            <p style="color:var(--vg-navy-400); margin-bottom:26px;">
              That item doesn&rsquo;t exist in the catalog — it may have been renamed.
            </p>
            <a href="/#shop" class="vg-btn vg-btn-primary">Back to Shop</a>
          </div>
        </section>
        <Footer />
      </>
    )
  }

  // ---- Accessory PDP (simple, no colorways) ----
  if (accessory) {
    return c.render(
      <>
        <Nav />
        <section class="vg-section">
          <div class="vg-container vg-grid-2">
            <div class="vg-reveal vg-in">
              <div class="vg-card" style="padding:24px; overflow:hidden;">
                <div style="aspect-ratio:1/1; border-radius:var(--vg-radius-md); overflow:hidden; background:var(--vg-ivory-50);">
                  <img src={accessory.image} alt={accessory.title} style="width:100%; height:100%; object-fit:cover;" />
                </div>
              </div>
            </div>
            <div class="vg-reveal vg-in" data-delay="1">
              <a href="/#shop" style="color:var(--vg-navy-400); font-size:13px; text-decoration:none;">
                <i class="fa-solid fa-arrow-left"></i> Back to shop
              </a>
              <h1 style="font-size:32px; margin:16px 0 10px;">{accessory.title}</h1>
              <div style="font-size:20px; color:var(--vg-navy-600); margin-bottom:18px;">${accessory.price.toFixed(2)}</div>
              <span class={accessory.stock > 0 ? 'vg-pill vg-pill-in' : 'vg-pill vg-pill-out'} style="margin-bottom:26px; display:inline-block;">
                {accessory.stock > 0 ? 'In stock' : 'Out of stock'}
              </span>
              <div style="margin-top:20px;">
                <button
                  class="vg-btn vg-btn-primary"
                  id="add-to-cart-btn"
                  data-vg-haptic="tap"
                  style="width:100%; padding:16px;"
                  disabled={accessory.stock <= 0}
                >
                  <i class="fa-solid fa-bag-shopping"></i> Add to Cart
                </button>
                <div id="add-to-cart-note" style="font-size:12px; color:var(--vg-navy-400); text-align:center; margin-top:10px;">
                  {accessory.stock <= 0 ? 'This item is currently out of stock.' : ''}
                </div>
              </div>
            </div>
          </div>
        </section>
        <Footer />
        <script src="/static/js/haptic-scroll.js"></script>
        <script src="/static/js/product-page.js"></script>
        <script>{`VG.initHapticScroll();`}</script>
      </>
    )
  }

  // ---- Guard colorway PDP ----
  const g = guard as Guard
  const siblings = getGuardsByBrand(g.brand)

  return c.render(
    <>
      <Nav active="home" />

      <section class="vg-section">
        <div class="vg-container vg-grid-2">
          {/* Image */}
          <div class="vg-reveal vg-in">
            <div class="vg-card" style="padding:24px; overflow:hidden;">
              <div style="aspect-ratio:1/1; border-radius:var(--vg-radius-md); overflow:hidden; background:var(--vg-ivory-50);">
                <img src={g.image} alt={g.title} style="width:100%; height:100%; object-fit:cover;" id="pdp-image" />
              </div>
            </div>
          </div>

          {/* Details */}
          <div class="vg-reveal vg-in" data-delay="1">
            <a href="/#shop" style="color:var(--vg-navy-400); font-size:13px; text-decoration:none;">
              <i class="fa-solid fa-arrow-left"></i> Back to shop
            </a>
            <span class="vg-pill vg-pill-gold" style="margin-top:16px; display:inline-block;">{g.brand} Guard</span>
            <h1 style="font-size:32px; margin:12px 0 10px;" id="pdp-title">{g.title}</h1>
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:22px;">
              <span style="font-size:20px; color:var(--vg-navy-600);" id="pdp-price">${g.price.toFixed(2)}</span>
              <span class={g.stock > 0 ? 'vg-pill vg-pill-in' : 'vg-pill vg-pill-out'} id="pdp-stock">
                {g.stock > 0 ? 'In stock' : 'Out of stock'}
              </span>
            </div>

            <p style="color:var(--vg-navy-400); font-size:15px; line-height:1.7; max-width:440px; margin-bottom:26px;">
              Precision-molded {g.brand} guard in the <strong style="color:var(--vg-navy-700);">{g.title}</strong> colorway.
              Wraps the slab&rsquo;s edges and corners only — your label and cert number stay fully visible.
            </p>

            {/* Colorway swatches — same brand only */}
            <div style="margin-bottom:26px;">
              <div style="font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:var(--vg-navy-400); margin-bottom:10px;">
                Other {g.brand} colorways
              </div>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                {siblings.map((s) => (
                  <a
                    href={`/product/${s.handle}`}
                    title={s.title}
                    style={`width:34px; height:34px; border-radius:50%; background:${s.hex}; box-shadow:var(--vg-shadow-xs); display:block; ${
                      s.handle === g.handle ? 'outline:3px solid var(--vg-navy-900); outline-offset:2px;' : ''
                    }`}
                  ></a>
                ))}
              </div>
            </div>

            <button
              class="vg-btn vg-btn-primary"
              id="add-to-cart-btn"
              data-vg-haptic="tap"
              style="width:100%; padding:16px;"
              disabled={g.stock <= 0}
            >
              <i class="fa-solid fa-bag-shopping"></i> Add to Cart
            </button>
            <div id="add-to-cart-note" style="font-size:12px; color:var(--vg-navy-400); text-align:center; margin-top:10px;">
              {g.stock <= 0 ? 'Currently out of stock — try previewing it in The Vault while you wait.' : ''}
            </div>

            <a href="/vault" class="vg-btn vg-btn-ghost" data-vg-haptic="tap" style="width:100%; margin-top:12px; justify-content:center;">
              <i class="fa-solid fa-vault"></i> Preview This in The Vault
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <script src="/static/js/haptic-scroll.js"></script>
      <script src="/static/js/product-page.js"></script>
      <script>{`VG.initHapticScroll();`}</script>
    </>
  )
})

export default product
