# Next Agent Prompt (Handover)

**Generated:** 2026-02-21  
**Context:** Style editor preview refresh (v11.59.0) delivered; board/docs/version/build/commit/push requested.

---

## What to read first

1. **docs/messmass-codex-brain-dump.md** — doc structure and style-editor/preview note (v11.59.0).
2. **MEMORY.md** — recent focus (style editor preview, OPS-SEC, delivery focus).
3. **docs/operations/operations-action-plan.md** — execution queue and STATE MEMORY.
4. **docs/release-notes-11.59.0.md** — what shipped in this version.

---

## What was done (ready for next agent)

- **Version:** Bumped to **11.59.0** in `package.json`, README, `docs/coding-standards.md`, `docs/api/api-reference.md`, `docs/audits/audit-developer-conduct-and-build-2026-02-21.md`.
- **Docs:** `docs/release-notes-11.59.0.md` created; `docs/features/features-landing-main-page.md` and `docs/landing-main-page-ui-refactor-plan.md` updated with v11.59.0.
- **Memory:** `MEMORY.md` (recent focus), `docs/messmass-codex-brain-dump.md` (Last Updated + Style editor & preview section), `memory/2026-02-21.md` (v11.59.0 completion note).
- **Handover:** This file (`docs/NEXT_AGENT_PROMPT.md`).
- **GitHub project board:** Update MVP Factory Board (project 1, repo mvp-factory-control) — move/close cards for style-editor preview fixes and landing preview if corresponding issues exist; otherwise no change.
- **Build:** Run `npm run build`; fix any failures before commit.
- **Commit & push:** Commit all changes with a clear message (e.g. "v11.59.0: style editor preview refresh, Value Chain + Landing preview, docs, handover") and push to **preview** branch.

---

## What to run first

1. `npm run build` — confirm green.
2. `git status --short` — confirm all intended files are staged.
3. Commit and push to `preview`.

---

## What to avoid

- Do not bump version again for this same delivery (already 11.59.0).
- Do not duplicate release notes or feature doc entries.

---

## Definition of done for this handover

- [x] Version 11.59.0 set everywhere
- [x] Release notes and feature docs updated
- [x] MEMORY.md, brain-dump, memory/2026-02-21.md updated
- [x] Handover doc (this file) created
- [ ] GitHub project board updated (if issues exist for style-editor/landing preview)
- [ ] `npm run build` passed
- [ ] Changes committed and pushed to **preview**
