# Clicker Manager — Partner Clicker Sets
Status: Draft  
Last Updated: 2026-01-21  
Owner: Admin UX (Katja)  
Canonical: No  

## Goal
Add partner-aware “clicker sets” so each partner (and their events) can use a tailored clicker layout while retaining the existing global layout as the default/fallback. The Clicker Manager UX should mirror the Report Template selector pattern used in `app/admin/visualization/page.tsx`.

## Current State (2026-01-21)
- Single global clicker layout stored in `variablesGroups` collection; no notion of sets.
- `/admin/clicker-manager` edits the one layout (seed defaults, edit groups, visibility).
- `/api/variables-groups` has no scoping; EditorDashboard fetches it blindly.
- Partners have `styleId` and `reportTemplateId`, but no clicker assignment.

## Problem
- Admins cannot experiment with or ship partner-specific clicker layouts.
- Any change is global and risks breaking existing events.
- Partner edit UI cannot select a clicker layout, unlike style/template dropdowns.
- No safe fallback handling if a layout is missing or partially defined.

## Desired UX (anchor to Report Template selector)
- A selector card at the top of Clicker Manager: dropdown of clicker sets, star on default, usage count, SaveStatus pill, actions (New, Duplicate, Rename/Delete) similar to the Visualization page template selector.
- Creating a new set starts empty by default; optional “Clone current” toggle copies the currently selected set.
- Editing groups works exactly as today but is scoped to the selected set.
- Default set = existing layout migrated intact; cannot be deleted while in use.
- Partner Add/Edit modals get a “Clicker Set” dropdown beside Style/Report Template with a “Use Default Clicker” option.
- EditorDashboard resolves the clicker set for the event’s partner; if none or missing, fall back to default and surface a non-blocking warning.

## User Stories
1. As an admin, I can create a new clicker set without changing the default layout.
2. As an admin, I can switch between clicker sets in Clicker Manager to edit them.
3. As an admin, I can duplicate the default set to start a partner-specific variation.
4. As an admin, I can assign a clicker set to a partner in the Partner edit modal just like choosing style or report template.
5. As an editor using `/edit/[slug]`, I see the clicker layout chosen for that partner; if unavailable, I automatically fall back to the default without losing access.
6. As an admin, I can see which partners use a clicker set before deleting it (guardrails).

## Functional Requirements
- **Clicker Set entity**: `name`, `slug/id`, `isDefault`, `createdAt/updatedAt`, `usageCount` (computed), `notes` (optional).
- **Scoped groups**: `variablesGroups` entries are tied to `clickerSetId`; queries must filter by set.
- **Default preservation**: migrate existing groups into a “Default Clicker” set; mark as `isDefault = true`.
- **Partner linkage**: partners gain `clickerSetId`; null means default.
- **API contracts**:
  - `GET /api/clicker-sets` (list, include usage counts)
  - `POST /api/clicker-sets` (create/clone), `PUT` (rename/default), `DELETE` (with safety checks)
  - `GET/POST /api/variables-groups?clickerSetId=` scoped
  - `POST /api/variables-groups` accepts `clickerSetId`; seed respects current set.
- **Editor resolution**: `/api/projects/edit/[slug]` returns `clickerSetId` (from partner or explicit on event if added later); EditorDashboard fetches groups with that id, else default.
- **Validation**: disallow deleting default set; block deletion when `usageCount > 0` unless forced with an explicit flag (future).

## Data Model & Migration
- New collection: `clickerSets`.
- Update `variablesGroups` to include `clickerSetId` (ObjectId/string). Migration: set all existing docs to the default set id.
- Update `partners` schema + API to store `clickerSetId`.
- Backfill: for existing partners, leave `clickerSetId = null` (implicitly default).

## UI Changes
- **Clicker Manager**: add selector card (dropdown + actions) modeled on Visualization template selector; fetch sets once; load groups per selection; show SaveStatusIndicator.
- **Partner Admin (create/edit modals)**: add “Clicker Set” dropdown using `/api/clicker-sets` list; default option text “Use Default Clicker”.
- **EditorDashboard**: add query param when fetching groups, display subtle banner if falling back to default.

## Edge Cases
- Set deleted after assignment → EditorDashboard falls back to default and logs.
- Seed defaults when a non-default set is selected → seed into that set (not global).
- Missing groups in selected set → render available groups; no crashes.

## Testing
- API unit tests: create/clone/rename/delete clicker sets; scoped group CRUD; migration idempotency.
- UI integration: Clicker Manager selector flows; Partner modal dropdown binding; EditorDashboard fallback banner.
- Regression: existing default flow unchanged when no clicker set is selected.

## Acceptance Criteria
- New clicker set can be created and edited without altering the current default.
- Partners can be saved with a clicker set selection; data persists and is reflected in EditorDashboard.
- Default set remains intact and is the fallback when selection is absent/invalid.
- Selector UX in Clicker Manager matches the interaction pattern of the Report Template selector (dropdown + New/Duplicate/Edit/Delete with status indicator).

## Rollout Plan
1) Ship migration creating “Default Clicker” set and attaching existing groups.  
2) Ship partner dropdown (safe because default is preserved).  
3) Ship Clicker Manager selector + scoped groups.  
4) Ship EditorDashboard set resolution + fallback banner.  
5) Add delete/usage guardrails and telemetry.  
