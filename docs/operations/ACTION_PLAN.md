# Operations Action Plan
Status: Active
Last Updated: 2026-02-04
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
7. STATE MEMORY (current only)

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
- Do not list completed or DONE items in this file or on the Roadmap; they belong in release notes (docs/archive/_archive/releases/).

---

## 2. Global Dependency Map

2.1 Reporting runtime depends on Admin configuration consistency:
- Report templates
- Styles/themes
- Variables
- Layout schema (LayoutV2)

2.2 LayoutV2 delivery order (dependency order only):
- Reporting Contract + Admin Schema are prerequisites.
- Reporting renderer implementation + regression alignment are prerequisites for Admin authoring integration.
- Reporting supports variable blockAspectRatio for TEXT-AREA/TABLE (4:1–4:10).
- Admin authoring of LayoutV2 incl. optional blockAspectRatio (A-UI-LAYOUT-02.1).
- Contract conformance fixtures (X-LAYOUT-01).

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

3.3 **Pre-release checks (run every release):**
- [ ] Build: `npm run build`
- [ ] Layout Grammar guardrail: `npx tsx scripts/check-layout-grammar-guardrail.ts`
- [ ] Type-check: `npm run type-check` (or `tsc --noEmit`)
- [ ] Lint: `npm run lint` (if not skipped in CI)

3.4 **Flaws / errors reference:** Layout Grammar audit and report defects → `docs/audits/investigations/LAYOUT_GRAMMAR_AUDIT_2026-02-05.md` (or `_archive` if moved). Rollout validation → [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md).

---

## 4. Reporting System (Action Items)

Owner: Tribeca (Reporting)

*No open action items. All Reporting tasks complete.*

---

## 5. Admin System (Action Items)

Owner: Katja (Admin)

*No open action items.*

---

## 6. Cross-System (Action Items)

*No open cross-system action items.*

---

## 7. STATE MEMORY (Current Only)

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
- CURRENT TASK ID: (none)
- STATUS: DONE
- LAST COMMIT(S): (see repo)
- CURRENT BLOCKERS: None
- NEXT EXPECTED OUTPUT: Awaiting next queue items
