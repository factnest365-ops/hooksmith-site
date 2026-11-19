#!/usr/bin/env node
// Contract test runner - original blind layer plus implementer-owned inbound-offer delta.
// Usage: node tests/site-contract.mjs <path-to-index.html>
//        (no arg: defaults to index.html in this bundle)
// Exit codes: 0 = all pass, 1 = one or more FAIL, 2 = usage error (file missing/unreadable).
// Dependency-free, no network. Reads ONLY the file given on argv (or the default above).

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ---------------------------------------------------------------- runner */

const tests = [];
let tNo = 0;
const nextId = () => 'T-' + String(++tNo).padStart(2, '0');
const t = (name, fn) => tests.push({ id: nextId(), name, fn });

/* ---------------------------------------------------------------- helpers */

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// exact phrase with whitespace tolerance between words
const flex = (s) => new RegExp(esc(s).trim().split(/\s+/).join('\\s+'));
// collapse whitespace runs to single space (for structural/attr matching)
const norm = (s) => s.replace(/\s+/g, ' ');

const re = (str, flags = '') => new RegExp(str, flags);
const m1 = (str, s, flags = '') => (s.match(re(str, flags)) || [])[1];

function classAttrHas(src, cls) {
  return re('class="[^"]*\\b' + esc(cls) + '\\b(?![-\\w])').test(src);
}
function idIdx(src, id) {
  return src.search(re('id=["\']' + esc(id) + '["\']'));
}
// slice of src from marker A to marker B (exclusive); null if marker missing
function slice(src, a, b) {
  const i = a, j = b;
  if (i < 0 || j < 0 || j <= i) return null;
  return src.slice(i, j);
}

// strip data-URI payloads (base64 + svg) so binary noise can't trip text scans
function stripDataUris(src) {
  return src
    .replace(/data:[a-z0-9.+-]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, 'data:STRIPPED')
    .replace(/data:image\/svg\+xml[^"'\s>)]*/gi, 'data:STRIPPED');
}

// collect all tags of one kind, e.g. allTags(src, 'link') -> ['<link ...>', ...]
function allTags(src, tag) {
  return (src.match(re('<' + tag + '\\b[^>]*>', 'gi')) || []);
}
const tagHas = (tag, attr) => re('\\b' + esc(attr), 'i').test(tag);

// minimal CSS block parser: returns [{sel, body}] flat, recursing into @media/@supports
function parseCssRules(css) {
  const rules = [];
  function walk(str) {
    let pos = 0;
    for (;;) {
      const open = str.indexOf('{', pos);
      if (open === -1) return;
      const sel = str.slice(pos, open).trim();
      pos = open + 1;
      let d = 1;
      while (pos < str.length && d > 0) {
        if (str[pos] === '{') d++;
        else if (str[pos] === '}') { if (--d === 0) break; }
        pos++;
      }
      const body = str.slice(open + 1, pos);
      pos++;
      if (sel.startsWith('@media') || sel.startsWith('@supports')) {
        rules.push({ sel, body, container: true });
        walk(body);
      } else {
        rules.push({ sel, body });
      }
    }
  }
  walk(css);
  return rules;
}
// does a CSS selector reference the class ".name" (not a longer class like .name-x)?
const selHasClass = (sel, cls) =>
  re('(^|[\\s,+>~])\\.' + esc(cls) + '(?![\\w-])').test(sel.replace(/\s+/g, ' '));
const rulesForClass = (rules, cls) => rules.filter((r) => !r.container && selHasClass(r.sel, cls));
const bodies = (rules, cls) => rulesForClass(rules, cls).map((r) => r.body).join('\n');

// normalize a CSS value region for exact token matching: tighten :;,() spacing,
// lowercase everything OUTSIDE double-quoted segments (hex/values are case-insensitive,
// quoted font names keep the contract's exact case), collapse remaining whitespace runs
function tighten(s) {
  const parts = s.replace(/\s*([:;,()])\s*/g, '$1').split('"');
  for (let i = 0; i < parts.length; i += 2) parts[i] = parts[i].toLowerCase();
  return parts.join('"').replace(/\s+/g, ' ');
}

/* ---------------------------------------------------------------- input */

const arg = process.argv[2];
if (arg === undefined) {
  // no arg: default to this bundle, retaining the factory artifact fallback
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = ['index.html', join(here, '..', 'index.html'), 'artifacts/index.html', join(here, '..', 'artifacts', 'index.html')];
  let found = null;
  for (const c of candidates) {
    try { readFileSync(c, 'utf8'); found = c; break; } catch { /* try next */ }
  }
  if (!found) {
    console.error('usage: node tests/site-contract.mjs <path-to-index.html>');
    console.error('no argument given and index.html / artifacts/index.html not found');
    process.exit(2);
  }
  process.argv[2] = found;
} else {
  try {
    readFileSync(arg, 'utf8');
  } catch (e) {
    console.error('usage: node tests/site-contract.mjs <path-to-index.html>');
    console.error(`cannot read "${arg}": ${e.code || e.message}`);
    process.exit(2);
  }
}

const src = readFileSync(process.argv[2], 'utf8');
const S = stripDataUris(src); // scanned for text rules; base64 noise removed

const styleStart = src.search(/<style\b/i);
const styleTagEnd = styleStart < 0 ? -1 : src.indexOf('>', styleStart) + 1;
const styleClose = src.search(/<\/style\s*>/i);
const headStart = src.search(/<head\b/i);
const headClose = src.search(/<\/head\s*>/i);
const scriptStart = src.search(/<script\b/i);
const scriptTagEnd = scriptStart < 0 ? -1 : src.indexOf('>', scriptStart) + 1;
const scriptClose = src.search(/<\/script\s*>/i);
const bodyClose = src.search(/<\/body\s*>/i);
const scriptSrc = scriptStart >= 0 ? src.slice(scriptTagEnd, scriptClose) : '';
const css = styleStart >= 0 ? src.slice(styleTagEnd, styleClose) : '';
const rules = parseCssRules(css);
const rootRules = rules.filter((r) => !r.container && r.sel.replace(/\s+/g, '') === ':root');
const rootBody = rootRules.map((r) => r.body).join(';\n');
const rootT = tighten(rootBody);

const footerStart = src.search(/<footer\b/i);
const footerClose = src.search(/<\/footer\s*>/i);
const footer = footerStart >= 0 ? src.slice(footerStart, footerClose) : null;

const idx = {};
for (const id of ['top', 'main', 'field', 'loss', 'line', 'triage', 'terms', 'company', 'careers', 'proof', 'questions', 'contact']) {
  idx[id] = idIdx(src, id);
}
const lineSlice = slice(src, idx.line, idx.triage);
const termsSlice = slice(src, idx.terms, idx.company);
const proofSlice = slice(src, idx.proof, idx.questions);
const questionsSlice = slice(src, idx.questions, idx.contact);

/* ---------------------------------------------------------------- checks */

t('doctype + html lang="en"', () => {
  if (!re(/^\s*<!doctype\s+html\s*>/i).test(src)) throw new Error('missing "<!doctype html>" at file start');
  if (!re(/<html\b[^>]*\blang=["']en["']/i).test(src)) throw new Error('missing <html lang="en">');
});

t('charset / viewport / color-scheme metas', () => {
  if (!re(/<meta\b[^>]*charset\s*=\s*["']?utf-8/i).test(src)) throw new Error('missing <meta charset="utf-8">');
  const vp = allTags(src, 'meta').find((tg) => tagHas(tg, 'name="viewport"') || tagHas(tg, "name='viewport'"));
  if (!vp) throw new Error('missing <meta name="viewport">');
  if (!re(/content=["']width=device-width,\s*initial-scale\s*=\s*1["']/i).test(vp))
    throw new Error('viewport meta must be "width=device-width, initial-scale=1"');
  const cs = allTags(src, 'meta').find((tg) => tagHas(tg, 'name="color-scheme"') || tagHas(tg, "name='color-scheme'"));
  if (!cs || !re(/content=["']dark["']/i).test(cs)) throw new Error('missing <meta name="color-scheme" content="dark">');
});

t('title + meta description present', () => {
  if (!re(/<title>\s*\S/).test(src)) throw new Error('missing non-empty <title>');
  if (!allTags(src, 'meta').some((tg) => tagHas(tg, 'name="description"') && tagHas(tg, 'content=')))
    throw new Error('missing <meta name="description" content="...">');
});

t('exactly one <style>, inside <head>', () => {
  const n = (src.match(/<style\b/gi) || []).length;
  if (n !== 1) throw new Error(`expected exactly 1 <style> tag, found ${n}`);
  if (!(styleStart > headStart && styleClose < headClose)) throw new Error('<style> is not inside <head>');
});

t('exactly one <script>, inline, last element before </body>', () => {
  const n = (src.match(/<script\b/gi) || []).length;
  if (n !== 1) throw new Error(`expected exactly 1 <script> tag, found ${n}`);
  if (re(/<script\b[^>]*\bsrc\s*=/i).test(src)) throw new Error('<script> has a src attribute (external JS)');
  if (scriptClose < 0) throw new Error('missing </script>');
  if (bodyClose < 0) throw new Error('missing </body>');
  const tail = src.slice(scriptClose, bodyClose);
  if (!re(/^<\/script\s*>\s*$/i).test(tail)) throw new Error('something other than whitespace sits between </script> and </body>');
});

t('fonts: 2 preconnects + exactly 1 stylesheet link (Inter Tight / JetBrains Mono)', () => {
  const pre = allTags(src, 'link').filter((tg) => tagHas(tg, 'rel="preconnect"') || tagHas(tg, "rel='preconnect'"));
  if (pre.length !== 2) throw new Error(`expected exactly 2 rel="preconnect" links, found ${pre.length}`);
  const gapi = pre.some((tg) => /fonts\.googleapis\.com/i.test(tg));
  const gstat = pre.find((tg) => /fonts\.gstatic\.com/i.test(tg));
  if (!gapi) throw new Error('no preconnect to fonts.googleapis.com');
  if (!gstat) throw new Error('no preconnect to fonts.gstatic.com');
  if (!/\bcrossorigin\b/i.test(gstat)) throw new Error('gstatic preconnect lacks crossorigin');
  const sheets = allTags(src, 'link').filter((tg) => tagHas(tg, 'rel="stylesheet"') || tagHas(tg, "rel='stylesheet'"));
  if (sheets.length !== 1) throw new Error(`expected exactly 1 rel="stylesheet" link, found ${sheets.length}`);
  const href = m1('href=["\']([^"\']+)["\']', sheets[0]) || '';
  const dec = href.replace(/%3A/gi, ':').replace(/%40/gi, '@').replace(/%2B/gi, '+').replace(/%26/gi, '&').replace(/%3D/gi, '=');
  if (!/fonts\.googleapis\.com\/css2/i.test(dec)) throw new Error('stylesheet link is not fonts.googleapis.com/css2');
  if (!/family=Inter\+Tight:wght@400;500;600;700/i.test(dec))
    throw new Error('Inter Tight weights 400;500;600;700 missing from stylesheet href');
  if (!/family=JetBrains\+Mono:wght@400;500/i.test(dec))
    throw new Error('JetBrains Mono weights 400;500 missing from stylesheet href');
  if (!/display=swap/i.test(dec)) throw new Error('display=swap missing from stylesheet href');
});

t('B7: no external http(s) loads beyond Google Fonts (citation hrefs allowed)', () => {
  // Only things the browser fetches count. A plain <a href> is a link, not a load.
  const loads = [];
  for (const m of S.matchAll(/\bsrc\s*=\s*["']([^"']+)["']/gi)) loads.push(m[1]);
  for (const m of S.matchAll(/<link\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)) loads.push(m[1]);
  for (const m of S.matchAll(/@import\s+(?:url\()?["']?([^"')\s]+)/gi)) loads.push(m[1]);
  for (const m of S.matchAll(/url\(\s*["']?(https?:[^"')\s]+)/gi)) loads.push(m[1]);
  const bad = loads.filter((u) => {
    const h = u.toLowerCase();
    if (!/^https?:/.test(h)) return false;
    if (h.startsWith('https://fonts.googleapis.com') || h.startsWith('http://fonts.googleapis.com')) return false;
    if (h.startsWith('https://fonts.gstatic.com') || h.startsWith('http://fonts.gstatic.com')) return false;
    if (h.startsWith('http://www.w3.org/') || h.startsWith('https://www.w3.org/')) return false; // xmlns, not a resource
    return true;
  });
  if (bad.length) throw new Error('external resource load(s) found: ' + bad.slice(0, 3).join(' ; '));
});

t('B8: no <img> tags anywhere', () => {
  if (re(/<img\b/i).test(S)) throw new Error('an <img> tag is present (v2 allows none; data: URIs and inline SVG instead)');
});

t('section ids present and in DOM order', () => {
  const order = ['top', 'main', 'field', 'loss', 'line', 'triage', 'terms', 'proof', 'questions', 'contact'];
  for (const id of order) if (idx[id] < 0) throw new Error(`missing id="${id}"`);
  for (let i = 1; i < order.length; i++)
    if (idx[order[i]] < idx[order[i - 1]]) throw new Error(`id="${order[i]}" appears before id="${order[i - 1]}" (DOM order)`);
});

t('secondary ids present (logbody, missed, annual, verdict, contour, warp, calc-lbl)', () => {
  for (const id of ['logbody', 'missed', 'annual', 'verdict', 'contour', 'warp', 'calc-lbl'])
    if (idIdx(src, id) < 0) throw new Error(`missing id="${id}"`);
});

t('section labels 01..10 exact', () => {
  const labels = ['01 / The loss', '02 / The line', '03 / Triage', '04 / Growth', '05 / Terms', '06 / Who we are', '07 / Careers', '08 / Proof', '09 / Questions', '10 / Start'];
  for (const L of labels) if (!flex(L).test(src)) throw new Error(`section label "${L}" not found`);
});

t('required classes present', () => {
  const need = ['rv', 'label', 'band', 'marquee', 'ramp', 'riso', 'grain', 'wordmark', 'plate',
    'calc', 'log', 'log-row', 'faq', 'cards', 'card', 'terms', 'mail', 'btn', 'skip'];
  const missing = need.filter((c) => !classAttrHas(src, c));
  if (missing.length) throw new Error('missing class(es): ' + missing.join(', '));
});

t('skip link + nav anchors + CTA anchor', () => {
  for (const h of ['#main', '#loss', '#line', '#terms', '#questions', '#contact'])
    if (!re('href=["\']' + esc(h) + '["\']').test(src)) throw new Error(`missing anchor href="${h}"`);
});

t('hero meta: THERMAL FIELD / SIMULATED / 7-STEP RAMP / .ramp / hero section', () => {
  if (!re(/<section\b[^>]*class="[^"]*\bhero\b/).test(src)) throw new Error('no <section class="hero">');
  if (!flex('THERMAL FIELD').test(src)) throw new Error('hero meta missing text "THERMAL FIELD"');
  if (!re(/SIMULATED\s*\/\s*7-STEP\s*RAMP/).test(src)) throw new Error('hero meta missing text "SIMULATED / 7-STEP RAMP"');
  if (!classAttrHas(src, 'ramp')) throw new Error('missing .ramp legend element');
});

t('marquee: after hero / before #loss, aria-hidden, five honest phrases, translateX(-50%) loop', () => {
  const mq = re('class="[^"]*\\bmarquee\\b(?![-\\w])').exec(src);
  if (!mq) throw new Error('missing .marquee element');
  const mqIdx = mq.index;
  if (!(idx.field < mqIdx && mqIdx < idx.loss)) throw new Error('.marquee is not between the hero and #loss');
  const tag = src.slice(mqIdx, src.indexOf('>', mqIdx) + 1);
  if (!/aria-hidden=["']true["']/.test(tag)) throw new Error('.marquee element lacks aria-hidden="true"');
  const mqSlice = slice(src, mqIdx, idx.loss);
  const phrases = ['~2 sec', 'inbound calls only', 'no outbound dialing', 'no recording'];
  for (const p of phrases) if (!flex(p).test(mqSlice)) throw new Error(`marquee item missing phrase "${p}"`);
  if (!/llustrative/i.test(mqSlice)) throw new Error('marquee missing an illustrative-data note');
  if (!re(/translateX\(\s*-50%\s*\)/).test(css)) throw new Error('marquee CSS lacks the translateX(-50%) keyframe loop');
});

t('band: >= 1 <div class="band" aria-hidden="true"> between two sections + pinned height', () => {
  const bandRe = re('<div\\b[^>]*class="[^"]*\\bband\\b(?![\\w-])[^"]*"[^>]*>', 'g');
  const bands = [];
  let mm;
  while ((mm = bandRe.exec(src))) bands.push({ i: mm.index, tag: mm[0] });
  const ok = bands.filter((b) => /aria-hidden=["']true["']/.test(b.tag));
  if (!bands.length) throw new Error('no <div class="band"> element found');
  if (!ok.length) throw new Error('every .band element lacks aria-hidden="true"');
  const footIdx = footerStart;
  const marks = [idx.main, idx.loss, idx.line, idx.triage, idx.terms, idx.proof, idx.questions, idx.contact, footIdx]
    .filter((v) => v >= 0).sort((a, b) => a - b);
  const between = ok.some((b) => marks.some((m, i) => i > 0 && b.i > marks[i - 1] && b.i < m));
  if (!between) throw new Error('no .band sits between two top-level sections');
  const bandCss = bodies(rules, 'band');
  if (!re(/height\s*:\s*clamp\(\s*36px\s*,\s*6vw\s*,\s*96px\s*\)/).test(bandCss))
    throw new Error('band height must be clamp(36px, 6vw, 96px)');
});

t('FAQ: >= 6 native <details> with <summary> in #questions', () => {
  if (!questionsSlice) throw new Error('cannot locate #questions section');
  const nd = (questionsSlice.match(/<details\b/gi) || []).length;
  const ns = (questionsSlice.match(/<summary\b/gi) || []).length;
  if (nd < 6) throw new Error(`#questions has ${nd} <details> elements, need >= 6`);
  if (ns < 6) throw new Error(`#questions has ${ns} <summary> elements, need >= 6`);
});

t('footer wordmark form per R7 (logo data-URI div, aria-hidden, pinned width/aspect)', () => {
  const wm = re('<div\\b[^>]*class="[^"]*\\bwordmark\\b(?![\\w-])[^"]*"[^>]*>').exec(src);
  if (!wm) throw new Error('missing <div class="wordmark">');
  if (!/aria-hidden=["']true["']/.test(wm[0])) throw new Error('.wordmark element lacks aria-hidden="true"');
  const cssWm = bodies(rules, 'wordmark');
  if (!/data:image\/png;base64/.test(cssWm)) throw new Error('.wordmark CSS lacks url("data:image/png;base64,...") logo background');
  if (!re(/aspect-ratio\s*:\s*1166\s*\/\s*178/).test(cssWm)) throw new Error('.wordmark CSS lacks aspect-ratio:1166/178');
  if (!re(/width\s*:\s*clamp\(\s*320px\s*,\s*92vw\s*,\s*1100px\s*\)/).test(cssWm))
    throw new Error('.wordmark CSS lacks width:clamp(320px, 92vw, 1100px)');
  if (!re(/background-size\s*:\s*contain/).test(cssWm)) throw new Error('.wordmark CSS lacks background-size:contain');
});

t('calculator: range min=1 max=40 step=1 value=6; JS multiplier 3867 + toLocaleString(en-US) + input event', () => {
  const inp = allTags(src, 'input').find((tg) => re(/type\s*=\s*["']range["']/i).test(tg));
  if (!inp) throw new Error('no <input type="range"> found');
  for (const a of ['min="1"', 'max="40"', 'step="1"', 'value="6"']) {
    if (!re(a.replace(/"/g, '["\']')).test(inp)) throw new Error(`range input lacks ${a}`);
  }
  if (!/3867/.test(scriptSrc)) throw new Error('JS does not contain the 3867 multiplier');
  if (!re(/toLocaleString\(\s*["']en-US["']\s*\)/).test(scriptSrc)) throw new Error('JS lacks toLocaleString("en-US")');
  if (!re(/["']input["']/).test(scriptSrc)) throw new Error('JS lacks an "input" event listener for the slider');
});

t('tier-1 tokens defined in :root with pinned values', () => {
  if (rootRules.length !== 1) throw new Error(`expected exactly one :root block, found ${rootRules.length}`);
  const pinned = [
    '--void:#05060a', '--deep:#0a0f18', '--bone:#ede9e1', '--heat:#ff5c1a',
    '--disp:"Inter Tight",-apple-system,"Segoe UI",roboto,helvetica,arial,sans-serif',
    '--mono:"JetBrains Mono",ui-monospace,"SF Mono",menlo,consolas,monospace',
    '--pad:clamp(20px,4vw,56px)', '--maxw:1240px',
  ];
  const missing = pinned.filter((p) => !rootT.includes(p));
  if (missing.length) throw new Error('missing/pinned-wrong token(s): ' + missing.join(' ; '));
});

t('tier-2 tokens all defined in :root', () => {
  const names = ['deep2', 'mist', 'faint', 'line', 'line2', 'heat-soft', 'phos',
    'riso-ink', 'fs-h1', 'fs-h2', 'fs-h3', 'fs-lead', 'fs-body', 'fs-label', 'fs-giant'];
  const missing = names.filter((n) => !re('--' + n + '\\s*:').test(rootBody));
  if (missing.length) throw new Error('missing token(s) in :root: --' + missing.join(', --'));
});

t('R6/AC-L4: --riso-ink is #022D52 (not #0078BF)', () => {
  if (!re(/--riso-ink\s*:\s*#022d52/i).test(rootBody))
    throw new Error('RULINGS R6 overrides A3: :root must define --riso-ink:#022D52');
});

t('R9/AC-L2: --spark #FCBE2F / --navy #022D52 / --paper #FEFCF5 in :root', () => {
  const pins = [['--spark:#FCBE2F', /--spark\s*:\s*#fcbe2f/i], ['--navy:#022D52', /--navy\s*:\s*#022d52/i],
    ['--paper:#FEFCF5', /--paper\s*:\s*#fefcf5/i]];
  for (const [label, rx] of pins) if (!rx.test(rootBody)) throw new Error(`missing pinned token in :root: ${label}`);
});

t('JS: single "use strict" IIFE, 8 module comment markers in distinct comments, reduce boolean', () => {
  if (!re(/["']use strict["'](?:\s*;)?/).test(scriptSrc)) throw new Error('script lacks "use strict"');
  const comments = scriptSrc.match(/\/\*[\s\S]*?\*\//g) || [];
  const markers = [
    ['thermal field', /thermal\s*-\s*field|thermal\s+field/i],
    ['fisheye', /fish\s*-?\s*eye/i],
    ['scroll', /\bscroll\b/i],
    ['reveal', /\breveal\b/i],
    ['call log', /call\s+log/i],
    ['calculator', /calculator/i],
    ['contours', /contours/i],
    ['faq', /\bfaq\b/i],
  ];
  for (const [name, rx] of markers) {
    if (!comments.some((c) => rx.test(c))) throw new Error(`no JS comment marker for module "${name}"`);
  }
  const marked = comments.filter((c) => markers.some(([, rx]) => rx.test(c))).length;
  if (marked < 8) throw new Error(`only ${marked} distinct module-marker comments; each of the 8 modules needs its own marker`);
  if (!/matchMedia\s*\(/.test(scriptSrc)) throw new Error('script never calls matchMedia (reduced-motion boolean required)');
  if (!/prefers-reduced-motion/.test(scriptSrc)) throw new Error('script never queries prefers-reduced-motion');
});

t('thermal field machinery: getContext / rAF / ImageData / pixelated / Bayer / ramp in JS', () => {
  for (const [name, rx] of [['getContext', /getContext/], ['requestAnimationFrame', /requestAnimationFrame/],
    ['ImageData/putImageData', /putImageData|\bnew\s+ImageData\b/], ['bayer dither', /bayer/i], ['ramp', /ramp/i]]) {
    if (!rx.test(scriptSrc)) throw new Error(`field module missing ${name}`);
  }
  const pixelatedCss = re(/image-rendering\s*:\s*pixelated/).test(css);
  if (!/imageSmoothingEnabled\s*=\s*false/.test(scriptSrc) && !pixelatedCss)
    throw new Error('neither imageSmoothingEnabled=false in JS nor image-rendering:pixelated in CSS');
});

t('observers: IntersectionObserver for reveal + call log, details toggle listener', () => {
  const n = (scriptSrc.match(/IntersectionObserver/g) || []).length;
  if (n < 2) throw new Error(`expected IntersectionObserver used by both reveal and call-log modules (found ${n} occurrence(s))`);
  if (!re(/["']toggle["']/).test(scriptSrc)) throw new Error('script lacks a "toggle" event listener for single-open FAQ');
});

t('contours + #warp: filter applied, feTurbulence(fractalNoise) + feDisplacementMap(2-14), viewBox 0 0 1200 640', () => {
  const filterBlock = re('<filter\\b[^>]*\\bid=["\']warp["\'][^>]*>[\\s\\S]*?<\\/filter\\s*>').exec(src);
  if (!filterBlock) throw new Error('no <filter id="warp"> definition found');
  const fb = filterBlock[0];
  if (!/feTurbulence/.test(fb) || !re(/type\s*=\s*["']fractalNoise["']/).test(fb))
    throw new Error('#warp lacks feTurbulence type="fractalNoise"');
  const bf = parseFloat(m1('baseFrequency\\s*=\\s*["\']?([\\d.]+)', fb) || '0');
  if (!(bf >= 0.005 && bf <= 0.025)) throw new Error(`feTurbulence baseFrequency ${bf} outside 0.008-0.02 range (+- tolerance)`);
  if (!/feDisplacementMap/.test(fb)) throw new Error('#warp lacks feDisplacementMap');
  const sc = parseFloat(m1('scale\\s*=\\s*["\']?([\\d.]+)', fb) || '0');
  if (!(sc >= 2 && sc <= 14)) throw new Error(`feDisplacementMap scale ${sc} outside 2-14`);
  if (!re(/filter\s*=\s*["']url\(\s*#warp\s*\)["']|filter\s*:\s*url\(\s*#warp\s*\)/).test(src))
    throw new Error('no filter="url(#warp)" attribute or filter:url(#warp) style applied to contour paths/svg');
  if (!re(/viewBox\s*=\s*["']\s*0\s+0\s+1200\s+640\s*["']/).test(src))
    throw new Error('contour svg lacks viewBox="0 0 1200 640"');
  if (!re(/rgba\(\s*255\s*,\s*92\s*,\s*26\s*,\s*\.30?/).test(src)) throw new Error('hot ring stroke rgba(255,92,26,.30) not found');
  if (!re(/rgba\(\s*237\s*,\s*233\s*,\s*225\s*,\s*\.075/).test(src)) throw new Error('base ring stroke rgba(237,233,225,.075) not found');
});

t('H1 label exact, inside #line (call log head)', () => {
  if (!lineSlice) throw new Error('cannot locate #line section');
  if (!lineSlice.includes('Illustrative - sample data'))
    throw new Error('exact ASCII label "Illustrative - sample data" not found in #line (A1 pins ASCII)');
});

t('H2 label exact + .riso + no-clients statement, inside #proof', () => {
  if (!proofSlice) throw new Error('cannot locate #proof section');
  if (!proofSlice.includes('Sample - not a real dispatch'))
    throw new Error('exact ASCII label "Sample - not a real dispatch" not found in #proof (A1 pins ASCII)');
  if (!/class="[^"]*riso[^"]*"/.test(proofSlice)) throw new Error('no .riso dispatch sheet inside #proof');
  if (!re(/no client logos|no clients yet|not (?:been )?installed .*paying/i).test(proofSlice))
    throw new Error('#proof lacks the explicit no-clients statement (AC-8)');
});

t('H3: every mailto is gethooksmith@gmail.com; fit-call mailto keeps town/average prompts; no <form>', () => {
  const hrefs = src.match(/href=["']mailto:([^"']+)["']/gi) || [];
  if (!hrefs.length) throw new Error('no mailto link found');
  const vals = hrefs.map((raw) => raw.match(/mailto:([^"']+)/i)[1].replaceAll('&amp;', '&'));
  for (const v of vals) {
    if (!/^gethooksmith@gmail\.com\?/i.test(v)) throw new Error(`mailto is not gethooksmith@gmail.com?...: ${v.slice(0, 60)}`);
    const subj = v.match(/[?&]subject=([^&]*)/i);
    const body = v.match(/[?&]body=([^&"']*)/i);
    if (!subj || !subj[1]) throw new Error('mailto lacks a non-empty subject param');
    if (!body || !body[1]) throw new Error('mailto lacks a non-empty body param');
  }
  const contact = vals.find((v) => /fit%20call|fit call/i.test(v));
  if (!contact) throw new Error('main fit-call mailto link not found');
  const dec = contact.replace(/%20/gi, ' ').replace(/%0A/gi, '\n').replace(/%26/gi, '&').replace(/%3D/gi, '=');
  if (!/town/i.test(dec) || !/average job value/i.test(dec))
    throw new Error('fit-call mailto body never mentions Town and Average job value (Appendix A prompts)');
  if (re(/<form\b/i).test(src)) throw new Error('a <form> is present (AC-5: mailto only)');
});

t('H4: no client prices inside #terms; three tiers named; no one-time framing', () => {
  if (!termsSlice) throw new Error('cannot locate #terms section');
  if (/\$\s?\d/.test(termsSlice)) throw new Error('a dollar figure appears inside #terms (prices must not be published)');
  for (const tier of ['Growth', 'Growth+', 'Scale'])
    if (!termsSlice.includes(tier)) throw new Error(`missing tier "${tier}" inside #terms`);
  if (/one-time/i.test(termsSlice)) throw new Error('obsolete "one-time" framing inside #terms');
});

t('H5: "3,867" present with national-average / industry framing', () => {
  if (!src.includes('3,867')) throw new Error('"3,867" not found');
  if (!re(/national average|industry figure|industry average/i).test(src))
    throw new Error('3,867 lacks its "national average / industry figure" framing copy');
});

t('H6: answer speed is a setup target', () => {
  const hero = slice(src, idIdx(src, 'field'), idIdx(src, 'loss')) || '';
  if (!/~2 sec<\/b><span>Answer-time target/.test(hero)) {
    throw new Error('hero must distinguish the answer-time target from a measured result');
  }
});

t('H7: "no outbound dialing" AND "no recording" present', () => {
  if (!flex('no outbound dialing').test(src)) throw new Error('"no outbound dialing" not found');
  if (!flex('no recording').test(src)) throw new Error('"no recording" not found');
});

t('B1: killed tiers absent (1,999 / 2,499 / 2,999 / Blueprint)', () => {
  for (const p of ['1,999', '2,499', '2,999', '$1,999', '$2,499', '$2,999', 'Blueprint'])
    if (S.includes(p)) throw new Error(`forbidden price token "${p}" present`);
  const bare = S.match(/\b(?:1999|2499|2999)\b/g);
  if (bare) throw new Error(`forbidden bare price token present: ${bare[0]} (context needed; may be a false positive - check manually)`);
});

t('B2/B3: no "our clients say"; capital-T "Testimonials"; lowercase only inside #proof', () => {
  if (S.includes('our clients say')) throw new Error('phrase "our clients say" present');
  if (S.includes('Testimonials')) throw new Error('capital-T "Testimonials" present (B3)');
  const re1 = /testimonials/gi;
  const proofStartS = S.search(/id=["']proof["']/i);
  const questionsStartS = S.search(/id=["']questions["']/i);
  let mm; const spots = [];
  while ((mm = re1.exec(S))) spots.push(mm.index);
  for (const p of spots)
    if (!(p > proofStartS && p < questionsStartS)) throw new Error('lowercase "testimonials" appears outside #proof (only the honest denial sentence may use it)');
});

t('B4: no <blockquote>, no star ratings', () => {
  if (re(/<blockquote\b/i).test(S)) throw new Error('<blockquote> present');
  if (/★|&#9733;|&#x2605;/i.test(S)) throw new Error('star-rating character present');
});

t('B5: no tel:, no demo-line CTA, no call/dial invitations', () => {
  if (re(/\btel:/i).test(S)) throw new Error('tel: URI scheme present');
  // AC-9 is about inviting clients to call a demo line.
  const careersAt = idIdx(S, 'careers');
  const questionsAt = idIdx(S, 'questions');
  const clientFacing = (careersAt >= 0 && questionsAt > careersAt)
    ? S.slice(0, careersAt) + S.slice(questionsAt)
    : S;
  for (const [label, rx] of [
    ['demo line/number', /demo\s+(?:line|number)/i],
    ['call (us|the line|our line/number)', /\bcall\s+(?:us|our\s+(?:line|number|team)|the\s+(?:line|number|demo))\b/i],
    ['dial invitation', /\bdial\s/i],
    ['try it live', /try\s+it\s+live/i],
    ['listen to a call', /listen\s+to\s+a\s+call/i],
  ]) if (rx.test(clientFacing)) throw new Error(`${label} phrase present (AC-9)`);
});

t('B6: no 10-digit phone number anywhere (data-URI payloads excluded)', () => {
  const mm = S.match(/(\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/);
  if (mm) {
    const i = S.indexOf(mm[0]);
    throw new Error(`phone-like match "${mm[0]}" near: ...${S.slice(Math.max(0, i - 30), i + 40).replace(/\s+/g, ' ')}...`);
  }
});

t('footer truthfulness: no entity/address/ZIP/registration; keeps mailto + HOOKSMITH + disclaimers', () => {
  if (footer === null) throw new Error('no <footer> element found');
  for (const [label, rx] of [
    ['entity/legal name', /\b(?:LLC|Inc\.|Ltd\.|Suite|Ste\.|Ave\.|St\.|Blvd)\b/i],
    ['ZIP-style 5-digit', /\b\d{5}\b/],
    ['registration claim', /regist/i],
  ]) if (rx.test(footer)) throw new Error(`footer contains ${label}`);
  if (!/mailto:gethooksmith@gmail\.com/.test(footer)) throw new Error('footer lacks the mailto contact link');
  if (!footer.includes('HOOKSMITH')) throw new Error('footer lacks visible HOOKSMITH string (meta row, per R7)');
  if (!/simulated/i.test(footer) || !/illustrative/i.test(footer))
    throw new Error('footer lacks honesty disclaimers ("thermal field simulated" / "call log illustrative" wording)');
});

t('ramp legend labels non-numeric: COLD/HOT present, no degree figures', () => {
  if (!/\bCOLD\b/.test(src) || !/\bHOT\b/.test(src)) throw new Error('ramp endpoints COLD/HOT labels not found (A7)');
  if (re(/\d\s*°/).test(S)) throw new Error('numeric temperature figure (digit + °) present - invented data (A7)');
});

t('riso CSS: paper ground, heat+navy inks, halftone radial-gradient, offset construct; riso in #proof', () => {
  const rb = bodies(rules, 'riso');
  if (!rb) throw new Error('no CSS rule for .riso found');
  if (!/(#fefcf5|var\(--paper\)|#ede9e1|var\(--bone\))/i.test(rb)) throw new Error('.riso lacks light paper/bone ground');
  if (!/(var\(--heat\)|#ff5c1a)/i.test(rb)) throw new Error('.riso lacks the heat ink');
  if (!/(var\(--riso-ink\)|#022d52)/i.test(rb)) throw new Error('.riso lacks the navy ink (var(--riso-ink) or #022D52)');
  if (!/radial-gradient/.test(rb)) throw new Error('.riso lacks halftone radial-gradient dot texture');
  if (!/(text-shadow|box-shadow|transform\s*:\s*translate)/.test(rb))
    throw new Error('.riso lacks a misregistration offset construct (text-shadow/box-shadow/translate)');
});

t('CRT log CSS: phosphor amber, scanlines, vignette inset, flicker keyframes (opacity delta <= .06, 3-6s), text-shadow', () => {
  const lb = bodies(rules, 'log');
  if (!lb) throw new Error('no CSS rule for .log found');
  if (!/(var\(--phos\)|#ffb25c)/i.test(lb)) throw new Error('.log lacks phosphor amber (var(--phos) or #FFB25C)');
  if (!/repeating-linear-gradient/.test(lb)) throw new Error('.log lacks repeating-linear-gradient scanlines');
  if (!/text-shadow/.test(lb)) throw new Error('.log lacks text-shadow chromatic aberration');
  if (!/box-shadow/.test(lb) || !/inset/.test(lb)) throw new Error('.log lacks inset box-shadow vignette');
  const kf = rules.filter((r) => /@keyframes/i.test(r.sel) && /flicker/i.test(r.sel));
  if (!kf.length) throw new Error('no @keyframes ...flicker... found');
  const ops = (kf.map((r) => r.body).join('\n').match(/opacity\s*:\s*([\d.]+)/g) || [])
    .map((v) => parseFloat(v.replace(/[^\d.]/g, '')));
  if (ops.length < 2) throw new Error('flicker keyframes are not opacity-based (A5)');
  const minOp = Math.min(...ops);
  if (minOp < 0.94) throw new Error(`flicker opacity dips to ${minOp}; max delta must be 0.06 (min >= 0.94, A5)`);
  const animDecl = (lb.match(/animation\s*:[^;]*flicker[^;]*/gi) || []).join(' ');
  const dur = (animDecl.match(/([\d.]+)s/g) || []).map((v) => parseFloat(v));
  if (!dur.length || !dur.some((d) => d >= 3 && d <= 6)) throw new Error(`flicker cycle ${dur.join('/')}s outside 3-6s (A5)`);
});

t('reduced-motion CSS: media query disables marquee/flicker/rv, scroll-behavior auto; JS reduce boolean', () => {
  const mqRe = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i;
  if (!mqRe.test(css)) throw new Error('no @media (prefers-reduced-motion: reduce) block');
  const blocks = [];
  let mm;
  const g = new RegExp(mqRe.source, 'gi');
  while ((mm = g.exec(css))) {
    let d = 0, i = css.indexOf('{', mm.index), j = i;
    do { if (css[j] === '{') d++; else if (css[j] === '}') d--; j++; } while (j < css.length && d > 0);
    blocks.push(css.slice(i, j));
  }
  const all = blocks.join('\n');
  if (!re(/animation\s*:\s*none/).test(all)) throw new Error('reduce block never sets animation:none (marquee/flicker)');
  if (!re(/scroll-behavior\s*:\s*auto/).test(all)) throw new Error('reduce block lacks scroll-behavior:auto');
  if (!/\.rv\b/.test(all)) throw new Error('reduce block does not mention .rv (reveals must show)');
  if (!(/\.flicker|flicker/i.test(all) || /\.log-row\b/.test(all))) throw new Error('reduce block does not handle flicker/log-row');
  if (!/\.marquee/.test(all)) throw new Error('reduce block does not handle .marquee');
});

t('grain overlay: fixed, pointer-events none, opacity <= 0.06, SVG data-URI source', () => {
  const gb = bodies(rules, 'grain');
  if (!gb) throw new Error('no CSS rule for .grain found');
  if (!re(/position\s*:\s*fixed/).test(gb)) throw new Error('.grain is not position:fixed');
  if (!re(/pointer-events\s*:\s*none/).test(gb)) throw new Error('.grain lacks pointer-events:none');
  const ops = (gb.match(/opacity\s*:\s*([\d.]+)/g) || []).map((v) => parseFloat(v.replace(/[^\d.]/g, '')));
  if (!ops.length) throw new Error('.grain has no opacity declaration');
  if (Math.max(...ops) > 0.06) throw new Error(`.grain opacity ${Math.max(...ops)} > 0.06 (A6)`);
  if (!/data:image\/svg/.test(gb)) throw new Error('.grain background is not an inline/data-URI SVG');
});

t('emboss exclusive to plate: .plate has inset box-shadow', () => {
  const pb = bodies(rules, 'plate');
  if (!pb) throw new Error('no CSS rule for .plate found');
  if (!/box-shadow/.test(pb) || !/inset/.test(pb)) throw new Error('.plate lacks inset box-shadow emboss (AC-20)');
});

t('focus visible: :focus-visible rules with outline', () => {
  if (!/:focus-visible/.test(css)) throw new Error('no :focus-visible selector in CSS (AC-35)');
  const focusRules = rules.filter((r) => !r.container && /focus/i.test(r.sel));
  if (!focusRules.some((r) => re(/outline\s*:/).test(r.body)))
    throw new Error('no focus rule declares an outline');
});

t('responsive media query for narrow widths present', () => {
  const medias = rules.filter((r) => r.container && /max-width\s*:\s*(\d+)px/i.test(r.sel));
  if (!medias.length) throw new Error('no max-width @media block in CSS (AC-30)');
  const widths = medias.map((r) => parseInt(m1('max-width\\s*:\\s*(\\d+)px', r.sel, 'i'), 10));
  if (!widths.some((w) => w <= 700)) throw new Error(`narrow breakpoints are ${widths.join('/')}px; need one <= 700px`);
});

t('R8/AC-L1: mark-logo span + data-URI favicon + >= 3 distinct base64 logo payloads', () => {
  const span = allTags(src, 'span').find((tg) => re(/class\s*=\s*["'][^"']*\bmark-logo\b(?![\w-])/).test(tg));
  if (!span) throw new Error('missing <span class="mark-logo"> (R8)');
  if (!re(/aria-hidden\s*=\s*["']true["']/i).test(span)) throw new Error('.mark-logo lacks aria-hidden="true"');
  const fav = allTags(src, 'link').find((tg) => re(/rel\s*=\s*["'][^"']*icon/i).test(tg));
  if (!fav) throw new Error('missing favicon <link rel="icon">');
  if (!re(/href\s*=\s*["']data:image\//i).test(fav)) throw new Error('favicon link href is not a data: URI (R8)');
  const payloads = new Set((src.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g) || []).map((p) => p.split(',')[1]));
  if (payloads.size < 3)
    throw new Error(`only ${payloads.size} distinct data:image/png;base64 payload(s); AC-L1 requires >= 3 (top bar, wordmark, favicon)`);
});

t('H8: Inbound only present in hero or FAQ', () => {
  const hero = slice(src, idIdx(src, 'field'), idIdx(src, 'loss')) || '';
  if (!/inbound only/i.test(hero + (questionsSlice || ''))) throw new Error('missing inbound-only framing in hero/FAQ');
});

t('B9: obsolete payment claims and tier name absent', () => {
  for (const phrase of ['pilot', 'first caught call', 'credited against month 1', 'no card before proof', '$0 until', 'Multi-line'])
    if (new RegExp(esc(phrase).split(/\s+/).join('\\s+'), 'i').test(S)) throw new Error(`obsolete claim "${phrase}" present`);
});

t('B10: unverified named product absent', () => {
  if (/ChatGPT Business Hub/i.test(S)) throw new Error('unverified named product present');
});

t('N1: no published client prices anywhere (old pilot and three-tier figures gone)', () => {
  for (const p of ['$5,000', '$7,500', '$15,000', '$2,000', '$3,000', '$1,999', '$2,499', '$2,999'])
    if (S.includes(p)) throw new Error(`published client price "${p}" present`);
  for (const phrase of ['billed on the first caught call', 'billed on first caught call', 'on the first caught call'])
    if (new RegExp(esc(phrase).split(/\s+/).join('\\s+'), 'i').test(S)) throw new Error(`obsolete billing claim "${phrase}" present`);
  if (/\bpilot\b/i.test(S)) throw new Error('pilot framing present');
});

t('N2: #careers is gated/informational, no open applications or pay figures, and states remote Egypt + contact', () => {
  const i = idIdx(src, 'careers');
  if (i < 0) throw new Error('no #careers section');
  const j = idIdx(src, 'proof');
  const c = (j > i) ? src.slice(i, j) : src.slice(i);
  for (const [label, rx] of [
    ['hiring gated', /hiring is (?:currently )?gated/i],
    ['informational / no open applications', /informational only|no open applications/i],
    ['no application form accepted', /no application form/i],
    ['operates from India', /operates from india/i],
    ['roles remote from Egypt', /roles? (?:are |is )?remote from egypt/i],
    ['no general pay published', /general pay[^<]{0,120}not published|pay[^<]{0,80}not published here/i],
    ['private agreements for negotiated terms', /private agreements/i],
    ['verified contact email', /mailto:gethooksmith@gmail\.com/i],
  ]) if (!rx.test(c)) throw new Error(`careers missing ${label}`);

  // No application form / materials collection flow
  if (re(/<form\b/i).test(c)) throw new Error('careers contains a form (application form not allowed while gated)');
  if (/voice note|screening links|subject\s*["']phone setter/i.test(c))
    throw new Error('careers contains application instructions/material collection (not allowed while gated)');
  // No pay figures or dial targets promised in careers
  if (/\$\s*\d/.test(c)) throw new Error('careers contains a dollar figure/pay figure (not allowed unless separately approved)');
  if (/\b\d+\s*[- ]?\s*dials?\b|per closed deal|unlocked base/i.test(c))
    throw new Error('careers contains pay/dial-target promises (not allowed in gated informational copy)');
});

t('N3: #company discloses India ops, founder, father as signer, pre-revenue', () => {
  const i = idIdx(src, 'company');
  if (i < 0) throw new Error('no #company section');
  const j = idIdx(src, 'careers');
  const c = (j > i) ? src.slice(i, j) : src.slice(i);
  for (const [label, rx] of [
    ['India operations', /based in India|works? from India|done from India|India, serving/i],
    ['founder & operator', /founder and operator/i],
    ['father signs', /father is the contracting party/i],
    ['pre-revenue / no client', /pre-revenue|no paying client/i],
  ]) if (!rx.test(c)) throw new Error(`company section missing ${label}`);
});

t('N4: no age disclosure anywhere (number, teen, young, minor)', () => {
  for (const [label, rx] of [
    ['age in years', /\b\d{1,3}[\s-]+years?[\s-]+old\b/i],
    ['teen', /\bteen(?:ager|aged)?\b/i],
    ['young founder/operator', /\byoung\s+(?:founder|operator|entrepreneur)\b/i],
    ['minor', /\bminor\b/i],
    ['age number', /\bage(?:d)?\s*\d{1,3}\b/i],
  ]) if (rx.test(S)) throw new Error(`age disclosure present: ${label}`);
});

t('N5: no invented address, registration line or headcount claim', () => {
  for (const [label, rx] of [
    ['postal address', /\b\d+\s+[A-Z][\w'-]+\s+(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Blvd\.?|Boulevard)\b/],
    ['registration number', /\b(?:CIN|GSTIN|LLC|Inc\.|Ltd\.)\b/],
    ['headcount', /\b\d+\s*(?:employees|staff|people|agents|setters)\b/i],
    ['Cairo claim', /(?<!no )cairo/i],
  ]) if (rx.test(S)) throw new Error(`${label} present`);
});

/* ---------------------------------------------------------------- report */

const results = tests.map(({ id, name, fn }) => {
  try { fn(); return { id, name, ok: true }; }
  catch (e) { return { id, name, ok: false, reason: e && e.message ? e.message.split('\n')[0] : String(e) }; }
});
for (const r of results) {
  console.log(`${r.id} ${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.ok ? '' : ' - ' + r.reason}`);
}
const failed = results.filter((r) => !r.ok);
console.log('');
console.log(`${results.length - failed.length}/${results.length} checks passed against: ${process.argv[2]}`);
if (failed.length) {
  console.log(`FAILED: ${failed.map((r) => r.id).join(', ')}`);
  process.exit(1);
}
process.exit(0);
