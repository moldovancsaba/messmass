# Unified Admin Entity System
Status: Active
Last Updated: 2026-05-03
Canonical: Yes
Owner: Engineering

## Purpose

This document defines the shared admin entity contract introduced for the `{messmass}` unified admin entity system foundation.

It exists to stop page-local action drift across admin-managed entities such as Partners and Organizations. The contract keeps `UnifiedAdminPage` as the presentation shell, while moving behavioral truth into shared entity configuration and action execution primitives.

## Canonical Contract

The source-of-truth runtime contract lives in:

- `/Users/moldovancsaba/Projects/messmass/lib/adminEntitySystem.ts`

Core shape:

```ts
type AdminEntityConfig<T> = {
  entityKey: string
  pageName: string
  displayName: string
  supportedViews: ('list' | 'card')[]
  capabilities: AdminEntityCapability[]
  search: {
    fields: Array<keyof T | string>
    placeholder?: string
  }
  permissionRequirements?: AdminEntityPermission[]
  actions: AdminEntityActionDefinition<T>[]
}
```

Each entity now declares:

- identity: `entityKey`, `pageName`, `displayName`
- supported surfaces: `supportedViews`
- search contract: fields and placeholder
- capability flags: explicit support matrix for supported behaviors
- permission expectations: minimum role gate for the entity/action
- actions: one declarative action list consumed by both list and card views

## Action Model

Each action definition declares:

- stable `id`
- user-facing `label`
- optional `icon`, `variant`, `title`
- allowed `surfaces`
- required capabilities
- required permissions
- execution mode

Supported execution modes in the shared runtime:

1. `route`
2. `modal`
3. `share`
4. `mutation`

`mutation` also supports confirmation copy, which covers destructive confirmation flows without pushing that logic back into page-local label branches.

## Execution Semantics

The runtime executor is `executeAdminEntityAction(...)`.

Execution behavior:

- `route`: navigates to a route or opens a new tab
- `modal`: opens a page-owned modal by stable `modalKey`
- `share`: opens a page-owned share flow by stable `shareKey`
- `mutation`: dispatches a page-owned mutation by stable `mutationKey`, optionally after confirmation

This is the key boundary:

- shared layer owns the action contract and dispatch semantics
- page layer owns the concrete modal state, share popup state, and mutation implementation

That split keeps the architecture declarative without pretending every entity shares the same underlying data mutation code.

## Capability Matrix

Current shared capability vocabulary:

| Capability | Meaning | Current entity usage |
| :--- | :--- | :--- |
| `create` | Entity can be created from admin | Partner, Organization |
| `edit` | Entity metadata can be edited in admin modal/form | Partner, Organization |
| `delete` | Entity supports destructive deletion | Partner, Organization |
| `report` | Entity exposes a report destination | Partner, Organization |
| `share` | Entity supports protected share flow / share popup | Partner |
| `edit-content` | Entity exposes the report/content editor surface | Partner, Organization |
| `manage-members` | Entity supports membership assignment | Organization |
| `analytics` | Entity exposes analytics dashboard | Partner |
| `kyc` | Entity exposes KYC data view | Partner |

Rules:

- unsupported capabilities must be omitted from `capabilities`
- actions that require missing capabilities are not rendered
- permissions are enforced separately from capability support
- list and card surfaces consume the same action source, filtered only by `surfaces`

## Current Entity Mapping

### Organization

Config lives in:

- `/Users/moldovancsaba/Projects/messmass/lib/adapters/organizationsAdapter.tsx`

Declared capabilities:

- `create`
- `edit`
- `delete`
- `report`
- `edit-content`
- `manage-members`

Action mapping:

| Action | Execution kind | Runtime key |
| :--- | :--- | :--- |
| `Report` | `route` | `/organization-report/[id]` |
| `Edit Stats` | `route` | `/organization-edit/[id]` |
| `Edit` | `modal` | `edit-organization` |
| `Manage Members` | `modal` | `manage-members` |
| `Delete` | `mutation` + confirm | `delete-organization` |

### Partner

Config lives in:

- `/Users/moldovancsaba/Projects/messmass/lib/adapters/partnersAdapter.tsx`

Declared capabilities:

- `create`
- `edit`
- `delete`
- `report`
- `share`
- `edit-content`
- `analytics`
- `kyc`

Action mapping:

| Action | Execution kind | Runtime key |
| :--- | :--- | :--- |
| `Edit` | `modal` | `edit-partner` |
| `Report` | `share` | `partner-report` |
| `Edit Stats` | `route` | `/partner-edit/[id]` |
| `KYC Data` | `route` | `/admin/partners/[id]/kyc-data` |
| `Analytics` | `route` | `/admin/partners/[id]/analytics` |
| `Delete` | `mutation` + confirm | `delete-partner` |

Notes:

- `KYC Data` is currently list-only via `surfaces: ['list']`
- `Report` intentionally uses the share popup flow instead of direct navigation
- Partner-only capabilities remain explicit rather than being approximated on Organizations

## How Pages Consume The Contract

Pages should compose the shared layer through:

1. a display adapter (`AdminPageAdapter<T>`)
2. an entity config (`AdminEntityConfig<T>`)
3. a runtime handler object for modal/share/mutation ownership

Current integration helper:

- `withAdminEntityActions(baseAdapter, entityConfig, runtime)`

That helper injects the shared action source into both:

- `listConfig.rowActions`
- `cardConfig.cardActions`

This removes the old pattern where pages remapped actions by `label === 'Report'` or `label === 'Delete'`.

## Migration Rule For Future Entities

A new admin-managed entity should onboard by:

1. defining a display adapter
2. defining an `AdminEntityConfig`
3. wiring modal/share/mutation handlers through runtime keys

It should not:

1. add action behavior through page-local label matching
2. duplicate separate list and card action definitions when they represent the same behavior
3. expose unsupported capabilities as disabled or dead buttons

## Implementation Status

This foundation issue delivers:

- canonical entity contract
- capability matrix
- shared action execution model
- shared list/card action source
- concrete Partner and Organization mapping onto the contract

Follow-up issues should build on this foundation instead of introducing new page-local action branching.
