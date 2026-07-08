# Variable Management Guide

Status: Active
Last Updated: 2026-07-08T07:16:48.000Z
Canonical: Yes
Owner: Product

> One operational reference for how the `{messmass}` variable system works and how to maintain it.
> Grounded in the shipped behavior of `lib/formulaEngine.ts` and the variable admin APIs —
> not aspirational design. When behavior changes, update this guide alongside the code.

## 1. What a "variable" is

A variable is a named numeric (or derived) data point that can be referenced in chart-algorithm
formulas and reporting. Variables come from two places:

- **Stats fields** — the per-event numbers captured in the Clicker (e.g. `eventAttendees`,
  `remoteImages`, `selfies`, `merched`). These live on each project's `stats` object.
- **Variable metadata** — the catalog of variables (type, category, grouping, aliases, derived
  formulas) stored in the `variables_metadata` collection and surfaced through the admin UI.

## 2. Source of truth

- **Catalog SSOT:** the `variables_metadata` MongoDB collection. It is read (and cached) by
  `fetchAvailableVariables()` (`lib/formulaEngine.ts:48`) and its sync variant
  `fetchAvailableVariablesSync()` (`:91`). Each entry carries `type`, `category`, `derived`,
  `formula`, `alias`, flags, `order`, and `isSystem`.
- **Runtime values:** the `stats` object on each `projects` document. A variable named `foo` in a
  formula resolves to `stats.foo` at evaluation time.

Do not hand-edit `variables_metadata` in the database — use the admin surfaces (§4) so grouping,
ordering, and system flags stay consistent.

## 3. Formula syntax (the important gotcha)

Formulas reference variables with **bracket syntax**, resolved by `evaluateFormula()`
(`lib/formulaEngine.ts:1024`). The recognized patterns (`lib/formulaEngine.ts:392`) are:

- `[variableName]` — a stats/derived variable, e.g. `[remoteImages] + [selfies]`
- `[PARAM:key]` — a parameter value
- `[MANUAL:key]` — a manually supplied value
- `[MEDIA:slug]` / `[TEXT:slug]` — report content slot references (see the Report Content Slots flow)

**Gotcha:** inside a formula you write the variable in **brackets** (`[eventAttendees]`), but the
underlying stats object is accessed by its **camelCase key** (`stats.eventAttendees`). The bracket
name and the stats key must match. This is the single most common source of "my formula returns 0"
confusion — a bracketed name with no matching stats key evaluates as missing.

## 4. Managing variables (admin flow)

- **Catalog CRUD:** `app/api/variables-config/route.ts` (variable definitions) and
  `app/api/variables-groups/route.ts` (grouping).
- **Managing UI:** `app/admin/clicker-manager/page.tsx` is the page that wires both APIs — add,
  edit, group, and order variables there.
- **Formula authoring:** `components/ChartAlgorithmManager.tsx` is where variables are composed
  into chart formulas; it uses the validation helpers below for live feedback.

## 5. Validation lifecycle

Before a formula is saved or evaluated, the engine validates it:

- `extractVariablesFromFormula(formula)` (`:397`) — lists the variable names a formula references.
- `validateFormula(formula)` (`:422`) — checks syntax/structure and returns a
  `FormulaValidationResult`.
- `isValidVariable(name)` (`:1127`) — is this a known variable?
- `getVariableExample(name)` (`:1166`) — a sample value for previews.
- `validateStatsForFormula(...)` (`:1181`) — confirms the stats object actually carries the fields a
  formula needs before evaluating.
- `evaluateFormula(...)` (`:1024`) and the fail-proof `evaluateFormulaSafe(...)` (`:1253`) — compute
  the result; the `*Safe` variants return an error object instead of throwing.

Rule of thumb: author with `validateFormula` feedback, and rely on `validateStatsForFormula` /
`evaluateFormulaSafe` so a missing field degrades to a visible warning rather than a crash.

## 6. Governance rules

- **Naming:** follow the conventions in `docs/conventions/conventions-variable-dictionary.md`. Names
  are the contract between the Clicker, formulas, and reporting — renaming one breaks every formula
  that brackets it.
- **Grouping & order:** set via the groups API/UI, not ad hoc; the `order` and `category` fields
  drive how variables list in the admin surfaces.
- **Aliases:** use the `alias` field to rename a display label without breaking the underlying key.
- **System variables:** entries flagged `isSystem` are engine-managed — don't repurpose them.
- **Hygiene:** periodic cleanup is tracked under `docs/operations/variables-hygiene-ops-var-01.md`;
  the current inventory lives under `docs/operations/variables-inventory/` and
  `docs/admin/ADMIN_UI_VARIABLE_INVENTORY.csv`.

## 7. Common failures & fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| Formula returns 0 | bracketed name has no matching `stats` key | check the exact camelCase key (§3) |
| "Invalid formula" on save | syntax / unknown variable | run against `validateFormula`; confirm with `isValidVariable` |
| Value present in Clicker but missing in report | field absent on older projects' `stats` | guard with `validateStatsForFormula`; treat missing as unavailable, not 0 |
| Renamed variable broke charts | key rename without updating formulas | rename via alias, or update every referencing formula |

## 8. Related references

- `docs/conventions/conventions-variable-dictionary.md` — naming dictionary
- `docs/operations/variables-hygiene-ops-var-01.md` — hygiene operations
- `docs/operations/variables-inventory/` — current variable inventory
- `docs/admin/ADMIN_UI_VARIABLE_INVENTORY.csv` — admin UI variable inventory (appendix)
