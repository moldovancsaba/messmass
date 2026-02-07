# Admin Variable System Enhancement (ADM-RM-09)
Status: Archived
Last Updated: 2026-02-06T15:05:00Z
Canonical: No
Owner: Admin

## Archive Note (2026-02-06)
This document is archived to avoid maintaining a second backlog outside Operations.
Any open items here must be tracked in:
- `docs/operations/operations-action-plan.md` (execution queue)
- `docs/operations/operations-roadmap.md` (future staged enhancements)

1 Purpose
- DONE: Capture the current variable inventory used by Admin and Reporting.
- DONE: Define the compatibility contract for variable names/types and runtime behavior.
- DONE: Document runtime guarantees for missing/invalid variables.
- DONE: Separate safe enhancement scope from future staged improvements.

2 Source of Truth
- DONE: Variable definitions are stored in MongoDB `variables_metadata` and exposed via `/api/variables-config`. Evidence: [app/api/variables-config/route.ts](app/api/variables-config/route.ts).
- DONE: Admin edit surface is `/admin/kyc` (create/update/delete, with cache invalidation). Evidence: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx).
- DONE: Reporting consumes variables through formula evaluation and chart calculation. Evidence: [lib/formulaEngine.ts](lib/formulaEngine.ts), [lib/report-calculator.ts](lib/report-calculator.ts), [lib/chartCalculator.ts](lib/chartCalculator.ts).

3 Variable Inventory (Admin + Reporting)
- DONE: Inventory file (generated from latest backup snapshot):
  - `docs/admin/ADMIN_UI_VARIABLE_INVENTORY.csv`
  - Source snapshot: `backups/messmass_backup_2025-12-18T11-34-21-329Z/collections/variables_metadata.json`
- DONE: Inventory columns: `name`, `type`, `default`, `scope`, `defined_in`, `consumed_by`.
- DONE: Default values reflect runtime behavior (see Section 5 for details).

4 Compatibility Contract (No Breaking Changes)
- DONE: Do not rename or delete existing variable names used in formulas or stats.
- DONE: Do not change variable names to add/remove `stats.` prefix without a migration plan.
- DONE: Maintain backward compatibility for existing `stats.`-prefixed entries (legacy reportText/reportImage fields).
- DONE: Do not change variable types in-place (number/text) without data migration and template compatibility checks.
- DONE: Keep formula token behavior stable: `[fieldName]` must continue to resolve to `stats.fieldName`.
- DONE: Custom variables may be added, but must follow camelCase naming and remain unique.
- DONE: `isSystem` variables remain protected from rename/delete in Admin UI.
- DONE: Any changes to derived formulas must be additive or gated (no silent behavior changes).

5 Runtime Guarantees (Missing/Invalid Variables)
Admin-side validation (input and metadata):
- DONE: `/admin/kyc` enforces camelCase names and requires label + category on create.
- DONE: System variables cannot be renamed in the Admin UI.
- DONE: Variables cache is invalidated on create/update/delete to prevent stale lists.

Reporting-side evaluation (runtime behavior):
- DONE: Formula engine defaults missing numeric fields to `0` during evaluation. Evidence: [lib/formulaEngine.ts](lib/formulaEngine.ts).
- DONE: Division by zero or invalid expressions return `NA` (non-fatal). Evidence: [lib/formulaEngine.ts](lib/formulaEngine.ts).
- DONE: Derived metrics are computed when missing (`allImages`, `remoteFans`, `totalFans`). Evidence: [lib/dataValidator.ts](lib/dataValidator.ts).
- DONE: Text/image/table charts attempt direct stats field access and content asset resolution; missing content returns `NA` or empty string depending on chart path. Evidence: [lib/chartCalculator.ts](lib/chartCalculator.ts), [lib/report-calculator.ts](lib/report-calculator.ts).
- DONE: Safe defaults for optional metrics: numbers default to `0`, booleans to `false`, strings to `null`. Evidence: [lib/dataValidator.ts](lib/dataValidator.ts).

6 Enhancement Scope (Safe, Non-Breaking)
- DONE: Inventory export automation (CSV) sourced from `/api/variables-config`.
- DONE: Add validation warnings for `stats.`-prefixed variable names (warn-only).
- DONE: Improve Admin UI display: show derived/formula badges and expose source (system/custom).
- DONE: Add read-only usage hints (where a variable appears in formulas/templates).
- DONE: Add lint-style checks for duplicate names or mismatched types (warn-only).

7 Future Improvements Plan (Staged)
Stage 1: Visibility + Hygiene (No behavior change)
- Automate nightly inventory generation + diff report.
- Add UI filters for legacy `stats.`-prefixed variables.
- **Dependencies:** None.
- **Risk:** Low (read-only changes).

Stage 2: Type and Naming Normalization
- Normalize `variables_metadata.type` values to the Admin UI enum (`count`, `numeric`, `text`, etc.).
- Add compatibility layer to accept both old and normalized type strings.
- **Dependencies:** Stage 1 + explicit migration plan.
- **Risk:** Medium (template/editor type assumptions).

Stage 3: Deprecation and Alias Support
- Introduce explicit alias mapping for legacy names instead of manual `stats.` handling.
- Add deprecation flags and warnings for planned removals.
- **Dependencies:** Stage 2 + template compatibility checks.
- **Risk:** Medium (formula/token resolution changes).

Stage 4: Contracted Versioning
- Add explicit variable schema versioning and change logs.
- Tie compatibility checks to versioned variable sets.
- **Dependencies:** Stage 3 + reporting contract updates.
- **Risk:** Medium/High (requires contract and runtime alignment).

8 Evidence Links
- `/api/variables-config` source: [app/api/variables-config/route.ts](app/api/variables-config/route.ts)
- Admin KYC UI: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx)
- Formula engine: [lib/formulaEngine.ts](lib/formulaEngine.ts)
- Report calculators: [lib/report-calculator.ts](lib/report-calculator.ts), [lib/chartCalculator.ts](lib/chartCalculator.ts)
- Variable dictionary: [docs/conventions/conventions-variable-dictionary.md](docs/conventions/conventions-variable-dictionary.md)
