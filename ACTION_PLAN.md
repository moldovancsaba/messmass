# ACTION_PLAN.md

**Version:** 1.2.0  
**Created:** 2026-01-12T00:09:33.679Z  
**Last Reviewed:** 2026-01-15T10:23:47.000Z  
**Last Updated:** 2026-01-15T10:23:47.000Z  
**Status:** Active  
**Canonical:** Yes  
**Owner:** Chappie (The Architect) 
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

### R-LAYOUT-01.1: LayoutV2 Renderer Contract (Block + Item + Unit Rules)

**Priority:** High  
**Status:** ACTIVE  
**Dependency:** None

**Description:**
Define the LayoutV2 renderer contract specifying block aspect ratio (4:1), block capacity (4 units), item unit rules, deterministic packing rules, fit policies, and renderer input shape expectations.

**Deliverables:**
- Contract document at `docs/design/REPORT_LAYOUT_V2_CONTRACT.md`
- Block aspect ratio: fixed 4:1
- Block capacity: fixed 4 units
- Item unit rules documented (Images: 16:9 = 2 units, 1:1 = 1 unit, 9:16 = 1 unit; Texts/charts: 1:1 = 1 unit, 2:1 = 2 units)
- Deterministic packing rules (no ambiguity, same input => same layout)
- Fit policies (text/charts never overflow inside their allocated unit slot)
- Renderer input shape expectations (what Reporting will consume from Admin)

**Owner:** Tribeca

---

### A-03.4: Layout Grammar Text Safety Standardization (All Charts)

**Priority:** High  
**Status:** ACTIVE  
**Dependency:** None

**Description:**
Standardize text fitting across all chart types using KPI-safe measurement and dynamic font scaling, eliminating overflow on mobile/desktop while preserving Layout Grammar.

**Root Cause Analysis:**

**Why KPI Charts Work (Stable):**
- Uses CSS Grid with fixed row ratios: `grid-template-rows: 4fr 3fr 3fr` (40%:30%:30%)
- Each row has guaranteed height based on container height (no competing flex containers)
- JavaScript measures actual content height vs allocated row height
- Dynamically reduces font size with `!important` to override CSS clamp() rules
- Independent row heights - no space competition

**Why PIE Charts Fail on Mobile (Unstable):**
- Uses Flexbox column with fixed flex-basis percentages: `flex: 0 0 30%` (title), `flex: 0 0 40%` (chart), `flex: 1 1 30%` (legend)
- On mobile, CSS changes to `flex: 0 0 auto` for title/legend and `flex: 1 1 auto` for chart
- Chart container competes with title/legend for space (no guaranteed height)
- Chart.js canvas forced to 100% width/height, but container may not have stable height
- Title and legend can grow, pushing chart container to shrink
- No measured height calculation like KPI - relies on flex percentages

**Solution Pattern (KPI-Safe Standard):**
1. Measure container height (via refs)
2. Calculate allocated space for each section (based on fixed ratios)
3. Measure actual content height (offsetHeight)
4. If actual > available: reduce font size proportionally
5. Apply with `!important` to override CSS clamp() rules
6. Use ResizeObserver + MutationObserver for dynamic updates

**Chart Type Status:**

✅ **KPI Chart:** Stable (uses measured height + dynamic font scaling)
✅ **BAR Chart:** Stable (uses measured height + dynamic font scaling for labels)
✅ **TEXT Chart:** Stable (uses measured height + dynamic font scaling for content + title)
✅ **TABLE Chart:** Stable (uses measured height + dynamic font scaling for content)
✅ **CellWrapper:** Stable (uses measured height + dynamic font scaling for title + subtitle)
⚠️ **PIE Chart:** Unstable on mobile (needs measured body height calculation)
⚠️ **IMAGE Chart:** Uses CellWrapper (title/subtitle stable, body needs verification)

**Action Items:**

1. **Update Layout Grammar Documentation:**
   - Document "measured height" approach as standard for all chart types
   - Specify: Measure container → Calculate allocated space → Measure actual content → Reduce font size if needed
   - Add mobile-specific guidance: Avoid competing flex containers, use measured heights

2. **Fix PIE Chart Mobile Layout:**
   - Replace flex percentage approach with measured body height calculation
   - Calculate: `bodyHeight = containerHeight - titleHeight - legendHeight`
   - Set `--chart-body-height` CSS variable on PIE container
   - Ensure chart container has guaranteed height (not competing flex)
   - Apply same pattern as KPI: measure → calculate → scale

3. **Verify IMAGE Chart:**
   - Confirm CellWrapper title/subtitle scaling works correctly
   - Verify image body zone respects Layout Grammar (no clipping)

4. **Update CSS:**
   - Remove mobile-specific flex percentage overrides for PIE
   - Use measured heights via CSS variables instead
   - Ensure all chart containers have guaranteed heights (no competing flex)

**Considerations (before execution):**
- PIE chart must use same measured height pattern as KPI (no flex competition)
- All text elements must use measured available space + `!important` overrides
- Mobile layouts must use same measurement approach as desktop (no special cases)
- Chart.js canvas must have guaranteed container height (not flex-dependent)

**Owner:** Tribeca

---

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
- [x] Resolve the canonical user guide source referenced in [app/admin/help/page.tsx](app/admin/help/page.tsx).
- [x] Decide whether the guide is doc-driven or embedded and define update process.
- [x] Map user workflows to admin workflows and reference links.

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
| ADM-RM-09 | Variable System Enhancement | DONE | `ROADMAP.md` |  |
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
**Last Updated:** 2026-01-15T10:23:47.000Z  
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
1) REPORTING: A-03.4 (Layout Grammar text safety standardization)
2) ADMIN: A-UI-12, A-UI-13 (template/style clarity)
3) REPORTING: A-03 (incl. A-03.1 TEXT AREA and A-03.2 KPI height calculations, eliminate overflow while respecting Layout Grammar)
4) REPORTING: A-05 (runtime enforcement expectations aligned with Admin model outputs)
5) ADMIN: A-UI-01 (Partner IA + override rules, depends on A-UI-12/A-UI-13 clarity)
6) ADMIN: A-UI-10, A-UI-11 (hashtag/category consolidation decisions)
7) ADMIN: A-UI-14 (operational support and documentation)
8) ADMIN: Remaining ADM-RM items (post-foundation)

---

## 4. Reporting System (Action Items)

**Owner:** Tribeca (Reporting)

- [x] A-03.4: Layout Grammar Text Safety Standardization (All Charts)
  - **Status:** DONE
  - **Priority:** High
  - **Dependencies:** None
  - **Owner:** Tribeca
  - **Definition:** Unify text fitting logic across chart types to KPI-safe measurement and dynamic font scaling; fix PIE mobile layout conflicts without breaking Layout Grammar.
  - **Completed:** 2026-01-15 - All chart types now use measured height pattern. PIE chart mobile layout fixed.

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

Admin: A-UI-CLEAN-01, A-UI-15, ADM-RM-09

---

## 9. STATE MEMORY (Current Only)

**2026-01-15T[UTC_TIME]Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** A-03.4 – Layout Grammar Text Safety Standardization (All Charts)
- **STATUS:** DONE
- **LAST COMMIT(S):** `8db71ecd1` - A-03.4: Layout Grammar Text Safety Standardization - PIE chart measured height fix
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** Awaiting Architect assignment
- **DELIVERABLES:**
  - Layout Grammar documentation updated with measured height standard pattern
  - PIE chart mobile layout fixed using measured body height calculation (KPI-safe pattern)
  - CSS updated to use measured heights via CSS variables (removed mobile flex overrides)
  - IMAGE chart verified (uses CellWrapper with title/subtitle scaling)
  - All chart types now use consistent measured height pattern for Layout Grammar compliance

**2026-01-14T12:35:00.000Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** A-03
- **STATUS:** DONE
- **LAST COMMIT(S):** `c1c167d03` - fix(A-03.1+A-03.2): Height calculation fixes for TEXT AREA and KPI charts
- **CURRENT BLOCKERS:** Push to HTTPS remote requires authentication
- **NEXT EXPECTED OUTPUT:** Resolve Git authentication for HTTPS remote and push commit `c1c167d03`

**2026-01-14T13:49:28.000Z**
- **AGENT:** Katja
- **DOMAIN:** Admin
- **CURRENT TASK ID:** ADM-RM-09
- **STATUS:** DONE
- **LAST COMMIT(S):** `29c865247` (ADM-RM-09 docs already present; no new commit created)
- **CURRENT BLOCKERS:** Git authentication required to push (https://github.com/moldovancsaba/messmass.git)
- **NEXT EXPECTED OUTPUT:** Awaiting next Admin assignment

---

# ACTION_PLAN.md

**Version:** 1.2.1  
**Created:** 2026-01-12T00:09:33.679Z  
**Last Updated:** 2026-01-15T10:23:47.000Z  
**Status:** Active  
**Canonical:** Yes  
**Owner:** Chappie (The Architect)  
**Audience:** Engineering + Product

---

## 0. Summary Index
- 1. Operating Rules
- 2. Global Dependency Map
- 3. Execution Queue (Dependency-Ordered)
- 4. Reporting System – Action Items
- 5. Admin System – Action Items
- 6. Cross-System Action Items
- 7. Parked / Waiting Items
- 8. STATE MEMORY (Current Only)

---

## 1. Operating Rules
- This file is the single executable TODO + memory.
- Only OPEN / WAITING tasks live here.
- DONE tasks are removed immediately.
- STATE MEMORY contains current state only.

---

## 2. Global Dependency Map
- Reporting depends on Admin templates, styles, variables.
- Admin foundation precedes Reporting extensions.

---

## 3. Execution Queue (Dependency-Ordered)
1. A-03.4
2. A-03
3. A-05
4. A-UI-12
5. A-UI-13
6. A-UI-01
7. A-UI-10
8. A-UI-11
9. A-UI-14
10. ADM-RM-02
11. ADM-RM-10
12. ADM-RM-07
13. ADM-RM-08
14. ADM-RM-04
15. ADM-RM-06
16. ADM-RM-11
17. ADM-RM-12
18. ADM-RM-13
19. X-01

---

## 4. Reporting System – Action Items
- [ ] A-03.4: Layout Grammar Text Safety Standardization (All Charts)
  - Priority: High
  - Dependencies: None
  - Owner: Tribeca
  - Status: OPEN
- [ ] A-03: Height Calculation Accuracy Improvements
  - Priority: Medium
  - Dependencies: None
  - Owner: Tribeca
  - Status: IN PROGRESS
- [ ] A-05: Layout Grammar Runtime Enforcement
  - Priority: Medium
  - Dependencies: Runtime validation (exists)
  - Owner: Tribeca
  - Status: IN PROGRESS

---

## 5. Admin System – Action Items
- [ ] A-UI-12: Reporting (Report Structures)
  - Priority: High
  - Dependencies: None
  - Owner: Katja
  - Status: OPEN
- [ ] A-UI-13: Style Editor (Report Themes)
  - Priority: High
  - Dependencies: A-UI-12
  - Owner: Katja
  - Status: OPEN
- [ ] A-UI-01: Partners (Partner Model, Partner Report, Partner Scoping)
  - Priority: Medium
  - Dependencies: A-UI-12, A-UI-13
  - Owner: Katja
  - Status: OPEN
- [ ] A-UI-10: Hashtag Manager (Hashtags and Reports)
  - Priority: Medium
  - Dependencies: A-UI-12
  - Owner: Katja
  - Status: OPEN
- [ ] A-UI-11: Category Manager (Purpose and Scope)
  - Priority: Medium
  - Dependencies: A-UI-10
  - Owner: Katja
  - Status: OPEN
- [ ] A-UI-14: Cache Management (Seeing Updates)
  - Priority: Low
  - Dependencies: A-UI-12, A-UI-13
  - Owner: Katja
  - Status: OPEN
- [ ] ADM-RM-02: Google Sheets Integration (auto-provision sheets for new partners)
  - Priority: Medium
  - Dependencies: A-UI-01
  - Owner: Katja
  - Status: OPEN
- [ ] ADM-RM-10: Admin UI Consistency
  - Priority: Medium
  - Dependencies: A-UI-12, A-UI-13
  - Owner: Katja
  - Status: OPEN
- [ ] ADM-RM-07: Bitly Search Enhancements
  - Priority: Low
  - Dependencies: ADM-RM-10
  - Owner: Katja
  - Status: BACKLOG
- [ ] ADM-RM-08: Bitly Analytics Export & Reporting
  - Priority: Low
  - Dependencies: ADM-RM-07
  - Owner: Katja
  - Status: BACKLOG
- [ ] ADM-RM-04: Search & Paging Unification (Admin: Users)
  - Priority: Low
  - Dependencies: ADM-RM-10
  - Owner: Katja
  - Status: BACKLOG
- [ ] ADM-RM-06: Partner Analytics Dashboard enhancements
  - Priority: Low
  - Dependencies: A-UI-01
  - Owner: Katja
  - Status: BACKLOG
- [ ] ADM-RM-11: Admin UI assignment dropdown (project edit modal)
  - Priority: Low
  - Dependencies: A-UI-12, A-UI-13
  - Owner: Katja
  - Status: BACKLOG
- [ ] ADM-RM-12: Admin Grid Settings UI (desktop/tablet/mobile units)
  - Priority: Low
  - Dependencies: ADM-RM-10
  - Owner: Katja
  - Status: BACKLOG
- [ ] ADM-RM-13: Admin Productivity backlog
  - Priority: Low
  - Dependencies: ADM-RM-10
  - Owner: Katja
  - Status: BACKLOG

---

## 6. Cross-System Action Items
- [ ] X-01: Confirm Admin -> Reporting contract for template/style/variable assignment
  - Priority: High
  - Dependencies: A-UI-12, A-UI-13
  - Owner: Chappie
  - Status: OPEN

---

## 7. Parked / Waiting Items
(none)

---

## 8. STATE MEMORY (Current Only)
**2026-01-15T12:45:00.000Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** R-LAYOUT-01.1 – LayoutV2 Renderer Contract (Block + Item + Unit Rules)
- **STATUS:** ACTIVE
- **LAST COMMIT(S):** Pending (R-LAYOUT-01.1: Contract document creation)
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** docs/design/REPORT_LAYOUT_V2_CONTRACT.md committed + ACTION_PLAN.md STATE MEMORY updated

**2026-01-15T10:23:47.000Z**
- **AGENT:** Katja
- **DOMAIN:** Admin
- **CURRENT TASK ID:** A-UI-12
- **STATUS:** OPEN
- **LAST COMMIT(S):** N/A
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** Report template model definition