# Hooksmith site - GitHub push bundle (prepared 2026-11-13)

**Status:** Code ready, contract gate 49/49 PASS. **Not pushed** - `gh` auth `factnest365-ops` cannot create `factnest365-ops/hooksmith-site` (repo missing / no permission).

## Contents
- `index.html` - live/gated site artifact (synced from `Shared/hooksmith/factory/site-v2/artifacts/index.html`)
- `BRIEF.md`, `contract.md`, `spec.md`, `RULINGS.md` - factory source of truth
- `tests/site-contract.mjs` - blind contract test (run: `node tests/site-contract.mjs index.html`)

## Blocker (Boss/Father action needed)
Create repo `factnest365-ops/hooksmith-site` on GitHub (or grant `factnest365-ops` create/write access to an existing repo), then run:

```bash
cd /Users/bhavy/OpenBot/Shared/hooksmith/overnight-2026-11-13/github-hooksmith-site-bundle
git init
git add .
git commit -m "Hooksmith site v2 (contract 49/49)"
git branch -M main
git remote add origin git@github.com:factnest365-ops/hooksmith-site.git
# or: git remote add origin https://github.com/factnest365-ops/hooksmith-site.git
git push -u origin main
```

If using a different owner/repo, replace the remote URL. Verify after push:
```bash
node tests/site-contract.mjs index.html
```

## Live deploy
Already deployed (Vercel prod): https://hooksmith-snowy.vercel.app  
Vercel project: `forgers-projects-d514bc4e/hooksmith` (config in `Shared/hooksmith/factory/site-v2/artifacts/.vercel/`). GitHub is for source control; Vercel deploy is separate.
