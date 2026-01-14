# ACTION_PLAN.md

**Version:** 1.1.8  
**Created:** 2026-01-12T00:09:33.679Z  
**Last Reviewed:** 2026-01-12T10:05:00.000Z  
**Last Updated:** 2026-01-12T13:18:36.000Z  
**Status:** Active  
**Canonical:** Yes  
**Owner:** Architecture  
**Audience:** Engineering + Product

---

## Purpose

This document serves as the single executable layer between:
- `docs/audits/COMPREHENSIVE_SYSTEM_AUDIT_PLAN_2026.md` (audit inventory)
- `IMPLEMENTATION_COMPLETE.md` (completed work)
- `ROADMAP.md` (strategic planning)

It translates audit findings and residual risks into concrete, trackable actions.

**Source of Truth:**
- `IMPLEMENTATION_COMPLETE.md` (Residual Risks section)
- `ROADMAP.md` (Hardening & Follow-ups section)
- P0/P1 items marked DONE + VERIFIED (for exclusion only)

---

## Reporting System – Active Action Items

**Owner:** Tribeca (Reporting)

### A-03: Height Calculation Accuracy Improvements

**Priority:** Medium  
**Status:** IN PROGRESS
**Dependency:** None

**Description:**
Refine BAR chart height calculation (estimated 40px label height) and PIE chart legend height calculation (30% → 50% growth assumption). Account for actual font size and content wrapping behavior.

**Owner:** Tribeca

---

### A-05: Layout Grammar Runtime Enforcement

**Priority:** Medium  
**Status:** IN PROGRESS
**Dependency:** Runtime validation (exists)

**Description:**
Block rendering if critical CSS variables are missing. Implement fail-fast behavior for Layout Grammar violations. Add production guardrails for height calculation failures.

**Owner:** Tribeca

---

## Completed Reporting Items (Reference Only)

A-01, A-02, A-04, A-06, A-R-07, A-R-08, A-R-09 (deprecated), A-R-10, A-R-11, A-R-12, A-R-13, A-R-15, A-R-16, A-R-18, A-R-19

**Note:** Details in release notes, verification packs, and investigation docs.




---

--------------------------------------------


## ADMIN UI REFACTOR PROGRAM (Actionable Breakdown)

**Status:** PLANNED  
**Owner:** Architecture (Chappie)  
**Execution:** Documentation + Engineering (Katja + Tribeca)  

---

## A-UI-01: Partners (Partner Model, Partner Report, Partner Scoping)

**Ownership scope:** Partner
**Dependencies:** A-UI-00 outputs (capability map, ownership model, glossary)

### Checkable tasks
- [ ] Confirm partner data model fields in [lib/partner.types.ts](lib/partner.types.ts) and partner admin UI.
- [ ] Map partner routes: /admin/partners, /admin/partners/[id], /admin/partners/[id]/analytics, /admin/partners/[id]/kyc-data.
- [ ] Define partner override rules for report templates and styles (global -> partner -> event).
- [ ] Identify partner-related duplication candidates (C-04, C-08, C-09, C-10).
- [ ] Define target partner IA (list, detail, analytics, kyc) and which routes remain.

---

## A-UI-10: Hashtag Manager (Hashtags and Reports)

**Ownership scope:** Global
**Dependencies:** A-UI-00 outputs (capability map, ownership model, glossary)

### Checkable tasks
- [ ] Define hashtag model and color management in [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx).
- [ ] Map hashtag usage in filters and event/partner tagging.
- [ ] Identify overlap with categories and define consolidation plan (C-07).

---

## A-UI-11: Category Manager (Purpose and Scope)

**Ownership scope:** Global
**Dependencies:** A-UI-00 outputs (capability map, ownership model, glossary)

### Checkable tasks
- [ ] Define category model and usage in [app/admin/categories/page.tsx](app/admin/categories/page.tsx).
- [ ] Map categorizedHashtags usage and dependencies.
- [ ] Decide consolidation with Hashtag Manager (C-07).

---

## A-UI-12: Reporting (Report Structures)

**Ownership scope:** Global
**Dependencies:** A-UI-00 outputs (capability map, ownership model, glossary)

### Checkable tasks
- [ ] Define report template model and data blocks in [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx).
- [ ] Define template selection rules (global -> partner -> event).
- [ ] Map dependencies on algorithms and styles.
- [ ] Identify assignment duplication (C-06).

---

## A-UI-13: Style Editor (Report Themes)

**Ownership scope:** Global
**Dependencies:** A-UI-00 outputs (capability map, ownership model, glossary)

### Checkable tasks
- [ ] Define report style model in [app/admin/styles/page.tsx](app/admin/styles/page.tsx).
- [ ] Define style assignment rules (global -> partner -> event -> filter).
- [ ] Identify duplication with template or admin design flows (C-06).

---

## A-UI-14: Cache Management (Seeing Updates)

**Ownership scope:** Global
**Dependencies:** A-UI-00 outputs (capability map, ownership model, glossary)

### Checkable tasks
- [ ] Document cache types and actions in [app/admin/cache/page.tsx](app/admin/cache/page.tsx).
- [ ] Define when support should use each cache action.

---

## A-UI-15: User Guide (messmass.com Operations)

**Ownership scope:** User
**Dependencies:** A-UI-00 outputs (capability map, ownership model, glossary)

### Checkable tasks
- [ ] Resolve the canonical user guide source referenced in [app/admin/help/page.tsx](app/admin/help/page.tsx).
- [ ] Decide whether the guide is doc-driven or embedded and define update process.
- [ ] Map user workflows to admin workflows and reference links.

---

## ADMIN ROADMAP CONSOLIDATION (Canonical)

**Scope:** Admin-only roadmap items outside the A-UI documentation program (A-UI-00 to A-UI-15 above).  
**Sources:** `ROADMAP.md` (Admin UI sections + Optional/Exploratory backlog).  
**Rule:** ACTION_PLAN.md is the single canonical source of Admin roadmap status.

| Item ID | Item | Status | Source | Notes |
| --- | --- | --- | --- | --- |
| ADM-RM-02 | Google Sheets Integration (auto-provision sheets for new partners) | PLANNED | `ROADMAP.md` |  |
| ADM-RM-04 | Search & Paging Unification (Admin: Users) | DEFERRED | `ROADMAP.md` |  |
| ADM-RM-06 | Partner Analytics Dashboard enhancements | DEFERRED | `ROADMAP.md` |  |
| ADM-RM-07 | Bitly Search Enhancements | PLANNED | `ROADMAP.md` |  |
| ADM-RM-08 | Bitly Analytics Export & Reporting | PLANNED | `ROADMAP.md` |  |
| ADM-RM-09 | Variable System Enhancement | PLANNED | `ROADMAP.md` |  |
| ADM-RM-10 | Admin UI Consistency | ACTIVE | `ROADMAP.md` |  |
| ADM-RM-11 | Admin UI assignment dropdown (project edit modal) | BACKLOG | `ROADMAP.md` |  |
| ADM-RM-12 | Admin Grid Settings UI (desktop/tablet/mobile units) | BACKLOG | `ROADMAP.md` |  |
| ADM-RM-13 | Admin Productivity backlog | BACKLOG | `ROADMAP.md` |  |

---

## STATE MEMORY

**2026-01-14T12:45:00.000Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** A-03.3 – BAR Chart Height Calculation Accuracy
- **STATUS:** DONE
- **LAST COMMIT(S):** pending (A-03.3: BAR chart height calculation with measured layout logic)
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** Awaiting Architect assignment

**2026-01-14T12:30:00.000Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** A-03.1 + A-03.2 (under A-03) Height Calculation Fix for TEXT AREA + KPI Charts
- **STATUS:** DONE
- **LAST COMMIT(S):** c1c167d03 (A-03.1 + A-03.2: Height calculation fixes for TEXT AREA and KPI charts)
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** Awaiting Architect assignment

**2026-01-14T11:06:00.000Z**
- **AGENT:** Katja
- **DOMAIN:** Admin
- **CURRENT TASK ID:** A-UI-CLEAN-01
- **STATUS:** DONE
- **LAST COMMIT(S):** pending (Admin cleanup commit)
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** Awaiting next Admin assignment

**2026-01-14T18:05:00.000Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** Reporting Docs & Versioning Consolidation
- **STATUS:** DONE
- **LAST COMMIT(S):** pending (docs + version bump commit for Reporting crash fixes and documentation sync)
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** Awaiting Architect task breakdown to decompose consolidated Reporting roadmap into new ACTION_PLAN items

**2026-01-13T18:05:00.000Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** Reporting Docs & Versioning Consolidation
- **STATUS:** ACTIVE
- **LAST COMMIT(S):** pending (docs + version bump commit for Reporting crash fixes and documentation sync)
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** Updated Reporting docs, version alignment, roadmap consolidation, and STATE MEMORY entry

**2026-01-13T16:55:10.000Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** Build Fix (Post-A-R-19)
- **STATUS:** DONE
- **LAST COMMIT(S):** `b5bb08ad5` - Fix TypeScript build errors for Vercel deployment
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** Awaiting explicit Product instruction for next Reporting task (new assignment)

**2026-01-13T15:36:10.000Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** A-R-19
- **STATUS:** DONE
- **LAST COMMIT(S):** `13a54aff7` - A-R-19: Reporting Release Preflight Execution - COMPLETE
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** Build fix for Vercel deployment (TypeScript errors)

**2026-01-13T15:30:30.000Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** A-R-18
- **STATUS:** DONE
- **LAST COMMIT(S):** `3e2e967e4` - A-R-18: Reporting Release Candidate Definition & Handoff - COMPLETE
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** A-R-19: Reporting Release Preflight Execution

**2026-01-13T15:21:00.000Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** A-R-16
- **STATUS:** DONE
- **LAST COMMIT(S):** `8b0568a99` - A-R-16: Reporting Release Verification Pack - COMPLETE
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** A-R-18: Reporting Release Candidate Definition & Handoff

**2026-01-13T15:14:00.000Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** A-R-15
- **STATUS:** DONE
- **LAST COMMIT(S):** `def750c40` - A-R-15: CSV Export Formatting Alignment - COMPLETE
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** A-R-16: Reporting Release Verification Pack

**2026-01-13T14:22:30.000Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** A-R-14
- **STATUS:** DONE
- **LAST COMMIT(S):** `7e58521fe` - A-R-14: Reporting Docs Truth Sync - COMPLETE
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** A-R-15: CSV Export Formatting Alignment

**2026-01-13T14:12:00.000Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** A-R-13
- **STATUS:** DONE
- **LAST COMMIT(S):** `adcea2138` - A-R-13: Chart Data Validation & Error Boundaries - COMPLETE
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** A-R-14: Reporting Docs Truth Sync

**2026-01-13T17:30:00.000Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** Production Runtime Error Fix
- **STATUS:** DONE
- **LAST COMMIT(S):** `e3506c061` - Fix production runtime errors: TEXT chart plain text handling and Layout Grammar validation
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** Awaiting explicit Product instruction for next Reporting task
- **FIXES:**
  - Fixed TEXT chart formula evaluation: Plain text strings (e.g., "Sampletextcontent15") are now detected and returned directly without formula evaluation, preventing CSP errors from expr-eval trying to parse plain text as a formula.
  - Fixed Layout Grammar validation: `--block-height` CSS variable validation now checks the parent row element instead of the chart element, since the variable is set on the row and may not be accessible via getComputedStyle on the chart element.

**2026-01-13T17:45:00.000Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** Chart Rendering Crash Fix
- **STATUS:** DONE
- **LAST COMMIT(S):** `bd104e9c3` - Fix chart rendering crashes: Wrap CSS variable validation in try-catch
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** Awaiting explicit Product instruction for next Reporting task
- **FIXES:**
  - Fixed "Chart rendering failed" error: Wrapped `validateCriticalCSSVariable` calls in try-catch blocks to prevent validation errors from crashing component rendering. Validation errors are now logged to console instead of throwing errors that break the UI.
  - Applied to TEXT, BAR, and TABLE chart types. This prevents Layout Grammar validation from breaking user experience when CSS variables are temporarily missing during initial render or resize events.

## 0. Executive Summary

ACTION_PLAN.md is the single source of truth for all open and actionable work items. Only *open* (not completed) items are tracked here. Completed (DONE) items are removed from this plan and live in release notes, verification packs, or investigation docs.

Major sections:
- Section 1: How to Use This Document
- Section 2: Global Dependency Map
- Section 3: Reporting System – Active Action Items
- Section 4: Admin System – Active Action Items
- Section 5: Cross-System / Shared Risks
- Section 6: Blocked or Waiting Items
- Section 7: Technological Dependency Priority List
- Section 8: Next-Step Recommendations
- Section 9: Historical Reference (Read-Only)
- Section 10: State Memory

---

## 1. How to Use This Document

- This document tracks only actionable, open, or waiting work.
- Each action item is a single checkbox task, with clear owner, dependency, and status.
- When items are completed, they are removed from active sections and referenced in Section 9.
- Use this as the canonical execution queue for Reporting and Admin systems.

---

## 2. Global Dependency Map

- Reporting and Admin systems have the following dependency relationships:
  - Reporting runtime depends on Admin configuration (templates, styles, variables, algorithms).
  - Admin system documentation and hardening must precede any new feature development.
  - Shared risks are tracked in Section 5.

---

## 3. Reporting System – Active Action Items

- Owner: Tribeca (unless otherwise specified)

[ ] A-R-20: Manual smoke execution ownership for post-release reporting  
    - Dependency: Release candidate verification complete  
    - Owner: Tribeca  
    - Status: OPEN

[ ] A-R-21: Post-release monitoring hooks for reporting runtime  
    - Dependency: Deployment of release candidate  
    - Owner: Tribeca  
    - Status: OPEN

[ ] A-R-22: Runtime guardrail follow-ups (if any remain after recent release)  
    - Dependency: Review of runtime error logs post-release  
    - Owner: Tribeca  
    - Status: WAITING

---

## 4. Admin System – Active Action Items

- Owner: Katja (unless otherwise specified)

[ ] A-UI-10: Define hashtag model and color management  
    - Dependency: Access to hashtags admin page  
    - Owner: Katja  
    - Status: OPEN

[ ] A-UI-11: Define category model and usage  
    - Dependency: Access to categories admin page  
    - Owner: Katja  
    - Status: OPEN

[ ] A-UI-12: Define report template model and data blocks  
    - Dependency: Access to visualization admin page  
    - Owner: Katja  
    - Status: OPEN

[ ] A-UI-13: Define report style model and assignment rules  
    - Dependency: Access to styles admin page  
    - Owner: Katja  
    - Status: OPEN

[ ] A-UI-14: Document cache types and admin cache actions  
    - Dependency: Access to cache admin page  
    - Owner: Katja  
    - Status: OPEN

[ ] A-UI-15: Resolve canonical user guide source and workflow mapping  
    - Dependency: Access to help admin page  
    - Owner: Katja  
    - Status: OPEN

---

## 5. Cross-System / Shared Risks

- Pending review of cross-system runtime errors after next release.
- Coordination required on template and style assignment logic between Reporting and Admin.

---

## 6. Blocked or Waiting Items

[ ] A-R-22: Runtime guardrail follow-ups  
    - Waiting on: Post-release error log review  
    - Owner: Tribeca  
    - Status: WAITING

---

## 7. Technological Dependency Priority List

1. Reporting post-release monitoring (A-R-21) requires release candidate deployment.
2. Runtime guardrail follow-ups (A-R-22) depend on log review after deployment.

---

## 8. Next-Step Recommendations

### Top 3 Next Steps – Reporting (Tribeca)

1. [ ] A-R-20: Manual smoke execution ownership for post-release reporting
2. [ ] A-R-21: Post-release monitoring hooks for reporting runtime
3. [ ] A-R-22: Runtime guardrail follow-ups (after error log review)

---

## 9. Historical Reference (Read-Only)

The following items are completed and tracked in release notes, verification packs, or investigation docs:

- A-01: Layout Grammar Editor Integration
- A-02: Layout Grammar Migration Tooling
- A-04: Typography Scaling Edge Cases
- A-06: Performance Optimization Pass
- A-R-07: Export Correctness & Validation
- A-R-08: Render Determinism Guarantees
- A-R-10: Export Format Consistency (CSV/PDF Parity vs Rendered Report)
- A-R-11: Formula Calculation Error Handling & Recovery
- A-R-12: Report Template Compatibility Validation
- A-R-13: Chart Data Validation & Error Boundaries
- A-R-15: CSV Export Formatting Alignment (Rendered vs Exported Values)
- A-R-16: Reporting Release Verification Pack (Docs + Evidence)
- A-R-18: Reporting Release Candidate Definition & Handoff
- A-R-19: Reporting Release Preflight Execution (Evidence Run)

---

## 10. State Memory

**Sultan**
- Focus: System-level oversight and section structure enforcement
- Last reviewed: All sections present and numbered
- No open tasks assigned

**Tribeca**
- Focus: Reporting system execution and monitoring
- Manual smoke and post-release monitoring pending
- Awaiting error log review for guardrail follow-up

# ACTION_PLAN.md

**Version:** 1.2.0  
**Created:** 2026-01-12T00:09:33.679Z  
**Last Updated:** 2026-01-14T12:20:00.000Z  
**Status:** Active  
**Canonical:** Yes  
**Owner:** Chappie (Architecture)  
**Audience:** Product + Engineering

---

## 0. Summary Index

0. Summary Index (this section)
1. Operating Rules for This File
2. Global Dependency Map
3. Execution Queue (Dependency-Ordered)
4. Reporting System (Action Items)
5. Admin System (Action Items)
6. Shared / Cross-System Risks (Action Items)
7. Parked / Waiting Items
8. Completed Items (Reference Only)
9. STATE MEMORY (Current Only)

---

## 1. Operating Rules for This File

1.1 ACTION_PLAN.md is the executable TODO queue and the only long-term memory for execution state.

1.2 This file contains only:
- Open or waiting action items (checkbox tasks)
- Minimal metadata needed for execution: owner, status, dependencies
- Current STATE MEMORY (current task per agent only)

1.3 This file must NOT contain:
- Closure evidence blocks
- Commit lists
- Verification narratives
- Release note content

1.4 DONE work rule:
- When a task is DONE, remove it from Sections 3–7.
- Keep only a short reference in Section 8.

---

## 2. Global Dependency Map

2.1 Reporting runtime depends on Admin configuration consistency:
- Report templates
- Styles/themes
- Variables
- Algorithms and assignment rules

2.2 Therefore, Admin model clarity and assignment rules must be stabilised before adding new Reporting features that rely on those definitions.

---

## 3. Execution Queue (Dependency-Ordered)

3.1 Priority is determined by technological dependency and risk containment.

3.2 Queue (highest priority first):
1) ADMIN: A-UI-12, A-UI-13, ADM-RM-09 (template/style/variable system clarity)
2) REPORTING: A-03 (incl. A-03.1 TEXT AREA and A-03.2 KPI height calculations, eliminate overflow while respecting Layout Grammar)
3) REPORTING: A-05 (runtime enforcement expectations aligned with Admin model outputs)
4) ADMIN: A-UI-01 (Partner IA + override rules, depends on A-UI-12/A-UI-13 clarity)
5) ADMIN: A-UI-10, A-UI-11 (hashtag/category consolidation decisions)
6) ADMIN: A-UI-14, A-UI-15 (operational support and documentation)
7) ADMIN: Remaining ADM-RM items (post-foundation)

---

## 4. Reporting System (Action Items)

**Owner:** Tribeca (Reporting)

- [ ] A-05: Layout Grammar Runtime Enforcement
  - **Status:** IN PROGRESS
  - **Priority:** High
  - **Dependencies:** Admin template/style/variable definitions stabilised (see A-UI-12, A-UI-13, ADM-RM-09)
  - **Owner:** Tribeca
  - **Execution notes:** Define and implement correct runtime behaviour for missing critical CSS variables without causing production crashes.

---

## 5. Admin System (Action Items)

**Owner:** Katja (Admin)

5.1 Foundation (must be done before downstream work)

- [ ] A-UI-12: Reporting (Report Structures)
  - **Status:** OPEN
  - **Priority:** High
  - **Dependencies:** None
  - **Owner:** Katja
  - **Definition:** Define report template model, data blocks, and selection rules (global -> partner -> event).

- [ ] A-UI-13: Style Editor (Report Themes)
  - **Status:** OPEN
  - **Priority:** High
  - **Dependencies:** A-UI-12
  - **Owner:** Katja
  - **Definition:** Define style model and assignment rules (global -> partner -> event -> filter where applicable).

- [ ] ADM-RM-09: Variable System Enhancement
  - **Status:** IN PROGRESS
  - **Priority:** High
  - **Dependencies:** A-UI-12, A-UI-13
  - **Owner:** Katja
  - **Definition:** Stabilise and harden the existing Variable system so daily operation is reliable and existing variables remain respected. Deliver enhancements without breaking compatibility. In addition, provide a future-facing improvement plan.
  - **Deliverables (required):**
    - Variable inventory: list all current variables used by Admin and Reporting (name, type, default, scope, where defined, where consumed).
    - Compatibility contract: rules that guarantee existing variables keep working (no renames, no silent behaviour changes).
    - Runtime guarantees: what happens when variables are missing or invalid (Admin validation, Reporting behaviour expectations).
    - Enhancement scope: clearly separated list of safe improvements that do not break current operation.
    - Future improvements plan: staged plan for improvements with dependencies and risk notes.

5.2 Partner and assignment flows

- [ ] A-UI-01: Partners (Partner Model, Partner Report, Partner Scoping)
  - **Status:** OPEN
  - **Priority:** Medium
  - **Dependencies:** A-UI-12, A-UI-13, ADM-RM-09
  - **Owner:** Katja
  - **Definition:** Confirm partner model, map partner routes, and define override rules (global -> partner -> event).

- [ ] ADM-RM-02: Google Sheets Integration (auto-provision sheets for new partners)
  - **Status:** OPEN
  - **Priority:** Medium
  - **Dependencies:** A-UI-01
  - **Owner:** Katja

- [ ] ADM-RM-10: Admin UI Consistency
  - **Status:** OPEN
  - **Priority:** Medium
  - **Dependencies:** A-UI-12, A-UI-13
  - **Owner:** Katja

5.3 Taxonomy management

- [ ] A-UI-10: Hashtag Manager (Hashtags and Reports)
  - **Status:** OPEN
  - **Priority:** Medium
  - **Dependencies:** A-UI-12
  - **Owner:** Katja

- [ ] A-UI-11: Category Manager (Purpose and Scope)
  - **Status:** OPEN
  - **Priority:** Medium
  - **Dependencies:** A-UI-10
  - **Owner:** Katja

5.4 Operations and support

- [ ] A-UI-14: Cache Management (Seeing Updates)
  - **Status:** OPEN
  - **Priority:** Low
  - **Dependencies:** A-UI-12, A-UI-13
  - **Owner:** Katja

- [ ] A-UI-15: User Guide (messmass.com Operations)
  - **Status:** OPEN
  - **Priority:** Low
  - **Dependencies:** A-UI-12, A-UI-13
  - **Owner:** Katja

5.5 Backlog (kept as checkboxes, not a table)

- [ ] ADM-RM-07: Bitly Search Enhancements
  - **Status:** BACKLOG
  - **Priority:** Low
  - **Dependencies:** ADM-RM-10
  - **Owner:** Katja

- [ ] ADM-RM-08: Bitly Analytics Export & Reporting
  - **Status:** BACKLOG
  - **Priority:** Low
  - **Dependencies:** ADM-RM-07
  - **Owner:** Katja

- [ ] ADM-RM-04: Search & Paging Unification (Admin: Users)
  - **Status:** BACKLOG
  - **Priority:** Low
  - **Dependencies:** ADM-RM-10
  - **Owner:** Katja

- [ ] ADM-RM-06: Partner Analytics Dashboard enhancements
  - **Status:** BACKLOG
  - **Priority:** Low
  - **Dependencies:** A-UI-01
  - **Owner:** Katja

- [ ] ADM-RM-11: Admin UI assignment dropdown (project edit modal)
  - **Status:** BACKLOG
  - **Priority:** Low
  - **Dependencies:** A-UI-12, A-UI-13
  - **Owner:** Katja

- [ ] ADM-RM-12: Admin Grid Settings UI (desktop/tablet/mobile units)
  - **Status:** BACKLOG
  - **Priority:** Low
  - **Dependencies:** ADM-RM-10
  - **Owner:** Katja

- [ ] ADM-RM-13: Admin Productivity backlog
  - **Status:** BACKLOG
  - **Priority:** Low
  - **Dependencies:** ADM-RM-10
  - **Owner:** Katja

---

## 6. Shared / Cross-System Risks (Action Items)

- [ ] X-01: Confirm Admin -> Reporting contract for template/style/variable assignment
  - **Status:** OPEN
  - **Priority:** High
  - **Dependencies:** A-UI-12, A-UI-13, ADM-RM-09
  - **Owner:** Chappie
  - **Execution notes:** Produce a single authoritative mapping of what Reporting expects to exist at runtime and where Admin guarantees those values.

---

## 7. Parked / Waiting Items

- None

---

## 8. Completed Items (Reference Only)

Reporting: A-01, A-02, A-04, A-06, A-R-07, A-R-08, A-R-09 (deprecated), A-R-10, A-R-11, A-R-12, A-R-13, A-R-15, A-R-16, A-R-18, A-R-19, A-03 (incl. A-03.1 TEXT AREA, A-03.2 KPI height calculations)

Admin: A-UI-CLEAN-01

---

## 9. STATE MEMORY (Current Only)

**2026-01-14T12:35:00.000Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** A-03
- **STATUS:** DONE
- **LAST COMMIT(S):** `c1c167d03` - fix(A-03.1+A-03.2): Height calculation fixes for TEXT AREA and KPI charts
- **CURRENT BLOCKERS:** Push to HTTPS remote requires authentication
- **NEXT EXPECTED OUTPUT:** Resolve Git authentication for HTTPS remote and push commit `c1c167d03`

**2026-01-14T12:30:00.000Z**
- **AGENT:** Katja
- **DOMAIN:** Admin
- **CURRENT TASK ID:** ADM-RM-09
- **STATUS:** IN PROGRESS
- **LAST COMMIT(S):** pending
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** Admin Variable system hardening package (inventory + compatibility contract + runtime guarantees) plus a staged future improvement plan, documented and ready for implementation

---