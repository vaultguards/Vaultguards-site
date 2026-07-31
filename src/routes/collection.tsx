import { Hono } from 'hono'
import { renderer } from '../renderer'
import { Nav } from '../components/Nav'
import { Footer } from '../components/Footer'
import { ProductCard } from '../components/ProductCard'
import { getGuardsByBrand, type Brand } from '../data/products'

const collection = new Hono()
collection.use(renderer)

function renderCollection(c: any, brand: Brand) {
  const guards = getGuardsByBrand(brand)
  const inStock = guards.filter((g) => g.stock > 0).length

  return c.render(
    <>
      <Nav active="home" />

      <section class="vg-section" style="padding-top:56px;">
        <div class="vg-container">
          <a href="/#shop" style="color:var(--vg-navy-400); font-size:13px; text-decoration:none;">
            <i class="fa-solid fa-arrow-left"></i> Back to shop
          </a>
          <div class="vg-reveal vg-in" style="margin-top:18px; margin-bottom:40px;">
            <div class="vg-eyebrow">{brand} Collection</div>
            <h1 style="font-size:38px; margin-top:14px;">All {brand} colorways.</h1>
            <p style="color:var(--vg-navy-400); margin-top:10px; font-size:15px;">
              {guards.length} colorways &middot; {inStock > 0 ? `${inStock} in stock` : 'currently sold out — preview any of them live in The Vault'}
            </p>
          </div>

          <div class="vg-grid-4">
            {guards.map((g, i) => (
              <ProductCard g={g} delay={i % 4} />
            ))}
          </div>

          <div style="text-align:center; margin-top:48px;">
            <a href="/vault" class="vg-btn vg-btn-gold" data-vg-haptic="tap"><i class="fa-solid fa-vault"></i> Preview Your Slab in The Vault</a>
          </div>
        </div>
      </section>

      <Footer />
      <script src="/static/js/haptic-scroll.js"></script>
      <script>{`VG.initHapticScroll();`}</script>
    </>
  )
}

collection.get('/tag', (c) => renderCollection(c, 'TAG'))
collection.get('/psa', (c) => renderCollection(c, 'PSA'))

export default collection
