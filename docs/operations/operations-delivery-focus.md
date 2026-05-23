# Delivery Focus ({messmass})
Status: Active
Last Updated: 2026-05-23
Canonical: No
Owner: Product

**Source of truth:** [{messmass} - From IDEA to LIVE](https://github.com/users/moldovancsaba/projects/8). Issues live in [mvp-factory-control](https://github.com/moldovancsaba/mvp-factory-control). This local file is a reminder of how to choose work, not a substitute for the live board.

## Current Rule

Do **not** treat any older issue ranking stored in this repo as current delivery truth.

Before starting work:
1. Open the live board.
2. Filter for `Product = messmass`.
3. Identify the highest-priority item that is either `In Progress`, `Ready`, or the board’s current equivalent.
4. Use the board state, not this repo, as the deciding authority.

## Current Queue

Last verified against Project 8 on `2026-05-23`.

1. `#859` — `In Progress (NOW)` — shared primitive parity and wrapper transition
2. `#857` — `Review (ALMOST)` — governance reset and authority alignment
3. `#858` — `Review (ALMOST)` — root runtime, theme, and overlay platform
4. `#860` — `Todo (NEXT)` — shared shell, navigation, and page-header migration
5. `#861` — `Backlog (SOONER)` — reporting and analytics workspace migration

Queue notes:
- `#862` remains `Backlog (SOONER)` behind `#861`.
- `#863` and `#864` are intentionally deferred to `Roadmap (LATER)`.
- `#739` through `#746` are open but currently deferred to `Roadmap (LATER)` until the Mantine chain is materially further along.
- Closed duplicate issues `#865`, `#866`, and `#867` were removed from the board.

## Local Repo Context

Latest shipped repo release:
- `v12.1.12` — admin workspace regression fixes, including:
  - project-partner CSRF fix
  - shared admin hero containment fix
  - analytics card overflow cleanup
  - Bitly status cleanup
  - README/workspace sync

Current local documentation truth:
- [README.md](../../README.md) reflects the current product/workspace model and shipped version.
- [HANDOVER.md](../HANDOVER.md) reflects the latest repo truth and dated delivery log.
- [operations-release-notes.md](operations-release-notes.md) reflects the latest shipped release.

## Next Step Discipline

If you need a “top 5” or “next best step” list:
- re-check the live board first
- verify issue status and dependencies directly
- then update this file only after the board snapshot is confirmed

This prevents local documentation from drifting into outdated rankings such as older `#72`-centric guidance after the product focus has moved on.
