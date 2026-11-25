---
name: publish-delivery
description: Mandatory rock-solid publish, CI parity, and live GitHub Actions + Vercel deployment verification gate. Activate BEFORE any git commit, git push, PR merge, or release across messmass, fanmass, camera, sso, or planetbrain so zero commits ever fail on GitHub Actions or Vercel.
---

# Rock-Solid Publish & Delivery Protocol (`publish-delivery`)

Every `git commit` + `git push` in `/Users/Shared/Projects` (`messmass`, `fanmass`, `camera`, `sso`, `planetbrain`) MUST pass local CI/build parity **before** pushing and live remote GitHub Actions + Vercel verification **after** pushing.

## Why Previous Publishes Failed (Forensic Root Causes)

1. **Unregenerated `docs/_audit/*.json` & Wrong Regeneration Order (`inventory:check` / `architecture:check`)**:
   - Adding or editing routes, Mongo collections, env vars, outbound hosts, or `.md` files caused `python3 scripts/fleet-audit-inventory.py --check` to fail on GitHub Actions (`40/40` failed runs on `messmass`, `6/6` on `fanmass`).
   - In `messmass`, `scripts/generate-architecture-sections.js` reads `docs/_audit/endpoints.json`, so `fleet-audit-inventory.py --write` MUST run **before** `generate-architecture-sections.js`.
2. **Untracked Local Files Polluting `fleet-audit-inventory.py --write`**:
   - `fleet-audit-inventory.py` walks the directory tree (`rglob`), not `git ls-files`. Running `--write` in a repo with untracked local scratch files writes phantom entries into `docs/_audit/*.json` that fail on GitHub Actions' clean checkout.
   - `publish-gate.sh --prepare` solves this permanently by regenerating `docs/_audit/*.json` inside an isolated temporary mirror of **only git-tracked + staged files** (`git ls-files --cached`).
3. **Partial Local Checks Skipping CI Guardrails**:
   - Running only `tsc && eslint && jest` missed `check-dependency-guardrail.ts` (e.g. unapproved `echarts`), `docs:audit` / 90-commit verification stamp freshness (`docs/_audit/fleet-architecture.md` & `drift-register.md`), `gds-compliance`, `comments:check`, `comments:versions`, and `next build` / `vite build`.
4. **Fire-and-Forget `git push`**:
   - Pushing without watching `gh run watch` and Vercel deployment status left broken CI runs unnoticed.

---

## Mandatory 4-Step Publish Procedure (No Exceptions)

### Step 1: Stage Intended Files Explicitly
Never use blind `git add .` when untracked scratch files exist. Inspect `git status -s` and stage all intended source, test, and documentation files:
```bash
git status -s
git add <intended-files...>
```

### Step 2: Run the Pre-Commit CI & Build Parity Gate (`--prepare`)
Run `publish-gate.sh --prepare <repo_path>` **after** staging your files and **before** `git commit`:
```bash
bash /Users/Shared/Projects/.agents/skills/publish-delivery/scripts/publish-gate.sh --prepare /Users/Shared/Projects/<repo>
```
What `--prepare` enforces automatically:
1. Builds an isolated clean checkout of **only tracked + staged files** (`git ls-files --cached`) so untracked local files never leak into inventories.
2. Runs `fleet-audit-inventory.py --write` inside that clean mirror, copies `docs/_audit/*.json` back into the repo, runs `generate-architecture-sections.js` (when present), and stages the updated derived files (`git add docs/_audit docs/architecture.md`).
3. Re-exports the staged tree and runs `fleet-audit-inventory.py --check` on the clean mirror (100% identical to GitHub Actions `actions/checkout`).
4. Executes the repository's full CI + production build gate (`messmass`: `type-check`, `lint`, `test`, `style:check`, `version:verify`, `docs:audit`, `inventory:check`, `gds:sync`, `gds-compliance`, `comments:check`, `comments:versions`, `architecture:check`, `check-dependency-guardrail.ts`, `check-layout-grammar-guardrail.ts`, `npm run build`; `fanmass`: `scripts/preflight.sh` byte-compile, unit + 16 CI smoke scripts, clean inventory check, frontend Vite build; `camera`: `inventory:check` + `release:check`; `sso`: `lint`, `type-check`, `build`, guardrails, GDS, `test --runInBand`; `planetbrain`: `diff-schema.sh` + `lint-invariants.py`).

If ANY step fails, **DO NOT COMMIT OR PUSH**. Fix the root cause and re-run `--prepare` until it prints `✅ PRE-COMMIT PUBLISH GATE PASSED`.

### Step 3: Commit & Push
Only after `--prepare` exits `0`:
```bash
git commit -m "<type>(<scope>): <concise summary>"
git push origin HEAD
```

### Step 4: Verify Live GitHub Actions & Vercel Deployment (`--verify-remote`)
Immediately after `git push`, run `--verify-remote` and wait until BOTH GitHub Actions and Vercel (when applicable) finish green:
```bash
bash /Users/Shared/Projects/.agents/skills/publish-delivery/scripts/publish-gate.sh --verify-remote /Users/Shared/Projects/<repo>
```
- Watches the exact GitHub Actions workflow run for `HEAD` (`gh run watch --exit-status`). If it fails, `--verify-remote` automatically prints the failed step logs (`gh run view --log-failed`).
- For Vercel-deployed apps (`messmass`, `camera`, `sso`), polls GitHub Deployment statuses for `HEAD` until Vercel reports `state: success` (`● Ready`). If Vercel reports `failure` or `error`, inspect logs immediately with `npx vercel inspect <deployment-url> --logs` and fix forward.
- **Never report "published", "pushed", or "done" to the user until `--verify-remote` exits `0`.**
