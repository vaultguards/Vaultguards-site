import type { Guard } from '../data/products'
import { PRODUCT_PHOTO_ASPECT } from '../data/products'

/** Shared product-card markup used on the homepage featured grid AND the full collection pages. */
export function ProductCard({ g, delay }: { g: Guard; delay?: number }) {
  return (
    <a
      href={`/product/${g.handle}`}
      class="vg-reveal vg-card vg-product-card"
      data-delay={String(delay ?? 0)}
      style="overflow:hidden; padding:0; display:block; text-decoration:none; color:inherit;"
    >
      {/* aspect-ratio matches the REAL product photo ratio (4:5) so the top
          and bottom of the guard photo are never cropped — a 1:1 square
          crop here was cutting off the top/bottom of every portrait-shot
          product photo, most noticeably on PSA guards. */}
      <div style={`aspect-ratio:${PRODUCT_PHOTO_ASPECT}; background:var(--vg-ivory-50);`}>
        <img src={g.image} alt={g.title} style="width:100%; height:100%; object-fit:cover;" loading="lazy" />
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
    </a>
  )
}
