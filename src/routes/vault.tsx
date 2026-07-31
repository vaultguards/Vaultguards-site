import { Hono } from 'hono'
import { renderer } from '../renderer'
import { Nav } from '../components/Nav'
import { Footer } from '../components/Footer'

const vault = new Hono()

vault.use(renderer)

vault.get('/', (c) => {
  return c.render(
    <>
      <Nav active="vault" />

      <section style="padding:64px 0 20px;">
        <div class="vg-container" style="text-align:center; max-width:680px; margin:0 auto;">
          <div class="vg-eyebrow">Virtual Try-On</div>
          <h1 style="font-size:44px; margin:14px 0 14px;">THE VAULT</h1>
          <p style="color:var(--vg-navy-400); font-size:16.5px;">
            Upload a photo of your own graded slab, align it, then preview every real
            colorway before you buy.
          </p>
        </div>
      </section>

      {/* Step progress rail */}
      <section style="padding:0 0 20px;">
        <div class="vg-container">
          <div id="vault-steps" style="display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap;">
            <div class="vault-step" data-step="1"><span class="vault-step-num">1</span> Brand</div>
            <div class="vault-step-line"></div>
            <div class="vault-step" data-step="2"><span class="vault-step-num">2</span> Upload</div>
            <div class="vault-step-line"></div>
            <div class="vault-step" data-step="3"><span class="vault-step-num">3</span> Align</div>
            <div class="vault-step-line"></div>
            <div class="vault-step" data-step="4"><span class="vault-step-num">4</span> Preview &amp; Buy</div>
          </div>
        </div>
      </section>

      <section class="vg-section" style="padding-top:24px;">
        <div class="vg-container" style="max-width:920px;">

          {/* ===== STEP 1: BRAND SELECT ===== */}
          <div class="vault-panel" id="panel-brand">
            <div class="vg-card vault-card-pad">
              <h2 style="font-size:22px; margin-bottom:6px; text-align:center;">Which brand is your slab?</h2>
              <p style="text-align:center; color:var(--vg-navy-400); font-size:14px; margin-bottom:30px;">
                This determines the slab shape used for alignment and which colorways you can preview.
                TAG and PSA slabs are never mixed.
              </p>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <button class="vault-brand-btn" data-brand="TAG" data-vg-haptic="tap">
                  <div class="vault-brand-swatch" style="background:linear-gradient(135deg,#eee,#ccc);"></div>
                  <div style="font-weight:700; font-size:18px; margin-top:14px;">TAG Slab</div>
                </button>
                <button class="vault-brand-btn" data-brand="PSA" data-vg-haptic="tap">
                  <div class="vault-brand-swatch" style="background:linear-gradient(135deg,#dbe7f7,#9fc0e8);"></div>
                  <div style="font-weight:700; font-size:18px; margin-top:14px;">PSA Slab</div>
                </button>
              </div>
            </div>
          </div>

          {/* ===== STEP 2: UPLOAD ===== */}
          <div class="vault-panel" id="panel-upload" style="display:none;">
            <div class="vg-card vault-card-pad">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:22px;">
                <h2 style="font-size:22px;">Upload your slab photo</h2>
                <button class="vg-btn vg-btn-ghost" style="padding:8px 16px; font-size:12.5px;" data-vault-back="1">
                  <i class="fa-solid fa-arrow-left"></i> Change brand
                </button>
              </div>

              <div id="camera-guidance" class="vg-card-flat" style="padding:16px 20px; display:flex; gap:14px; align-items:flex-start; margin-bottom:24px;">
                <i class="fa-solid fa-camera" style="color:var(--vg-gold-500); font-size:18px; margin-top:2px;"></i>
                <div style="font-size:13.5px; color:var(--vg-navy-600); line-height:1.6;">
                  <strong>For the cleanest result:</strong> place your slab on a flat, well-lit surface and fill most
                  of the camera frame with it — shoot straight-on, not at an angle, and avoid glare on the case.
                </div>
              </div>

              <div id="upload-dropzone" class="vault-dropzone">
                <input type="file" id="upload-input" accept="image/*" capture="environment" style="display:none;" />
                <i class="fa-solid fa-cloud-arrow-up" style="font-size:30px; color:var(--vg-gold-500);"></i>
                <div style="font-weight:600; margin-top:12px;">Tap to take or choose a photo</div>
                <div style="color:var(--vg-navy-400); font-size:12.5px; margin-top:4px;">JPG or PNG · background removed automatically</div>
              </div>

              <div id="upload-progress" style="display:none; text-align:center; padding:30px 0;">
                <div class="vault-spinner"></div>
                <div id="upload-progress-label" style="margin-top:14px; font-size:14px; color:var(--vg-navy-500);">Removing background…</div>
                <div style="font-size:12px; color:var(--vg-navy-400); margin-top:6px;">First run downloads a small on-device model — this can take a moment.</div>
              </div>
            </div>
          </div>

          {/* ===== STEP 3: ALIGN ===== */}
          <div class="vault-panel" id="panel-align" style="display:none;">
            <div class="vg-card vault-card-pad">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                <h2 style="font-size:22px;">Align your slab</h2>
                <button class="vg-btn vg-btn-ghost" style="padding:8px 16px; font-size:12.5px;" data-vault-back="2">
                  <i class="fa-solid fa-arrow-left"></i> Retake photo
                </button>
              </div>
              <p style="color:var(--vg-navy-400); font-size:13.5px; margin-bottom:22px;">
                Drag to position, pinch or scroll to zoom until your slab fills the guide.
              </p>

              <div id="align-stage" class="vault-align-stage">
                <canvas id="align-canvas" width="700" height="875"></canvas>
                <div id="align-guide" class="vault-align-guide"></div>
              </div>

              <div style="display:flex; align-items:center; gap:14px; margin-top:22px;">
                <i class="fa-solid fa-magnifying-glass-minus" style="color:var(--vg-navy-400);"></i>
                <input type="range" id="align-zoom" min="50" max="300" value="100" style="flex:1;" />
                <i class="fa-solid fa-magnifying-glass-plus" style="color:var(--vg-navy-400);"></i>
              </div>

              <div style="text-align:center; margin-top:26px;">
                <button class="vg-btn vg-btn-primary" id="align-confirm-btn" data-vg-haptic="success">
                  Looks good <i class="fa-solid fa-check"></i>
                </button>
              </div>
            </div>
          </div>

          {/* ===== STEP 4: PREVIEW & BUY ===== */}
          <div class="vault-panel" id="panel-preview" style="display:none;">
            <div class="vault-preview-grid">
              <div class="vg-card" style="padding:24px;" id="preview-image-card">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
                  <span class="vg-pill vg-pill-gold" id="preview-brand-pill">TAG</span>
                  <button class="vg-btn vg-btn-ghost" style="padding:7px 14px; font-size:12px;" data-vault-back="3">
                    <i class="fa-solid fa-arrow-left"></i> Re-align
                  </button>
                </div>
                <div id="preview-stage" class="vault-preview-stage">
                  <canvas id="preview-canvas" width="800" height="1000"></canvas>
                </div>
                <div id="suggestion-banner" style="display:none;"></div>
              </div>

              <div>
                <h2 style="font-size:20px; margin-bottom:4px;" id="preview-color-title">&nbsp;</h2>
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
                  <span id="preview-color-price" style="color:var(--vg-navy-400); font-size:14.5px;"></span>
                  <span id="preview-color-stock" class="vg-pill" style="font-size:10.5px; padding:3px 10px;"></span>
                </div>

                <div id="swatch-grid" class="vault-swatch-grid"></div>

                <button class="vg-btn vg-btn-primary" id="add-to-cart-btn" style="width:100%; padding:16px;" data-vg-haptic="tap" disabled>
                  <i class="fa-solid fa-bag-shopping"></i> Add to Cart
                </button>
                <div id="add-to-cart-note" style="font-size:12px; color:var(--vg-navy-400); text-align:center; margin-top:10px;"></div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <Footer />

      <script src="/static/js/products-data.js"></script>
      <script src="/static/js/haptic-scroll.js"></script>
      <script type="module" src="/static/js/vault.js"></script>
      <script>{`VG.initHapticScroll();`}</script>
    </>
  )
})

export default vault
