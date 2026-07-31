# Vaultguards.co — Deployment & Update Method (Reference Doc)

This file is the canonical reference for **how** this project is built, deployed,
and verified. Every future update should follow this exact method unless the
user explicitly asks to change the approach. Keep this file up to date whenever
the method itself changes (new theme id, new token, new store, etc.) — the
*content* of the site (copy, colors, sections) will keep changing, but the
*process* below should stay stable.

---

## 1. What this project is

- **Store**: vaultguards.co (Shopify), selling colored protective "guard" frames
  for **TAG-graded** and **PSA-graded** trading card slabs.
- **Theme**: Shopify's "Horizon" base theme, customized.
- **Storefront domain**: `mjxp20-0n.myshopify.com`
- **Live theme**: `vaultguards.theme` — **Theme ID `190268047653`**
  - Confirmed LIVE (published) via `shopify theme list`. Other themes on the
    store (Horizon #188454175013, Copy of Horizon #190262608165, Copy of Copy
    of Horizon #190266081573) are unpublished duplicates — ignore them.
  - Because it's the live theme, **every push must include `--allow-live`**
    (aka `-a`), otherwise the CLI blocks non-interactively with:
    `Failed to prompt: Push theme files to the live theme...`

- **Source of truth for code**: `/home/user/webapp/shopify-package/` — this is
  what gets edited. It mirrors a Shopify theme's folder layout:
  ```
  shopify-package/
    layout/theme.liquid        <- site-wide header, nav, footer, global CSS vars, shared JS
    sections/
      vg-homepage.liquid       <- Homepage
      vg-product.liquid        <- Product page (PDP)
      vg-collection.liquid     <- Collection/catalog page
      vg-contact.liquid        <- Contact page (emails via Resend)
      vg-vault.liquid          <- "The Vault" virtual try-on tool
      vg-cart.liquid           <- Cart page
      vg-pauls-vault.liquid    <- "Paul's Vault" founder collection showcase page
    templates/
      cart.json                <- {"sections":{"main":{"type":"vg-cart"}}, ...}
      collection.json
      page.contact.json
      page.vault.json
      page.founder-collection.json  <- Paul's Vault template (deliberately NOT named
                                        "page.pauls-vault.json" - see Section 7)
      product.json
    assets/
      vaultguards-logo.png         <- circular "V" shield icon (unchanged master asset)
      vaultguards-wordmark-dark.png <- "VAULTGUARDS" wordmark, dark/near-black letters,
                                        transparent bg — used on LIGHT backgrounds
                                        (header nav, hero headline)
      vaultguards-wordmark.png      <- "VAULTGUARDS" wordmark, WHITE letters,
                                        transparent bg — used on DARK backgrounds (footer)
      tag-logo.png              <- TAG brand logo (white bordered badge, opaque)
      psa-logo.png              <- PSA brand logo (transparent bg, cropped to bbox)
  ```
- **Staging dir for the CLI**: `/home/user/webapp/shopify-theme-push/` — a
  working copy synced from `shopify-package/` right before every push (see
  Section 3). It's gitignored; `shopify-package/` is the real git-tracked source.
- **Deploy tool**: Shopify CLI (`shopify theme push` / `shopify theme pull`),
  authenticated via a **Theme Access token** (scoped to theme files only, not
  full store admin) — run directly and non-interactively from the sandbox, no
  browser OAuth needed.
- **Version control**: git, GitHub repo
  `https://github.com/vaultguards/Vaultguards-site`, branch `main`.

---

## 2. Credentials

```bash
export SHOPIFY_CLI_THEME_TOKEN=shptka_d8f98845fd2d7cf7569c5ed16b4f9d42
```
- This is a **Theme Access app** token (Shopify Admin → Apps → Theme Access
  channel), scoped only to theme file read/write — it cannot touch orders,
  customers, or other store data.
- ⚠️ This value is recorded here because the user explicitly asked to save the
  exact reusable method. Treat it as a secret: don't paste it into anything
  public-facing, and if the user ever suspects it's been exposed, regenerate
  it from the Theme Access app in Shopify Admin and update this file plus any
  running commands.
- Store: `mjxp20-0n.myshopify.com`
- Theme: `190268047653`

---

## 3. The exact update workflow (repeat for every change)

1. **Edit** the relevant file(s) directly under `/home/user/webapp/shopify-package/`
   (never edit `shopify-theme-push/` directly — it's just a push staging mirror).

2. **Validate** every edited `.liquid` / `.json` file before pushing:
   ```bash
   cd /home/user/webapp/shopify-package && python3 -c "
   import re, json
   files = ['layout/theme.liquid', 'sections/vg-XXXX.liquid']  # list the files you touched
   for f in files:
       content = open(f, encoding='utf-8').read()
       non_ascii = [c for c in content if ord(c) > 127]
       print(f, 'non-ascii chars:', len(non_ascii), set(non_ascii) if non_ascii else '')
       print(f, '{{ count:', content.count('{{'), '}} count:', content.count('}}'))
       print(f, '{% count:', content.count('{%'), '%} count:', content.count('%}'))
       print(f, 'em-dash present:', '—' in content, '&mdash; present:', '&mdash;' in content)
       m = re.search(r'{% schema %}(.*?){% endschema %}', content, re.S)
       if m:
           json.loads(m.group(1))  # raises if invalid
           print(f, 'schema JSON: OK')
   "
   ```
   For any `templates/*.json` file, just run `json.loads(open(f).read())`.

3. **Validate embedded `<script>` JS** in any file whose `<script>` block was
   touched (Liquid tags must be neutralized first so `node --check` can parse
   plain JS):
   ```bash
   cd /home/user/webapp/shopify-package && python3 -c "
   import re
   content = open('sections/vg-XXXX.liquid', encoding='utf-8').read()
   scripts = re.findall(r'<script[^>]*>(.*?)</script>', content, re.S)
   combined = ''
   for js in scripts:
       js2 = re.sub(r'\{\{.*?\}\}', '\"__LIQUID__\"', js)
       js2 = re.sub(r'\{%.*?%\}', '', js2)
       combined += js2 + '\n;\n'
   open('/tmp/vg_script_check.js', 'w').write(combined)
   "
   node --check /tmp/vg_script_check.js && echo "JS SYNTAX OK"
   ```

4. **Sync only the changed files** into the CLI staging dir (no bulk rsync —
   `rsync` isn't installed in this sandbox; use targeted `cp`):
   ```bash
   cd /home/user/webapp
   cp shopify-package/layout/theme.liquid        shopify-theme-push/layout/theme.liquid
   cp shopify-package/sections/vg-XXXX.liquid     shopify-theme-push/sections/vg-XXXX.liquid
   cp shopify-package/assets/some-asset.png       shopify-theme-push/assets/some-asset.png
   # then diff/md5sum each pair to confirm the copy landed correctly before pushing
   ```

5. **Push** via Shopify CLI, `--only`-scoped to just the changed files (never
   push the whole theme blindly):
   ```bash
   cd /home/user/webapp/shopify-theme-push
   export SHOPIFY_CLI_THEME_TOKEN=shptka_d8f98845fd2d7cf7569c5ed16b4f9d42
   shopify theme push --store mjxp20-0n.myshopify.com --theme 190268047653 \
     --only layout/theme.liquid \
     --only sections/vg-XXXX.liquid \
     --only assets/some-asset.png \
     --allow-live --nodelete --force
   ```
   - `--allow-live` — required, theme is live (see Section 1).
   - `--nodelete` — never let a partial `--only` push delete files not included.
   - `--force` — skip interactive "are you sure" prompts (needed for non-interactive CLI use).

6. **Pull back into a disposable verify dir** and diff/md5sum against source —
   this is the authoritative check, not ad-hoc `curl` on the live site (curl
   checks can trip Shopify's edge rate limiting / 429 if run repeatedly):
   ```bash
   export SHOPIFY_CLI_THEME_TOKEN=shptka_d8f98845fd2d7cf7569c5ed16b4f9d42
   rm -rf /tmp/vg-verify && mkdir -p /tmp/vg-verify
   cd /tmp/vg-verify && shopify theme pull --store mjxp20-0n.myshopify.com --theme 190268047653 \
     --only layout/theme.liquid \
     --only sections/vg-XXXX.liquid \
     --only assets/some-asset.png \
     --path . --force

   diff /tmp/vg-verify/layout/theme.liquid /home/user/webapp/shopify-package/layout/theme.liquid && echo MATCH
   diff /tmp/vg-verify/sections/vg-XXXX.liquid /home/user/webapp/shopify-package/sections/vg-XXXX.liquid && echo MATCH
   md5sum /tmp/vg-verify/assets/some-asset.png /home/user/webapp/shopify-package/assets/some-asset.png
   ```
   - **Expected benign non-diff**: Shopify auto-prepends a
     `/* IMPORTANT: auto-generated... */` banner comment to pulled `.json`
     template files. That's not a real diff — compare content *below* the
     banner, or just eyeball that the rest matches.

7. **Commit to git** with a descriptive message, then **push to GitHub**:
   ```bash
   cd /home/user/webapp
   git add shopify-package/<changed files...>
   git commit -m "<clear summary of what changed and why>"
   git push origin main
   ```
   - Before the first push in a session, call the `setup_github_environment`
     tool to configure git/gh auth — do this every fresh session, it doesn't
     persist across sandbox resets.
   - Repo: `https://github.com/vaultguards/Vaultguards-site`, branch `main`.
   - A second remote, `genspark` (Second Brain SB-Git backup), auto-pushes at
     the end of every turn automatically — no action needed for that one.

8. **Reply to the user** summarizing exactly what shipped, any decisions or
   open questions (e.g. a design tension that needs their input), and next
   steps if any are pending.

---

## 4. Logo / wordmark asset pipeline — lessons learned

- **Never trust a "transparent-looking" PNG/JPEG at face value.** Check with
  PIL:
  ```python
  from PIL import Image
  img = Image.open('source.png')
  print(img.mode, img.size, img.format)
  print(img.getchannel('A').getextrema())   # (0,255) with many unique values = REAL alpha
  ```
  - If `format` is actually JPEG (even if the filename/extension says .png) or
    the alpha channel is fully opaque/binary with a checkerboard baked into
    the RGB pixels, it's a **flattened fake-transparency image** — extracting
    real transparency from it requires luminance-thresholding, which produces
    **jagged/chopped edges** at letter boundaries due to JPEG compression
    artifacts. This was the root cause of the "why does the logo look so
    chopped" complaint.
  - If `alpha extrema` spans the full `(0, 255)` range with ~256 unique alpha
    values, it's a **genuine anti-aliased PNG** — just crop it to
    `img.getbbox()` directly. Do **not** re-threshold or recolor it; that
    would destroy the good anti-aliasing it already has.

- **Tight-crop convention**: existing wordmark assets in this project have
  zero padding around the letters (`img.getbbox()` on the final asset equals
  the full canvas). Match that convention — crop tight, no extra margin —
  so the asset drops into `height:Npx; width:auto;` CSS slots consistently.

- **Preserve native color exactly** when the user says "don't change the
  color" — i.e. crop only, never run a recolor/threshold pass on a genuinely
  anti-aliased source.

- **Known open design tension**: the current wordmark master
  (`vaultguards-wordmark-dark.png`, extracted from the user's cleanest source
  so far) is near-black (~`#1A1819`). That reads fine on light backgrounds
  (header nav, hero headline on the ivory homepage) but would be **invisible**
  on the footer's dark navy background, which still uses the older
  white-letter asset (`vaultguards-wordmark.png`). Don't silently pick a side
  on this — if the user asks to unify every "VAULTGUARDS" logo again, flag the
  contrast conflict and ask whether they want (a) a light/inverted variant
  just for the footer, or (b) a lighter footer background so one universal
  color works everywhere.

- **Brand third-party logos (TAG, PSA, etc.)**: place them as-is (crop only if
  they have real transparent margin to trim); these are official brand marks,
  not something to restyle.

---

## 5. Site-wide design system (so recolors/resizes stay centralized)

- Nearly all brand colors flow through **one `:root` CSS variable block** at
  the top of `layout/theme.liquid`. A full-site recolor should mean editing
  *only* this block, plus grepping for stray hardcoded hex/RGB that bypass it.
- **Current palette** ("gunmetal / brushed-steel" vault look, as of the latest
  recolor):
  ```css
  --vg-ivory-50: #F4F4F5;
  --vg-ivory-100: #E6E7E9;
  --vg-ivory-200: #D2D4D7;
  --vg-ivory-300: #B7BABE;
  --vg-navy-900: #15171A;
  --vg-navy-800: #1E2023;
  --vg-navy-700: #2A2D30;
  --vg-navy-600: #3E4145;
  --vg-navy-500: #595D61;
  --vg-navy-400: #75797D;
  --vg-navy-300: #9CA0A3;
  --vg-gold-500: #63737B;
  --vg-gold-400: #8A99A1;
  --vg-gold-300: #B4BFC5;
  --vg-gold-050: #EBEDEE;
  --vg-success: #2E8B6F;
  --vg-danger: #B5453B;
  ```
  (Yes, the variable names still say "gold"/"ivory"/"navy" from the original
  blue/gold scheme — only the hex *values* were swapped to the new neutral
  gunmetal tones, to avoid touching every reference across 6 section files.)
- Known stray hardcoded values that mirror the palette and must be kept in
  sync manually if the palette changes again: `--vg-shadow-gold-glow`, the
  `.vg-btn-gold:hover` box-shadow, and the `.vg-nav` background `rgba(...)`.
- Grep command to catch any other stray hex before a recolor:
  ```bash
  grep -rn "#[0-9a-fA-F]\{6\}\|rgba\?(" shopify-package/sections/*.liquid shopify-package/layout/theme.liquid
  ```
  then manually judge which hits are intentional semantic exceptions (pure
  `#fff` on an already-dark section, a red error border, neutral canvas fills
  in the Vault's image compositor, etc.) vs. real leftovers to fix.

---

## 6. Current site structure (as of this doc's last update)

| Page/feature | File | Template override |
|---|---|---|
| Site-wide header/nav/footer | `layout/theme.liquid` | (applies everywhere) |
| Homepage | `sections/vg-homepage.liquid` | (homepage default) |
| Product page | `sections/vg-product.liquid` | `templates/product.json` |
| Collection page | `sections/vg-collection.liquid` | `templates/collection.json` |
| Contact page | `sections/vg-contact.liquid` | `templates/page.contact.json` |
| The Vault (virtual try-on) | `sections/vg-vault.liquid` | `templates/page.vault.json` |
| Cart | `sections/vg-cart.liquid` | `templates/cart.json` |
| Paul's Vault (founder collection) | `sections/vg-pauls-vault.liquid` | `templates/page.founder-collection.json` |

Key mechanics worth remembering when touching these:
- **Cart**: single `{% form 'cart', cart, id: '...' %}` wraps the WHOLE
  layout; `name="update"` submit button updates quantities & stays on
  `/cart`, `name="checkout"` submit button goes to Shopify Checkout — both
  work natively in the same form, distinguished purely by button `name`.
  Discount codes apply via Shopify's own `/discount/{code}?redirect={path}`
  route. Gift cards can only be redeemed on the Checkout page itself (native
  Shopify limitation, not something to build around).
- **Add to Cart (PDP + Vault)**: uses `/cart/add.js` via `fetch`
  (`Accept: application/json`) so the page does **not** navigate away — a
  shared `VG.refreshCartCount()` helper (in `theme.liquid`'s script block)
  re-fetches `/cart.js` and updates the header cart badge (`#vg-nav-cart-count`)
  after every successful add.
- **Vault mobile upload**: primary hidden `<input type="file" accept="image/*">`
  (no `capture` attr) defaults to photo-library picker; a second, separate
  hidden input with `capture="environment"` is wired to an explicit "Take a
  Photo Instead" button (with `e.stopPropagation()` so it doesn't also trigger
  the primary dropzone's click handler).
- **Paul's Vault (founder collection)**: unlike the fixed `image_picker`
  settings used for the homepage hero photos, this page uses **repeatable
  schema blocks** (block type `"photo"`, each with an `image_picker` +
  optional `text` caption). That's the correct native mechanism whenever the
  user wants to add an *unbounded, growing* number of images over time purely
  through Online Store > Themes > Customize — no code edits ever needed for a
  new photo, just "Add block". Fixed numbered settings (`photo_1`..`photo_N`)
  only make sense for a small, capped set of override slots (like the
  homepage hero rotator); reach for blocks instead whenever the count is
  open-ended. Remember the one-time manual step this pattern still requires:
  the user must create the actual Shopify **Page** resource (Online Store >
  Pages > Add page) and set its Theme template to match the `page.<handle>.json`
  filename — the Theme Access token used here can only push theme *files*, not
  create Page resources via Admin API, so that step is always on the user.
- **Header nav layout**: `.vg-nav-inner` is a flex row,
  `justify-content:space-between`, containing the logo, `.vg-nav-links`
  (hidden below 720px), and `.vg-nav-actions` (CTA button + cart icon +
  hamburger). If the logo or CTA button size ever changes again, re-check the
  `@media (max-width: ...)` breakpoint that hides the CTA button's `<span>`
  text down to icon-only — it exists specifically to prevent overlap at
  narrow/mid mobile widths, and its exact px threshold needs to move if the
  logo/button visual weight changes materially.

---

## 7. Open items / known pending decisions

- **Footer wordmark color** (see Section 4) — unresolved, needs the user's
  call between a footer-only light variant vs. lightening the footer
  background.
- Confirm the user has manually assigned the "Vaultguards Contact" /
  "Vaultguards Vault" page templates via the Shopify Admin page editor
  dropdown (should finally be visible now that `vaultguards.theme` is live).
- There is a harmless orphaned `templates/page.pauls-vault.json` file still
  sitting on the live theme (superseded by `page.founder-collection.json`,
  see Section 8's naming-collision lesson). No page should be assigned to it
  after the fix; safe to delete manually via Admin > Online Store > Themes >
  Edit code whenever convenient, not urgent.

---

## 8. Sanity-check gotchas

- Don't hammer the live storefront with repeated `curl` checks in quick
  succession — Shopify's edge will 429 you. Trust the CLI
  push → pull → diff/md5 cycle instead; it's authoritative.
- `wrangler`/Cloudflare workflow described elsewhere in this environment's
  system instructions **does not apply** to this project — this is a Shopify
  Liquid theme, deployed via Shopify CLI, not Cloudflare Pages.
- Never run `shopify login`/OAuth flows in this sandbox — auth is entirely via
  the `SHOPIFY_CLI_THEME_TOKEN` env var.
- **Never run `theme push` without `--nodelete`, even scoped with `--only`.**
  The `shopify-theme-push/` staging dir only contains OUR custom overlay
  files (layout/theme.liquid, our sections/templates/assets) — it does NOT
  contain the rest of the live Horizon theme (config/, locales/, snippets/,
  default templates, layout/password.liquid, etc.). Whether `--only` fully
  scopes deletion behavior alongside `--nodelete` is undocumented/reportedly
  inconsistent (see Shopify CLI GitHub issues about templates being deleted
  unexpectedly even with scoping flags) — don't test this on production.
  Practical effect: there is **no safe CLI way to delete a single remote
  theme file** from this sandbox. If a stray/renamed file needs removing
  from the live theme, either leave it as a harmless orphan (preferred, see
  Section 7) or delete it manually via Admin > Online Store > Themes > Edit
  code (safe, scoped to one file, official UI).
- **Naming collision lesson (page templates)**: Shopify's page-editor "Theme
  template" dropdown displays a humanized version of each `page.<suffix>.json`
  filename (e.g. `page.vault.json` → "Vault", `page.pauls-vault.json` →
  "Pauls vault"). Similar-looking names in that list are an easy pick-the-
  wrong-one mistake for the user, with a confusing symptom: visiting the new
  page renders the OLD page's content (or vice versa) because the wrong
  template got assigned to it, while the actual section/template files on
  disk are completely correct and separate — don't assume a code bug when a
  user reports this. When adding a new page whose name is verbally similar
  to an existing one (e.g. "Paul's Vault" next to "The Vault"), proactively
  pick a `page.<suffix>.json` filename with **zero shared words** from any
  existing template (this project uses `page.founder-collection.json`, not
  `page.pauls-vault.json`, for exactly this reason). Fixing a live mix-up
  requires the user to go into Admin and re-pick the correct dropdown entry
  per page — the Theme Access token used here cannot read or write Page
  resources (only theme files), so this step can never be automated from
  this sandbox.
