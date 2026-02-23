# Operations Action Plan
Status: Active
Last Updated: 2026-02-05
Canonical: Yes
Owner: Operations

**Version:** 1.3.4  
**Created:** 2026-01-12T00:09:33.679Z  
**Last Updated (UTC):** 2026-02-06  
**Audience:** Product + Engineering

**Source of truth:** Project planning and execution now live on the [MVP Factory Board](https://github.com/users/moldovancsaba/projects/1). This file is reference only. Roadmap = Status **Roadmap**; Backlog = not yet broken down; Ready = actionable. Product = **messmass**. Top 5 value/priority items and next step: [operations-delivery-focus.md](operations-delivery-focus.md).

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

- [ ] OPS-SEC-01: Production security flag enablement + verification (P0 gate)
  - Status: PLANNED
  - Priority: High
  - Owner: Operations / Security
  - Deliverables:
    - [ ] Confirm all environments updated with rotated secrets (local/dev/preview/prod)
    - [ ] Enable production flag: `ENABLE_BCRYPT_AUTH=true`
    - [ ] Verify all users have `passwordHash` present (or document explicit exception). Script: `npm run security:check-users-password-hash -- --strict`
    - [ ] If needed, migrate legacy login users (skips apiKeyEnabled users): `npm run security:migrate-users-to-password-hash -- --dry-run`, then re-run without `--dry-run`
    - [ ] Enable production flag: `ENABLE_JWT_SESSIONS=true`
    - [ ] Ensure `JWT_SECRET` is set in production and is >= 32 chars (required when `ENABLE_JWT_SESSIONS=true`)
    - [ ] Define legacy token deprecation monitoring plan (measure usage)
    - [ ] Enable production flag: `ENABLE_HTML_SANITIZATION=true`
    - [ ] Smoke test key rendering surfaces (rich text / markdown / report rendering)
  - References:
    - `docs/security/security-overview.md` (canonical)
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
  - Status: IN PROGRESS (board: In Progress)
  - Priority: High
  - Owner: Product / Engineering
  - Deliverables:
    - [x] Design and scope: aggregation tables + comparative API + sequencing — see `docs/operations/ops-analytics-01-design.md`
    - [ ] Phase 1 backlog: P1-1 index verification, P1-2 partner-to-partner compare, P1-3 period-to-period compare, P1-4 API docs, P1-5 cron monitoring
    - [ ] Phase 2+: Insights engine, dashboards, white-label (after Phase 1)
  - References:
    - `docs/operations/ops-analytics-01-design.md` (design + Phase 1 backlog)
    - `docs/operations/operations-roadmap.md` (Advanced Analytics & Insights Platform, Milestones)

3.3 **Pre-release checks (run every release):**
- [ ] Build: `npm run build`
- [ ] Layout Grammar guardrail: `npx tsx scripts/check-layout-grammar-guardrail.ts`
- [ ] Type-check: `npm run type-check` (or `tsc --noEmit`)
- [ ] Lint: `npm run lint` (if not skipped in CI)

3.4 **Flaws / errors reference:** Layout Grammar audit and report defects (archived pack) → `docs/archive/_archive/investigations/archive-investigations-pack-2026.md#layout-grammar-audit-2026-02-05`. Rollout validation → [operations-deployment-checklist.md](operations-deployment-checklist.md). Google Sheets E2E → [ops-google-sheets-deployment-checklist.md](ops-google-sheets-deployment-checklist.md). Style system (OPS-STYLE-01 done) → [style-system-phase-5-audit.md](style-system-phase-5-audit.md), [atlas-theme-injection-plan.md](atlas-theme-injection-plan.md). Admin UI width/hero (OPS-ADMIN-02 done) → [admin-ui-width-and-hero.md](admin-ui-width-and-hero.md). Admin layout tokens + a11y (OPS-ADMIN-01 done) → theme tokens, skip link, aria-current, focus trap, aria-live, persisted collapse; see archived [admin-layout-code-review-findings-2026-02-05.md](../archive/_archive/admin/admin-layout-code-review-findings-2026-02-05.md). Variables hygiene (OPS-VAR-01 done) → [variables-hygiene-ops-var-01.md](variables-hygiene-ops-var-01.md) (inventory script + KYC legacy filter). Code injection audit (OPS-SEC-02 done) → [sec-02-code-injection-audit.md](sec-02-code-injection-audit.md); formula tests: `__tests__/formula-engine-production-like.test.ts`; guardrail: expr-eval approved with removal path documented. Operational hardening (OPS-SEC-03) → [sec-03-operational-hardening.md](sec-03-operational-hardening.md) (console guardrail + CORS/lockout/roles/audit plan). Layout Grammar editor (OPS-LAYOUT-01) → validation in save flow + real-time "Layout check" in block modal; blocked configs → [layout-grammar-editor-blocked-configs.md](layout-grammar-editor-blocked-configs.md). Google Sheets (OPS-INT-01) → [ops-google-sheets-deployment-checklist.md](ops-google-sheets-deployment-checklist.md); schema check script: `npm run check:google-sheets-schema`.

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

2026-02-21
- CONTEXT: Style editor preview refresh (v11.59.0) — bar/pie CSS vars, inject on change + after fetch, Value Chain + Landing in preview. Version 11.59.0; release notes, feature docs, MEMORY, brain-dump, handover doc updated.
- PENDING: GitHub project board update (style-editor/landing preview cards if any); npm run build; commit and push to preview.
- NEXT: Run build, commit, push to preview; optionally update board.

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
