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

**Confirmed live Page handles (Shopify Page resource URLs, separate from the
template filename above)** — these are the actual values, confirmed directly
by the user visiting the live site, and are what any `pages['<handle>']`
Liquid lookup or nav link must match exactly:
- The Vault → `vaultguards.co/pages/the-vault` (Page resource handle: `the-vault`)
- Paul's Vault → `vaultguards.co/pages/founder-collection` (Page resource
  handle: `founder-collection` — **not** `pauls-vault`; an earlier guess used
  `pauls-vault` before the user had actually created the page, which caused
  a live 404 on the header nav link once the real page turned out to use a
  different handle. If a nav link or `pages['...']` reference for this page
  is ever missing/wrong again, this is the first thing to check — Page
  handles are a property of the Shopify Page resource itself, not something
  this Theme Access token can read or write, so they must be confirmed with
  the user rather than assumed.)

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
  logo/button visual weight changes materially. Current header circle icon
  size is **36px** (`vg-logo-mark`, doubled from an earlier 18px per user
  feedback) — check `layout/theme.liquid` around the `.vg-logo` anchor if
  this needs to change again.
- **Homepage photos auto-update from Shopify with zero code changes** —
  by design, do not treat this as something that needs "turning on":
  - The big rotating hero photo ("photo collage") and the Aura spotlight
    photo both default to pulling real, live `featured_image` values
    straight from the TAG/PSA collection products (and the `aura` product)
    at render time. Confirmed via pulling the live `templates/index.json`:
    the `vg_homepage_*` section instance's `settings` is `{}` (empty) on the
    live theme, meaning no manual override is set — so it is already
    running in full automatic mode. Whenever the user replaces/reorders
    product photos in Shopify Admin, the homepage collage and spotlight
    reflect that automatically on the next page load, no theme edit needed.
  - Manual override slots still exist for when the user *wants* fixed
    control instead: `hero_photo_1`..`hero_photo_4` and `spotlight_photo`
    under this section's settings in Theme Customize. As soon as any of
    those is set, it takes priority over the automatic product photos for
    that slot — so if "my photo updates aren't showing up" is ever reported,
    check whether one of these overrides got set accidentally.
  - All product/collection photos elsewhere on the site (PDP, collection
    grid, "Suggested for you", etc.) work the same way — they render
    `product.featured_image` / `collection.image` live from Shopify, so
    there is nothing to "sync" when the user updates product photography.
- **Homepage "Watch once you buy" video section**: lives right before the
  features grid (moved there from its original spot after "Suggested for
  you" per user request; the "Protection that respects the grade" /
  "Why collectors switch" headings above that grid have since been removed
  entirely per user request — the grid itself is unchanged). Real video ID
  is set via `{% assign youtube_id = '...' %}` right above the section —
  currently `JPYy9seWNDY` (the user's real unboxing video, extracted from
  `https://youtu.be/JPYy9seWNDY`). To swap the video later, just change that
  one assign line to the new ID from any `youtu.be/<ID>` or
  `youtube.com/watch?v=<ID>` URL.
- **Announcement bar (top strip) is a native Horizon file, not a custom
  `vg-` section**: `sections/header-group.json` — previously untouched/
  untracked locally until we needed to edit it for the VG15 promo attempts
  below. Its `header_announcements_*` section natively supports EITHER
  multiple rotating `_announcement` blocks (fades between them every
  `settings.speed` seconds, only activates when `section.blocks.size > 1` —
  confirmed by pulling `sections/header-announcements.liquid`) OR a single
  static block.
  - **VG15 promo history in this file (all abandoned, now fully reverted)**:
    1. Tried rotation (2 blocks: VG15 code + free shipping, various
       speeds/orders) — pushed/verified correct at the source level three
       times, but the user repeatedly reported never seeing it rotate
       visually.
    2. Pivoted to one static block with both lines via a literal `\n` in the
       `text` setting + a `white-space: pre-line` CSS override in
       `layout/theme.liquid` (note: `<br>` is explicitly rejected by
       Shopify's push validation for `inline_richtext` fields — error
       `Setting 'text' is invalid. Tag '<br>' is not permitted` — `\n` is the
       working substitute since it isn't an HTML tag).
    3. User said this "didn't work at all" and asked to move the VG15 promo
       off the top bar entirely, onto the cart page instead (see below).
  - **Current live state: fully reverted to the pre-existing original**,
    single block (`announcement_BxgCk9`), `settings.text` =
    `"Free Shipping On US Orders over $50"` (no VG15 mention, no `\n`),
    `speed: 5`, `padding-block-start/end: 15` — byte-for-byte the same as
    before any of this work started. The `white-space: pre-line` CSS rule
    added to `layout/theme.liquid` for step 2 above was also removed (it's
    dead weight once there's no `\n` left to render).
  - If a top-bar promo is ever wanted again, the native rotation mechanism
    above is proven to work correctly at the source/push/pull level every
    time it was tried — the open question is only whether it visually
    renders/rotates for real users, which was never confirmed either way in
    this sandbox. Test it live with the user watching a full cycle before
    calling it done, not just via source verification.
  - **Rate-limit note (applies broadly, not just to this feature)**:
    Cloudflare's rate limiter on repeated storefront fetches from this
    sandbox kicks in fast (HTTP 429 `local_rate_limited`, `retry-after: 60`)
    — a `curl`/crawler check right after a push will often just get
    rate-limited, not a real signal either way. `theme pull` +
    diff/structural-compare (our normal method) is the reliable verification
    step; treat any live-rendering claim beyond that as needing the user's
    own eyes on the actual page, not something this sandbox can reliably
    confirm by fetching the page itself.
- **VG15 discount promo now lives on the Cart page instead**
  (`sections/vg-cart.liquid`), per the user's explicit request after the
  top-bar approach failed to satisfy them. A gold pill banner reading
  "Did you add a discount? Use code VG15 for 15% off — tap to apply." sits
  directly above the existing "Discount code or gift card" field, wrapped in
  `{% if cart.total_discount == 0 %}` so it disappears automatically once a
  discount is already applied (avoids nagging). Clicking it fills the
  discount input with `VG15` and reuses the file's existing
  `applyDiscount('/cart')` JS helper, which redirects through Shopify's
  native `/discount/CODE?redirect=/cart` route — the same mechanism the
  existing manual "Apply Code" button already used, so no new backend
  logic was needed.
  - **IMPORTANT — unresolved, needs the user to confirm**: the Theme Access
    token this project uses only has theme read/write scope (confirmed by a
    direct test: a `price_rules.json` Admin API call with this token returns
    `401 Invalid API key or access token`), so there is no way for this
    agent to check or create discount codes in Shopify Admin. **This banner
    is purely a UI prompt — it does nothing to guarantee a "VG15" discount
    code actually exists and is active in Shopify Admin > Discounts.** If
    that code isn't set up (or is expired/inactive), clicking the banner
    will redirect through Shopify's discount-apply route and land back on
    the cart with no discount applied and no clear error shown to the
    shopper. The user needs to verify/create the VG15 discount code
    themselves in Admin — this agent cannot do it with the current token.
- **The Vault (`sections/vg-vault.liquid`) — `GUARD_WINDOW.tag` geometry
  fix**: Vaultguards' TAG product photos were replaced on Shopify
  (position-1/featured image, used both as the try-on preview image AND
  the product page's default "Front" photo) with new shots that frame the
  guard's clear display window differently/smaller than the old photos the
  original `GUARD_WINDOW.tag` percentages were tuned against. Symptom
  reported by the user: "the guards are being cut off ... the picture
  that's being uploaded is too big" — i.e. with the old (too-generous)
  window percentages, a user's uploaded slab photo (clipped to that
  oversized window) would spill past the guard's actual clear-window edges
  and paint over/erase the colored plastic frame entirely, so the frame
  disappeared instead of framing the user's photo.
  - **How the fix was derived** (no Admin/product-image-editing access
    needed — this is pure math/config in the section file): pulled several
    real TAG product photos directly from the public, unauthenticated
    storefront JSON endpoint (`https://vaultguards.co/collections/<handle>/
    products.json`, works around the admin-token limitation entirely — no
    login needed for this one), downloaded them via their `cdn.shopify.com`
    URLs (not subject to the vaultguards.co-domain rate limiter), and used
    grid-overlay + AI-vision analysis across 3 different colorways to
    triangulate the actual inner-window boundary as a % of image width/
    height. Landed on `{ top: 17.0, left: 24.5, right: 24.5, bottom: 20.0 }`
    (up from `{ top: 13.7, left: 22.5, right: 22.1, bottom: 13.8 }`) —
    confirmed "good fit" by AI vision on 3 separate products, then
    **independently re-confirmed by simulating the exact JS compositing
    algorithm in Python** (same clip-to-window + evenodd-cutout logic) with
    a placeholder "user photo" sized to perfectly fill the align guide: with
    the OLD numbers the simulated guard frame was completely invisible
    (i.e. reproduced the user's exact bug); with the NEW numbers the frame
    rendered fully intact on all 4 sides. This dual-verification approach
    (measure the real photos + simulate the actual algorithm) is the
    reusable pattern for any future "the guard/frame looks wrong in the
    Vault" report — don't just eyeball the live canvas.
  - Only `GUARD_WINDOW.tag` was touched, per the user's explicit instruction
    to leave PSA alone. `GUARD_WINDOW.psa` is unchanged from its original
    values.
  - Both the align-step guide box (`guideRectForBrand()`) and the final
    preview/swatch compositing (`drawGuardComposite()`) read from the same
    `GUARD_WINDOW` object, so this one config change fixes both the
    alignment guide the user drags/pinches their photo into AND the final
    composited preview consistently — no separate places to update.
  - If TAG photos are ever swapped again in the future and this drifts out
    of alignment again, repeat the same measurement method: pull a few
    fresh product photos from the public `products.json` endpoint (per
    product handle, e.g. `/products/<handle>.json`, or the collection
    endpoint for several at once), grid-overlay them, and re-derive the 4
    percentages — then sanity-check with the Python compositing simulation
    before pushing, not just visual inspection of the raw photo alone.
- **Product page (`sections/vg-product.liquid`) — added a 3rd "Side" photo
  toggle** alongside the existing Front/Back buttons. Confirmed via the same
  public `products.json` endpoint + AI-vision image inspection (checked 2
  different products) that the image order is consistent for every real
  guard product: `images[0]` = front (the new updated photo), `images[1]` =
  back (acrylic backing), `images[2]` = side (profile/edge view). The Side
  button is wrapped in `{% if side_image %}` (where
  `side_image = product.images[2]`), so it only renders when a product
  actually has a 3rd image — products with just 2 photos still show a clean
  Front/Back-only toggle, no broken button. The existing
  `.vg-front-back-toggle { display:flex }` /
  `.vg-fb-btn { flex:1 }` CSS already spaces 3 buttons evenly with no
  changes needed; added one small mobile refinement (`@media (max-width:
  420px)`) to tighten padding/font-size slightly so 3 buttons don't feel
  cramped on small phones.

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
