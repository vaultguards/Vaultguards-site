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

## 6b. TAG window aspect-ratio correction + background removal fix
   (`sections/vg-vault.liquid`, follow-up to Section 6)

The Section 6 fix stopped the guard frame from being cut off, but the window
shape itself was still off — because it was derived by **visually tracing** a
thin/translucent border in AI-vision-measured product photos, which is an
inherently imprecise method. The user reported it again ("the dots... not
shaped correctly") and separately reported background removal not working.
Both were root-caused and fixed for real this time, with actual proof:

- **Aspect ratio fix**: TAG publishes the real physical slab dimensions on
  their own site (https://help.taggrading.com — "The standard TAG slab for
  trading cards up to 50pt measures 5.25in x 3.125in"), giving an
  authoritative width:height ratio of `3.125/5.25 ≈ 0.595238`. The
  Section-6 values (`left/right: 24.5`, `top/bottom: 17/20`) implied a ratio
  of `0.6476` — about 8.8% too wide. Fix: keep `top`/`bottom` (the
  vertical measurement was fine) and solve `left`/`right` algebraically so
  the window matches the TRUE ratio instead of a traced edge:
  `left = right = 26.56` (was `24.5`). Derivation, since the align canvas
  and preview canvas are both width:height = 0.8:
  `winW/winH (on canvas) = canvasAspect * (1-(l+r)/100) / (1-(t+b)/100)`,
  solved for `(l+r)` given the target ratio. **Verified two ways before
  pushing**: (1) overlaid both the old and new window rects on 3 real TAG
  guard photos and had AI vision confirm the new, narrower box sits safely
  inside the actual clear-window opening with margin to spare (never
  crossing onto the colored frame border — narrowing a window can only ever
  reduce cutoff risk, never increase it); (2) re-ran the from-scratch Python
  compositing simulation (Section 6's method) with a synthetic magenta
  rectangle drawn at the TRUE 3.125x5.25 ratio as the "user's photo" — under
  the OLD window it overflowed/mismatched the frame opening on the sides,
  under the NEW window it filled the opening edge-to-edge on all 4 sides
  with the colored frame border fully and evenly visible. Only `tag` was
  touched — `psa` untouched, per the user's explicit scope constraint.

- **Background removal fix — actual root cause found and reproduced**: the
  code imported the library from
  `https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/dist/index.mjs`
  — this is the library's **raw, unbundled** dist file, which contains bare
  module specifiers (`import("onnxruntime-web")`, `import("onnxruntime-web/webgpu")`)
  meant to be resolved by a build-time bundler (webpack/vite/rollup) that
  substitutes in the real `onnxruntime-web` package from `node_modules`.
  Loaded directly in a browser via dynamic `import()` from a CDN — as this
  theme does, since it has no build step — those bare specifiers can never
  resolve, and it throws **every single time**, on every visitor, in every
  browser. This was proven by literally reproducing it: built a minimal test
  page, served it locally, and opened it with a real Playwright browser
  (via the `PlaywrightConsoleCapture` tool) — the exact console error was:
  `TypeError: Failed to resolve module specifier 'onnxruntime-web'` at
  `getOrt (.../dist/index.mjs:1002:5)`. This is a hard, 100%-reproducible
  JS error, not a CORS/CSP/network flakiness issue — meaning it was NOT
  intermittent, it plainly never worked for anyone, and the code's existing
  silent `.catch()` fallback (falling back to the original un-removed-
  background photo with a small, easy-to-miss text note) is exactly why the
  user never saw an explicit error, just a feature that quietly did nothing.
  **Fix**: use jsDelivr's special `+esm` combined-ESM endpoint instead of the
  raw dist file —
  `https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm` — which
  rewrites every bare import into a real resolvable CDN URL at bundle time
  (jsDelivr does this server-side, on every request, via Rollup/esbuild), so
  it works with zero build step. Confirmed this fix actually works, again
  via a real Playwright browser test against the exact same test page: the
  module imported cleanly, the ~40MB `isnet_quint8` ONNX model + WASM
  runtime downloaded, inference ran (with a harmless console warning that
  multi-threading isn't available without `Cross-Origin-Opener-Policy`/
  `Cross-Origin-Embedder-Policy` headers — confirmed to be a performance-only
  fallback, not a functional blocker, per the library's own README), and
  `removeBackground()` resolved with a real, valid, non-empty PNG blob
  (background actually removed). Also switched the model from the
  ~80MB default (`isnet_fp16`) to the ~40MB quantized `isnet_quint8` to keep
  first-run download time reasonable, since this storefront can't set the
  cross-origin-isolation headers needed for the faster multi-threaded path.
  Added a `console.error(err)` right before the existing silent-fallback
  path so any *future* failure (e.g. a visitor's ad-blocker or corporate
  network blocking jsDelivr/staticimgly.com) is at least visible in
  devtools instead of vanishing completely.
- **Reusable verification technique introduced here**: for any future bug
  report about client-side JS/WASM/canvas behavior that can't be verified
  by fetching HTML (fundamentally different limitation than the Cloudflare
  rate-limiting problem — this is about interactive script execution, not
  network access) — build a minimal standalone HTML repro of just the
  suspect code path, serve it with `python3 -m http.server` in the sandbox,
  get a public URL via `GetServiceUrl`, and open it with the
  `PlaywrightConsoleCapture` tool to capture real browser console output
  (including thrown errors with stack traces). This is how both the exact
  failure mode and the fix were proven here, rather than guessing from
  documentation alone.

---

## 6c. PSA guard "auto-center" fix — runtime bounding-box detection

**Symptom reported:** "a lot of the colors and guards aren't centered" on the
PSA guards specifically (TAG was explicitly excluded — it was already fixed,
see 6b). Request: auto-center each color option to the real perforated edges
of the PSA slab whenever a customer uploads their photo.

**Root cause (found via pixel measurement, not guesswork):** `vg-vault.liquid`
used one hardcoded `GUARD_WINDOW.psa` rectangle, defined as a fixed
percentage of the *whole canvas*, applied identically to every PSA guard
color's product photo in `drawGuardComposite()`. Real PSA guard product
photos are NOT shot on a fixed rig — each of the 14 colors' photos has its
own zoom/crop. Downloaded all 14 real front photos from
`cdn.shopify.com` (via the `shimmer-series` `products.json` — see Section 2
for the Cloudflare-rate-limit workaround) and measured them:

- The guard+slab object's own visible (non-white) bounding box ranges from
  ~62% to ~66% of the photo's width depending on the color, and isn't always
  centered in the frame (2 of 14 colors were shifted ~4pp left of the rest).
- So *any* single fixed-percentage window is only ever correct for whichever
  one photo happened to match the guess — every other color is off by
  however much that photo's real crop differs.

**Measurement method (important caveat found this session):** an initial
pass asked `understand_images` to verify the current window against each
photo with the current red-box overlay already drawn on it — this produced
an **anchoring-bias artifact**: across 14 different photos, sometimes with
completely different graded cards inside, it echoed back near-identical
numbers to the box every time, even when explicitly told not to trust the
box. **Do not verify a measurement with a vision model shown the reference
value in the same image.** What actually worked:
1. Direct pixel/numpy inspection (horizontal + vertical intensity scans) of
   several real photos, to characterize the frame-color band vs. the
   slab's own visible content.
2. A plain white-background-threshold bounding-box scan (`max(|255-pixel|) >
   12`) across all 14 photos — simple, unambiguous, no card-content
   dependency, and it's exactly what confirmed the object position/size
   really does vary photo to photo.
3. Overlay images with the *newly computed* rectangle (not the old one)
   drawn on the real photos, viewed directly (not asked to a vision model to
   "confirm a number") across 11 of the 14 products, including different
   frame colors, different demo cards (confirmed at least 3 different real
   graded cards appear across the 14 photos: Mega Gengar ex, Dark
   Charmeleon, Blaine's Charizard) and the two known outlier photos — all
   showed a clean, consistent margin around the label+card with no clipping.

**Fix — auto-detect at runtime instead of one hardcoded value:** rather than
trying to hand-tune a better single percentage (which would still be wrong
for whichever photos don't match it), `vg-vault.liquid` now detects each
PSA guard photo's own visible bounding box in the browser when it loads,
then derives that photo's window as a fixed proportional inset *from that
photo's own box* — so it "auto-centers" against whatever the real photo
actually shows instead of assuming one universal position:
- `detectContentBox(img)` — draws the loaded guard image onto a small
  (≤240px wide) offscreen canvas purely for speed, reads back pixel data,
  and returns the non-white bounding box as fractions of width/height.
  Returns `null` if the canvas can't be read (falls back to the old fixed
  percentage) — this only matters if a future host ever serves guard photos
  without CORS; `cdn.shopify.com` sends `access-control-allow-origin: *` so
  in production this always succeeds (confirmed both via `curl -I` and via a
  real Playwright browser test loading real product photos with
  `crossOrigin="anonymous"` and calling `getImageData()` — no
  `SecurityError`, and the computed boxes matched a Python simulation of the
  same algorithm run against the same photos, to the pixel).
- `GUARD_WINDOW_AUTO_MARGIN.psa = { left: 0.13, right: 0.13, top: 0.03,
  bottom: 0.03 }` — measured proportions of that box's own width/height that
  the colored guard border eats up. Left/right margin is much bigger than
  top/bottom because these guards have a real physical design with almost
  no visible border above/below the slab but a thicker gripping rail on the
  sides — confirmed consistent (~13-15%) across every photo checked once the
  box itself is used as the reference frame, even though the box's absolute
  position in the canvas is not consistent.
- `getGuardWindowRect(brand, guardImg, W, H)` picks the auto-detected path
  when both a margin config and a successfully-detected box exist for that
  brand, otherwise falls back to the old fixed `GUARD_WINDOW[brand]`
  percentages untouched — this is exactly how **TAG stays on the old,
  already-verified-correct fixed-percentage path**: it's simply not present
  in `GUARD_WINDOW_AUTO_MARGIN`, so it always takes the fallback branch.
- The box is computed once per photo (inside `loadGuardImage()`, cached as
  `img.__vgvContentBox` alongside the existing `guardImageCache`), not
  recomputed on every redraw.
- `GUARD_WINDOW.psa`'s fixed percentage still exists but now only feeds the
  generic *align-step* guide overlay (shown before any specific color is
  picked, so there's no real per-photo box to detect yet) — updated to a
  representative median across all 14 photos' own auto-detected windows
  (`{ top: 11.0, left: 27.7, right: 25.6, bottom: 12.2 }`) so the guide the
  customer aligns against during upload is a better approximation than the
  old blind visual estimate. The align step's relative positioning math
  (`relX`/`relY`/`baseHRatio` in `drawGuardComposite()`) is unaffected by
  this change — it already worked by mapping the user's position *relative*
  to the align-step guide into whatever the final window turns out to be, so
  it stays correct even though the guide and the real per-photo window are
  now two different rectangles.

**Deployed:** pushed via `shopify theme push --only
sections/vg-vault.liquid --allow-live --nodelete --force`, verified
byte-for-byte via `theme pull` into a fresh tmp dir (banner-stripped diff),
committed and pushed to GitHub.

---

## 6d. PSA align-guide/window shape correction — user-verified ground truth

**Problem reported by user (with screenshot):** after 6c shipped, the user
sent a screenshot of the align-step guide with a real PSA Mewtwo slab photo
positioned inside it, showing clearly visible empty space above the label
and below the card, still inside the dashed guide boundary. Quote: *"it
needs to perfectly fit the dimensions of a PSA slab... the registration
lines from the picture need to match perfectly all angles of the slab."*

**Root cause:** 6c's fix solved *position* (per-photo auto-centering) but
never validated *shape*. The margins used in `GUARD_WINDOW_AUTO_MARGIN.psa`
(13%/13% left-right, 3%/3% top-bottom) were an eyeballed guess from a quick
visual pass, not measured against any authoritative boundary. Reverse-
engineering the resulting window's aspect ratio (all Vault canvases share a
fixed 0.8 width:height ratio, so `windowAspect = boxAspect * (1-marginL-
marginR)/(1-marginT-marginB)`) showed these margins produced windows with
aspect ≈ 0.48-0.49 — and the align-guide's own separate fixed
`GUARD_WINDOW.psa` value (itself only a median of those same flawed
per-photo windows) inherited the same ≈0.487 ratio. A real PSA slab is
nowhere near that elongated, so scaling a real slab photo to fill the
guide's width left visible empty space top/bottom — exactly the bug
reported.

**Why not just use PSA's published slab dimensions (the TAG-fix approach)?**
Web research on PSA's *external slab* dimensions converged on a
width:height ratio of ~0.60 (multiple independent sources: forum ruler
measurements of 3-3/16"x5-5/16", a third-party grading-slab size-comparison
table citing 3.25"x5.375", etc.) On its own this would have been a
reasonable next guess (mirroring the TAG fix's method exactly), but it
describes the *whole outer slab*, not necessarily the *exact cutout window*
a specific guard manufacturer designs into their product — and this tool
needed the latter. Rather than guess further, the user was shown one of our
own diagnostic overlay images (blue = auto-detected outer guard+slab
silhouette, red = the then-current per-photo window) and hand-drew a black
box directly on it marking the true boundary: *"the black rectangle...
bordering the very edge of the beginning of the guard is the correct
dimension."*

**Extracting ground truth from the user's hand-drawn box:** downloaded the
user's annotated image, then, instead of trusting a second vision-model
pass (see the anchoring-bias caveat in 6c — still applies), located the
box programmatically: scanned fixed-position rows/columns in the flat
background margin areas (avoiding the rounded corners and card art) for
runs of near-black pixels (`grayscale < 70`), which cleanly isolates the
straight ruler-drawn lines from the card's own dark artwork. Measured
against the same-image's auto-detected outer box (found the same way as
`detectContentBox()`, via simple color-channel thresholding):
- left margin = 5.9%, right = 7.2%, top = 3.4%, bottom = 4.0% (as a
  fraction of the outer box's own width/height)
- symmetrized to `left = right = 6.56%`, `top = bottom = 3.72%` (the ~1pp
  L/R and T/B asymmetry is consistent with normal freehand-drawing noise on
  a physically symmetric manufactured product, not a real design asymmetry)

**Re-verification:** re-applied these exact margins (0.0656/0.0656/0.0372/
0.0372) to 6 different real PSA guard photos spanning different colors
(curse, voltshift, halo, solarwind, aquapulse, shockwave) and visually
inspected each resulting overlay myself (`Read` tool, not a second
vision-model call) — the computed window lands exactly on the same
guard-frame-to-slab boundary in every case, confirming the margins
generalize across the whole product line, not just the one annotated
photo. Across all 14 real photos this produces a window aspect ratio of
0.568-0.576 (essentially constant, ±1.5%) — a dramatic improvement over the
old margins' ~0.48-0.49, and reassuringly close to the independently
web-researched PSA slab ratio (~0.60), confirming both methods point the
same direction even though the user's hand-marked ground truth was used as
the authoritative source since it reflects this exact manufactured
product's own cutout, not just the generic slab spec.

**Fix applied:**
- `GUARD_WINDOW_AUTO_MARGIN.psa` (runtime per-photo composite window):
  `{ left: 0.0656, right: 0.0656, top: 0.0372, bottom: 0.0372 }` (previously
  `{ left: 0.13, right: 0.13, top: 0.03, bottom: 0.03 }`).
- `GUARD_WINDOW.psa` (fixed align-guide-only value): recomputed as the
  median photo-object position across all 14 photos with the new margins
  applied on top, giving `{ top: 11.25, left: 23.60, right: 21.48, bottom:
  12.70 }` (previously `{ top: 11.0, left: 27.7, right: 25.6, bottom: 12.2
  }`) — aspect ≈0.577, matching the real per-photo windows' 0.568-0.576
  range, so the align guide and the final composite are now shape-consistent
  with each other and with the real product.
- `getGuardWindowRect()`/`detectContentBox()`/`loadGuardImage()` logic
  itself is unchanged — only the numeric margin/window values changed; no
  code-path change was needed since the existing auto-detect architecture
  already supported per-axis margins correctly, it was only fed the wrong
  numbers.
- TAG's fixed `GUARD_WINDOW.tag` value is untouched (still 5.25"x3.125"
  slab-proportioned per section 6b).

**Deployed:** pushed via `shopify theme push --only
sections/vg-vault.liquid --allow-live --nodelete --force`, verified
byte-for-byte via `theme pull` into `/tmp/vg-verify-alignfix` (banner-
stripped diff), committed (`e68caf2`) and pushed to GitHub.

---

## 6e. TAG guard auto-centering + align-guide correction — user-verified ground truth

**Request:** after 6d shipped and was confirmed "absolutely perfect", the
user asked for the exact same auto-centering treatment for TAG guards:
*"I need it to Auto center just like the PSA guards did for the colors...
the sizing of the Tag slab for photos is perfect already, so I want it to
be exactly the same type of accuracy you did with PSA but Tag specific for
the Tag guards."*

**Initial approach (superseded mid-task):** since the existing fixed
`GUARD_WINDOW.tag` value (5.25"x3.125" slab-proportioned, from 6b) was
believed already correct, the first attempt was to *reverse-engineer* an
auto-margin set that would exactly reproduce that known-good fixed window
when applied to each real TAG photo's own detected outer box — i.e. treat
6b's value as ground truth and just add the auto-detect wrapper around it.
This worked mathematically (reconstructed the old window to <0.01% error
across all 9 real TAG photos) and was even visually plausible in isolation.

**New complication discovered along the way:** TAG's live product photos
had recently been reshot at 1800×2400px (native aspect 0.75) — different
from PSA's 1920×2400 (0.8) and from the app canvas's own aspect (0.8, e.g.
700×875 / 800×1000). Since `drawGuardComposite()` draws the guard image via
`ctx.drawImage(guardImg, 0, 0, W, H)`, which stretches the image
non-uniformly to exactly fill the canvas, a window's aspect ratio expressed
as a fraction of the image's own width/height ("raw fraction ratio") is
**not** the same as its final on-canvas *displayed* ratio — the correct
relationship is `displayedRatio = rawFractionRatio * (canvasAspect)`, since
canvasAspect already folds in the image→canvas stretch (a fraction of width
divided by a fraction of height is aspect-ratio-independent of the image's
own native pixel dimensions; it only needs multiplying by the canvas's own
W/H to know how it will actually look once stretched to fill that canvas).
This nuance mattered for sanity-checking any window ratio against TAG's
"true" ratio and had to be tracked carefully throughout this fix.

**Decisive ground truth, again from the user:** while the reverse-engineered
auto-margins were being visually verified, the user sent back one of the
generated diagnostic overlays (blue = auto-detected outer box, red = the
reverse-engineered window) with a **hand-drawn green rectangle** directly on
top of it, stating explicitly: *"the blue line you set represents the slab
with the guard on. The red is where you were going to have the perforated
area... but that is wrong. THE BLACK/GREEN rectangle that I made bordering
the very edge of the beginning of the guard is the correct dimension and
shape... be precise, and how you did it with psa guards and how it fit, and
auto centered is what I need for TAG."* This is the exact same "hand-mark
the true guard-to-slab boundary on a real photo" ground-truth method used
for PSA in 6d — and it revealed that the *theoretical* TAG window (from 6b's
published 3.125"x5.25" slab dimensions, which the reverse-engineered margins
had faithfully reconstructed) was itself measurably off against a real
photo, not just imprecisely centered.

**Extraction method (mirrors 6d, avoiding the established anchoring-bias
pitfall):** rather than asking a vision model to read off the user's
hand-drawn line (risk of anchoring on whatever reference value is already
visible in the same image), the annotated screenshot was downloaded and the
green line's position was found **programmatically** — scanning column/row
pixel-count profiles for a distinctive green color (`G−R>40 & G−B>40 &
G>100`) and locating the four dense straight-line runs (left/right/top/bottom
edges), exactly as was done for PSA's black line in 6d. The same technique
was also used to precisely re-locate the existing blue (outer box) and red
(old computed window) lines already burned into that same image, using a
tight, distinct color threshold for each. Because the user's screenshot was
a resized/letterboxed rendition of the original overlay (not pixel-identical
to the source file), the blue and red lines' **already-known exact positions**
in the original 1800×2400 image were used as calibration anchors: a linear
(affine) fit from "original-image fraction" → "screenshot pixel" was solved
per axis using all 4 known blue+red edge positions, with sub-pixel residuals
(<1px) confirming the fit was reliable — then the same fit was inverted to
map the newly-measured green line back into the original image's own
fraction space, fully independent of any assumption about how the screenshot
tool scaled/padded the image.

**Result:** measured margins (as fraction of the outer detected box, same
convention as `GUARD_WINDOW_AUTO_MARGIN`): left=4.45%, right=4.41%,
top=2.94%, bottom=2.58%; symmetrized to left=right=4.43%, top=bottom=2.76%
(comparable-magnitude L/R and T/B asymmetry to PSA's 6d measurement, treated
the same way as freehand-marking noise). Applying these margins to all 9
real TAG photos gives a tightly-clustered displayed window ratio of
0.625-0.630 (mean 0.6276, spread <1%) — vs. the theoretical published-
dimension ratio of 0.5952, meaning the *theoretical* TAG window had been
running ~5.4% narrower/taller than the guard's actual real-world window
opening all along. This is exactly what the user meant by the red overlay
looking "a little off": the shape itself needed correcting, not just its
position.

**Changes made to `sections/vg-vault.liquid`:**
- Added `GUARD_WINDOW_AUTO_MARGIN.tag = { left: 0.0443, right: 0.0443, top:
  0.0276, bottom: 0.0276 }` — TAG now uses the exact same runtime
  bounding-box auto-detection architecture as PSA (`detectContentBox()` +
  `getGuardWindowRect()`), auto-centering per real photo instead of relying
  on one universal fixed window. No changes were needed to either function's
  code — the architecture already generalized to any brand added to this
  map.
- Recomputed `GUARD_WINDOW.tag` (the fixed pre-upload align-guide value,
  shown before a specific color/photo is loaded) as the median photo-object
  position across all 9 real TAG photos with the new margins applied:
  `{ top: 17.14, left: 25.70, right: 25.68, bottom: 20.87 }` (previously `{
  top: 17.0, left: 26.56, right: 26.56, bottom: 20.0 }`, which had been
  derived from the now-superseded theoretical slab-dimension ratio).
- Updated surrounding comments to remove the now-stale "TAG is intentionally
  not in this map" language and document the corrected methodology and the
  image/canvas aspect-ratio nuance discovered along the way.

**Verified before deploying:** visually inspected the resulting window
overlay on 7 of the 9 real TAG photos (multiple different colors/cards),
confirming the window now lands tightly on the true guard-to-slab edge in
every case — visibly tighter/more accurate than the old (theoretical-ratio)
window, and matching the user's own hand-marked line almost exactly on the
photo they annotated. Also re-ran a from-scratch Python simulation mirroring
`detectContentBox()`/`getGuardWindowRect()` exactly, on both real app canvas
sizes (700×875 align canvas, 800×1000 preview canvas — both aspect 0.8),
confirming the same 0.625-0.630 clustering holds on the actual canvases the
app uses, not just in raw-image-fraction space.

**Deployed:** pushed via `shopify theme push --only
sections/vg-vault.liquid --allow-live --nodelete --force`, verified
byte-for-byte via a fresh `theme pull` into `/tmp/vg-verify-tagfix`
(banner-stripped diff, exact match), committed (`70c0926`) and pushed to
GitHub.

---

## 6f. TAG align-guide height correction — real-slab ground truth supersedes 6e

**Request:** after 6e shipped, the user tested the live align UI against a
real photographed TAG slab and reported the guide was "a little off" —
*"the registration lines need to be shorter in width... because when I zoom
to cover the full dead space it cuts off some of the tag slab."* The user
provided a screenshot of the live align step for reference.

**First investigation (found no supporting evidence — width was not the
issue):** the screenshot was analyzed with contamination-free color masking
restricted to the gray container bounds, plus flat, non-corner edge
measurements comparing the deployed 6e guide box against the real
photographed slab's own silhouette in that same screenshot. Result: the 6e
guide (ratio 0.6265) and the real slab (ratio 0.6269) matched to <0.1% —
directly contradicting the "too wide" complaint. This evidence (precise
pixel measurements + magnified flat-edge crops showing the dashed line
sitting directly on the slab's edge on all 4 sides) was shared back with the
user, along with a request for a screenshot that actually showed the
cropping, rather than making an unfounded change on a complaint the data
didn't support.

**Decisive ground truth, reframing the problem as HEIGHT not width:** the
user then sent a new annotated screenshot with a hand-drawn **red rectangle**
("the outside of the guard") and a hand-drawn **black rounded rectangle**
near the top, explaining: *"you can see that I positioned the slab
perfectly on sides and the bottom on the perforated guide, but there's a
lot of missing slab because the rectangle is not long enough. See the Black
rectangle I created that's the amount that we need to add in height to have
the slab fit perfectly."* This completely reframed the issue: the guide's
**top** edge needed to move up (decrease the top-margin percentage) to
include the slab case's own rounded top cap/lip — a raised blank plastic
area at the very top of a real TAG slab, distinct from the label/QR-code
area below it — which the 6e guide had been excluding. Left/right/bottom
were confirmed still correct as deployed.

**Why 6e's ground truth missed this:** the 6e mark had been drawn on a
studio photo of the guard **product** (colored frame + cutout), which does
not include a real slab's own top cap at all — so no amount of careful
measurement against that photo could have surfaced the gap. It took a
second, more direct ground truth — hand-marked by the user on a live
screenshot of an **actual uploaded slab photo** — to reveal it. This also
explains why the first (width) investigation found a near-perfect match:
that measurement was only sensitive to whatever portion of the slab was
visible in that particular screenshot, and didn't surface the top-cap
exclusion the same way the red/black annotation did.

**Extraction method (same affine-calibration technique as 6d/6e):** the
annotated image (758×1024) was downloaded and measured programmatically:
- Background gray: (156,155,150)
- Red rectangle ("outside of the guard"): left≈121, right≈669.5, top≈54,
  bottom≈947.5 (ratio 0.6139)
- Current deployed blue dashed guide line: left≈149, right≈640, top≈144,
  bottom≈920 — verified via visual overlay to trace exactly onto the real
  rendered dashed line (critical sanity check before trusting any
  calibration built on top of it)
- Black rectangle ("amount to add in height"): top border rows 77-85
  (center=81), bottom border rows 133-141 (center=137)

Since the user's screenshot is a resized rendition whose absolute scale/
origin relative to the true canvas is unknown, a per-axis linear (affine)
fit `pixel = a*frac + b` was solved using the two already-known equations
from the currently-deployed fixed percentages (mapped to their measured
pixel positions in the screenshot), then inverted to convert the black
rectangle's measured top position into canvas-fraction space — giving the
new `GUARD_WINDOW.tag.top` value.

**Units/methodology error caught mid-calculation:** when first computing the
corresponding `GUARD_WINDOW_AUTO_MARGIN.tag` top/bottom values, the
canvasAspect correction described in 6e (`displayedRatio = rawFractionRatio
* canvasAspect`) was mistakenly applied a **second time** to a quantity that
was already in canvas-px space, producing wildly wrong, seemingly-impossible
results. This was caught by cross-verifying the OLD (6e) margins against a
from-scratch simulation using the exact runtime JS logic (`getGuardWindowRect()`'s
auto-margin path computes `boxW=(box.right-box.left)*W` and
`boxH=(box.bottom-box.top)*H` using the actual canvas W,H directly, not the
photo's own thumbnail dimensions — this already fully replicates
`ctx.drawImage(guardImg,0,0,W,H)`'s non-uniform stretch, with no further
aspect correction needed) — confirming it reproduces the previously-
validated 0.625-0.630 range. The calculation was redone with the corrected
method.

**Result — corroborated by triangulation:** the corrected calculation still
showed the exact per-photo top+bottom margin needed (as a fraction of each
photo's own auto-detected content box) came out **negative** on average
(-0.0166 across the 9 real TAG photos) — meaning the auto-detected box's own
natural height, after only left/right trimming, is already essentially the
correct slab height, with no further vertical shrink needed. Since the
current code doesn't cleanly support a negative margin, `top=bottom=0` was
chosen as the closest valid value. This was cross-checked against two
independent sources before committing to it:
- TAG's own theoretical published slab ratio (5.25in×3.125in ≈ 0.5952,
  from `https://help.taggrading.com`, the same spec used in 6b/6e)
- The "natural" ratio produced by `GUARD_WINDOW_AUTO_MARGIN.tag` with
  top/bottom margin set to 0 (i.e. no vertical trim at all): ≈0.590 mean
  across the 9 real TAG photos on both real app canvas sizes (700×875,
  800×1000), range 0.585-0.596

Both of these closely bracket the direct 6f measurement (0.5804) — a far
tighter, more physically sensible cluster than 6e's 0.625-0.630 — giving
high confidence in both the direction and magnitude of the fix.

**Changes made to `sections/vg-vault.liquid`:**
- `GUARD_WINDOW.tag.top`: `17.14` → **`12.10`** (left/right/bottom unchanged:
  `25.70`/`25.68`/`20.87`)
- `GUARD_WINDOW_AUTO_MARGIN.tag`: `top`/`bottom` `0.0276`/`0.0276` →
  **`0`/`0`** (left/right unchanged: `0.0443`/`0.0443`)
- Rewrote the surrounding comment blocks documenting the 6e→6f methodology
  change, the corroboration sources, and why top/bottom auto-margin is now 0.

**Verified before deploying:** re-simulated `getGuardWindowRect()`'s exact
runtime logic against all 9 real TAG guard photos on both real canvas sizes
with the new values, confirming the tightly-clustered 0.585-0.596 (mean
0.590) result above. Also rendered the new computed window (as a green box)
directly on the user's own red/black-annotated reference image
(`new_window_overlay.png`) and visually confirmed the new top edge lines up
almost exactly with the top of the user's hand-drawn black rectangle.

**Deployed:** pushed via `shopify theme push --only
sections/vg-vault.liquid --allow-live --nodelete --force`, verified
byte-for-byte via a fresh `theme pull` into `/tmp/vg-verify-tagheight`
(banner-stripped diff, exact match), committed (`b8bdc7f`) and pushed to
GitHub.

**⚠️ This fix was itself found to be a regression — see 6g immediately
below, which reverts it.**

---

## 6g. Revert of 6f — zero vertical margin broke the guard's own frame border

**The bug, caught immediately by the user testing live:** after 6f shipped,
the user tested with a real photographed TAG slab (a graded Pokemon Mewtwo
card) and reported: *"look at how off it is now. if you look at the top and
bottom this is the result, the color of the guard is cut off."* An
`understand_images` check of the screenshot confirmed it precisely: the
left/right edges showed the guard's normal black-outer/red-inner colored
frame band, but at top and bottom that same colored band was **completely
absent** — the slab's own white plastic ran straight to the outer casing
edge, with no frame color at all top/bottom.

**Root cause — a fundamental misunderstanding of what the window rect
controls:** re-reading `drawGuardComposite()` closely revealed that
`getGuardWindowRect()`'s returned rect is not merely "how much of the slab
photo to show" - it is used for **two** clips:
1. The user's slab photo is clipped to draw *only inside* this rect.
2. The guard product image is clipped (via an evenodd "donut" path: outer
   canvas rect XOR the window rect) to draw *only outside* this rect.

This means the window rect **is** the literal, exact boundary between
"rendered as guard frame" and "rendered as slab window" in the final
composite - it is not a soft preference, it is a hard mask. 6f's change of
`GUARD_WINDOW_AUTO_MARGIN.tag.top/bottom` from `0.0276` to `0` meant the
window's top/bottom edges were set to sit exactly on the guard photo's own
auto-detected outer silhouette edge (zero inset) - leaving **zero pixels**
of vertical space in which the guard's own frame material could ever be
drawn. The frame didn't get thinner; it was mathematically eliminated at
top/bottom. The 6f reasoning that arrived at this value (solving for a
"negative" needed margin, then rounding up to the nearest valid value of 0)
was a plausible-looking derivation that nonetheless produced an obviously
wrong result once actually rendered - this is exactly the failure mode this
change should have been visually checked against (a rendered composite,
not just a numeric ratio simulation) before deploying, and wasn't.

**Independent re-verification that 6e's original margin was correct all
along:** rather than just reverting on faith, the frame-to-slab boundary
was re-measured directly and independently, using a different technique
than 6e's single user-hand-mark: zoomed, pixel-gridlined crops of the top
and bottom edge regions of 3 different real TAG guard product photos
(aquafrost/blue, voidshift/dark purple, solarshade/orange - chosen for
color variety) were generated and visually read frame-by-frame to find the
exact row where the colored frame material transitions to the slab's own
plastic/label color. (An initial attempt to fully automate this via
gradient/edge detection was tried first and discarded - it proved unreliable,
picking up glitter-texture and JPEG-noise gradients instead of the true
seam; direct visual reading of gridlined crops was more trustworthy.)
Results: top margins of 2.10%, 2.51%, 2.11% of each photo's own outer-box
height (average 2.24%), bottom margins of 2.54%, 2.26%, 2.50% (average
2.43%) - closely matching the existing 6e value of 2.76% (well within
normal measurement tolerance for a 3-photo spot check), and nowhere close
to 0%. Re-simulating `getGuardWindowRect()`'s exact runtime logic with the
reverted 0.0276 margin across all 9 real TAG photos on both real app canvas
sizes reproduced the previously-validated 0.625-0.630 ratio range exactly.

**Changes made to `sections/vg-vault.liquid`:**
- `GUARD_WINDOW_AUTO_MARGIN.tag.top/bottom`: `0`/`0` → **`0.0276`/`0.0276`**
  (the 6e value, restored)
- `GUARD_WINDOW.tag.top`: `12.10` → **`17.14`** (the 6e value, restored, so
  the align-guide shown before a photo is uploaded stays a consistent shape
  with the actual 6e-margin render window)
- Rewrote the surrounding comments to document the 6f regression, why it
  broke the render (the clip-boundary mechanism above), and the 3-photo
  independent re-verification supporting the revert.

**What this does NOT resolve:** the original concern behind 6f - that a
real user's photographed slab might show its rounded top cap getting
covered by the guard's frame - is not further addressed by this revert.
6g's finding is that the *window's* margin is constrained by the guard
product's own physical frame border (confirmed present at ~2.1-2.5% on 3
different real guard colors) and cannot be reduced without destroying that
visible border - if a real slab is taller than this physical window, that
is a property of the real product, not a software bug, and the tool should
render it faithfully rather than paper over it by masking out the guard's
own frame. If cropping is still observed after this revert, the next step
should be a direct, unedited photo of the user's own physical guard+slab
(not a screenshot of this tool) so the true physical window can be
compared against a real, non-tool-generated reference.

**Deployed:** pushed via `shopify theme push --only
sections/vg-vault.liquid --allow-live --nodelete --force`, verified
byte-for-byte via a fresh `theme pull` into `/tmp/vg-verify-tagrevert`
(banner-stripped diff, exact match), committed (`8908da4`) and pushed to
GitHub.

---

## 6h. Align-guide "too short" feeling — resolved via copy, not geometry

**Context:** after 6g shipped, the user confirmed *"the amount of guard
shown on all sides is perfect"* (the render/mask is correct). They then
raised a separate, second concern: *"the registration lines for when taking
a picture or uploading the picture is off again. its too short."* - this is
about the **align-step guide** (the dashed box shown during Step 3, driven
by the fixed `GUARD_WINDOW` percentages via `guideRectForBrand()`), not the
render mask (driven by `GUARD_WINDOW_AUTO_MARGIN` + auto-detection, which
they'd just confirmed was correct). They asked directly: *"if you were to
adjust would it cover the color of the guard?"*

**Why the guide and the render mask are architecturally decoupled:** the
align-step guide is used only for two things: (1) drawing the dashed
overlay the user aligns against, and (2) as the reference frame for
converting the user's drag/zoom position into a *relative fraction*
(`relX`, `relY`, `baseHRatio` in `drawGuardComposite()`), which is then
re-applied onto the real, per-photo `winRect` from `getGuardWindowRect()`.
Changing the guide's fixed percentages does not touch
`GUARD_WINDOW_AUTO_MARGIN` or the auto-detected content box at all - so it
cannot reintroduce the 6f-style frame-vanishing bug. The one thing that
*does* matter is that the guide's own aspect ratio stays close to the real
window's ratio (currently ~0.627-0.629, confirmed in 6e/6g), so that
"filling the guide" during alignment maps proportionally onto "filling the
window" at render time - this already holds today (`GUARD_WINDOW.tag`'s
guide ratio computes to ~0.6277, matching).

**Why "too short" is structurally expected, not a bug:** the guard's window
trims proportionally more off the width (left+right auto-margin 4.43% each)
than off the height (top+bottom auto-margin 2.76% each) - because that's
what the real, physically-measured guard hardware does (confirmed in 6e/6g
across 9 + 3 real photos respectively). This asymmetric trim necessarily
makes the *visible-through-the-window* ratio (~0.627) wider relative to
height than a bare TAG slab's own full-body ratio (~0.595-0.61 theoretical).
Any user photographing their *entire* slab and trying to make it exactly
fill a guide shaped like the *window* will, by definition, always have some
top/bottom (or corner) overflow - this is an inherent consequence of the
guard's own design (the window doesn't show 100% of the slab), not
something a differently-shaped guide can "solve" without becoming
inaccurate to the real window.

**Resolution taken - copy, not geometry:** rather than risk a third
speculative geometry change in a row (6e and 6f each required a correction
after deploy), and because the user's own follow-up message concluded *"ok
so the registration lines aren't perfect for tag but it looks great as it
doesnt mess up the guards picture when uploading it"* (i.e. explicitly
accepting the current geometry once the render itself was confirmed
correct), the fix implemented was to the **instructional copy only**,
updating the single shared Step 3 "Align your slab" text (used identically
for both PSA and TAG - it's brand-agnostic in the DOM) from:

> Drag to position, pinch or scroll to zoom until your slab fills the guide.

to:

> Drag to position, pinch or scroll to zoom until the guide is fully
> covered by your slab. Part of the slab may end up cropped off - that's
> completely normal, just make sure there are no gaps. If your slab photo
> still shows a guard or case on it, retake or crop the photo so the guard
> itself is out of frame.

This directly requested addition (a) sets the correct expectation that
some cropping is normal given the guard's real window shape, reframing
"fill the guide" as the actual goal (no gaps) rather than "fit the whole
slab", and (b) reminds users uploading a photo of a slab that already has
some *other* guard/case on it to remove it from frame first, since the tool
expects a photo of the bare slab.

**Deployed:** pushed via `shopify theme push --only
sections/vg-vault.liquid --allow-live --nodelete --force`, verified
byte-for-byte via a fresh `theme pull` into `/tmp/vg-verify-copytext`
(banner-stripped diff, exact match), committed (`357ea84`) and pushed to
GitHub.

---

## 6i. Align-step instructions redesigned as a scannable checklist

**Request:** the 6h paragraph (*"Drag to position, pinch or scroll to zoom
until the guide is fully covered by your slab. Part of the slab may end up
cropped off..."*) was correct in content but the user found it too wordy:
*"can you clean up the whole explanation on when its explaining how to
align the slab. the info is needs theres just too much wording. maybe
bullet points or list checkpoints so its more user friendly."*

**Change made to `sections/vg-vault.liquid`:** replaced the single dense
`<p>` block (Step 3 "Align your slab", shared identically by PSA and TAG)
with the same tip-card pattern already used one step earlier in Step 2
("Upload your slab photo" - a `.vg-card-flat` box with an icon + text) and
a short checklist, so the instruction is scannable rather than a single
paragraph:
- A short bold header line with a drag icon: "Drag to position, pinch or
  scroll to zoom"
- Three checkbox-style list items (each with a small gold check icon):
  1. "Fill the guide completely - no gaps around the edges"
  2. "Some cropping at the edges is normal - that's OK"
  3. "Slab already in a guard/case? Retake or crop the photo so it's out
     of frame"

Same information as 6h, same shared markup for both brands, just
restructured for scannability per the user's request - no wording meaning
was changed, no geometry/logic touched.

**Deployed:** pushed via `shopify theme push --only
sections/vg-vault.liquid --allow-live --nodelete --force`, verified
byte-for-byte via a fresh `theme pull` into `/tmp/vg-verify-checklist`
(banner-stripped diff, exact match), committed (`c0609f4`) and pushed to
GitHub.

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
