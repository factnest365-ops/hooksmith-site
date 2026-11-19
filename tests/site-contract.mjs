#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const home = resolve(process.argv[2] ?? fileURLToPath(new URL("../index.html", import.meta.url)));
const root = dirname(home);
const pages = new Map([
  ["/", readFileSync(home, "utf8")],
  ["/company", readFileSync(join(root, "company.html"), "utf8")],
  ["/careers", readFileSync(join(root, "careers.html"), "utf8")],
]);
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
assert.equal(vercel.cleanUrls, true, "Company and Careers need extensionless routes");
assert.equal(vercel.trailingSlash, false, "Use the canonical paths");

for (const [route, html] of pages) {
  assert.match(html, /^<!doctype html>\s*<html lang="en">/i, route);
  assert.match(html, /<title>[^<]+<\/title>/, route);
  assert.match(html, /<meta name="description" content="[^"]+">/, route);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/, route);
  assert.ok(html.includes(`rel="canonical" href="https://www.gethooksmith.com${route}"`), route);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, route);
  assert.match(html, /href="#main">Skip to content<\/a>/, route);
  assert.match(html, /<main id="main">/, route);
  assert.match(html, /href="\/company"/, route);
  assert.match(html, /href="\/careers"/, route);
  assert.doesNotMatch(html, /\b(?:India|Cairo|Egypt|Father|contracting party)\b/i, route);
  assert.doesNotMatch(html, /\$\s*\d|two.second|free month|tel:|<form\b/i, route);

  for (const [, link] of html.matchAll(/\b(?:href|src)="(\/[^"]*|#[^"]+)"/g)) {
    const [path, fragment] = link.split("#");
    if (path.startsWith("/assets/")) {
      assert.ok(existsSync(join(root, path)), `${route} → ${link}`);
      continue;
    }

    const target = pages.get(path || route);
    assert.ok(target, `${route} → ${link}`);
    if (fragment) assert.ok(target.includes(`id="${fragment}"`), `${route} → ${link}`);
  }
}

const homepage = pages.get("/");
assert.match(homepage, /<h1[^>]*>Growth systems for <span>restoration companies\.<\/span>/);
for (const service of ["Demand generation", "Inquiry handling", "Lead follow-up", "Reviews and referrals"]) {
  assert.ok(homepage.includes(`<h3>${service}</h3>`), service);
}
assert.equal([...homepage.matchAll(/href="mailto:([^?"]+)/g)].map(([, email]) => email).join(), "gethooksmith@gmail.com");
assert.doesNotMatch(homepage, /id="(?:company|careers)"/, "Use standalone Company and Careers pages");
assert.match(pages.get("/careers"), /No open positions/);
assert.doesNotMatch(pages.get("/careers"), /apply now|mailto:/i);
assert.match(readFileSync(join(root, "assets/site.css"), "utf8"), /thermal-field\.png/);
assert.ok(existsSync(join(root, "assets/thermal-field.png")));

console.log("Site contract passed for /, /company and /careers.");
