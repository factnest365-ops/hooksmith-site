# SPEC - Hooksmith site v2

Derived from `BRIEF.md` (frozen). Source of approved copy: `Shared/hooksmith/site/index.html` (v1).
Build target: `artifacts/index.html` inside this factory folder. Single deliverable file.

Verification method keys used below:
- SCAN = a script reads the HTML source / DOM and checks a rule
- SHOT = a human looks at a rendered screenshot (desktop 1440px and/or mobile 390px)
- RUN = a scripted browser session performs the check live
- REPORT = builder's written report (command + exit code)

---

## 1. Acceptance criteria

### A. Artifact and structure

- **AC-1 (Single file)** `artifacts/index.html` is one self-contained HTML file. SCAN: no `<script src=...>`, no `<link rel="stylesheet">` except `fonts.googleapis.com` / `fonts.gstatic.com`, no `src`/`href` pointing to local or remote files other than (a) the Google Fonts URLs, (b) `data:` URIs, (c) same-page `#` anchors. All CSS and JS are inline in the file.
- **AC-2 (Section order and ids)** In DOM order: top bar, hero with `id="main"`, marquee ticker, `#loss` (01), `#line` (02), `#triage` (03), `#terms` (04), `#proof` (05), `#questions` (06), `#contact` (07), footer. SCAN: query the ids, assert order; each of `01`..`07` appears as a visible section label.
- **AC-3 (Skip link)** A "skip to content" link targeting `#main` is the first focusable element. SCAN + RUN: first Tab shows it; activating it moves focus/scroll to main content.
- **AC-4 (Title/meta carry-over)** `<title>` and meta description carry over from v1 meaning; no new claims. SCAN: description still states what the product is, ~2 sec answer, triage/dispatch, billed on first caught call, and contains no number outside the Appendix A allowlist.

### B. Copy constraints (brief items 1-9, one AC each)

- **AC-5 (C1: contact path)** Every contact affordance is `mailto:hooksmith@gmail.com` with non-empty prefilled `subject` and `body` URL params (body includes prompts for town and average job value, per Appendix A). SCAN: no `tel:` hrefs, no `<form>`, no third-party booking/chat widgets; all contact hrefs start `mailto:hooksmith@gmail.com?subject=&body=`.
- **AC-6 (C2: price shown)** "$2,000" appears as the pilot price with "one-time" framing on the plate. SCAN: text contains `$2,000` and `one-time` in the same `#terms` plate block.
- **AC-7 (C2: forbidden tiers)** The tokens `1,999`, `1999`, `2,499`, `2499`, `2,999`, `2999`, `Blueprint` do not appear anywhere in text, attributes, comments, or JS string literals. The only prices allowed are `$2,000` (pilot), `$5,000`, `$7,500`, `$15,000` (monthly ladder), each attached to a named tier. SCAN: regex over full file text.
- **AC-8 (C3: no fake proof)** No testimonials, client names, client logos, or photographic people. SCAN: no `<img>` loading any remote/photographic asset (inline SVG and `data:` allowed); no quoted customer names or attribution lines; the proof section contains an explicit no-clients statement matching `/no client logos|no clients yet|not (been )?installed .*paying/i`. SHOT: proof section screenshot shows no logo wall and no people photos.
- **AC-9 (C4: no demo-line CTA)** Nothing invites the visitor to call a phone number or try the line live. SCAN: no `tel:` href; no match for `/demo (line|number)|call (us|the|our)|dial /i`; no "try it live" / "listen to a call" invitation. (Product description saying what the line does is fine; inviting a call is not.)
- **AC-10 (C5: sample-data labels)** Every block displaying fabricated call content carries a visible DOM-text label matching `/illustrative\s*[-\u2013\u2014]?\s*sample\s+data/i` or `/sample\s*[-\u2013\u2014]?\s*not a real dispatch/i`. At minimum: the CRT call log (`#line`) and the riso dispatch sheet (`#proof`). Visible means computed opacity/color make it readable on its ground (not display:none, not opacity < 0.2). SCAN + SHOT.
- **AC-11 (C6: numeric whitelist)** Outside (a) blocks labelled per AC-10, (b) the calculator subtree whose output is slider-value x $3,867, and (c) numbers explicitly carried over from v1 and listed in Appendix A, the only numbers allowed are: `~2 sec` (answer time), `$3,867` (with industry-average framing present: text ties it to "national average"/"industry figure"), `$0` / "nothing invoiced before the first caught call", `$2,000`, `$5,000`, `$7,500`, `$15,000`, `three` (monthly invoices), `thirty` (days). SCAN: script extracts text nodes excluding AC-10-labelled subtrees and the calculator, matches `/\$\s?[\d,]+/` and `/\b\d+\s?(sec|seconds)\b/`, asserts the allowed set. New invented figures fail.
- **AC-12 (C7: footer claims)** Footer makes no address or entity claim. SCAN: footer text has no match for `/\b(LLC|Inc\.|Ltd\.|Suite|Ste\.|Ave\.|St\.|Blvd)\b/i`, no ZIP-style 5-digit sequences, no street/city strings presented as a location. Footer keeps a contact mailto and the honesty disclaimers ("thermal field simulated", "call log illustrative" or equivalent).
- **AC-13 (C8: dark theme + palette)** Body ground is `#05060A`; CSS uses `#0A0F18`, `#EDE9E1` (or rgba equivalents such as `255,92,26` / `237,233,225`), and `#FF5C1A`. The page is dark throughout - no light sections except the riso paper card (AC-21), which is an artifact, not a theme. SCAN: computed `body` background-color + CSS token scan. SHOT: full-page screenshot is dark.
- **AC-14 (C8: type)** Google Fonts request includes Inter Tight and JetBrains Mono; `font-family` stacks reference both with system fallbacks after them. SCAN: `<link href>` query params + CSS scan.
- **AC-15 (C9: v1 copy carried over)** Every meaning anchor in Appendix A is present (regex-tolerant matching; wording may be lightly tightened but the claim must survive; no new claims). SCAN: the Appendix A table, column "required match".

### C. Visual effects (brief a-k, one or more ACs each)

- **AC-16 (a: thermal field)** Hero contains an animated dithered heat field: a `<canvas>` with an offscreen low-res buffer, a false-color ramp (ordered dark-to-light colors), a Bayer threshold matrix, and a `requestAnimationFrame` loop (only when motion is allowed, see AC-33). SCAN: source contains `getContext`, an ImageData/putImageData path, a Bayer-like matrix constant, rAF. SHOT: hero screenshot shows a visibly dithered false-color (orange/amber/bone on near-black) field behind the text.
- **AC-17 (a: IR ramp legend)** A false-color IR ramp legend strip is visible in or beside the hero: at least 7 ordered swatches spanning dark to bone, with at least one text label (e.g. ramp scale/units are fine as decorative mono text, but must not invent a real measurement claim). SCAN: a legend element with >= 7 discrete color stops matching the field ramp. SHOT: legend visible.
- **AC-18 (b: dithered transition band)** Besides the hero field, at least one dithered transition band sits between two sections (e.g. between hero/marquee or between any two numbered sections). SCAN: an element between section boundaries whose background/canvas/SVG constructs an ordered (Bayer/checker/dot) dither. SHOT: the band is visibly dithered, not a plain gradient.
- **AC-19 (c: contours)** Topographic contour lines render behind the triage section AND behind the contact section. SCAN: a contour-drawing element (SVG paths or canvas) exists inside both `#triage` and `#contact`, `aria-hidden="true"`, layered under text content. SHOT: both screenshots show visible contour lines that do not obstruct reading.
- **AC-20 (d: emboss, exclusive)** The $2,000 price plate has emboss treatment (raised look via inset highlight + shadow, e.g. `box-shadow: inset 0 1px 0 ...` style pairing). No other element on the page uses an emboss treatment. SCAN: plate styles inspected; SHOT: `#terms` screenshot shows emboss; a sweep of all full-page screenshots shows no second embossed surface.
- **AC-21 (e: riso dispatch sheet)** `#proof` contains a "dispatch sheet" memo card in risograph print style: (1) bone/paper light ground, (2) two-ink look with heat orange plus a dark ink, (3) visible misregistration (duplicated/offset color layers), (4) halftone dot texture, (5) paper grain, (6) the AC-10 sample-data label on or in the card. SCAN: card CSS contains the light ground, two ink colors, an offset-layer construct (e.g. doubled text-shadow/background layers offset a few px), a halftone dot pattern (radial-gradient repeating), a noise/grain layer. SHOT: the card reads as a riso print.
- **AC-22 (f: CRT call log)** The `#line` call log renders as a dispatch-room CRT terminal: phosphor amber text on dark, scanline overlay, curved-screen vignette (rounded corners + inset shading/mask), subtle flicker animation, and chromatic aberration on type (red/cyan or heat/void offset text-shadow or duplicated layer). Carries the AC-10 label. SCAN: CSS contains amber text color, a repeating scanline gradient, vignette inset shadows/radius, a flicker keyframe animation, and a chromatic-aberration construct. SHOT: `#line` screenshot reads as a CRT monitor, not a plain table.
- **AC-23 (f: flicker off under reduced motion)** The CRT flicker animation is disabled when `prefers-reduced-motion: reduce` matches. SCAN: the flicker keyframes are inside/overridden by a `@media (prefers-reduced-motion: reduce)` rule setting `animation: none` (or equivalent) on the flicker.
- **AC-24 (g: fisheye on hero field)** The hero thermal field has a barrel/fisheye warp on its edges (post-process: SVG displacement filter, per-frame distortion in the canvas draw, or equivalent). SCAN: source contains the distortion construct applied to the field output (filter reference or warp math on edge samples). SHOT: hero screenshot shows visibly curved/warped field toward edges (straight-on look at center is fine).
- **AC-25 (h: displacement warp)** An SVG `<filter>` containing both `<feTurbulence>` and `<feDisplacementMap>` exists and is applied to the contour paths and/or a wisp divider element. SCAN: filter definition + `filter:` attribute/style applied to at least one contour or divider element.
- **AC-26 (i: film grain)** A full-page static grain overlay exists: covers the viewport (fixed/absolute full-bleed element), built from SVG feTurbulence noise or equivalent, opacity very low (<= 0.1), `pointer-events: none`, and static - no animation of the grain element itself. SCAN + SHOT: grain perceptible in close screenshot, text remains fully legible.
- **AC-27 (j: marquee)** A marquee ticker sits directly after the hero. Its repeating content includes all five honest phrases: about the ~2 sec answer; billed on the first caught call; no card before proof; no recording; a note that sample data is illustrative. SCAN: ticker text contains the five ideas (substring match on "2 sec" or "two seconds", "first caught call", "no card", "no recording", "illustrative"). SHOT: strip visible under hero, seamless loop, no overflow.
- **AC-28 (k: giant footer wordmark)** The footer contains an oversized "HOOKSMITH" wordmark: rendered text at display scale (computed font-size >= 120px at 1440px viewport, or equivalent viewport-scaled value), fitting the viewport width without causing overflow. SCAN: computed font-size + AC-31 overflow check. SHOT: screenshot shows the giant wordmark.

### D. Responsive behavior

- **AC-29 (no overflow)** At viewports 390px and 1440px: `document.documentElement.scrollWidth <= document.documentElement.clientWidth` after load, after opening and closing every FAQ item, after dragging the slider to min and max, and at multiple scroll positions. RUN.
- **AC-30 (390px layout)** At 390px: logo and the primary contact CTA are both visible in the top bar; every section stacks to a single column; the three hero facts stack vertically; the plate amount scales without clipping; the mailto address wraps or shrinks without mid-glyph clipping; the four triage cards are single-column. SHOT: full-page 390px screenshot. SCAN: media queries present for narrow widths.
- **AC-31 (1440px layout)** At 1440px: two-column grids per v1 (loss copy/calculator, line copy/log, terms copy/plate), content column capped by a max-width and centered, marquee and hero field span full width. SHOT: full-page 1440px screenshot.
- **AC-32 (text floor)** Body prose is at least 16px computed font-size at both 390px and 1440px (mono micro-labels may be smaller but are decorative/labels, not prose). SCAN: computed styles on representative selectors. SHOT: mobile screenshot is comfortably readable.

### E. Reduced motion

- **AC-33 (prefers-reduced-motion: reduce)** With the media query matching: (1) the hero canvas loop is not started (a static single frame, or no canvas draw, is acceptable; the hero remains legible); (2) the marquee does not scroll - it shows as a static strip with the phrases visible; (3) CRT flicker is off (AC-23); (4) reveal animations are disabled - all `.rv`-style content is visible immediately with no opacity-0 resting state and no translate-in; (5) smooth scrolling is off. SCAN: `@media (prefers-reduced-motion: reduce)` rules exist for each of these. RUN: emulate the media query, assert no `.rv` element rests at opacity 0, canvas not animating across two sampled frames, marquee not translating across two sampled frames. SHOT: reduced-motion screenshot still shows every effect as a static composition.

### F. Keyboard and focus

- **AC-34 (keyboard reachability)** Every interactive element is reachable and operable by keyboard: skip link, top-bar nav links, top-bar CTA, hero CTAs, mailto links, the missed-jobs slider (arrow keys), every FAQ summary (Enter/Space via native `<details>`). DOM order matches visual order. RUN: scripted tab-walk hits each element; slider responds to ArrowLeft/ArrowRight; FAQ toggles on Enter.
- **AC-35 (focus visible)** A visible focus indicator exists on all interactive elements (e.g. `:focus-visible` with >= 2px outline, visible on both dark grounds and the riso paper). SCAN: focus rules in CSS. RUN/SHOT: screenshots of focused nav link, slider, FAQ summary, mailto link each show a clear indicator.
- **AC-36 (FAQ is native)** FAQ is built on native `<details>/<summary>` elements (no JS-dependent accordion for the questions; JS may close-siblings, but content must open/close with JS disabled). SCAN: `<details>` count >= 6 in `#questions` with `<summary>` children.

### G. Contrast and readability

- **AC-37 (body contrast)** All body prose (paragraphs, list items, FAQ answers/summaries, log messages, verdict lines) has contrast >= 4.5:1 against its effective ground (computed alpha-composited color vs computed background). RUN: script computes WCAG ratio for a fixed selector list (e.g. `p.lead`, `.calc .verdict`, `.log-row .m`, `.faq .a`, `.terms li`, `.art p`, `.pull p`, marquee text) at 390px and 1440px. Mono micro-labels under 16px are exempt from the 4.5 bar but must be >= 3:1 or documented as decorative.
- **AC-38 (decorative layers do not block reading)** Grain, scanlines, contours, field canvas, dither bands, vignettes, and the marquee are decorative only: each has `pointer-events: none` (or is positioned behind content and never overlaps interactive elements), and none is `aria-hidden="false"` content. SHOT: text over every decorative layer is fully legible in screenshots. RUN: click-through test - clicks at text positions hit the text element, not an overlay.

### H. Engineering constraints

- **AC-39 (no console errors)** Zero console errors on load, and zero errors during an interaction pass: open all FAQ items, move the slider to both extremes, scroll the full page, resize 390px to 1440px and back. Warnings are acceptable only if unavoidable browser noise (e.g. autofill); errors are not. RUN: scripted session with console capture.
- **AC-40 (animation cost)** (1) The hero offscreen buffer is low resolution (longest side <= 320px, matching v1's 216x122 scale), drawn scaled with pixelated rendering; (2) the draw loop is throttled (roughly v1's <= ~12fps, e.g. 80ms gate) and per frame touches only the canvas - no `getBoundingClientRect`/`offsetWidth`/style writes that trigger layout inside the rAF loop; (3) grain overlay is static (AC-26); (4) no per-frame DOM layout work anywhere (scroll/marquee animation is transform/opacity based or canvas based). SCAN: code inspection of the rAF loop and animation drivers.
- **AC-41 (local run evidence)** The builder served `artifacts/index.html` over a local HTTP server and reports the exact command and exit code (0) in the build report. REPORT.

---

## 2. Edge-case table

| # | Situation | Expected page behavior | Verify |
|---|-----------|------------------------|--------|
| E1 | JavaScript disabled | All content visible with zero permanently hidden elements: reveal styles must not rely on JS-added classes to become visible (either default-visible-with-JS-applied-hidden, or a `<noscript>` override). FAQ opens/closes natively. Calculator shows the pre-rendered default output (6 x $3,867) from static HTML; slider is inert but labeled. Mailto links work. Hero falls back to scrim/gradient legibility. No broken layout. | Disable JS, screenshot full page 390 + 1440; text scan confirms all Appendix A anchors present. |
| E2 | Google Fonts CDN offline or blocked | Text renders immediately in the system fallbacks from the font stacks (font-display swap or equivalent); no invisible-text period, no overflow from metrics change, headings do not clip. Page remains readable and coherent, just less branded. | Block `fonts.googleapis.com`/`fonts.gstatic.com`, load page, screenshot 390 + 1440; confirm no horizontal overflow (AC-29 rule). |
| E3 | Canvas 2D context unavailable (`getContext` returns null or throws) | Code guards the failure: no thrown error, no console error; hero shows its scrim/gradient fallback with all text fully legible; every other section and the marquee render normally. | Stub `HTMLCanvasElement.prototype.getContext` to return null, reload, capture console (clean), screenshot hero. |
| E4 | Very narrow screen (320px) | No horizontal overflow (`scrollWidth <= clientWidth`); sections stack; plate amount scales down without clipping; marquee fits; mailto address wraps or truncates gracefully; nothing is unreadably small in prose. | 320px viewport: overflow check (RUN) + screenshot (SHOT). |
| E5 | Reduced-motion user | Static thermal frame (or no canvas), static marquee with all five phrases readable, no CRT flicker, no reveal transitions, no smooth scroll; no content hidden behind a never-fired animation. | AC-33 checks; emulated-media screenshot full page. |
| E6 | Slow / low-end device (heavy CPU throttle) | Hero text and CTAs render without waiting on the canvas; draw loop throttled and low-res (AC-40); no long tasks from the animation loop that block scrolling; FAQ and slider stay responsive. | CPU 4x-6x throttle in devtools; interact and observe; optional trace confirms loop work is canvas-only and small. |
| E7 | Ultra-wide screen (2560px) | Content column capped and centered; hero field, contours, grain, and dither bands cover full bleed without visible seams or stretching artifacts; marquee spans the viewport; giant wordmark scales without overflow. | 2560px screenshot; AC-29 overflow rule at 2560px. |
| E8 | Touch-only device (no hover) | No affordance depends on hover: FAQ toggles by tap, slider by touch drag, links by tap; tap targets are comfortably sized; hover styles are decorative only. | Human pass on a mobile viewport emulator tapping every interactive element. |
| E9 | Slow network (fonts CSS pending long) | Text is visible in fallback fonts from first paint (swap); the page is fully usable before webfonts arrive; no layout shift bad enough to cause overflow when fonts land. | Throttle network, load, observe first paint; then complete load and re-check AC-29. |

---

## 3. Explicitly NOT requirements (out of scope)

From the brief's out-of-scope list:
- Deployment to any host (Vercel or otherwise), domain/DNS work, git/GitHub setup for the artifact.
- Email/Gmail configuration, analytics or tracking of any kind.
- Forms, backend, storage, scheduling integrations (contact stays a mailto link).
- OG/social preview image assets (carrying over v1's meta tags is allowed; producing new images is not required).
- Real testimonials or client logos (impossible today, and forbidden by constraint 3).
- Multi-page navigation, sitemap, robots.txt, routing.

Derived non-requirements (grounded in the brief):
- Pixel-perfect reproduction of v1's markup or CSS. v2 is a new implementation; v1 is reference for copy and structure only. Any internal structure is fine as long as the ACs hold.
- Light theme or a theme toggle. The page is dark, period (AC-13).
- SEO work beyond carrying over title/description (AC-4), keyword tuning, structured data.
- Lighthouse scores or a performance budget beyond the specific animation-cost rules in AC-40 and the overflow/contrast ACs.
- Legacy browser support (IE11 etc.) or polyfills for `:focus-visible`/IntersectionObserver-class features; modern evergreen browsers are the target.
- i18n/translations, cookie banners, GDPR UI, accessibility certification (the WCAG items here are the bar, nothing more).
- New marketing copy, new numbers, new sections, or a restructure of the 01-07 narrative.

---

## Appendix A - v1 meaning anchors (for AC-15 and AC-11)

Regex-tolerant: punctuation, case, and light rewording allowed, claim must survive. "Carried numbers" are the only numbers allowed outside AC-10-labelled blocks and the calculator subtree.

| Section | Required match (any alternative) | Carried numbers |
|---------|----------------------------------|-----------------|
| Top bar | `Emergency Response` (brand sub-label); nav labels covering loss/line/terms/questions; CTA text containing `pilot` | 01-07, 02, 04, 06 (nav/section refs) |
| Hero | h1 containing `answered`; lead containing `/AI emergency-response line/`, `/four questions/`, `/on-call tech/`, `/never before/`; CTA `Start the $2,000 pilot`; facts containing `~2 sec`, `$3,867`, `$0` | 2, 3867, 0, 2000 |
| 01 The loss | `/voicemail/` and `/2 a\.m\.|2am/i`; `/next company on the list/`; `/first competent answer/`; calculator label `/missed last year/`; verdict `/3,867/`; assumption `/not telling you that you lost/`, `/not a fit/`, `/industry average/` | 2 (a.m.), 1-40 slider range, 6 (default), 3867, 23,202 (6x3867 pre-render) |
| 02 The line | `/ninety seconds|90 seconds/i`; `/short questions/`; `/fallback human|fallback/`; `/dead end/`; log note `/no recording/`, `/no card data|no payment data/`; log head `/illustrative/` (AC-10) | 02:14:xx timestamps, 2.1s, 1200 (block), Plano TX - all inside AC-10-labelled log only |
| 03 Triage | `/dispatcher asks/`; `/called about water/`; four card concepts: `/what is happening|burst|supply line/i`, `/water still moving|active/i`, `/hurt|hazard/i`, `/where exactly|address/i`; lead `/truck rolling/` | 01-04 (card indices) |
| 04 Terms | `/one price/i`; plate `$2,000` + `one-time`; `/first caught call/`; `/ring-out month is free|ring-out/i`; `/no card before proof|no card/i`; `/month-to-month/`; `/cancel by reply/`; `/notice fee/` | 2000 |
| 05 Proof | `/no client logos/i`; `/invented testimonials|five invented/i`; `/stock photo/`; `/mechanism/`; `/early for you/`; `/first three pilots/`; `/that is what the \$2,000 is for/`; three artifact blocks: `/inspect/i`, `/keep/i`, `/will not do/i` | 3 (pilots), 2000 |
| 06 Questions | Six FAQ themes present: `/answering service/`, `/not a person|know it is not/i`, `/panicking|hard to understand/i`, `/cannot handle|can't handle|fallback/i`, `/record/`, `/after the pilot/`; answers keep the key claims (tonight vs morning; calm person not phone tree; never guesses on a hazard; no voicemail no hold music; timestamped log; keep configuration, cancel by reply) | Q1-Q6, 01-07 (question refs) |
| 07 Contact | `/one email/i`; `/deck/`; `/town/`, `/average job value/`; `/pay for itself/`; `/you will hear that first/`; mailto body contains `Town`, `Average job value`, `missed last year`; mini line `$2,000` + `/first caught call/` | 2000 |
| Footer | `HOOKSMITH`; `/after-hours|emergency response/i`; `/thermal field simulated/i`; `/illustrative/i`; mailto link | 2026 (copyright year) |
| Meta | title carries `the after-hours emergency line for restoration companies` meaning; description keeps ~2 sec / triage / dispatch / billed on first caught call | 2 |

Note: the Appendix A carried-numbers list is the exhaustive allowlist for AC-11. Anything numeric not in this table, in an AC-10-labelled block, or produced by the calculator (n x $3,867) is a spec violation.
