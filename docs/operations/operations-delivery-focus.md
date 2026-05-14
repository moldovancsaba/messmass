# Delivery Focus ({messmass})
Status: Active
Last Updated: 2026-05-14
Canonical: No
Owner: Product

**Source of truth:** [MVP Factory Board](https://github.com/users/moldovancsaba/projects/1) (Product = `messmass`). Issues live in [mvp-factory-control](https://github.com/moldovancsaba/mvp-factory-control). This local file is a reminder of how to choose work, not a substitute for the live board.

## Current Rule

Do **not** treat any older issue ranking stored in this repo as current delivery truth.

Before starting work:
1. Open the live board.
2. Filter for `Product = messmass`.
3. Identify the highest-priority item that is either `In Progress`, `Ready`, or the board’s current equivalent.
4. Use the board state, not this repo, as the deciding authority.

## Local Repo Context

Latest shipped repo release:
- `v12.1.12` — admin workspace regression fixes, including:
  - project-partner CSRF fix
  - shared admin hero containment fix
  - analytics card overflow cleanup
  - Bitly status cleanup
  - README/workspace sync

Current local documentation truth:
- [README.md](/Users/moldovancsaba/Projects/messmass/README.md) reflects the current product/workspace model and shipped version.
- [HANDOVER.md](/Users/moldovancsaba/Projects/messmass/docs/HANDOVER.md) reflects the latest repo truth and dated delivery log.
- [operations-release-notes.md](/Users/moldovancsaba/Projects/messmass/docs/operations/operations-release-notes.md) reflects the latest shipped release.

## Next Step Discipline

If you need a “top 5” or “next best step” list:
- re-check the live board first
- verify issue status and dependencies directly
- then update this file only after the board snapshot is confirmed

This prevents local documentation from drifting into outdated rankings such as older `#72`-centric guidance after the product focus has moved on.
