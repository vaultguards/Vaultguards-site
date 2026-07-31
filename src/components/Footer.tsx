export function Footer() {
  return (
    <footer style="background:var(--vg-navy-900); color:var(--vg-ivory-200); padding:64px 0 32px;">
      <div class="vg-container">
        <div class="vg-footer-grid" style="display:grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap:40px;">
          <div>
            <div class="vg-logo" style="color:#fff;">
              <img src="/static/images/vaultguards-logo.png" alt="Vaultguards" class="vg-logo-mark" /> Vaultguards
            </div>
            <p style="color:var(--vg-navy-300); font-size:14px; max-width:280px; margin-top:14px;">
              Precision-fit colorway guards for TAG and PSA graded slabs. Built for collectors who
              treat their cards like the assets they are.
            </p>
          </div>
          <div>
            <div style="font-size:12px; letter-spacing:0.1em; text-transform:uppercase; color:var(--vg-gold-400); margin-bottom:14px;">Shop</div>
            <div style="display:flex; flex-direction:column; gap:10px; font-size:14px; color:var(--vg-navy-300);">
              <a href="/collection/tag">TAG Guards</a>
              <a href="/collection/psa">PSA Guards</a>
              <a href="/#shop">Accessories</a>
            </div>
          </div>
          <div>
            <div style="font-size:12px; letter-spacing:0.1em; text-transform:uppercase; color:var(--vg-gold-400); margin-bottom:14px;">Explore</div>
            <div style="display:flex; flex-direction:column; gap:10px; font-size:14px; color:var(--vg-navy-300);">
              <a href="/vault">The Vault — Try It On</a>
              <a href="/#watch">Watch Once You Buy</a>
            </div>
          </div>
          <div>
            <div style="font-size:12px; letter-spacing:0.1em; text-transform:uppercase; color:var(--vg-gold-400); margin-bottom:14px;">Support</div>
            <div style="display:flex; flex-direction:column; gap:10px; font-size:14px; color:var(--vg-navy-300);">
              <a href="/contact">Contact</a>
              <a href="#">Shipping</a>
              <a href="#">FAQ</a>
            </div>
          </div>
        </div>
        <div style="margin-top:48px; padding-top:24px; border-top:1px solid rgba(255,255,255,0.08); display:flex; flex-wrap:wrap; gap:8px 20px; justify-content:space-between; color:var(--vg-navy-400); font-size:13px;">
          <span>© {new Date().getFullYear()} Vaultguards. All rights reserved.</span>
          <span>Not affiliated with TAG Grading or PSA.</span>
        </div>
      </div>
    </footer>
  )
}
