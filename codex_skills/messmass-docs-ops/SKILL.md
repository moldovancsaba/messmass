---
name: messmass-docs-ops
description: Maintain and evolve documentation in the Messmass repo, especially docs under docs/operations/ and docs/_meta/. Use when asked to update or audit runbooks, action plans, learnings, documentation inventories, or to turn notes/brain dumps into structured docs and next steps.
---

# Messmass Docs & Ops

## Quick start (read first)

- Identify the user’s concrete goal and the target doc(s).
- Open the relevant doc(s) and preserve existing structure and tone.

**Common targets in this repo**

- `docs/operations/operations-learnings.md` (append learnings; keep entries scannable)
- `docs/operations/operations-action-plan.md` (update plan items; keep actionable + dated)
- `docs/_meta/meta-docs-inventory.md` (add/update entries when docs move/change)
- `docs/messmass-codex-brain-dump.md` (canonical project brain dump; keep updated when doc structure/entrypoints change)

## Workflow

1. Locate the source-of-truth files for the request (use `rg` for discovery).
2. Decide the “single best home” for new information (avoid duplicating content across docs).
3. Update the primary doc first (the one the team will actually read).
4. Update cross-references:
   - If a doc is added/renamed/moved, update `docs/_meta/meta-docs-inventory.md`.
   - If new work is introduced, reflect it in `docs/operations/operations-action-plan.md`.
5. Record learnings after changes land:
   - Add short, specific entries to `docs/operations/operations-learnings.md` with a date and what changed.
6. Sanity-check consistency:
   - Headings, links, terminology, and “what to do next” are aligned across docs.

## Conventions

- Prefer concrete bullets over paragraphs.
- Prefer “do X because Y” phrasing for guidance.
- Don’t introduce new doc files unless the user explicitly wants them.
- When referencing dates, use absolute dates (e.g., “2026-02-06”) instead of “today/yesterday”.

## Helpful commands

- Find docs by keyword: `rg -n "keyword" docs`
- Find references to a doc path: `rg -n "docs/operations/LEARNINGS\\.md|LEARNINGS\\.md" -S`
