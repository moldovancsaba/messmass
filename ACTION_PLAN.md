# ACTION_PLAN.md

**Version:** 1.3.1  
**Created:** 2026-01-12T00:09:33.679Z  
**Last Updated (UTC):** 2026-01-15T13:40:00.000Z  
**Status:** Active  
**Canonical:** Yes  
**Owner:** Chappie (The Architect)  
**Audience:** Product + Engineering

---

## 0. Summary Index

0. Summary Index  
1. Operating Rules  
2. Global Dependency Map  
3. Execution Queue (dependency-ordered)  
4. Reporting System (action items)  
5. Admin System (action items)  
6. Cross-System (action items)  
7. Completed Items (reference only)  
8. STATE MEMORY (current only)

---

## 1. Operating Rules

1.1 ACTION_PLAN.md is the single executable TODO and the only long-term memory for execution state.  
1.2 This file contains only:
- Open or waiting action items (checkbox tasks)
- Minimal metadata needed for execution: owner, status, dependencies, deliverable paths
- STATE MEMORY (current task per agent only)

1.3 This file must not contain:
- Closure evidence blocks
- Commit lists (outside STATE MEMORY)
- Verification narratives
- Release note content

1.4 DONE rule:
- When a task is DONE, remove it from Sections 3 to 6.
- Keep only a short reference in Section 7.

---

## 2. Global Dependency Map

2.1 Reporting runtime depends on Admin configuration consistency:
- Report templates
- Styles/themes
- Variables
- Layout schema (LayoutV2)

2.2 LayoutV2 delivery order:
- Reporting Contract + Admin Schema are prerequisites (DONE).
- Reporting renderer implementation is prerequisite for Admin authoring integration (DONE).
- Admin must be able to author LayoutV2 templates before we can validate end-to-end flows.

---

## 3. Execution Queue (Dependency-Ordered)

3.1 Priority is determined by technological dependency and risk containment.

3.2 Queue (highest priority first):
1) ADMIN: A-UI-LAYOUT-01.2 (Admin LayoutV2 authoring output in Visualization Editor)
2) REPORTING: R-LAYOUT-01.3 (LayoutV2 end-to-end rendering alignment and regression pass)
3) CROSS: X-LAYOUT-01 (Contract conformance fixtures: Admin output -> Reporting input)
4) REPORTING: A-05 (Layout Grammar runtime enforcement guardrails)
5) ADMIN: A-UI-12 (Report template model and selection rules)
6) ADMIN: A-UI-13 (Style model and assignment rules)

---

## 4. Reporting System (Action Items)

Owner: Tribeca (Reporting)

### R-LAYOUT-01.3: LayoutV2 End-to-End Rendering Alignment (Regression Pass)

- [ ] Align LayoutV2 renderer behaviour against real report data and all chart types
  - Status: ASSIGNED
  - Priority: High
  - Dependencies: R-LAYOUT-01.2 (DONE)
  - Owner: Tribeca
  - Deliverables:
    - Confirm LayoutV2 layout works for TEXT, KPI, BAR, PIE, TABLE, IMAGE (no overflow, no clipping)
    - Remove any remaining legacy height-assumption paths if any still exist in Reporting runtime
    - Add regression fixtures using representative report inputs
    - Extend tests: __tests__/layoutV2-packing.test.ts to cover multi-block and mixed chart-type layouts

### A-05: Layout Grammar Runtime Enforcement

- [ ] Define and implement correct runtime behaviour for missing critical CSS variables without production crashes
  - Status: OPEN
  - Priority: Medium
  - Dependencies: Admin foundations (A-UI-LAYOUT-01.2, A-UI-12, A-UI-13)
  - Owner: Tribeca
  - Deliverables:
    - Guardrails in reporting runtime
    - Tests for failure modes

---

## 5. Admin System (Action Items)

Owner: Katja (Admin)

### A-UI-LAYOUT-01.2: Implement Admin LayoutV2 Template Builder Output (Visualization Editor)

- [ ] Update the Admin report template editor to support LayoutV2 items with explicit unit size (1 or 2 units) and explicit aspect ratio per item type
  - Status: ASSIGNED
  - Priority: High
  - Dependencies: A-UI-LAYOUT-01.1 (DONE), docs/design/REPORT_LAYOUT_V2_CONTRACT.md, docs/design/ADMIN_LAYOUT_V2_SCHEMA.md
  - Owner: Katja
  - Deliverables:
    - Admin template editor emits LayoutV2-compatible output
    - Authoring-time validation (capacity <= 4 units per block)
    - Prevent saving invalid layouts
    - Migration note for existing templates
    - Operator docs updated

### A-UI-12: Reporting (Report Structures)

- [ ] Define report template model, data blocks, and selection rules (global -> partner -> event)
  - Status: OPEN
  - Priority: Medium
  - Dependencies: None
  - Owner: Katja
  - Deliverables:
    - Doc updates: app/admin/visualization/page.tsx model mapping
    - Selection rule documentation

### A-UI-13: Style Editor (Report Themes)

- [ ] Define style model and assignment rules (global -> partner -> event -> filter)
  - Status: OPEN
  - Priority: Medium
  - Dependencies: A-UI-12
  - Owner: Katja
  - Deliverables:
    - Doc updates: app/admin/styles/page.tsx model mapping
    - Assignment rule documentation

---

## 6. Cross-System (Action Items)

### X-LAYOUT-01: Contract Conformance Fixtures (Admin Output -> Reporting Input)

- [ ] Create shared fixtures that validate Admin LayoutV2 output matches Reporting LayoutV2 renderer input
  - Status: OPEN
  - Priority: High
  - Dependencies: A-UI-LAYOUT-01.2, R-LAYOUT-01.3
  - Owner: Chappie
  - Deliverables:
    - Minimal fixture templates (1-unit, 2-unit, mixed, max-capacity 4-unit)
    - Validation checklist: schema + contract conformance

---

## 7. Completed Items (Reference Only)

Reporting:
- R-LAYOUT-01.1 (Contract)
- R-LAYOUT-01.2 (Renderer implementation)
- A-03.1 (TEXT AREA height fix)
- A-03.2 (KPI height fix)
- A-03.3 (BAR height accuracy)
- A-R-19 (Reporting release preflight)
- Build Fix (b5bb08ad5)
- Chart Crash Fix (bd104e9c3)

Admin:
- A-UI-LAYOUT-01.1 (Schema)
- ADM-RM-09 (Variable system enhancement)
- A-UI-15 (End user guide)
- A-UI-CLEAN-01 (Plan cleanup)

---

---

## 8. STATE MEMORY (Current Only)

 2026-01-15T14:18:00.000Z
- AGENT: Tribeca
- DOMAIN: Reporting
- CURRENT TASK ID: R-LAYOUT-02.1 – Reporting Support for Variable Block Aspect Ratio (Text-Area/Table)
- STATUS: DONE
- LAST COMMIT(S): `aed66e36b`, `8a3a3447c`, `1fcd43796`, `269f49206` - R-LAYOUT-02.1: Variable Block Aspect Ratio, Pending (TypeScript fix + STATE MEMORY update)
- CURRENT BLOCKERS: None
- NEXT EXPECTED OUTPUT: Awaiting Architect assignment
- DELIVERABLES:
  - Extended layoutV2BlockCalculator.ts to support variable blockAspectRatio (4:1 to 4:10)
  - Added validation: override only allowed for TEXT-AREA/TABLE blocks, rejects mixed types
  - Updated ReportContent.tsx and useReportLayout.ts to pass and use blockAspectRatio
  - Created __tests__/layoutV2-variable-aspect-ratio.test.ts (28 tests, all passing)
  - Default behavior unchanged (4:1 when not specified)
  - Maintains deterministic layout guarantees

2026-01-15T13:55:00.000Z
- AGENT: Katja
- DOMAIN: Admin
- CURRENT TASK ID: A-UI-LAYOUT-01.2
- STATUS: ACTIVE
- LAST COMMIT(S): 3043f7be4, fda5cf521
- CURRENT BLOCKERS: None
- NEXT EXPECTED OUTPUT: Admin Visualization Editor emits LayoutV2-compatible templates with validation + migration note + operator docs
