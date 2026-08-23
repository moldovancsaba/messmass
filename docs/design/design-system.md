# {messmass} Design System
Status: Active
Last Updated: 2026-08-08T16:40:43.000Z
Canonical: Yes
Owner: Architecture

**Version**: 12.2.3
**Status**: Production

## Purpose

This document defines the current frontend design-system contract for {messmass}. All UI/UX/frontend work must use the General Design System as the canonical implementation source:

`https://github.com/sovereignsquad/general-design-system`

Local UI code may adapt GDS primitives to Messmass domain needs, but it must not fork the design language or introduce unrelated component systems.

## Current Stack

- GDS packages: `@sovereignsquad/gds-admin`, `@sovereignsquad/gds-core`, `@sovereignsquad/gds-theme`
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

Machine-readable form of this table lives in `gds-adoption.json`'s `localAdapters`
— keep the two in sync. `status: active` here means a genuine thin GDS wrapper;
`status: planned` means fully local/custom markup with a scheduled GDS
replacement (see the GDS adoption plan for the migration order).

| Pattern | Current Use | GDS target | Status |
|---------|-------------|------------|--------|
| `ColoredHashtagBubble` | Hashtag display/selection/removal chip, over GDS `ChoiceChip` | `ChoiceChip` | active |
| `HashtagMultiSelect` | Hashtag filter-bar multi-select, over GDS `ChoiceChip` | `ChoiceChip` | active |
| `MetricCard` (`components/analytics/MetricCard.tsx`) | Analytics metric card, over GDS `MetricCard` | `MetricCard` | active |
| `AdminLayout` | Admin shell and page containment | `AppShell` | planned |
| `UnifiedAdminPage` | Orchestrates hero+search+list/card toggle+sort across 6 admin pages; not previously documented despite being load-bearing | `AdminResourceManager` | planned |
| `UnifiedListView` | Sortable admin table, composes `AdminActionRail` for row actions; not previously documented | `AdminDataTable` / `ResponsiveDataView` | planned |
| `UnifiedCardView` | Admin card grid, composes `ColoredCard` + `AdminActionRail`; not previously documented | `AdminResourceGrid` | planned |
| `UnifiedAdminHeroWithSearch` | Admin list-page hero, search, and primary actions | `PageHeader` | planned |
| `FormModal` / `BaseModal` | Modal workflows that need consistent accessible structure | `AdminCrudForm` / `AdminModal` | planned |
| `AdminActionRail` | Shared primary/secondary/overflow row and card action rail; not previously documented | `ActionBar` | planned |
| `TopHeader` | Admin workspace header | `WorkspaceHeader` | planned |
| `UnifiedHashtagInput` | Hashtag selection and categorized hashtag input | — | domain-specific, not yet mapped |
| `ReportChart` | Report chart rendering (Chart.js) | — | domain-specific, not a UI-kit primitive |
| `ReportContent` | Report block layout (custom CSS-grid layout engine) | — | domain-specific, not a UI-kit primitive |

### `ColoredHashtagBubble` / `HashtagMultiSelect` (2026-08-08 GDS migration)

- **GDS primitive used**: `ChoiceChip` (`@sovereignsquad/gds-core/client`) — a real `<button>`
  when interactive (`onClick` set), a non-interactive `Badge` otherwise.
- **Runtime flow**: `ColoredHashtagBubble` keeps its existing color-resolution logic
  (`useHashtagColorResolver`) and prop contract, but renders the pill via `ChoiceChip`
  instead of a hand-rolled `<span>`/`<button>`. `HashtagMultiSelect`'s selection grid
  replaced `<label><input type="checkbox"/></label>` with `ChoiceChip`'s own
  `active`/`onClick` (`aria-pressed` under the hood) — GDS's `ChoiceChip` is explicitly
  documented upstream for "lightweight selection, mode toggles, and taxonomy links".
- **Props contract**: unchanged externally for `ColoredHashtagBubble`
  (`hashtag`/`small`/`interactive`/`onClick`/`removable`/`onRemove`/`categoryColor`/
  `projectCategorizedHashtags`/`autoResolveColor`) — all 14 existing call sites work as-is.
  One new optional prop: `ariaLabel`. `ColoredHashtagBubble` is reused for genuinely
  different `interactive` actions across the app (toggle a filter, open a share popup, …)
  — it cannot guess which one a given caller means, so it never hardcodes a description.
  Omit `ariaLabel` and the chip's visible text (`#hashtag`) is the accessible name, which
  is always at least accurate; pass it when a caller's action needs a more specific
  description (e.g. `"Remove {hashtag} filter"`).
- **Accessibility behavior**: interactive chips are real `<button>`s (native keyboard
  reachability, focus state, `aria-pressed` on selection chips). An `interactive` +
  `removable` chip can't nest a second real button (invalid HTML), so in that combination
  the "×" is decorative (`aria-hidden`) and the whole chip removes on click — only used
  where `onClick`/`onRemove` already invoke the same handler. A `removable`-only chip
  keeps a real, independently focusable/labelled remove `<button>`.
- **Mobile behavior**: `ChoiceChip` touch targets match GDS's own sizing; the selection
  grid still wraps via `HashtagMultiSelect.module.css`'s `.hashtagsGrid`
  (`repeat(auto-fill, minmax(280px, 1fr))`), unchanged.
- **States**: disabled forwards to the underlying `<button>` (verified: `ChoiceChip`'s
  Mantine `Badge` is polymorphic and forwards unrecognized props to the DOM element it
  renders as, even though its own TS type doesn't declare `disabled`/`title`). No
  loading/empty/error state applies to a display chip.
- **Verification**: `npm run lint`, `npm run type-check`, `npm test`, `npm run build`
  all clean; manually verified via a temporary scratch route (deleted before commit) —
  display/removable/interactive+removable bubbles, the selection grid's active/light
  variant swap on click, and the selected-filters row's remove-on-click, all screenshot-
  and interaction-tested with headless Chromium.

### `ConfirmDialog` retired (2026-08-16, Phase 5)

- **GDS primitive used**: `GdsConfirmProvider`/`useGdsConfirm` (`@sovereignsquad/gds-core/client`),
  mounted once at the root (`app/providers.tsx`, inside `GdsProvider`).
- **Runtime flow**: full retirement, not a wrapper — `components/modals/ConfirmDialog.tsx`
  is deleted. All 3 call sites (`app/admin/clicker-manager/page.tsx`,
  `app/admin/visualization/page.tsx`, `app/admin/users/page.tsx`) now call
  `const ok = await confirm({ title, message, danger })` imperatively instead of
  rendering a controlled `isOpen`/`onClose` dialog component; the local `isOpen`
  state each site kept solely to drive the old dialog was removed.
- **Props contract**: `confirm()`'s `ConfirmRequest` takes `title`/`message`/`danger`
  (boolean) — no `confirmText`/`cancelText` override; button copy comes from GDS's
  own semantic action vocabulary (`danger: true` defaults to the `delete` action).
  None of the 3 call sites customized button text beyond "Delete"/"Delete All", both
  already covered by the default.
- **Accessibility / mobile / states**: inherited entirely from GDS's own dialog —
  not re-implemented locally, so there is nothing local left to verify beyond the
  call sites' own confirm/cancel branching.
- **Verification**: `npm run lint`, `npm run type-check`, `npm test`, `npm run build`
  all clean.

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

**Alias status (Phase 4a)**: 17 of `theme.css`'s ~80 color tokens are aliased
to a GDS/Mantine CSS variable (`var(--mantine-color-messmassX-N, #original)`)
— verified byte-identical to the prior literal, not a visual change. Only
values with an exact match were aliased; GDS's default Mantine palette is
Open Color-derived while messmass's remaining chart/landing colors are
Tailwind-derived, so most of the file has no exact GDS equivalent to alias
to. Retiring those requires picking a real replacement color and a visual
review — that is Phase 4b, tracked as ongoing token-system work, not a
mechanical alias.

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
