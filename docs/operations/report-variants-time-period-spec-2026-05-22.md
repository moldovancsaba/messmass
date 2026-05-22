# Report Variants And Time-Period Selection Spec

Status: Proposed  
Owner: Product / Admin Reporting  
Date: 2026-05-22  
Primary Goal: Introduce compatibility-safe report variants with time-period scoping for organizations, partners, hashtags, and filters without harming existing live reports.

## 1. Problem

`{messmass}` currently resolves one report template per entity context:

- organization via `metadata.reportTemplateId`
- partner via `partners.reportTemplateId`
- project via `projects.reportTemplateId`
- hashtag/filter via default template fallback

That model works for one canonical report, but it breaks down when a user needs multiple named report versions for the same owner:

- `Default / All Time`
- `This Month`
- `Last 30 Days`
- `This Year`
- `Last Year`
- custom date range

The current model also forces operational friction:

- list views still expose `Open Report` and `Open Editor` separately
- there is no first-class concept of multiple report versions per owner
- template selection, layout, theme, text, and period are coupled too loosely to support named report variants safely

## 2. Product Intent

The target UX is:

1. Each report-capable owner has a `Reports` entry instead of a single `Open Report` action.
2. Each owner always has a `DEFAULT` report variant.
3. `DEFAULT` starts as the current behavior:
   - all-time period
   - current assigned report template
   - current assigned style
4. Creating a custom report variant always duplicates from `DEFAULT`.
5. A custom variant can then override:
   - time period
   - text/content
   - images/content assets
   - layout/template
   - theme/style
6. Existing report URLs and current live report resolution must continue to work during rollout.

## 3. Non-Negotiable Constraint

Do not harm existing reports.

Compatibility rules:

1. Existing report pages must continue resolving if no variants exist.
2. Existing entity-level `reportTemplateId`, `reportId`, and `styleId` remain valid during rollout.
3. `DEFAULT` variant must mirror current live behavior until an operator explicitly changes it.
4. The rollout must be additive first, destructive never.

## 4. Recommended Data Model

Add a new collection: `report_variants`

### 4.1 Core fields

- `_id`
- `ownerType`: `organization | partner | hashtag | filter`
- `ownerId`
- `name`
- `slug`
- `isDefault`
- `status`: `active | archived`
- `periodPreset`: `all_time | this_month | last_30_days | this_year | last_year | custom`
- `customDateRange?`
  - `startDate`
  - `endDate`
- `timezone`
- `reportTemplateId`
- `styleId?`
- `contentOverrideId?` or inline structured override payload
- `createdFromVariantId?`
- `createdAt`
- `updatedAt`

### 4.2 Default behavior

For each owner, exactly one active default variant:

- name: `Default`
- slug: `default`
- periodPreset: `all_time`
- inherits current entity template/style truth

## 5. Separation Of Concerns

Keep these layers separate:

1. `report_templates`
   - reusable layout, blocks, chart composition

2. `report_styles`
   - reusable visual theme

3. `report_variants`
   - owner-specific published report versions
   - time period
   - template/style references
   - content overrides

Do not put time-period selection directly into `report_templates`.

## 6. Resolution Model

### 6.1 New resolution order

For organization/partner/hashtag/filter reports:

1. If a specific variant is requested, resolve that variant.
2. Else resolve the owner’s active default variant.
3. If no variant exists yet, synthesize virtual default from existing entity metadata.
4. If entity metadata is missing, fall back to current existing default template behavior.

### 6.2 Compatibility bridge

During rollout, the resolver must support:

- new variant-based flow
- current template assignment flow
- legacy `reportId` mirror where still present

### 6.3 URL strategy

Phase 1:

- keep current report routes intact
- pass variant by query param

Examples:

- `/organization-report/[id]`
- `/organization-report/[id]?variant=default`
- `/organization-report/[id]?variant=chl-this-year`

Same approach later for:

- partner
- hashtag
- filter

## 7. Time-Period Semantics

Presets:

- `all_time`
- `this_month`
- `last_30_days`
- `this_year`
- `last_year`
- `custom`

Rules:

1. `last_30_days` is rolling.
2. `this_month`, `this_year`, `last_year` are calendar-based.
3. Every variant resolves in a timezone.
4. `custom` stores explicit start/end dates.
5. Aggregation endpoints must normalize these presets into a canonical date filter object.

## 8. UX Model

### 8.1 Entity list actions

Replace `Open Report` as the primary conceptual action with `Reports`.

Entity row actions become:

- `Reports`
- `Edit`
- `Share`
- `Analytics`

`Open Editor` should no longer be required from list view once the variant workflow exists.

### 8.2 Reports workspace

For an owner, open a reports workspace/modal/page showing:

- `Default`
- custom variants
- create button

Row actions:

- `Open`
- `Edit`
- `Duplicate`
- `Rename`
- `Set Default`
- `Archive`

### 8.3 Create flow

1. Click `Create Report Variant`
2. Duplicate from `Default`
3. Enter report name
4. Choose period preset
5. Land in variant editor

### 8.4 Variant editor

Variant-level edit surface should expose:

- report name
- period preset
- custom date range
- template
- style/theme
- content overrides
- builder entry

## 9. Rollout Strategy

### Phase A: Additive infrastructure

- add `report_variants`
- add variant resolver
- do not change current report URLs
- synthesize virtual default variants from current metadata when no stored variant exists

### Phase B: Admin management surfaces

- add `Reports` workspace for organizations first
- then partners
- then hashtags / filters

### Phase C: Variant-aware runtime

- report pages accept optional variant
- period filters flow into data aggregation

### Phase D: Builder/editor convergence

- builder edits variant-owned template reference
- duplicating a variant can optionally duplicate template/content resources as needed

### Phase E: Cleanup

- remove `Open Editor` dependency from list views after parity is proven

## 10. Compatibility-Safe First Scope

Implement first for organizations.

Why:

- direct PO need already exists on organization report
- lower surface area than changing all owners at once
- proves model before partner/hashtag/filter rollout

First live example target:

- `CHL organization report`
- existing URL remains valid
- `Default` variant mirrors current behavior
- custom variants add period-scoped report versions without touching live default

## 11. Acceptance Criteria

### Product acceptance

1. Existing report URLs still render correctly when no variants are manually created.
2. An organization can have:
   - one default all-time report
   - multiple named variants
3. A variant can use:
   - this month
   - last 30 days
   - this year
   - last year
   - custom range
4. Creating a variant duplicates from default.
5. Editing a variant does not mutate the default report unless explicitly intended.

### Technical acceptance

1. Resolver supports legacy fallback.
2. Time-period filters are centralized, not duplicated per page.
3. No destructive migration is required for initial rollout.
4. All variant operations are scoped by owner and tenant rules.

## 12. Recommended Issue Breakdown

1. Program / compatibility umbrella
2. Variant data model + resolver
3. Shared time-period filter engine
4. Organization reports workspace
5. Organization variant editor
6. Organization runtime variant resolution
7. Partner rollout
8. Hashtag/filter rollout
9. List-view action grammar update

## 13. Key Risks

1. Confusing templates with variants
   - mitigation: keep separate collections and UI language

2. Breaking existing report resolution
   - mitigation: variant resolver falls back to current metadata model

3. Duplicating data incorrectly on variant creation
   - mitigation: define what is referenced vs duplicated before implementation

4. Divergent period logic per page
   - mitigation: central period normalization utility and shared API contract

## 14. Recommended Naming

Use `Report Variant` in both product and code.

Avoid:

- `Report Version`
- `Report Preset`
- `Custom Report`

Reason:

`Variant` best conveys “derived from default but independently configurable.”
