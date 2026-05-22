# Design System Remediation Spec — 2026-05-22

## Objective

Turn the 2026-05-22 design-system audit into a strict, dependency-driven remediation program that:

- stops new styling drift immediately
- reduces existing shared-surface inconsistency first
- protects active admin/reporting workflows from further divergence
- clarifies the authority model between the external `GENERAL_DESIGN_SYSTEM` and the current `{messmass}` local wrapper/token system

## Source Inputs

- Audit: `/Users/moldovancsaba/Projects/messmass/docs/audits/design-system-audit-2026-05-22.md`
- External design-system SSOT: `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM`
- Local repo rules:
  - `/Users/moldovancsaba/Projects/messmass/docs/coding-standards.md`
  - `/Users/moldovancsaba/Projects/messmass/docs/HANDOVER.md`

## Core Problem

The product is currently mixing three styling authorities:

1. external Mantine-first platform rules from `GENERAL_DESIGN_SYSTEM`
2. local `{messmass}` token-and-wrapper rules (`ColoredCard`, `FormModal`, `theme.css`, unified inputs)
3. legacy or ad hoc feature-level styling using raw colors, inline styles, utility-like classes, and raw HTML controls

This means the problem is not “a few hardcoded leftovers.” It is design-system authority fragmentation.

## Required Product Rule

This program must force an explicit repo-level answer to one question:

- Is `{messmass}` migrating to the external Mantine-based design system?
- Or is the local `{messmass}` token/wrapper system the actual canonical implementation standard for the near term?

No full remediation should proceed without making that explicit, because enforcement and migration choices depend on it.

## Remediation Strategy

### Phase 1 — Stop New Drift

Goal:
- prevent any new noncompliant styling from entering active feature work

Deliverables:
- static enforcement for raw color literals in `app`, `components`, `lib`
- static enforcement for new inline `style={{...}}` in shared UI surfaces
- static enforcement for new raw `<input>`, `<select>`, `<textarea>` in admin/reporting surfaces where approved wrappers exist
- clear documented exception rules for legitimately dynamic inline styling

Success criteria:
- new PRs cannot add the same drift patterns without deliberate review override

### Phase 2 — Shared Surface Normalization

Goal:
- fix the styling infrastructure that spreads inconsistency across the whole admin product

Priority targets:
- `components/AdminDashboard.tsx`
- `lib/adminNavigation.ts`
- `components/UnifiedAdminHeroWithSearch.module.css`
- shared workspace navs
- shared adapter badge/render styling

Success criteria:
- top-level navigation and dashboard surfaces use one consistent design grammar
- shared accent/status/badge colors stop being hardcoded per file

### Phase 3 — Active Reporting/Admin Workflow Normalization

Goal:
- fix the currently active reporting and variant-management surfaces that are still introducing drift

Priority targets:
- `app/admin/organizations/[id]/reports/page.tsx`
- `app/admin/partners/[id]/reports/page.tsx`
- `components/OrganizationEditorDashboard.tsx`
- `components/PartnerEditorDashboard.tsx`
- `app/admin/visualization/page.tsx`

Success criteria:
- these screens use the approved form/input/card patterns consistently
- no new raw admin form controls remain where shared primitives already exist

### Phase 4 — Status/Badge Semantics

Goal:
- replace repeated hand-built status presentation with a shared semantic status system

Priority targets:
- role badges
- save-status indicators
- analytics/data-quality state chips
- adapter-level status renderers

Success criteria:
- status colors and labels are centralized and reusable
- semantics do not depend on per-screen handcrafted color maps

### Phase 5 — Chart and Analytics Presentation Normalization

Goal:
- remove hardcoded chart palettes, tooltip styling, and typography fallbacks from chart components

Priority targets:
- `components/analytics/LineChart.tsx`
- `components/charts/PieChart.tsx`
- `components/charts/VerticalBarChart.tsx`
- supporting chart style helpers

Success criteria:
- chart visual language resolves from one style/token authority
- chart components stop embedding raw palette logic in feature code

### Phase 6 — Global CSS and Legacy Cleanup

Goal:
- clean remaining raw rgba/hex/shadow values after shared infrastructure is normalized

Priority targets:
- `app/globals.css`
- older shared CSS modules that still encode decorative shadow and mixed-token fallback logic

Success criteria:
- global styling is mostly semantic/tokenized instead of color-literal driven
- remaining exceptions are documented and intentional

## Strict Dependency Order

1. authority model decision
2. enforcement and drift freeze
3. shared admin/navigation normalization
4. active reporting/admin workflow normalization
5. status/badge semantic consolidation
6. chart/analytics normalization
7. global CSS and legacy cleanup

## Constraints

- Do not silently break existing live reports or admin workflows while restyling
- Do not broaden this into unrelated product redesign
- Do not introduce a fourth parallel styling system while trying to reconcile the existing three
- Shared infrastructure fixes must happen before mass feature cleanup, otherwise the same drift patterns will be recopied

## Recommended GitHub Breakdown

- umbrella program issue
- authority decision issue
- drift-freeze enforcement issue
- shared-surface normalization issue
- reporting/admin workflow normalization issue
- status/badge semantic issue
- chart/analytics normalization issue
- global CSS/legacy cleanup issue

## Expected Outcome

By the end of this program:

- `{messmass}` has one explicit design-system authority model
- new styling drift is blocked by default
- shared admin/reporting surfaces follow one coherent grammar
- chart, status, and form behavior are materially more consistent
- the repo stops extending legacy styling debt while cleanup is in progress
