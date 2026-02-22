# Release Steps (Every Deliverable Change)
Status: Active
Last Updated: 2026-02-21T00:00:00.000Z
Canonical: Yes
Owner: Product

**MANDATORY:** After every deliverable code change, run these steps **in order**. Do not skip or defer. Do not wait for the user to ask.

## 1. Version update

- Bump **PATCH** in `package.json` for fixes; **MINOR** for features (semantic versioning).
- Update **README.md** (Version and Last Updated if needed).
- Update any docs that display product version: `docs/api/api-reference.md`, `docs/features/features-*.md` touched by the change, `docs/coding-standards.md` (Version line). See `docs/documentation-governance.md` (Product SSOT).

## 2. Documentation

- Update feature/API docs for the code you changed (e.g. landing main page, API reference).
- If the project has **RELEASE_NOTES.md** or equivalent, add a short entry for the change (module impact per `docs/coding-standards.md`).

## 3. Test local build

Run and ensure both pass:

```bash
npm run type-check
npm run build
```

If either fails, fix before committing.

## 4. Commit and push

- Stage all changed files (code, docs, version bumps).
- Commit with a clear message (e.g. `v11.56.X: Short description`).
- Push to a **non-protected** branch (e.g. `preview`, or `release/v11.56.X`). Do not push directly to `main` if branch protection requires a PR.
- If the repo uses PRs for `main`, tell the user to open a PR from the pushed branch.

## Reference

- **Delivery loop (branch/CI):** `agentic/operating-rules/delivery-loop.md`
- **Coding standards (version + docs):** `docs/coding-standards.md`
- **Documentation governance:** `docs/documentation-governance.md`
