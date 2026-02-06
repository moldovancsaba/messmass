# Variable System History & Migration Summary
Status: Archived
Last Updated: 2026-02-04T05:00:00.000Z
Canonical: Yes
Owner: Architecture

This document consolidates the key learnings, decisions, and reference points that previously lived in `docs/archive/_archive/legacy-variable-system/ADMIN_VARIABLES_SYSTEM.md`, `docs/archive/_archive/legacy-variable-system/VARIABLE_SYSTEM_V7_MIGRATION.md`, and `docs/archive/_archive/legacy-variable-system/VARIABLES_DATABASE_SCHEMA.md`. Use this single source when you need to understand the database-first variables platform or migrate it in the future.

## Overview
- MongoDB now holds every variable definition in `variables_metadata`, seeded from `lib/variablesConfig.ts`.
- The **Single Reference System** enforces a `stats.<variable>` pattern across UI, formulas, and APIs so no code hard-codes variable names.
- Aliases (e.g., `Women` for `stats.female`) and visibility flags live beside the database record, which enables a flexible editor experience without touching the schema.

## System Architecture
- **KYC Management UI (`/admin/kyc`)** is the canonical implementation of variable cards, alias editing, and visibility switches.
- **API layer (`/api/variables-config`, `/api/variables-groups`)** exposes CRUD plus grouping, seeding, and ordering operations.
- **Editor dashboards (`/edit/[slug]`)** and report rendering read from `variables_metadata` to apply consistent labels and formatting.
- **Seeders (`seedVariables.ts`, `lib/variablesConfig.ts`)** populate 96 system variables at deploy time, ensuring parity across environments.

## Database Schema
- Each variable document contains `name`, `alias`, `type`, `category`, `visibility` bits (`visibleInClicker`, `visibleInManual`), and `metadata` for UI tooling.
- Relationships: variable groups store ordered lists of variable IDs while `variables_config` links to `variables_metadata` for runtime lookups.
- The schema enforces immutable `isSystemVariable` flags, preventing deletion of core metrics.

## API Reference
- **`GET /api/variables-config`** — returns all variables, grouped by category with alias metadata.
- **`POST /api/variables-config`** — creates a custom variable (category `custom`, editable UI flags allowed).
- **`PUT /api/variables-config/:id`** — updates alias/visibility without changing database `name`.
- **`DELETE /api/variables-config/:id`** — removes custom variables (system variables are protected).
- **`/api/variables-groups`** — manages group ordering for display in clicker and dashboards.

## Migration Path
- Migration from v6 relied on `lib/variablesRegistry.ts` (code-defined lists). Phase 7 moved all definitions into MongoDB and introduced the `stats.` prefix.
- Key steps:
  1. Seed existing variables via `seedVariables.ts` and update all formulas to use `stats.` prefixes.
  2. Update every front-end reference to pull alias data from `/api/variables-config` instead of importing `variablesRegistry.ts`.
  3. Replace any hard-coded variable names in rules or formulas with the new aliases maintained by the KYC page.

## Visibility & Editability Controls
- `visibleInClicker`, `visibleInManual`, and `editableInManual` properties live on each document and drive whether a variable shows up in the clicker, formulas, or manual input screens.
- Variable groups (`variableGroup` documents) allow grouping charts together, controlling order, and referencing default chart IDs.

## Reference Materials
1. `docs/archive/_archive/legacy-variable-system/ADMIN_VARIABLES_SYSTEM.md` — original implementation guide (kept for legal trace).
2. `docs/archive/_archive/legacy-variable-system/VARIABLE_SYSTEM_V7_MIGRATION.md` — step-by-step migration notes for v6 → v7.
3. `docs/archive/_archive/legacy-variable-system/VARIABLES_DATABASE_SCHEMA.md` — detailed MongoDB schema that was in use until 2026.
