# Delivery Focus ({messmass})
Status: Active
Last Updated: 2026-06-25
Canonical: No
Owner: Product

**Source of truth:** [{messmass} - From IDEA to LIVE](https://github.com/users/moldovancsaba/projects/8). Migration-program issues live in [mvp-factory-control](https://github.com/moldovancsaba/mvp-factory-control); repo-local bug/delivery issues may live in [moldovancsaba/messmass](https://github.com/moldovancsaba/messmass). This local file is a reminder of how to choose work, not a substitute for the live board.

## Current Rule

Do **not** treat any older issue ranking stored in this repo as current delivery truth.

Before starting work:
1. Open the live board.
2. Filter for `Product = messmass`.
3. Identify the highest-priority item that is either `In Progress`, `Ready`, or the board’s current equivalent.
4. Use the board state, not this repo, as the deciding authority.

## Current Queue

Last verified against Project 8 on `2026-06-25` after the #857-#861 delivery chain.

1. `#862` — next dependency — report-variant and editor workflow migration
2. `#863` — later dependency — public report shell migration with runtime compatibility
3. `#864` — later dependency — legacy deletion and enforcement hardening
4. `#739`-`#746` — later unified admin entity system chain, revisit after Mantine migration progresses
5. `#66` — lower-value documentation infrastructure, keep behind product/runtime migration work

Queue notes:
- `#857` through `#861` are delivered/closed by the `v12.1.14` chain.
- `#862` should move ahead of `#863`/`#864` because it continues the same dependency path and directly affects editor/report-variant workflows.
- `#863` and `#864` remain deferred until editor/report-variant migration is stable.
- `#739` through `#746` are still deferred until the Mantine chain is materially further along.
- Closed duplicate issues `#865`, `#866`, and `#867` were removed from the board.

## Local Repo Context

Latest shipped repo release:
- `v12.1.14` — Mantine migration chain closure and shared primitive/shell/workspace hardening, including:
  - governance/runtime verification for `#857` and `#858`
  - Mantine-backed card primitive hardening for `#859`
  - Mantine-governed admin shell/mobile navigation controls for `#860`
  - Mantine-governed analytics section/toolbar/state primitives for `#861`

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
