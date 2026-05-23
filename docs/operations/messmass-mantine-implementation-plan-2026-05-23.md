# Messmass Mantine Implementation Plan

Status: Planned
Last updated: 2026-05-23
Owner: Product + Engineering
Canonical: No
Related SSOT:

- `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM/FOUNDATION.md`
- `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM/COMPONENTS_AND_PATTERNS.md`
- `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM/PATTERN_SERVICE_MODEL.md`
- `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM/GOVERNANCE_AND_ADOPTION.md`
- `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM/SERVICE_BACKBONE_IMPLEMENTATION_PLAN.md`
- `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM/PROJECTS/MESSMASS_MANTINE_REFACTOR.md`

## 1. Objective

Refactor `{messmass}` into a strict Mantine-only product UI without harming:

- existing public report URLs
- existing admin/reporting workflows
- existing analytics/report data behavior
- current export/share behavior

This is a foundation replacement plan, not a cosmetic theme pass.

## 2. Hard Rules

1. Mantine becomes the only approved product UI primitive system.
2. Existing reports must keep working during migration.
3. No big-bang rewrite. All work must land as vertical slices with compatibility preserved.
4. No second long-lived bridge design system is allowed.
5. Route behavior and report rendering contracts stay stable unless explicitly versioned.

## 3. Current Reality

### 3.1 Authority conflict

`{messmass}` currently has a direct documentation conflict with the shared GDS.

Current conflicting file:

- `/Users/moldovancsaba/Projects/messmass/docs/coding-standards.md`

It still says the local token-and-wrapper system is the implementation authority until a future Mantine migration is complete. That is incompatible with the shared SSOT and must be treated as a Phase 0 governance bug.

### 3.2 Existing local system

The current UI foundation is a large local custom system built around:

- `app/styles/theme.css`
- `app/styles/components.css`
- `app/styles/admin.css`
- `app/styles/layout.css`
- shared wrappers/primitives such as:
  - `ColoredCard`
  - `FormModal`
  - `UnifiedTextInput`
  - `UnifiedInputField`
  - `UnifiedSelectField`
  - `UnifiedCheckboxField`
  - `AdminDashboard`
  - analytics section/workspace primitives

This system already contains useful workflow structure. The migration should preserve workflow intelligence while replacing the primitive and authority layer underneath it.

### 3.3 High-risk product surfaces

The highest-risk surfaces are:

1. shared admin shell and navigation
2. reporting workspaces
3. analytics workspaces
4. organization and partner report-variant flows
5. organization and partner editor dashboards
6. public report shells

These are high-risk because they are repeated, central, and tied to live delivery workflows.

## 4. Migration Strategy

The correct migration strategy is:

- replace the foundation first
- migrate repeated shared surfaces before page-local cleanup
- keep route and data behavior stable
- preserve report runtime compatibility until the Mantine version reaches full parity

This means:

- we do not start by rewriting every page
- we do not start by deleting CSS
- we do not start by changing report URLs
- we do not start by rewriting chart engines

## 5. Target Architecture

### 5.1 Required root runtime

`{messmass}` needs:

- one root `MantineProvider`
- one exported Messmass Mantine theme
- one centralized notifications runtime
- one centralized modals runtime

Candidate local paths:

- `app/providers.tsx`
- `lib/ui/mantineTheme.ts`
- `lib/ui/mantineProvider.tsx`

Exact paths may change, but the responsibilities may not.

### 5.2 Required local contracts

Messmass should maintain these local contracts:

1. `AdminShell`
2. `PageHeader`
3. `MetricCard`
4. `DataToolbar`
5. `ResponsiveDataView`
6. `StateBlock`
7. `EditorFormPrimitives`
8. `ReportWorkspaceShell`
9. `AnalyticsWorkspaceShell`

The implementation may use thin local Mantine wrappers where that reduces migration risk, but those wrappers must be Mantine-governed and may not become a second design system.

## 6. Phase Plan

### Phase 0: Governance Reset

Objective:

- remove the local authority conflict before deeper UI work

Tasks:

1. update `/docs/coding-standards.md` so it no longer treats the old local system as the active authority
2. document the Mantine-only rule in local onboarding docs
3. mark legacy styling files and wrappers as frozen for new UI invention
4. create a board-backed migration umbrella and issue chain before implementation begins

Exit criteria:

- local docs no longer conflict with the GDS
- migration scope is explicit on the SSOT board

### Phase 1: Root Mantine Runtime

Objective:

- land the Mantine platform without breaking existing UI behavior

Tasks:

1. add Mantine package baseline
2. add root provider composition
3. add Messmass theme module
4. wire notifications and modals centrally
5. keep current routes visually and functionally stable while the runtime lands

Exit criteria:

- all product UI renders under Mantine root runtime
- one theme file is the only new token authority

### Phase 2: Shared Primitive Parity

Objective:

- replace the highest-leverage local primitives with Mantine-governed equivalents

Targets:

- cards
- modals
- text inputs
- selects
- checkboxes/switches
- buttons
- alerts
- loaders/skeletons

Migration rule:

- preserve existing component APIs where practical
- reimplement them as thin Mantine wrappers
- then progressively reduce wrapper surface area where direct Mantine usage is cleaner

Exit criteria:

- no new shared product primitives depend on raw HTML/CSS controls
- shared form and state primitives are Mantine-based

### Phase 3: Shared Shells And Navigation

Objective:

- migrate the parts of the app that currently spread layout authority everywhere

Targets:

- `AdminDashboard`
- sidebar/navigation system
- analytics workspace nav
- reporting workspace nav
- page headers
- shared state panels

Exit criteria:

- shell and navigation decisions are no longer CSS-first or page-local
- shared navigation hierarchy is Mantine-governed

### Phase 4: Reporting And Analytics Workspaces

Objective:

- migrate the repeated high-traffic workspace surfaces before page-level cleanup

Targets:

- analytics home
- sponsorship hub
- partner activation
- insights
- executive / marketing / operations dashboards
- reporting workspace
- report builder selection surfaces

Rules:

- keep current report/chart data behavior
- keep existing routes
- preserve current report variant behavior

Exit criteria:

- KPI cards, filters, section shells, tables, and state panels are Mantine-based
- the current analytics/reporting grammar is implemented through Mantine contracts

### Phase 5: Report Variant And Editor Workflows

Objective:

- migrate the configuration-heavy flows that currently rely on the local form grammar

Targets:

- organization reports workspace
- partner reports workspace
- organization editor dashboard
- partner editor dashboard
- report builder settings flows

Rules:

- existing default reports stay stable
- variant URLs and share/export behavior stay stable
- editing behavior may be refactored, but report outputs must remain compatible

Exit criteria:

- report-variant create/edit/manage flows use Mantine-governed form and modal patterns

### Phase 6: Public Report Shells

Objective:

- bring public report shells into the same governed system after admin/reporting parity exists

Targets:

- organization report shell
- partner report shell
- hashtag/filter report shells where applicable
- shared report action surfaces

Rules:

- do not change existing public URL semantics
- `/organization-report/[id]` and `/partner-report/[slug]` must continue to resolve `DEFAULT` unless variant is explicitly requested

Exit criteria:

- public report page shells are Mantine-governed while report runtime remains compatible

### Phase 7: Legacy Deletion And Enforcement

Objective:

- remove the old authority rather than leaving a permanent hybrid

Tasks:

1. delete or narrow legacy CSS that still acts as product authority
2. remove obsolete wrapper assumptions
3. expand static checks so non-Mantine product UI cannot re-enter
4. document any narrow, justified exceptions

Exit criteria:

- the old local system is no longer a competing authority
- remaining exceptions are narrow, documented, and intentional

## 7. Recommended Implementation Order

1. Phase 0 governance reset
2. Phase 1 root Mantine runtime
3. Phase 2 shared primitive parity
4. Phase 3 shared shells and navigation
5. Phase 4 reporting and analytics workspaces
6. Phase 5 report variant and editor workflows
7. Phase 6 public report shells
8. Phase 7 deletion and enforcement

## 8. What We Should Keep

The migration should preserve:

- current workflow topology
- current report runtime compatibility
- current report variant model
- current analytics domain logic
- current share/export behavior

The migration should replace:

- primitive/runtime authority
- shell/layout authority
- repeated local form/control implementations
- repeated CSS-first state and surface patterns

## 9. Validation Requirements

Every migration slice must pass:

- `npm run lint`
- `npm run build`
- `npm run type-check`

Additional required validation for shared UI slices:

- route-level smoke test of the touched high-traffic surface
- no regression in report opening/editing/sharing where applicable
- no broken public report resolution

Additional required validation for migration governance:

- local docs remain aligned with the GDS
- SSOT board issues reflect actual migration state

## 10. Board Recommendation

This plan should not be implemented as one catch-all issue.

Recommended board structure:

1. umbrella: `{messmass} Mantine migration program`
2. governance reset
3. root runtime
4. shared primitive parity
5. shared shell/navigation migration
6. analytics/reporting workspace migration
7. report-variant/editor migration
8. public report shell migration
9. legacy deletion and enforcement

## 11. Brutally Honest Risk Assessment

The main risk is not technical impossibility. The main risk is that `{messmass}` already has a mature local workflow system, so it is easy to keep improving that system while delaying the foundation replacement indefinitely.

If that happens:

- Mantine remains mandatory only in theory
- the GDS remains advisory instead of authoritative
- every future improvement costs more because it has to be migrated later

So the real success condition is not “some Mantine components appear in the repo.”

The real success condition is:

- Mantine becomes the actual authority
- the old local system stops being the fallback authority
- the migration sequence preserves live business behavior while steadily deleting the competing foundation
