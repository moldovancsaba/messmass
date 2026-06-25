# Unified Admin Entity System
Status: Active
Last Updated: 2026-06-25
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
  forms?: AdminEntityFormSchema<Record<string, unknown>>[]
}
```

Each entity now declares:

- identity: `entityKey`, `pageName`, `displayName`
- supported surfaces: `supportedViews`
- search contract: fields and placeholder
- capability flags: explicit support matrix for supported behaviors
- permission expectations: minimum role gate for the entity/action
- actions: one declarative action list consumed by both list and card views
- forms: optional schema-driven modal fields for metadata create/edit flows

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
| `report-workspace` | Entity exposes report variant workspace | Partner, Organization |
| `export` | Entity supports export actions | Reserved |

Rules:

- unsupported capabilities must be omitted from `capabilities`
- actions that require missing capabilities are not rendered
- permissions are enforced separately from capability support
- list and card surfaces consume the same action source, filtered only by `surfaces`

## Current Entity Mapping

## Form Schema Model

The shared edit/create modal layer is `components/admin/EntityFormModal.tsx`.

Supported schema fields:

| Field type | Runtime control | Notes |
| :--- | :--- | :--- |
| `text` | Mantine `TextInput` | Required state is declared in schema; validation remains page/domain-owned |
| `select` | Mantine `Select` | Dropdown renders through a portal with modal-safe z-index |
| `checkbox` | Mantine `Checkbox` | Boolean metadata fields |
| `readonly` | Mantine `TextInput` disabled/read-only | Stable identifiers and immutable metadata |

Execution boundary:
- entity config owns the editable field declaration
- `EntityFormModal` owns accessible rendering and submit shell
- page code owns mutation calls, normalization, retries, and recovery behavior

Current migration status:
- Organizations create/edit use `EntityFormModal`
- Partners retain the existing two-step operational form because it includes richer nested integrations, but the compatibility path is explicit: keep the `edit-partner` modal runtime key and migrate smaller metadata subsets into schema-backed sections when the partner form is decomposed

### Organization

Config lives in:

- `/Users/moldovancsaba/Projects/messmass/lib/adapters/organizationsAdapter.tsx`

Declared capabilities:

- `create`
- `edit`
- `delete`
- `report`
- `report-workspace`
- `edit-content`
- `manage-members`

Action mapping:

| Action | Execution kind | Runtime key |
| :--- | :--- | :--- |
| `Reports` | `route` | `/admin/organizations/[id]/reports` |
| `Open Default Report` | `route` | `/organization-report/[id]` |
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
- `report-workspace`

Action mapping:

| Action | Execution kind | Runtime key |
| :--- | :--- | :--- |
| `Reports` | `route` | `/admin/partners/[id]/reports` |
| `Open Editor` | `route` | `/partner-edit/[id]` |
| `Share Report` | `share` | `partner-report` |
| `KYC Data` | `route` | `/admin/partners/[id]/kyc-data` |
| `Analytics` | `route` | `/admin/partners/[id]/analytics` |
| `Edit` | `modal` | `edit-partner` |
| `Delete` | `mutation` + confirm | `delete-partner` |

Notes:

- `Share Report` intentionally uses the share popup flow instead of direct navigation
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
- schema-driven organization create/edit modal layer
- concrete Partner and Organization mapping onto the contract

Follow-up issues should build on this foundation instead of introducing new page-local action branching.
