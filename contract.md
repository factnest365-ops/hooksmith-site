# CONTRACT - Hooksmith public site v2 (frozen technical interface)

This document pins the buildable/testable interface for the v2 artifact. It is derived from
`BRIEF.md` (frozen) and the v1 page `Shared/hooksmith/site/index.html` (behavioral base).
Where this contract is silent, the v1 page is the default. Where BRIEF.md and this contract
conflict, BRIEF.md wins.

---

## 1. File layout

Exactly one deliverable file: `artifacts/index.html` inside this factory folder
(`Shared/hooksmith/factory/site-v2/`). Nothing else is produced by the builder.

Hard rules:

1. `<!doctype html>` + `<html lang="en">` + `<meta charset="utf-8">` + `<meta name="viewport" content="width=device-width, initial-scale=1">` + `<meta name="color-scheme" content="dark">`.
2. Exactly **one** `<style>` tag in `<head>` containing all CSS. No external CSS.
3. Exactly **one** `<script>` tag, placed as the last element before `</body>`, containing all JS. No external JS.
4. External resources: Google Fonts only, loaded as two `rel="preconnect"` links (`https://fonts.googleapis.com`, `https://fonts.gstatic.com` with `crossorigin`) plus exactly **one** `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">`.
5. No other `http(s)` resource of any kind: no `<img src>`, no CDN scripts, no icon fonts, no analytics. `data:` URIs are allowed (favicon, grain background, dither pattern) and inline SVG is allowed.
6. `<title>` and `<meta name="description">` present; the v1 title/description copy carries over unchanged in meaning.
7. All JS must run error-free with the Google Fonts stylesheet blocked or failing (font fallbacks handle it) - i.e. no JS depends on font loading.

---

## 2. Section inventory (ordered)

Body order is fixed. Top-level sections and their exact `id` / label text:

| # | Element | id | Section label text (`.label`, mono, exact string) | Notes |
|---|---------|-----|---------------------------------------------------|-------|
| 1 | `<header class="top" id="top">` | `top` | - | Fixed top bar, logo + nav + CTA. Nav anchors: `#loss #line #terms #questions`. CTA anchors to `#contact`. Skip link `href="#main"` present. |
| 2 | `<main id="main">` wraps 3-10. Hero `<section class="hero">` | (hero has no id; anchor is `main#main`) | - | Thermal field canvas `#field` fills hero. `.meta` strip top of hero must contain: text `THERMAL FIELD`, text `SIMULATED / 7-STEP RAMP`, and the **IR ramp legend** `.ramp` (see effects). |
| 3 | `<div class="marquee">` | none | - | **NEW.** Ticker strip directly after hero, before `#loss`. CSS-animated, `aria-hidden="true"`. Items must include the honest phrases: `~2 sec`, `billed on the first caught call`, `no card before proof`, `no recording`, and one illustrative-data note (contains `llustrative`). |
| 4 | `<section id="loss">` | `loss` | `01 / The loss` | Loss copy + loss calculator (JS module `calculator`). |
| 5 | `<section id="line">` | `line` | `02 / The line` | Copy + call log `.log` with `#logbody` (JS module `call-log`). Log gets the **CRT treatment** (see effects). |
| 6 | `<section id="triage">` | `triage` | `03 / Triage` | 4 triage cards; topographic contour SVG `#contour` positioned absolutely behind `.wrap`. |
| 7 | `<section id="terms">` | `terms` | `04 / Terms` | Embossed `$2,000` price plate (`.plate`) + terms list. **The plate is the only embossed element on the page.** |
| 8 | `<section id="proof">` | `proof` | `05 / Proof` | Honest no-clients copy + **NEW riso dispatch sheet** `.riso` (see effects). |
| 9 | `<section id="questions">` | `questions` | `06 / Questions` | FAQ accordion: native `<details>/<summary>` only (JS adds single-open behavior). |
| 10 | `<section id="contact">` | `contact` | `07 / Start` | Contact copy + `mailto:hooksmith@gmail.com` link with prefilled subject/body. |
| 11 | `<footer>` | none | - | Footer meta row (no address/entity claim) + **NEW giant wordmark**: `<div class="wordmark" aria-hidden="true">HOOKSMITH</div>`, oversized (font-size >= 12vw, `--fs-giant`), clipped or fitted to viewport width, `overflow-x` must stay hidden. |

Required IDs that must exist in the DOM (exact spelling): `top`, `main`, `field`, `loss`, `line`,
`triage`, `terms`, `proof`, `questions`, `contact`, `logbody`, `missed`, `annual`, `verdict`,
`contour`, `warp` (SVG displacement filter), plus `#calc-lbl` label id from v1.

Required classes: `.rv` (reveal targets), `.label`, `.band`, `.marquee`, `.ramp`, `.riso`,
`.grain`, `.wordmark`, `.plate`, `.calc`, `.log`, `.log-body`/`.log-row`, `.faq`, `.cards`,
`.card`, `.terms`, `.mail`, `.btn`, `.skip`.

**Dithered transition bands (NEW):** at least one `<div class="band" aria-hidden="true">` element
placed between two top-level sections (recommended: immediately before `#loss`; optionally before
`#terms` and/or `#proof`). Height `clamp(36px, 6vw, 96px)`. Treatment: dithered dot/checker
pattern (Bayer-look, e.g. repeating gradients or data-URI SVG) in void/deep tones with heat
edge tint. 1-3 bands total, builder's choice.

**Effect placement summary (a-k):** a thermal field `#field` (hero) + `.ramp` legend (hero meta);
b Bayer dithering on `#field` + `.band`; c `#contour` behind `#triage` and reused behind
`#contact` (same generator or a second instance; both sections must show contour lines);
d emboss on `.plate` only; e `.riso` in `#proof`; f CRT on the call log in `#line`; g fisheye
post-process inside the field module; h SVG `#warp` filter applied to `#contour` paths (and/or a
wisp divider); i `.grain` fixed overlay on `body`; j `.marquee`; k `.wordmark`.

---

## 3. CSS variable contract

All tokens defined in the single `:root` block. Tests may check for these declarations in `:root`.

Tier 1 - **must define, exact values pinned**:

```css
--void:#05060A;      /* page ground */
--deep:#0A0F18;      /* card ground */
--bone:#EDE9E1;      /* body text / riso paper */
--heat:#FF5C1A;      /* accent ink */
--disp:"Inter Tight",-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
--mono:"JetBrains Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace;
--pad:clamp(20px,4vw,56px);      /* page gutter */
--maxw:1240px;                   /* content max width */
```

Tier 2 - **must define, values pinned** (v2 extends v1's set; values may be tweaked +- but the
names must exist and resolve):

```css
--deep2:#0D1420;                       /* third ground */
--mist:rgba(237,233,225,.56);          /* secondary text */
--faint:rgba(237,233,225,.34);         /* tertiary text */
--line:rgba(237,233,225,.09);          /* hairline */
--line2:rgba(237,233,225,.16);         /* stronger hairline */
--heat-soft:rgba(255,92,26,.12);       /* heat wash */
--phos:#FFB25C;                        /* CRT phosphor amber */
--riso-ink:#0078BF;                    /* riso second ink (heat + ink overprint) */
--fs-h1:clamp(52px,8.4vw,124px);
--fs-h2:clamp(34px,4.6vw,58px);
--fs-h3:clamp(20px,2vw,24px);
--fs-lead:clamp(17px,1.35vw,19.5px);
--fs-body:17px;
--fs-label:11px;
--fs-giant:clamp(72px,18vw,260px);     /* footer wordmark */
```

Tier 3 - builder's choice, but must be tokens if used at all: any additional alpha/spacing
variables. Body font-size, section padding (`clamp(72px,10vw,140px)` vertical in `.wrap`), and
all decorative values (scanline spacing, grain opacity, riso offset) must come from declared
variables or be hard-coded locally per component; no magic numbers duplicated across unrelated
rules.

---

## 4. JS module inventory

One `<script>` block, ES5-compatible, wrapped in a single IIFE with `"use strict"`. A single
`reduce` boolean is computed once at load: `matchMedia("(prefers-reduced-motion: reduce)").matches`.

Each module **must be preceded by a comment marker containing its name** so blind text scans can
locate it (v1 style, e.g. `/* ---------- thermal field ---------- */`). Required markers:

`thermal field`, `fisheye`, `scroll`, `reveal`, `call log`, `calculator`, `contours`, `faq`.

(The words may differ slightly in case/punctuation but the module name must appear in a comment.)

| Module (marker) | DOM touched | Responsibility | Reduced-motion behavior |
|---|---|---|---|
| `thermal field` | `#field` | Offscreen low-res buffer canvas (sensor width **144-320 px**, height proportional to aspect) draws an animated heat field: value-noise/fbm sampling, **7-step false-color IR ramp**, **4x4 Bayer ordered dithering** (threshold matrix applies before level index), heat source low-right with rising plume. Output blitted to `#field` with `imageSmoothingEnabled=false` / `image-rendering:pixelated`. Frame loop throttled to ~10-12 fps (>= 60 ms between frames). Resize handler re-fits and re-draws. | No rAF loop. One static frame drawn at a fixed time value. Resize still re-draws the static frame. |
| `fisheye` (part of field module or its own block) | `#field` buffer | **Barrel-warp post-process** on the hero field edges: per-pixel or blit-time radial remap so edge regions bow (visible curvature at canvas edges; center of hero stays readable under the scrim). Implemented in JS on the buffer or during the draw call - not a CSS filter on the element. | Static frame includes the warp (warp is not an animation). |
| `scroll` | `#top` | Sets `--p` (0..1, 3 decimals) on `#top` from scroll position; drives the top-bar progress hairline. Passive listener. | None needed (instant value). |
| `reveal` | `.rv` elements | `IntersectionObserver` (threshold ~0.14, bottom rootMargin ~-8%) adds `.in` once and unobserves. | CSS is authoritative: under reduce, `.rv` is visible without transition (see below). Observer may run harmlessly. |
| `call log` | `#logbody`, its `.log-row` children | On `#logbody` intersecting (threshold ~0.4), observer disconnects and rows get `.on` in staggered sequence (~340 ms initial + ~520 ms per row). | All rows `.on` immediately, no stagger timers. |
| `calculator` | `#missed`, `#annual`, `#verdict` | Range input `min=1 max=40 step=1 value=6`. On `input` and at init: output and verdict text = `"$" + (value * 3867).toLocaleString("en-US")` (3867 = the national average figure, the only permitted multiplier). Also sets slider track fill `--fill` (%). | Not animation-dependent; runs normally. |
| `contours` | `#contour`, filter `#warp` | Generates ~11 concentric wobbly closed paths (viewBox `0 0 1200 640`, ellipse squash ~0.62) into `#contour`; 2 "hot" rings stroked `rgba(255,92,26,.30)`, rest `rgba(237,233,225,.075)`. **Every path carries `filter="url(#warp)"`** (or the whole svg does). `#warp` is defined once in an inline SVG `<defs>`: `feTurbulence type="fractalNoise"` (baseFrequency ~0.008-0.02, any seed) + `feDisplacementMap scale` in 2-14. | Static; no turbulence animation. |
| `faq` | `.faq details` | `toggle` listener closes sibling `<details>` so only one is open at a time. Native semantics otherwise. | None. |

**CSS-only modules (no JS, no marker needed):** `.marquee` (track duplicated content, keyframed
`translateX(-50%)` loop; under reduce: `animation:none`, content shows as a static row),
`.grain` (fixed full-page overlay, inline/data-URI SVG turbulence, opacity <= 0.06,
`pointer-events:none`), `.band`, `.ramp`, `.riso`, CRT treatment of `.log`, `.plate` emboss,
`.wordmark`.

**Reduced-motion CSS (must be present, from brief DoD 5):** under
`@media (prefers-reduced-motion: reduce)`: canvas animation off (JS), `.marquee` animation none,
CRT `.flicker` animation none, `.rv`/`.log-row` shown without transitions, `scroll-behavior:auto`.

---

## 5. Honesty invariants (machine-checkable)

Static text scans against the source of `artifacts/index.html`. Case-sensitive substring rules.
(Assumption A1 explains the ASCII-label pinning.)

### 5.1 MUST contain

| Rule | Exact substring(s) | Where it must appear |
|---|---|---|
| H1 | `Illustrative - sample data` | Call log head (in `#line`). |
| H2 | `Sample - not a real dispatch` | Riso dispatch sheet (in `#proof`). |
| H3 | `mailto:hooksmith@gmail.com` | At least once (contact link; footer may repeat). Subject/body prefilled per brief. |
| H4 | `$2,000` | At least one **contiguous** occurrence (hero CTA and/or contact mini line; the plate may split `$`/`2,000`). |
| H5 | `3,867` | The national-average figure with its "national average / industry figure" framing nearby in copy. |
| H6 | `~2 sec` | Hero fact block and/or marquee. |
| H7 | `no card before proof` AND `no recording` | Marquee items and/or terms/FAQ copy. |

### 5.2 MUST NOT contain

| Rule | Forbidden pattern |
|---|---|
| B1 | The strings `1,999`, `2,499`, `2,999`, `$1,999`, `$2,499`, `$2,999`, `Blueprint` anywhere (including inside calculator logic comments - the only multiplier in JS is `3867`). |
| B2 | The string `our clients say`. |
| B3 | The string `Testimonials` (capital T) anywhere; the word `testimonials` (lowercase) is allowed **only** inside the honest proof-denial sentence. |
| B4 | `<blockquote` and any star-rating characters (`★★`). |
| B5 | The phrase `call our demo line`, the phrase `demo line` used as a CTA, and the URI scheme `tel:`. |
| B6 | Any 10-digit phone number: the regex `(\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}` must not match the file. Sample blocks must not contain phone numbers (use `callback on file`). |
| B7 | Any external `http(s)` URL other than the two Google Fonts hosts (`fonts.googleapis.com`, `fonts.gstatic.com`). |
| B8 | Customer logos, invented client names presented as clients, or `<img>` tags of people (no stock-photo people). Screenshot-judged, plus: no `<img` tags at all in v2. |

### 5.3 Structural truthfulness

- The `.riso` sheet and the CRT log are the only fabricated-data blocks; both carry their H1/H2
  label. Any other new sample-data block must carry the same style of label (reuse H1 or H2 text).
- Footer contains no address, no legal entity name beyond "Hooksmith", no registration claims.
- The IR ramp legend endpoints are labeled non-numerically (`COLD`/`HOT` or similar) - no invented
  temperature figures (see A7).

---

## 6. Assumptions the contract had to make

| # | Assumption | Rationale |
|---|---|---|
| A1 | Sample-data labels are pinned as **ASCII**: `Illustrative - sample data` and `Sample - not a real dispatch` (plain hyphen, regular spaces). The brief writes them with hyphens; v1 used `&mdash;`/`&nbsp;`. ASCII pins make blind file scans exact. | Testability over typography; rendered look differs only in the dash glyph. |
| A2 | `--phos` pinned to `#FFB25C` (v1's existing amber) rather than classic phosphor `#FFB000`. | Continuity with v1 flag-row color; either is plausible, one had to be chosen. |
| A3 | `--riso-ink` pinned to `#0078BF` (classic riso blue) as the second ink over heat orange on bone paper. | Brief says "two-ink overprint (heat orange + ink)" but names no ink color. |
| A4 | Field sensor buffer width allowed in **144-320 px** (v1 uses 216x122). | Brief says "low resolution buffer (like v1)"; any value in this range passes. |
| A5 | CRT flicker = opacity keyframes with **max delta 0.06** (e.g. 1 -> 0.94), 3-6 s cycle, on a pseudo-element only. | Brief says "subtle flicker"; needed a number for testing. |
| A6 | Grain overlay opacity <= 0.06; grain is static (no animation) per DoD 8. | "Very low opacity" needed a bound. |
| A7 | IR ramp legend labels are non-numeric (`COLD`/`HOT`). Constraint 6 bans invented numbers; temperature readings would be invented data. Ramp step count text "7-STEP RAMP" is carried over from v1 approved copy and is not treated as a banned "number". | Brief silence + constraint 6. |
| A8 | The 7-step ramp's exact RGB stops may differ from v1's, but must run dark void -> heat orange -> bone/white, and `.ramp` swatches must visually match the field ramp. | Brief says "keep/upgrade"; only the ramp's existence and 7 steps are pinned. |
| A9 | Fisheye strength is not numerically pinned: requirement is that the warp is visible in screenshots at hero edges while hero text remains readable (scrim unchanged). | Visual effect; screenshot verification owns it. |
| A10 | Marquee content is duplicated at least twice for a seamless `translateX(-50%)` loop; the strip is `aria-hidden="true"` because all its phrases exist elsewhere in the page. | Standard marquee technique; a11y reasoning. |
| A11 | Contour lines behind `#contact` may be a second SVG instance (generated by the same module) or the same markup pattern; both must exist visually. The `#warp` filter may live in a hidden `<svg><defs>` block or inside `#contour`. | Brief: "reused behind contact"; placement mechanics left open. |
| A12 | Constraint 6's "nothing else invented" is interpreted as banning invented *performance/pricing* figures. Illustrative blocks may contain fabricated timestamps, street references, and field labels because v1's approved copy already does (02:14:07, Plano TX) and constraint 5 covers them. B6 still bans phone numbers everywhere. | Reconciles constraints 5, 6, and 9 with v1 precedent. |
| A13 | Band count is 1-3; placement before `#loss` is required only as "recommended" - the hard rule is >= 1 `.band` between two sections. | Brief: "at least one dithered transition band". |
| A14 | Wordmark is `aria-hidden` decorative text (not an `<h1>`/logo link) so screen readers don't read "HOOKSMITH" twice. | Standard practice for oversized footer marks. |
| A15 | The calculator's `3867` multiplier is the only numeric constant in JS arithmetic; the label copy "national average" framing from v1 carries over verbatim in meaning. | Constraint 6. |
| A16 | Font weights pinned to v1's set (Inter Tight 400/500/600/700, JetBrains Mono 400/500) in the single stylesheet link; CRT/riso styling must not require additional weights. | Keeps the "one stylesheet link" rule simple. |
