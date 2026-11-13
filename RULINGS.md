# RULINGS - resolved conflicts and material changes (orchestrator, step 4)

## R1 - Real brand logo arrived (2026-11-11, from Boss)
Source asset: `assets/logo-source.png` (1254x1254, cream #FEFCF5 ground).
Sampled brand colors from the file: NAVY #022D52, SPARK YELLOW #FCBE2F, PAPER CREAM #FEFCF5.
Derived assets (image tool, must be verified against source before use):
- `assets/logo-navy-transparent.png` - original colors, transparent ground (for the riso paper sheet, favicon source)
- `assets/logo-bone-transparent.png` - letterforms recolored bone #EDE9E1, sparks stay yellow, transparent ground (for dark surfaces)

Rulings:
- Top bar mark: use `logo-bone-transparent` as data-URI image (height ~26px). The v1 hand-drawn SVG mark is retired.
- Favicon: derived from the real logo - cream rounded square, navy wordmark cropped, readable at tab size OR sparks-only glyph. Builder picks the cleaner of the two; both derive from `logo-navy-transparent`.
- Footer giant wordmark: render `logo-bone-transparent` image large (width clamp ~min(92vw, 900px)), not Inter Tight text.
- Riso dispatch sheet: header uses `logo-navy-transparent` at small size (true colors on cream paper).
- Palette: add `--spark:#FCBE2F` and `--navy:#022D52` and `--paper:#FEFCF5` tokens. Spark yellow is reserved for logo contexts and tiny accents; heat #FF5C1A stays the primary UI/CTA color. Never place spark yellow and heat orange on the same element.

## R2 - "make whole website" interpretation
Boss asked for the full visual effect stack on the single existing page structure.
Sections and copy stay as in v1 (approved). The upgrade is visual density + new effect
layers listed in BRIEF.md. No new pages.

## R3 - Effects previously recommended against are now ordered by Boss
Riso, CRT, fisheye, displacement ship - implemented diegetically per BRIEF.md so they
serve the story (dispatch sheet, dispatch-room terminal, sensor lens, warped map) rather
than decorate abstractly. Each new sample-data layer carries the honest label per constraint 5.

## R4 - Single-file constraint amendment
Data-URI images (logo variants, favicon) are allowed alongside Google Fonts as embedded
resources. Target total page weight: under ~250 KB. Logo PNGs must be resized before
embedding (top-bar ~520px wide source is enough; footer can reuse the same URI).

## R5 - Deployment sequencing
GitHub push and Vercel deploy happen only after the gate verdict is green. Repo:
`factnest365-ops/hooksmith-site` (private). Vercel project from CLI (logged in as
factnest365-4447). These are orchestrator tasks, out of the mesh's scope.

## R6 - Riso ink color (overrides contract A3)
Contract pinned `--riso-ink:#0078BF` (classic riso blue). Ruled: `--riso-ink:#022D52`
(brand navy, sampled from the real logo). The riso sheet overprints heat #FF5C1A + navy
#022D52 on paper cream #FEFCF5 - matches the brand, avoids adding a fourth hue.

## R7 - Footer wordmark form (overrides contract section 2 row 11)
Contract pinned a text wordmark (`HOOKSMITH` in Inter Tight at --fs-giant). Ruled:
the footer wordmark is the REAL logo - a `<div class="wordmark" aria-hidden="true">`
sized `width:clamp(320px,92vw,1100px); aspect-ratio:1166/178;` with
`background:url("data:image/png;base64,...")` (logo-bone-transparent.png, resized to
~700px wide before embedding), `background-size:contain`, no `<img>` tag (keeps B8).
The visible string HOOKSMITH stays in the footer meta row as in v1.

## R8 - Top bar mark + favicon (contract section 2 row 1 clarified)
Top bar `.mark`: inline SVG retired; use a `<span class="mark-logo" aria-hidden="true">`
with `background:url("data:image/png;base64,...")` (logo-bone-transparent.png resized to
~520px wide), height ~26px, aspect-ratio preserved. Favicon `<link rel="icon">` uses a
data-URI of `assets/favicon-256.png` (cream rounded square + navy wordmark, 256px).
Both count as data: URIs, which contract rule 5 allows; no `<img>` tags introduced.

## R9 - Spec amendment for the logo (spec.md was written before the logo arrived)
Add these acceptance criteria, authoritative over spec.md silence:
- AC-L1 (SCAN): file contains at least three distinct `data:image/png;base64` payloads
  (top-bar logo, footer wordmark, favicon link).
- AC-L2 (SCAN): `:root` defines `--spark:#FCBE2F`, `--navy:#022D52`, `--paper:#FEFCF5`.
- AC-L3 (SHOT): hero/top bar renders the bone logo with sparks on dark ground; riso sheet
  renders the navy logo on cream paper; footer wordmark is the logo lockup.
- AC-L4 (SCAN): `--riso-ink` is `#022D52` per R6.

## R10 - No reference URLs in the artifact
Prior-art citations stay in `prior-art.md`. The artifact must not contain any external
http(s) URL except the two Google Fonts hosts (contract B7 already enforces this; Guild
must not paste reference links into HTML comments either).


## R7 - Price ladder re-locked (2026-11-12, Boss)

Boss re-locked the offer: the emergency line is the first install of a growth agency, not the product.
Ladder is **$2,000 pilot** (one-time, credited 100% against month 1) then **$5,000 / $7,500 / $15,000 per month**.
The `$1,999` Blueprint and the `$1,999 / $2,499 / $2,999` managed-line tiers are killed.

Site consequences:
- BRIEF constraint 2 rewritten: the 5k/7.5k/15k tiers are now **required**, not forbidden.
- BRIEF constraint 6 and spec AC-11 numeric whitelist extended with the three monthly prices, "three monthly invoices", "thirty days".
- spec AC-7 and contract B1 inverted: the killed tiers are now the forbidden strings.
- tests T-35 renamed accordingly.
- New section `#growth` (04) added between triage and terms; proof/questions/contact renumbered 06/07/08.
- Canonical offer doc: `../../os/02-offer.md`.

## R11 - Gate corrections after the price re-lock (2026-11-12)

Four checks were wrong, not the page. Corrected rather than worked around:
- **T-30 / T-40**: expected `hooksmith@gmail.com`; the live address is
  `gethooksmith@gmail.com` (BRIEF). Both mailtos now carry subject + body.
  Footer meta row reads `© 2026 HOOKSMITH` so the visible brand string exists (R7).
- **T-36**: compared character offsets in `src` against offsets in `S`
  (data-URIs stripped), so the "testimonials" location check was comparing two
  different strings. Now locates `#proof`/`#questions` in `S`.
- **T-38**: `call (us|the|our)` matched the narrative sentence "They hang up and
  call the next company". Narrowed to real invitations: `call us`,
  `call our line|number|team`, `call the line|number|demo`.
- **T-07**: treated the palmbld citation `<a href>` as an external load. B7 is
  about loads; the check now scans `src`, `<link href>`, `@import` and `url()`.
  Citation verified live on 2026-11-12: page states $3,867 national average.

Gate now 42/49. The remaining seven (T-12, T-18, T-22, T-27, T-42, T-43, T-45)
are pre-existing design-token gaps that also fail on the deployed build; they are
cosmetic CSS contracts, not copy or pricing. Not touched in this pass.

## R12 - Calculator claim corrected for the new floor (2026-11-12)

The `#loss` verdict said "one caught call every two months covers the line".
That was true at $1,999/mo. At $5,000/mo, six missed jobs a year ($23,202) is
39% of the retainer, so the sentence was false. Now reads: "One caught job a
month covers most of the $5,000 retainer; a claim-sized job covers it twice."
Checked against `os/02-offer.md` (average job $3,867; claim $11-14k).
