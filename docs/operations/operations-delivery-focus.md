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

Last verified against Project 8 on `2026-06-25` before the #862-#864 and #740-#741 delivery update.

1. `#862` — delivered in `v12.1.15` through report-variant selector layering and report workspace form hardening
2. `#863` — delivered in `v12.1.15` through shared Mantine public report shells for partner/organization reports
3. `#864` — delivered in `v12.1.15` through public shell enforcement and legacy-wrapper guardrails
4. `#740` — delivered in `v12.1.15` through expanded entity contract/action/form schema documentation and runtime support
5. `#741` — delivered in `v12.1.15` through `EntityFormModal` and organization create/edit migration

Queue notes:
- `#857` through `#861` are delivered/closed by the `v12.1.14` chain.
- `#862` through `#864` should be closed after validation and board update.
- `#740` and `#741` should be closed after validation and board update.
- Remaining unified admin chain sub-issues `#742`, `#743`, `#744`, and `#746` remain the next likely product architecture sequence.
- Closed duplicate issues `#865`, `#866`, and `#867` were removed from the board.

## Local Repo Context

Latest shipped repo release:
- `v12.1.19` — Styled-jsx surface reduction (#85 part 1): removed 4 dead styled-jsx components (SimpleHashtagInput, FormattingControls, CategorizedHashtagInput, FormulaEditor), halving the styled-jsx baseline from 8 to 4. Remaining 4 live components + global legacy-CSS removal stay tracked in #85.
- `v12.1.18` — Definition-of-Done close-out: real insights `overallScore` (was hardcoded), honest Bitly device/browser comment, a styled-jsx reintroduction guardrail in `style:check`, an archived-docs note, and CI promoted to a required status check on `main`. The two high-risk migrations (Mantine legacy retirement, V2→V3 data layer) remain staged in issues #85/#87.
- `v12.1.17` — Enforcement & security hardening: restored the CI guardrail gate removed in `38c87cd`, re-enabled ESLint in the production build, authenticated the `content-assets` write endpoints, fixed the Jest connection leak, patched `ws`/`qs` advisories, and re-synced version/handover docs that had drifted to `v12.1.15`.
- `v12.1.16` — Documentation consistency delivery plus the (previously unversioned) partner-report slug canonicalization, ImgBB-413 direct-upload fix, and CHL report fonts.
- `v12.1.15` — Mantine report variant/public shell/entity form delivery, including:
  - report-variant select dropdown portal/z-index fix for `#862`
  - Mantine public report shell migration for `#863`
  - guardrail hardening for `#864`
  - admin entity form schema and organization form migration for `#740`/`#741`
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
