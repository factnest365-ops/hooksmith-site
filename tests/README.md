# site-v2 blind contract tests

Blind test layer of the software factory mesh. Written from `contract.md`, `RULINGS.md` and
`spec.md` only - never from the implementation. The runner reads exactly one file (the artifact)
and asserts the SCAN-level rules; it contains no DOM, no browser, no network, no dependencies.

## Run

```
node tests/site-contract.mjs <path-to-index.html>   # explicit artifact path
node tests/site-contract.mjs                        # from factory folder: defaults to artifacts/index.html
```

Exit codes: `0` all checks pass, `1` one or more FAIL, `2` usage error (file missing/unreadable).

Output: one `T-xx PASS/FAIL <name> [- reason]` line per check, then a summary and the failing ids.
Checks run against the file text with `data:` URI payloads stripped first (base64/SVG blobs are
binary noise and must not trip text scans); forbidden-token, phone-number and external-URL scans
run on the stripped text, payload-count and favicon checks run on the raw text.

## Test matrix

| Id | Asserts | Contract rule | Spec AC |
|----|---------|---------------|---------|
| T-01 | `<!doctype html>` first, `<html lang="en">` | §1 rule 1 | AC-1 |
| T-02 | charset utf-8, viewport `width=device-width, initial-scale=1`, color-scheme dark | §1 rule 1 | AC-1 |
| T-03 | non-empty `<title>` + `<meta name="description">` | §1 rule 6 | AC-4 (presence; meaning is Appendix A / human) |
| T-04 | exactly one `<style>`, inside `<head>` | §1 rule 2 | AC-1 |
| T-05 | exactly one inline `<script>`, no `src`, nothing between `</script>` and `</body>` | §1 rule 3 | AC-1 |
| T-06 | 2 preconnects (googleapis / gstatic+crossorigin) + exactly 1 stylesheet link, families + weights 400;500;600;700 / 400;500 + `display=swap` | §1 rule 4, A16 | AC-14 |
| T-07 | no `http(s)` URL except the two Google Fonts hosts (w3.org xmlns ignored) | §5.2 B7, R10 | AC-1 |
| T-08 | no `<img` tag anywhere | §5.2 B8, R7 | AC-8 |
| T-09 | ids top/main/field/loss/line/triage/terms/proof/questions/contact exist in DOM order | §2 | AC-2 |
| T-10 | ids logbody, missed, annual, verdict, contour, warp, calc-lbl exist | §2 | AC-2 |
| T-11 | section labels `01 / The loss` ... `07 / Start` (whitespace-tolerant, ASCII only) | §2 | AC-2 |
| T-12 | required classes: rv label band marquee ramp riso grain wordmark plate calc log log-row faq cards card terms mail btn skip | §2 | AC-2 |
| T-13 | anchors `#main` (skip), `#loss #line #terms #questions` (nav), `#contact` (CTA) | §2 row 1 | AC-3 (SCAN part; tab-walk is RUN) |
| T-14 | `<section class="hero">`, meta texts `THERMAL FIELD` + `SIMULATED / 7-STEP RAMP`, `.ramp` present | §2 row 2 | AC-16/AC-17 (SCAN part) |
| T-15 | `.marquee` after hero before `#loss`, `aria-hidden`, 5 honest phrases incl. illustrative note, `translateX(-50%)` keyframes | §2 row 3, A10 | AC-27 (SCAN part) |
| T-16 | >= 1 `<div class="band" aria-hidden="true">` between two top-level sections, height `clamp(36px,6vw,96px)` | §2, A13 | AC-18 (SCAN part) |
| T-17 | >= 6 native `<details>` with `<summary>` inside `#questions` | §2 row 9 | AC-36 |
| T-18 | wordmark = `<div class="wordmark" aria-hidden>` with data-URI logo background, `aspect-ratio:1166/178`, `width:clamp(320px,92vw,1100px)`, `background-size:contain` | R7 (overrides §2 row 11), A14 | AC-28 (SCAN part) |
| T-19 | range input `min=1 max=40 step=1 value=6`; JS has `3867`, `toLocaleString("en-US")`, `input` listener | §4 calculator, A15 | AC-11 (calculator context) |
| T-20 | exactly one `:root` block with tier-1 tokens at pinned values (void/deep/bone/heat/disp/mono/pad/maxw) | §3 tier 1 | AC-13 |
| T-21 | tier-2 token names all defined (deep2 mist faint line line2 heat-soft phos riso-ink fs-h1..fs-giant) | §3 tier 2 | AC-13/AC-14 |
| T-22 | `--riso-ink:#022D52` (not the A3 riso blue) | R6 | AC-L4 |
| T-23 | `--spark:#FCBE2F`, `--navy:#022D52`, `--paper:#FEFCF5` in `:root` | R1, R9 | AC-L2 |
| T-24 | script has `"use strict"`, `matchMedia` + `prefers-reduced-motion`, and 8 module markers (thermal field, fisheye, scroll, reveal, call log, calculator, contours, faq) in 8 distinct comments | §4 | AC-16/AC-33 (SCAN context) |
| T-25 | field machinery in JS: getContext, requestAnimationFrame, putImageData/ImageData, imageSmoothingEnabled=false or CSS pixelated, `bayer`, `ramp` | §4 thermal field, f/g | AC-16 (SCAN part), AC-40 (part) |
| T-26 | IntersectionObserver used by both reveal and call-log modules; `toggle` listener for FAQ single-open | §4 reveal / call log / faq | AC-34 context |
| T-27 | `<filter id="warp">` with feTurbulence fractalNoise (baseFrequency in 0.005-0.025) + feDisplacementMap scale 2-14, applied via `filter="url(#warp)"`; contour svg `viewBox="0 0 1200 640"`; hot ring `rgba(255,92,26,.30)` + base ring `rgba(237,233,225,.075)` | §4 contours, A11 | AC-19/AC-25 (SCAN part) |
| T-28 | H1 `Illustrative - sample data` exact ASCII, inside `#line` | §5.1 H1, A1 | AC-10 (SCAN part) |
| T-29 | H2 `Sample - not a real dispatch` exact ASCII + `.riso` element + no-clients statement, inside `#proof` | §5.1 H2, §5.3, A1 | AC-8, AC-10 (SCAN part) |
| T-30 | every mailto href is `hooksmith@gmail.com?subject=..&body=..` non-empty; body mentions Town + average job value; no `<form>` | §5.1 H3, brief C1 | AC-5 |
| T-31 | contiguous `$2,000` somewhere (plate may split it); `one-time` inside `#terms` | §5.1 H4, brief C2 | AC-6 |
| T-32 | `3,867` present + national average / industry framing copy | §5.1 H5 | AC-11 (allowlisted figure + framing) |
| T-33 | `~2 sec` present | §5.1 H6 | AC-11 |
| T-34 | `no card before proof` AND `no recording` present | §5.1 H7 | brief C5/C6, AC-27 |
| T-35 | killed tiers absent: `1,999 2,499 2,999 $1,999 $2,499 $2,999 Blueprint` (word-boundary; see note) | §5.2 B1, A15 | AC-7 |
| T-36 | no `our clients say`; no capital-T `Testimonials`; lowercase `testimonials` only inside `#proof` | §5.2 B2/B3 | AC-8 |
| T-37 | no `<blockquote`, no star-rating characters | §5.2 B4 | AC-8 |
| T-38 | no `tel:`, no demo line/number, no `call (us|the|our)`, no `dial `, no try-it-live / listen-to-a-call invitations | §5.2 B5 | AC-9 |
| T-39 | phone regex `(\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}` matches nothing (payloads stripped) | §5.2 B6 | AC-10 context |
| T-40 | footer: no LLC/Inc./Ltd./Suite/Ste./Ave./St./Blvd, no ZIP-style 5 digits, no registration claim; keeps mailto, visible `HOOKSMITH`, simulated + illustrative disclaimers | §5.3, brief C7 | AC-12 |
| T-41 | ramp legend labels non-numeric: `COLD` + `HOT` present; no digit+° temperature figures | §5.3, A7 | AC-17 (labels) |
| T-42 | `.riso` CSS: light paper ground, heat ink + navy ink (var(--riso-ink) or #022D52), radial-gradient halftone, offset construct (text-shadow/box-shadow/translate) | §4 riso (CSS-only), R6 | AC-21 (SCAN part) |
| T-43 | `.log` CSS: phosphor amber (var(--phos)/#FFB25C), repeating-linear-gradient scanlines, text-shadow, inset vignette; `@keyframes ...flicker...` opacity-based with min opacity >= 0.94 and cycle 3-6s | §4 CRT, A5, A2 | AC-22 (SCAN part), AC-23 context |
| T-44 | `@media (prefers-reduced-motion: reduce)` block sets animation:none, scroll-behavior:auto, and handles .marquee / .rv / flicker or .log-row; JS queries matchMedia | §4 reduced-motion CSS | AC-23, AC-33 (SCAN part) |
| T-45 | `.grain` fixed, pointer-events:none, opacity <= 0.06, data-URI SVG background | §4 grain, A6 | AC-26 (SCAN part) |
| T-46 | `.plate` CSS has inset box-shadow emboss (exclusivity of other surfaces is SHOT-judged) | §2 row 7 | AC-20 (SCAN part) |
| T-47 | `:focus-visible` in CSS and a focus rule declaring `outline:` | §DoD 6 | AC-35 (SCAN part) |
| T-48 | at least one `max-width` @media block <= 700px | §DoD responsive | AC-30 (SCAN part) |
| T-49 | `<span class="mark-logo" aria-hidden="true">` present; favicon `<link rel="icon">` with data: URI; >= 3 distinct `data:image/png;base64` payloads | R8, R9 | AC-L1 |

Notes on deliberately strict pins (fail loudly by design):
- A1 pins the two sample-data labels as exact ASCII (`Illustrative - sample data`,
  `Sample - not a real dispatch`); unicode dash variants are a FAIL, matching contract §5.1.
- T-35 bare-number scan (`5000/7500/15000`) runs on payload-stripped text with word boundaries,
  but if it ever hits, the reason says "check manually" - a legit non-price `5000` (e.g. a z-index)
  is adjudicated by the gate, not silently passed.
- T-38 encodes AC-9's regexes literally; a product-description sentence that trips
  `call (us|the|our)` is a finding for the gate to judge, not a test exception.
- T-24 requires 8 distinct marker comments (contract: each module preceded by its own marker).
- T-27 baseFrequency accepts 0.005-0.025 (contract pins ~0.008-0.02).

## What this runner does NOT check (orchestrator / gate verifies manually)

### SHOT (screenshots, desktop 1440px and mobile 390px)

- AC-8/AC-21: proof section shows no logo wall, no people; riso card reads as a riso print
  (AC-L3: navy logo on cream paper).
- AC-16/AC-17/AC-24: hero field visibly dithered false-color with barrel-warped edges (A9);
  ramp legend visible with >= 7 swatches; hero/top-bar bone logo with sparks on dark ground.
- AC-18: band visibly dithered (Bayer-look), not a plain gradient.
- AC-19: contour lines visible behind BOTH #triage and #contact, not obstructing reading.
- AC-20: plate emboss visible; no second embossed surface anywhere.
- AC-22: #line reads as a CRT monitor (scanlines, vignette, chromatic aberration).
- AC-26: grain perceptible up close, text legible.
- AC-27: strip visible under hero, seamless loop, no overflow.
- AC-28: giant wordmark is the logo lockup, fits viewport, no overflow.
- AC-30/AC-31: full-page screenshots at 390px (stacked single column, top bar keeps logo + CTA)
  and 1440px (two-column grids per v1, capped centered content).
- AC-33/AC-35: reduced-motion screenshot is a static composition; focus indicators visible on
  nav link, slider, FAQ summary, mailto (both dark grounds and riso paper).
- AC-38: text over every decorative layer fully legible.
- BRIEF DoD 1: effects a-k all visibly present (thermal/IR, Bayer dither, contours, emboss, riso,
  CRT, fisheye, displacement warp, grain, marquee, wordmark).

### RUN (scripted browser session)

- AC-3: skip link is the first Tab stop and moves focus to #main.
- AC-29/E4/E7: no horizontal overflow at 390px, 1440px, 320px, 2560px - after load, after
  FAQ open/close cycle, after slider min/max, at multiple scroll positions.
- AC-32: body prose >= 16px computed at both viewports.
- AC-33: with reduce emulated - no rAF loop on the canvas, marquee not translating, no `.rv`
  resting at opacity 0, smooth scroll off.
- AC-34: keyboard tab-walk hits every interactive element; slider answers ArrowLeft/Right;
  FAQ toggles on Enter.
- AC-37: WCAG ratio >= 4.5:1 computed on the prose selector list (p.lead, .calc .verdict,
  .log-row .m, .faq .a, .terms li, .art p, .pull p, marquee text) at both viewports;
  sub-16px mono labels >= 3:1 or documented decorative.
- AC-38: click-through test - clicks at text positions hit the text element, not an overlay.
- AC-39: zero console errors on load and through the interaction pass (FAQ all open, slider to
  both extremes, full scroll, resize 390 <-> 1440).
- AC-40: rAF loop code inspection - buffer longest side <= 320px, ~80ms gate, no layout reads
  or writes inside the loop, grain static.
- AC-4/AC-15: Appendix A meaning anchors and meta-description meaning (regex-tolerant, human-
  adjudicated; this runner only checks presence-level SCAN bits: T-03, T-32, T-33).
- Edge cases E1 (JS disabled: everything visible, calculator pre-renders 6 x $3,867 = $23,202,
  FAQ native), E2/E9 (fonts blocked: system fallback, no invisible text, no overflow),
  E3 (getContext stubbed null: clean console, scrim fallback), E5/E6/E8.

### REPORT (builder's written evidence)

- AC-41: exact local server command + exit code 0 used to view the page.
- Builder notes on the two AC-L1 payload split decisions (top-bar ~520px vs wordmark ~700px
  resize per R7/R8) and the 1-3 band placements.
