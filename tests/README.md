# Hooksmith site checks

Run from the repo root.

```sh
node --check assets/legacy-links.js
node tests/site-contract.mjs
git diff --check
```

The contract covers the three pages, their routes and links, public wording,
service coverage, the closed hiring state, and the shared thermal artwork.
It supersedes the single-page contract at commit `ed06c84`.

In a browser, check the three routes at 1440 px and 390 px. Check the main
navigation, contact link, keyboard skip link, and the old `/#company` and
`/#careers` bookmarks. Verify that Vercel serves the extensionless route URLs
directly before calling the release complete.
