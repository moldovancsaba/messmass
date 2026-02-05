# Operations Action Plan
Status: Active
Last Updated: 2026-01-16T11:30:00.000Z
Canonical: Yes
Owner: Operations

**Version:** 1.3.4  
**Created:** 2026-01-12T00:09:33.679Z  
**Last Updated (UTC):** 2026-02-04  
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

1.1 docs/operations/ACTION_PLAN.md is the single executable TODO and the only long-term memory for execution state.  
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
- Admin authoring of LayoutV2 incl. optional blockAspectRatio (A-UI-LAYOUT-02.1) (DONE).
- Contract conformance fixtures (X-LAYOUT-01) (DONE).

---

## 3. Execution Queue (Dependency-Ordered)

3.1 Priority is determined by technological dependency and risk containment.

3.2 Queue (highest priority first):
- [ ] OPS-INT-01: Google Sheets Partner Sync - Phase 2 hardening
  - Status: IN PROGRESS
  - Priority: High
  - Owner: Integrations
  - Started: 2025-12-26
  - Context: Partner-level bidirectional sync and admin UX for connect/disconnect/pull/push/status.
  - Deliverables:
    - [ ] End-to-end testing & validation (staging + production checklist)
    - [ ] Phase 2.5: Auto-provisioning via Drive API (optional follow-up)
  - References:
    - `docs/2026-02-04_GOOGLE_SHEETS_PARTNER_SYNC.md` (implementation notes)
    - `docs/operations/DEPLOYMENT_CHECKLIST.md` (rollout validation)

---

## 4. Reporting System (Action Items)

Owner: Tribeca (Reporting)

*No open action items. All Reporting tasks complete.*

---

## 5. Admin System (Action Items)

Owner: Katja (Admin)

### A-UI-12: Reporting (Report Structures)

- [x] Define report template model, data blocks, and selection rules (global -> partner -> event)
  - Status: DONE
  - Priority: Medium
  - Dependencies: None
  - Owner: Katja
  - Deliverables:
    - Doc updates: app/admin/visualization/page.tsx model mapping
    - Selection rule documentation

*No other open Admin action items.*

---

## 6. Cross-System (Action Items)

*No open cross-system action items.*

---

## 7. Completed Items (Reference Only)

Reporting:
- R-LAYOUT-01.1 (Contract)
- R-LAYOUT-01.2 (Renderer implementation)
- R-LAYOUT-01.3 (Regression alignment)
- R-LAYOUT-02.1 (Variable blockAspectRatio support)
- A-05 (Layout Grammar runtime enforcement guardrails)
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
- A-UI-13 (Style model and assignment rules – docs/admin/STYLE_MODEL_AND_ASSIGNMENT_RULES.md, app/admin/styles/page.tsx)
- A-UI-LAYOUT-02.1 (Variable blockAspectRatio authoring at block level – validation, persist, operator docs)
- ADM-RM-09 (Variable system enhancement)
- A-UI-15 (End user guide)
- A-UI-CLEAN-01 (Plan cleanup)

Cross:
- X-LAYOUT-01 (Contract conformance fixtures – __fixtures__/layoutV2/, VALIDATION_CHECKLIST.md, validate-fixtures.js)

---

---

## 8. STATE MEMORY (Current Only)

2026-02-04
- AGENT: Tribeca
- DOMAIN: Reporting
- CURRENT TASK ID: (none)
- STATUS: DONE
- LAST COMMIT(S): (see repo)
- CURRENT BLOCKERS: None
- NEXT EXPECTED OUTPUT: Awaiting Architect assignment

2026-02-04
- AGENT: Katja
- DOMAIN: Admin
- CURRENT TASK ID: A-UI-13, A-UI-LAYOUT-02.1
- STATUS: DONE
- LAST COMMIT(S): (delivered this session)
- CURRENT BLOCKERS: None
- NEXT EXPECTED OUTPUT: Awaiting next queue items
