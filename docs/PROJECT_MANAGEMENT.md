# Project Management & SSOT Guidelines

**Purpose:** This document defines how {messmass} delivery work is tracked and how SSOT updates must happen.
**Audience:** Product Owner, agents, and developers working in this repo.

## 1. Safety & Hallucination Controls
- Never guess board state, issue state, or deployment state. If it is not visible in the board or repo, ask.
- Read the active card and the canonical docs before changing code or docs.
- If GitHub CLI commands fail, hang, or return incomplete board data, stop and ask or use the board UI.
- Do not treat local notes as task truth. The board is the SSOT.

## 2. Single Source of Truth (SSOT)
- Board: <https://github.com/users/moldovancsaba/projects/8>
- SSOT issues repo: `moldovancsaba/messmass`
- Product field for this repo: `messmass`

Rules:
- If work is not on the board, it is not active delivery work.
- Status is controlled by the board field, not by issue titles.
- {messmass} issues live in `moldovancsaba/messmass` (this repo), attached to Project 8. Older deliveries were tracked in `mvp-factory-control`; those references remain valid history but no new {messmass} issues go there.
- Every delivery must map to one SSOT card and keep that card updated at start, milestone, blocker, and done states.
- Local docs must reflect board truth immediately after material progress.

## 3. Mandatory Delivery SOP
Use this process for every {messmass} delivery:

1. Confirm the active issue exists in `moldovancsaba/messmass`.
2. Ensure it is attached to Project 8.
3. Ensure board fields are correct at minimum: `Product=messmass`, `Type`, `Priority`, `Status`.
4. Before implementation, move it to `In Progress` and post a short start note with objective and approach.
5. After each meaningful milestone, post a progress note with evidence.
6. If blocked, set status to `Blocked` and post the blocker plus next attempt.
7. When done, post acceptance and validation evidence, move status to `Done`, and close the issue if that is the project convention.

## 4. Issue Structure
An issue is execution-ready only when it includes:

1. Objective
2. Context
3. Scope
4. Dependencies
5. Acceptance criteria / DoD

If any of these are materially unclear, stop and ask the PO.

## 5. Board Fields

| Field | Meaning | Rule |
| :--- | :--- | :--- |
| `Status` | Workflow stage | Use board value only: `Backlog`, `Ready`, `In Progress`, `Blocked`, `Done`, or current board equivalent |
| `Product` | App ownership | Must be `messmass` for this repo's work |
| `Type` | Nature of work | Use board taxonomy such as `Feature`, `Bug`, `Refactor`, `Docs`, `Ops` |
| `Priority` | Delivery urgency | Preserve board priority (`P0`, `P1`, `P2`, etc.) |
| `Agent` | Current executor | Set to the acting agent when work starts if the field exists |
| `DoD` | Definition of done status | Mark passed only after validation evidence exists |

## 6. Required Cadence
- Start: move card to `In Progress` and add a start note.
- Milestone: add a short progress note with evidence.
- Blocker: set `Blocked` and add blocker + next attempt.
- Done: set `Done` and add acceptance + validation evidence.

## 7. Manual CLI Fallback
Use the board UI first if CLI behavior is unreliable. If CLI is available, these are the safe baseline commands:

```bash
gh issue view <ISSUE_NUMBER> --repo moldovancsaba/messmass
gh project item-add 8 --owner moldovancsaba --url "https://github.com/moldovancsaba/messmass/issues/<ISSUE_NUMBER>"
gh project item-list 8 --owner moldovancsaba --limit 500 --format json
gh issue comment <ISSUE_NUMBER> --repo moldovancsaba/messmass --body-file /tmp/ssot-note.md
```

## 8. {messmass} Canonical Delivery Docs
- [index.md](index.md) — canonical docs entrypoint
- [messmass-codex-brain-dump.md](messmass-codex-brain-dump.md) — quick repo refresher
- [operations-action-plan.md](operations/operations-action-plan.md) — execution queue and state memory
- [operations-delivery-focus.md](operations/operations-delivery-focus.md) — board-derived priority view
- [NEXT_AGENT_PROMPT.md](NEXT_AGENT_PROMPT.md) — next-agent continuation package
