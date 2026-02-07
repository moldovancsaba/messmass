# Operations Action Plan
Status: Active
Last Updated: 2026-02-05
Canonical: Yes
Owner: Operations

**Version:** 1.3.4  
**Created:** 2026-01-12T00:09:33.679Z  
**Last Updated (UTC):** 2026-02-06  
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

1.1 docs/operations/operations-action-plan.md is the single executable TODO and the only long-term memory for execution state.  
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
  - Deliverables:
    - [ ] End-to-end testing & validation (staging + production checklist)
    - [ ] Schema/backward-compat checks (partners/projects with and without Google Sheet fields)
    - [ ] Confirm UUID uniqueness / duplicate detection behavior
    - [ ] (Optional) Create/verify MongoDB indexes for Google Sheets fields (sparse indexes)
    - [ ] Phase 2.5: Auto-provisioning via Drive API (optional follow-up)
  - References:
    - `docs/features/features-google-sheets-integration.md` (canonical feature guide)
    - `docs/archive/_archive/features/archive-delivered-one-offs-pack-2026.md#2026-02-04-google-sheets-partner-sync` (delivered notes; archived)
    - `docs/operations/ops-google-sheets-deployment-checklist.md` (E2E validation checklist)
    - `docs/archive/_archive/migrations/GOOGLE_SHEETS_SCHEMA_UPDATE.md` (historical schema notes; archived)

- [ ] OPS-SEC-01: Production security flag enablement + verification (P0 gate)
  - Status: PLANNED
  - Priority: High
  - Owner: Operations / Security
  - Deliverables:
    - [ ] Confirm all environments updated with rotated secrets (local/dev/preview/prod)
    - [ ] Enable production flag: `ENABLE_BCRYPT_AUTH=true`
    - [ ] Verify all users have `passwordHash` present (or document explicit exception)
    - [ ] Enable production flag: `ENABLE_JWT_SESSIONS=true`
    - [ ] Define legacy token deprecation monitoring plan (measure usage)
    - [ ] Enable production flag: `ENABLE_HTML_SANITIZATION=true`
    - [ ] Smoke test key rendering surfaces (rich text / markdown / report rendering)
  - References:
    - `docs/security/security-overview.md` (canonical)
    - `docs/archive/_archive/audits/AUDIT_REMEDIATION_STATUS.md` (historical tracker; archived)

- [ ] OPS-VAR-01: Variables system hygiene (nightly inventory + legacy filters)
  - Status: PLANNED
  - Priority: Medium
  - Owner: Admin / Reporting
  - Deliverables:
    - [ ] Nightly inventory generation and diff report (source: `/api/variables-config`)
    - [ ] Admin UI filters for legacy `stats.`-prefixed variables (warn-only; no behavior change)
  - References:
    - `docs/archive/_archive/admin/ADMIN_UI_VARIABLE_SYSTEM_ENHANCEMENT.md` (staged plan; archived)

- [ ] OPS-ADMIN-01: Admin layout tokenization + accessibility hardening
  - Status: PLANNED
  - Priority: Low
  - Owner: Admin UX / Frontend
  - Deliverables:
    - [ ] Replace hard-coded sidebar widths with theme tokens (`--mm-sidebar-width`, `--mm-sidebar-width-collapsed`)
    - [ ] Replace hard-coded breakpoints with theme tokens (`--mm-breakpoint-tablet`, `--mm-breakpoint-desktop`) or documented constants
    - [ ] Add tooltips/labels for collapsed sidebar icons
    - [ ] Add skip-to-content link with visible focus styling
    - [ ] Add `aria-current="page"` to active navigation items
    - [ ] Persist sidebar collapse state (SSR-safe storage guards)
    - [ ] Add focus trap behavior for mobile overlay drawer
    - [ ] Add `aria-live` announcement for notification badge updates
  - References:
    - `docs/archive/_archive/admin/admin-layout-code-review-findings-2026-02-05.md` (historical findings; archived)

- [ ] OPS-SEC-02: Code injection hardening follow-ups (P1)
  - Status: PLANNED
  - Priority: Medium
  - Owner: Security / Reporting
  - Deliverables:
    - [ ] Audit for any remaining dynamic evaluation (`Function()`, `eval`, similar)
    - [ ] Run formula evaluator against production-like datasets; capture failure cases
    - [ ] Update dependency allowlist/guardrail config to reflect removal of `expr-eval`
  - References:
    - `docs/archive/_archive/audits/AUDIT_REMEDIATION_STATUS.md` (historical tracker; archived)

- [ ] OPS-SEC-03: Operational hardening (P0/P1)
  - Status: PLANNED
  - Priority: Medium
  - Owner: Operations / Security
  - Deliverables:
    - [ ] Console log removal: remove/replace legacy `console.log` usage; add guardrail to prevent new occurrences
    - [ ] CORS lockdown: replace permissive config with explicit allowlist (prod + preview)
    - [ ] Account lockout policy (5 failed attempts -> 15 min lock; no user-existence leaks)
    - [ ] Role naming standardization (single canonical enum/source; migrate usage)
    - [ ] Add audit logging for auth-sensitive events (login fail/lock/unlock)
  - References:
    - `docs/archive/_archive/audits/AUDIT_REMEDIATION_STATUS.md` (historical tracker; archived)

- [ ] OPS-SEC-04: Security & reliability follow-ups (P1/P2)
  - Status: FUTURE
  - Priority: Low
  - Owner: Operations / Security
  - Deliverables:
    - [ ] Rate limiting policy (explicit strategy, storage, exemptions, and rollout)
    - [ ] Migration tracking system for applied scripts (eliminate “orphaned migrations”)
    - [ ] Security regression tests (auth/session/sanitization/formula safety)
    - [ ] Raise test coverage target for critical paths (define scope + measurement)
    - [ ] Performance optimization plan + measurements (DB queries, caching, hot paths)
  - References:
    - `docs/archive/_archive/audits/AUDIT_REMEDIATION_STATUS.md` (historical tracker; archived)

- [ ] OPS-ANALYTICS-01: Advanced Analytics & Insights (Q1–Q2 2026)
  - Status: PLANNED
  - Priority: High
  - Owner: Product / Engineering
  - Deliverables:
    - [ ] Design and implement analytics aggregation tables (time-bucketed, partner-level; <500ms query target)
    - [ ] Build comparative analytics API (event-to-event, partner-to-partner, period-to-period)
    - [ ] Implement insights/trend detection service (rule-based anomaly and trend detection)
    - [ ] Create dashboard views (executive, marketing, operations, partner)
    - [ ] Add white-label report generation (PDF with branding, report templates)
  - References:
    - `docs/operations/operations-roadmap.md` (Advanced Analytics & Insights Platform, Milestones)

- [ ] OPS-LAYOUT-01: Layout Grammar editor integration
  - Status: PLANNED
  - Priority: High
  - Owner: Reporting / Editor
  - Deliverables:
    - [ ] Integrate Layout Grammar validation into editor save flow (block invalid configs before save)
    - [ ] Add real-time validation feedback in editor UI (warnings/errors for scrolling, truncation, clipping)
    - [ ] Document which configurations are blocked and error messages
    - [ ] (Optional) Add pre-save or CI guardrail for layout violations
  - References:
    - `docs/operations/operations-roadmap.md` (Layout Grammar Editor Integration)
    - `docs/operations/operations-implementation-complete.md` (Explicit Non-Goals)

3.3 **Pre-release checks (run every release):**
- [ ] Build: `npm run build`
- [ ] Layout Grammar guardrail: `npx tsx scripts/check-layout-grammar-guardrail.ts`
- [ ] Type-check: `npm run type-check` (or `tsc --noEmit`)
- [ ] Lint: `npm run lint` (if not skipped in CI)

3.4 **Flaws / errors reference:** Layout Grammar audit and report defects (archived pack) → `docs/archive/_archive/investigations/archive-investigations-pack-2026.md#layout-grammar-audit-2026-02-05`. Rollout validation → [operations-deployment-checklist.md](operations-deployment-checklist.md). Google Sheets E2E → [ops-google-sheets-deployment-checklist.md](ops-google-sheets-deployment-checklist.md). Style system (OPS-STYLE-01 done) → [STYLE_SYSTEM_PHASE5_AUDIT.md](STYLE_SYSTEM_PHASE5_AUDIT.md), [ATLAS_THEME_INJECTION_PLAN.md](ATLAS_THEME_INJECTION_PLAN.md). Admin UI width/hero (OPS-ADMIN-02 done) → [ADMIN_UI_WIDTH_AND_HERO.md](ADMIN_UI_WIDTH_AND_HERO.md).

---

## 4. Reporting System (Action Items)

Owner: Tribeca (Reporting)

*All open work is tracked in Section 3 (Execution Queue). This section is intentionally kept non-duplicative.*

---

## 5. Admin System (Action Items)

Owner: Katja (Admin)

*All open work is tracked in Section 3 (Execution Queue). This section is intentionally kept non-duplicative.*

---

## 6. Cross-System (Action Items)

*All open work is tracked in Section 3 (Execution Queue). This section is intentionally kept non-duplicative.*

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
