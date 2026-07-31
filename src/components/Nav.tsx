export function Nav({ active }: { active?: 'home' | 'vault' }) {
  return (
    <header class="vg-nav">
      <div class="vg-nav-inner">
        <a href="/" class="vg-logo">
          <img src="/static/images/vaultguards-logo.png" alt="Vaultguards" class="vg-logo-mark" />
          Vaultguards
        </a>
        <nav class="vg-nav-links">
          <a href="/#shop" style={active === 'home' ? 'color:var(--vg-navy-900)' : ''}>Shop</a>
          <a href="/vault" style={active === 'vault' ? 'color:var(--vg-navy-900)' : ''}>The Vault</a>
        </nav>
        <a href="/vault" class="vg-btn vg-btn-gold" style="padding:10px 20px;font-size:13px" data-vg-haptic="tap">
          <i class="fa-solid fa-vault"></i> Try It On
        </a>
      </div>
    </header>
  )
}
