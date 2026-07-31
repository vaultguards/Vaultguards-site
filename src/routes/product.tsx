import { Hono } from 'hono'
import { renderer } from '../renderer'
import { Nav } from '../components/Nav'
import { Footer } from '../components/Footer'
import { CatalogScript } from '../components/CatalogScript'
import { ALL_GUARDS, ACCESSORIES, getGuardsByBrand, findComplementary, PRODUCT_PHOTO_ASPECT, type Guard } from '../data/products'

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
                <div style={`aspect-ratio:${PRODUCT_PHOTO_ASPECT}; border-radius:var(--vg-radius-md); overflow:hidden; background:var(--vg-ivory-50);`}>
                  <img src={accessory.image} alt={accessory.title} style="width:100%; height:100%; object-fit:cover;" id="pdp-image" />
                </div>
                {accessory.backImage && (
                  <div class="vg-front-back-toggle" style="margin-top:14px;">
                    <button class="vg-fb-btn vg-fb-active" data-fb="front" data-front={accessory.image} data-back={accessory.backImage}>Front</button>
                    <button class="vg-fb-btn" data-fb="back" data-front={accessory.image} data-back={accessory.backImage}>Back</button>
                  </div>
                )}
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
  // Curated "other slab suggestions" instead of a full circle-row of every
  // sibling colorway — one complementary same-brand guard + the accessory,
  // shown as small photo cards, so a color option isn't an overwhelming
  // wall of tiny swatches.
  const complement = findComplementary(g)
  const suggestions = [complement, ACCESSORIES[0]].filter(Boolean) as Array<
    (Guard | (typeof ACCESSORIES)[number])
  >

  return c.render(
    <>
      <Nav active="home" />

      <section class="vg-section">
        <div class="vg-container vg-grid-2">
          {/* Image */}
          <div class="vg-reveal vg-in">
            <div class="vg-card" style="padding:24px; overflow:hidden;">
              <div style={`aspect-ratio:${PRODUCT_PHOTO_ASPECT}; border-radius:var(--vg-radius-md); overflow:hidden; background:var(--vg-ivory-50);`}>
                <img src={g.image} alt={g.title} style="width:100%; height:100%; object-fit:cover;" id="pdp-image" />
              </div>
              {g.backImage && (
                <div class="vg-front-back-toggle" style="margin-top:14px;">
                  <button class="vg-fb-btn vg-fb-active" data-fb="front" data-front={g.image} data-back={g.backImage}>
                    <i class="fa-solid fa-image"></i> Front
                  </button>
                  <button class="vg-fb-btn" data-fb="back" data-front={g.image} data-back={g.backImage}>
                    <i class="fa-solid fa-image"></i> Back
                  </button>
                </div>
              )}
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

            <p style="color:var(--vg-navy-400); font-size:15px; line-height:1.7; max-width:440px; margin-bottom:18px;">
              Precision-molded {g.brand} guard in the <strong style="color:var(--vg-navy-700);">{g.title}</strong> colorway.
              Wraps the slab&rsquo;s edges and corners only — your label and cert number stay fully visible.
            </p>

            <div class="vg-card-flat" style="padding:14px 18px; display:flex; gap:12px; align-items:flex-start; margin-bottom:26px;">
              <i class="fa-solid fa-layer-group" style="color:var(--vg-gold-500); margin-top:2px;"></i>
              <div style="font-size:13px; color:var(--vg-navy-600); line-height:1.6;">
                <strong>Clear acrylic backing included</strong> — the back of every guard is a solid acrylic
                shell that fully protects your slab, not just a soft bumper. Tap &ldquo;Back&rdquo; above to see it.
              </div>
            </div>

            {/* Curated suggestions instead of every sibling colorway, to avoid overload */}
            {suggestions.length > 0 && (
              <div style="margin-bottom:26px;">
                <div style="font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:var(--vg-navy-400); margin-bottom:10px;">
                  Goes well with
                </div>
                <div style="display:flex; gap:12px; flex-wrap:wrap;">
                  {suggestions.map((s: any) => (
                    <a
                      href={`/product/${s.handle}`}
                      style="display:flex; align-items:center; gap:10px; background:var(--vg-ivory-50); border-radius:14px; padding:8px 14px 8px 8px; text-decoration:none; color:inherit; box-shadow:var(--vg-shadow-xs);"
                    >
                      <span style={`width:40px; height:50px; border-radius:8px; overflow:hidden; flex-shrink:0; background:var(--vg-ivory-100);`}>
                        <img src={s.image} alt={s.title} style="width:100%; height:100%; object-fit:cover;" loading="lazy" />
                      </span>
                      <span>
                        <span style="display:block; font-weight:600; font-size:13.5px;">{s.title}</span>
                        <span style="display:block; font-size:12px; color:var(--vg-navy-400);">${s.price.toFixed(2)}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

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

      {/* Smart Bundle, contextualized to the guard being viewed on this page */}
      <section class="vg-section" style="background:var(--vg-bg-alt); padding-top:0;">
        <div class="vg-container">
          <div class="vg-reveal" style="text-align:center; max-width:600px; margin:0 auto 36px;">
            <div class="vg-eyebrow">Complete the set</div>
            <h2 style="font-size:30px; margin-top:14px;">Goes great together.</h2>
          </div>
          <div id="bundle-widget" class="vg-reveal"></div>
        </div>
      </section>

      <Footer />
      <CatalogScript />
      <script src="/static/js/haptic-scroll.js"></script>
      <script src="/static/js/product-page.js"></script>
      <script src="/static/js/bundle-widget.js" data-context={g.handle}></script>
      <script>{`VG.initHapticScroll();`}</script>
    </>
  )
})

export default product
