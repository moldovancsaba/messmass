# ACTION_PLAN.md

**Version:** 1.3.2  
**Created:** 2026-01-12T00:09:33.679Z  
**Last Updated (UTC):** 2026-01-15T15:00:00.000Z  
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
- Reporting renderer implementation + regression alignment are prerequisites for Admin authoring integration (DONE).
- Reporting supports variable blockAspectRatio for TEXT-AREA/TABLE (4:1–4:10) (DONE).
- Admin authoring of LayoutV2 incl. optional blockAspectRatio is required before end-to-end validation.

---

## 3. Execution Queue (Dependency-Ordered)

3.1 Priority is determined by technological dependency and risk containment.

3.2 Queue (highest priority first):
1) ADMIN: A-UI-13 (Style model and assignment rules)
2) ADMIN: A-UI-LAYOUT-02.1 (Variable blockAspectRatio authoring for TEXT-AREA/TABLE)
3) REPORTING: A-05 (Layout Grammar runtime enforcement guardrails)
4) CROSS: X-LAYOUT-01 (Contract conformance fixtures: Admin output -> Reporting input)

---

## 4. Reporting System (Action Items)

Owner: Tribeca (Reporting)

### A-05: Layout Grammar Runtime Enforcement

- [ ] Define and implement correct runtime behaviour for missing critical CSS variables without production crashes
  - Status: ASSIGNED
  - Priority: Medium
  - Dependencies: Admin foundations (A-UI-LAYOUT-01.2, A-UI-12, A-UI-13)
  - Owner: Tribeca
  - Deliverables:
    - Guardrails in reporting runtime
    - Tests for failure modes

---

## 5. Admin System (Action Items)

Owner: Katja (Admin)

### A-UI-LAYOUT-02.1: Admin Authoring for Variable Block Aspect Ratio (Text-Area/Table)

- [ ] Implement blockAspectRatio authoring at block level with validation
  - Status: OPEN
  - Priority: High
  - Dependencies: A-UI-LAYOUT-01.2 (DONE), docs/design/REPORT_LAYOUT_V2_CONTRACT.md, docs/admin/ADMIN_LAYOUT_V2_SCHEMA.md
  - Owner: Katja
  - Deliverables:
    - blockAspectRatio (4:1–4:10) authorable at block level
    - Validation: range + width=4
    - Validation: TEXT-AREA/TABLE only, no mixed blocks
    - Persist to template output
    - Operator docs update

### A-UI-12: Reporting (Report Structures)

- [x] Define report template model, data blocks, and selection rules (global -> partner -> event)
  - Status: DONE
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
  - Dependencies: A-UI-12, A-UI-13, A-UI-LAYOUT-02.1, A-05
  - Owner: Chappie
  - Deliverables:
    - Minimal fixture templates (1-unit, 2-unit, mixed, max-capacity 4-unit)
    - Validation checklist: schema + contract conformance

---

## 7. Completed Items (Reference Only)

Reporting:
- R-LAYOUT-01.1 (Contract)
- R-LAYOUT-01.2 (Renderer implementation)
- R-LAYOUT-01.3 (Regression alignment)
- R-LAYOUT-02.1 (Variable blockAspectRatio support)
- A-03.1 (TEXT AREA height fix)
- A-03.2 (KPI height fix)
- A-03.3 (BAR height accuracy)
- A-R-19 (Reporting release preflight)
- Build Fix (b5bb08ad5)
- Chart Crash Fix (bd104e9c3)

Admin:
- A-UI-LAYOUT-01.1 (Schema)
- A-UI-LAYOUT-01.2 (LayoutV2 authoring output)
- A-UI-12 (Report template model + selection rules)
- ADM-RM-09 (Variable system enhancement)
- A-UI-15 (End user guide)
- A-UI-CLEAN-01 (Plan cleanup)

---

---

## 8. STATE MEMORY (Current Only)

 2026-01-15T15:00:00.000Z
- AGENT: Tribeca
- DOMAIN: Reporting
- CURRENT TASK ID: A-05
- STATUS: ASSIGNED
- LAST COMMIT(S): 95f4056ba
- CURRENT BLOCKERS: None
- NEXT EXPECTED OUTPUT: Runtime guardrails + tests + STATE MEMORY update

2026-01-16T11:13:59.000Z
- AGENT: Katja
- DOMAIN: Admin
- CURRENT TASK ID: A-UI-12
- STATUS: DONE
- LAST COMMIT(S): 71e92e9fb
- CURRENT BLOCKERS: None
- NEXT EXPECTED OUTPUT: Awaiting Architect assignment
