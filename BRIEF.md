# BRIEF - Hooksmith public site v2 (frozen)

## What the artifact is
One self-contained static web page, `index.html`, that is the public face of Hooksmith:
an AI emergency-response line for US residential water/fire restoration companies.
Owner-operators ($500k-$5M revenue) find it at 2 a.m. after a missed after-hours call.
It must look premium enough that a skeptical tradesman trusts it, and honest enough
that nothing on it is invented.

Working file location (build target): `artifacts/index.html` inside this factory folder.
After the gate passes it moves to `Shared/hooksmith/site/index.html`.

## Who uses it
A restoration company owner on a phone (390px) or laptop (1440px), often stressed,
skeptical of anything that smells like an agency. Readability outranks decoration.

## Locked copy constraints (invariant - cannot be changed by any role)
1. Contact is only `mailto:hooksmith@gmail.com` (subject/body prefilled).
2. Price shown: the $2,000 pilot (one-time, credited against month 1), then the ladder $5,000 / $7,500 / $15,000 per month. The $1,999 / $2,499 / $2,999 managed-line tiers and the $1,999 Blueprint are forbidden (killed 2026-11-12).
3. NO fake testimonials, NO client logos, NO invented customer names/quotes, NO stock-photo people.
   The proof section stays honest: says outright there are no clients yet.
4. NO "call our demo line" CTA anywhere.
5. Every sample-data block (call log, dispatch sheet, anything showing a fabricated call)
   carries a visible label: "Illustrative - sample data" or "Sample - not a real dispatch".
6. Numbers allowed on the page: ~2 sec answer, $3,867 national average job (with its framing
   as industry figure), $0 until first caught call, $2,000 pilot, $5,000 / $7,500 / $15,000 monthly
   tiers, "three monthly invoices", "thirty days". Nothing else invented.
7. Footer makes no address/entity claim.
8. Dark theme. Palette: void #05060A, deep #0A0F18, bone #EDE9E1, heat #FF5C1A.
   Type: Inter Tight (display/body) + JetBrains Mono (labels/data), Google Fonts CDN allowed.
9. Existing v1 copy (sections 01-07 text) is approved and carries over unchanged in meaning;
   wording may be lightly tightened but no new claims.

## Required visual effects (Boss directive - each must be visibly present)
- a. **Thermal / infrared photography** - animated dithered heat field in hero (exists in v1, keep/upgrade) + a false-color IR ramp legend strip.
- b. **Dithering (Bayer ordered)** - hero field + at least one dithered transition band between sections.
- c. **Topographic contour lines** - behind triage section (exists) + reused behind contact.
- d. **Embossing** - the $2,000 price plate (exists, exclusive use: no other emboss).
- e. **Risograph** - NEW: a "dispatch sheet" memo card in the proof section, riso-print look:
  bone paper ground, two-ink overprint (heat orange + ink), misregistration offset,
  halftone dots, grain. Labelled per constraint 5.
- f. **CRT distortion** - NEW: the call log rendered as a dispatch-room CRT terminal:
  phosphor amber text, scanlines, curved-screen vignette, subtle flicker, chromatic
  aberration on type. Labelled per constraint 5. Flicker OFF under reduced motion.
- g. **Fisheye / lens distortion** - NEW: barrel-warp post-process on the hero thermal field edges.
- h. **Deforcing (displacement warp)** - NEW: SVG feTurbulence+feDisplacementMap warp on the
  contour paths and/or a wisp divider.
- i. **Film grain** - NEW: full-page static grain overlay (SVG turbulence), very low opacity.
- j. **Marquee ticker** - NEW: scrolling strip under hero with honest phrases
  (~2 sec / billed on first caught call / no card before proof / no recording / illustrative data note).
- k. **Giant footer wordmark** - NEW: oversized HOOKSMITH footer treatment.

## Structure (v1 carries over)
Top bar - Hero (#main) - Marquee - 01 The loss / calculator (#loss) - 02 The line / CRT log (#line)
- 03 Triage / 4 cards + contours (#triage) - 04 Terms / embossed plate (#terms) - 05 Proof + riso sheet (#proof)
- 06 Questions / FAQ accordion (#questions) - 07 Contact (#contact) - Footer.

## Definition of done
1. Every effect a-k visibly present in rendered output (verified by screenshots, desktop + mobile).
2. All 9 copy constraints hold (verified by text scan + screenshots).
3. Single HTML file, no JS console errors on load and on interaction.
4. No horizontal overflow at 390px and 1440px.
5. `prefers-reduced-motion: reduce` disables canvas animation, marquee scroll, flicker, reveals.
6. All interactive elements keyboard reachable; focus visible; FAQ is native details/summary.
7. Contrast: body text at least ~4.5:1 on its ground; decorative layers must not block reading.
8. Animations run at reasonable cost: hero canvas at low resolution buffer (like v1), grain static,
   no per-frame DOM layout work.
9. Builder ran the page locally (http server) and reports the command + exit code.

## Out of scope (explicitly)
Deployment (Vercel), git/GitHub, domain, email setup, analytics, forms/backend,
OG images, real testimonials (impossible today), multi-page navigation.
