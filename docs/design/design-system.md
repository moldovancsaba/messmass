# {messmass} Design System
Status: Active
Last Updated: 2026-06-26T10:00:00.000Z
Canonical: Yes
Owner: Architecture

**Version**: 12.1.18
**Status**: Production

## Purpose

This document defines the current frontend design-system contract for {messmass}. All UI/UX/frontend work must use the General Design System as the canonical implementation source:

`https://github.com/sovereignsquad/general-design-system`

Local UI code may adapt GDS primitives to Messmass domain needs, but it must not fork the design language or introduce unrelated component systems.

## Current Stack

- GDS packages: `@doneisbetter/gds-admin`, `@doneisbetter/gds-core`, `@doneisbetter/gds-theme`
- UI foundation: Mantine 8
- Icons: Tabler icons through GDS-compatible wrappers
- Product routes: Next.js App Router
- Local theme tokens: `app/styles/theme.css`

## Mandatory Rules

1. Use GDS components and vocabulary before creating local UI.
2. Use local wrappers only when they encode Messmass domain behavior.
3. Do not introduce a second card, modal, table, action rail, shell, notification, or form-control system.
4. Do not rely on TailAdmin-era guidance, removed utility classes, or deleted component files.
5. Accessibility is a release blocker, not a polish task.
6. Mobile portrait layouts must expose primary actions without horizontal scrolling or hidden overflow.
7. Design-system changes must include documentation and verification evidence.

## Approved Local Patterns

| Pattern | Current Use |
|---------|-------------|
| `AdminLayout` | Admin shell and page containment |
| `UnifiedAdminHeroWithSearch` | Admin list-page hero, search, and primary actions |
| `FormModal` / `BaseModal` | Modal workflows that need consistent accessible structure |
| `ConfirmDialog` | Destructive confirmation flows |
| `UnifiedHashtagInput` | Hashtag selection and categorized hashtag input |
| `ReportChart` | Report chart rendering |
| `ReportContent` | Report block layout |

If a new local wrapper is needed, document:

- GDS primitive used
- runtime flow
- props contract
- accessibility behavior
- mobile behavior
- loading, empty, error, and disabled states
- tests or manual verification

## Accessibility Contract

Every interactive surface must define:

- accessible name for icon-only actions
- keyboard reachability
- visible focus state
- semantic element or ARIA role
- disabled and loading semantics
- error messaging connected to the input or region it describes
- touch target size suitable for mobile portrait

Modals must define:

- focus trap behavior
- initial focus
- escape/close behavior
- labelled title
- destructive action confirmation where relevant

## Mobile Portrait Contract

Mobile portrait is a first-class viewport. Required behavior:

- Primary action remains visible or moves into an accessible sticky/action area.
- Action groups wrap predictably and do not overflow their container.
- Search/filter controls remain reachable without blocking list content.
- Cards expose the same critical actions as list rows.
- Inputs, selects, and date/time controls remain tappable with visible active state.
- Browser bottom bars and safe-area insets must not cover primary actions.

## Token Contract

Use the GDS theme first. Use `app/styles/theme.css` only for Messmass-specific compatibility tokens and legacy migration support.

Allowed token work:

- mapping old `--mm-*` tokens to GDS/Mantine theme values
- adding domain-specific semantic tokens when GDS has no equivalent
- documenting token purpose and expected scope

Disallowed token work:

- arbitrary one-off hardcoded colors in active UI
- new local palettes that conflict with GDS
- component-private token systems without architecture approval

## Runtime Flow For UI Changes

1. Search for an existing GDS or approved local pattern.
2. Reuse that pattern unless there is a clear domain gap.
3. If creating a wrapper, keep it thin and domain-specific.
4. Verify desktop, tablet, and mobile portrait.
5. Verify keyboard and screen-reader semantics.
6. Update the relevant documentation.
7. Run `npm run docs:audit` after documentation edits.

## Observability And Recovery

UI operations that trigger backend work must expose:

- loading state
- success state
- recoverable error state
- retry path where retry is safe
- timeout/failure copy that explains what happened
- rollback/recovery behavior for destructive or sync actions

For long-running operations, show durable status rather than only transient toasts.

## Current Verification Commands

```bash
npm run docs:audit
npm run lint
npm run type-check
npm run build
```

Use targeted tests when touching feature-specific flows.

## Documentation Rules

- Current design-system truth lives in this file.
- Historical design-system migrations belong under `docs/archive/`.
- Component inventory lives in `docs/components/components-reusable-components-inventory.md`.
- Architecture integration details live in `docs/architecture.md`.
- No active doc may reference deleted UI files as implementation targets.
