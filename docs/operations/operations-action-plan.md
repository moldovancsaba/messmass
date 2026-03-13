# Operations Action Plan
Status: Active
Last Updated: 2026-03-06
Canonical: Yes
Owner: Operations

**Version:** 1.3.7  
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

3.4 **Flaws / errors reference:** Layout Grammar audit and report defects (archived pack) → `docs/archive/_archive/investigations/archive-investigations-pack-2026.md#layout-grammar-audit-2026-02-05`. Rollout validation → [operations-deployment-checklist.md](operations-deployment-checklist.md). Google Sheets E2E → [ops-google-sheets-deployment-checklist.md](ops-google-sheets-deployment-checklist.md). Style system (OPS-STYLE-01 done) → [style-system-phase-5-audit.md](style-system-phase-5-audit.md), [atlas-theme-injection-plan.md](atlas-theme-injection-plan.md). Admin UI width/hero (OPS-ADMIN-02 done) → [admin-ui-width-and-hero.md](admin-ui-width-and-hero.md). Admin layout tokens + a11y (OPS-ADMIN-01 done) → theme tokens, skip link, aria-current, focus trap, aria-live, persisted collapse; see archived [admin-layout-code-review-findings-2026-02-05.md](../archive/_archive/admin/admin-layout-code-review-findings-2026-02-05.md). Variables hygiene (OPS-VAR-01 done) → [variables-hygiene-ops-var-01.md](variables-hygiene-ops-var-01.md) (inventory script + KYC legacy filter). Code injection audit (OPS-SEC-02 done) → [sec-02-code-injection-audit.md](sec-02-code-injection-audit.md); formula tests: `tests/formula-engine-production-like.test.ts`; guardrail: expr-eval approved with removal path documented. Operational hardening (OPS-SEC-03) → [sec-03-operational-hardening.md](sec-03-operational-hardening.md) (console guardrail + CORS/lockout/roles/audit plan). Layout Grammar editor (OPS-LAYOUT-01) → validation in save flow + real-time "Layout check" in block modal; blocked configs → [layout-grammar-editor-blocked-configs.md](layout-grammar-editor-blocked-configs.md). Google Sheets (OPS-INT-01) → [ops-google-sheets-deployment-checklist.md](ops-google-sheets-deployment-checklist.md); schema check script: `npm run check:google-sheets-schema`.

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

2026-03-07
- CONTEXT: Root structure hardening tracked under `mvp-factory-control#359`.
- BOARD: `#359` is the active repository-structure cleanup slice being delivered.
- OPS: audited the project root against runtime/build/test/deploy requirements, removed non-canonical root artifacts, tightened `.gitignore`, and added `docs/root-structure.md` as the canonical top-level structure policy.
- NEXT: run full gates for `11.60.16`, post SSOT evidence on `#359`, then return to the queued work.

2026-03-07
- CONTEXT: Test tree normalization tracked under `mvp-factory-control#358`.
- BOARD: `#358` is the active repository-structure slice being delivered.
- OPS: moved the tracked suites from `__tests__/` into `tests/`, moved LayoutV2 fixtures into `tests/fixtures/layoutV2`, and updated config/workflow/doc references to the new canonical structure.
- NEXT: run full gates for `11.60.15`, post SSOT evidence on `#358`, then return to the queued work.

2026-03-07
- CONTEXT: Final repo visibility cleanup tracked under `mvp-factory-control#357`.
- BOARD: `#357` is the active ops slice being delivered.
- OPS: removed the last root-level local-only artifacts from Git tracking, kept real test assets, and prepared the branch for promotion to `main`.
- NEXT: run full gates for `11.60.14`, post SSOT evidence on `#357`, then promote the cleaned branch into `main`.

2026-03-07
- CONTEXT: Product branding rename tracked under `mvp-factory-control#356`.
- BOARD: `#356` is the active branding slice being delivered.
- BRANDING: exact tracked occurrences of `MessMass` were renamed to `{messmass}` across the repository, while lowercase identifiers and paths remain unchanged.
- NEXT: run full gates for `11.60.13`, post SSOT evidence on `#356`, then continue the queued work.

2026-03-07
- CONTEXT: Repo hygiene cleanup tracked under `mvp-factory-control#355`.
- BOARD: `#355` is the active ops slice being delivered.
- OPS: tightened `.gitignore` and removed local-only tooling, backup, memory, and temp directories from Git tracking so GitHub contains only runtime-essential product files.
- NEXT: run full gates for `11.60.12`, post SSOT evidence on `#355`, then continue the queued work.

2026-03-07
- CONTEXT: README refresh tracked under `mvp-factory-control#354`.
- BOARD: `#354` is the active docs slice being delivered alongside ongoing style-hardening work.
- DOCS: rewrote the top-level README to align with the product-introduction standard used by sibling repos and synced it to current versioning and canonical doc entrypoints.
- NEXT: run full gates for `11.60.11`, post SSOT evidence on `#354`, then continue the queued issue sequence.

2026-03-07
- CONTEXT: Style hardening Phase 5 continues under `mvp-factory-control#72`.
- BOARD: `#72` remains `In Progress (NOW)`.
- DOCS: updated current docs to stop referencing deleted CSS modules and removed stale hardcoded-values inventory rows for files already removed in prior cleanup slices.
- NEXT: run full gates for `11.60.10`, post SSOT evidence, then continue the CSS duplication inventory for the next low-risk slice.

2026-03-07
- CONTEXT: Style hardening Phase 5 continues under `mvp-factory-control#72`.
- BOARD: `#72` remains `In Progress (NOW)`.
- CODE: removed `app/partner-report/[slug]/page.module.OLD.css` and `app/report/[slug]/page.module.OLD.css`, and cleaned the stale archive/audit references to the partner-report/report legacy stylesheets.
- NEXT: run full gates for `11.60.9`, post SSOT evidence, then continue the CSS duplication inventory for the next low-risk slice.

2026-03-06
- CONTEXT: Style hardening Phase 5 continues under `mvp-factory-control#72`.
- BOARD: `#72` remains `In Progress (NOW)`.
- CODE: removed non-canonical backup files from the active app tree: `app/admin/design/Design.module.css.backup`, `app/api/projects/edit/[slug]/route.ts.backup`, and `app/api/public/events/[id]/stats/route.ts.bak`.
- NEXT: run full gates for `11.60.8`, post SSOT evidence, then decide whether the `.OLD.css` report artifacts should be cleaned under `#72` or split into a doc-audit follow-up.

2026-03-06
- CONTEXT: Style hardening Phase 5 continues under `mvp-factory-control#72`.
- BOARD: `#72` remains `In Progress (NOW)`.
- CODE: removed the inactive partners backup page `app/admin/partners/page_old_backup.tsx` and its orphaned stylesheet `app/admin/partners/PartnerManager.module.css`.
- NEXT: run full gates for `11.60.7`, post SSOT evidence, then continue the duplication audit.

2026-03-06
- CONTEXT: Style hardening Phase 5 continues under `mvp-factory-control#72`.
- BOARD: `#72` remains `In Progress (NOW)`.
- CODE: removed dead unreferenced route module `app/api-docs/page.module.css`; `/api-docs` continues to use the shared admin help stylesheet.
- NEXT: run full gates for `11.60.6`, post SSOT evidence, then continue the duplication audit.

2026-03-06
- CONTEXT: Style hardening Phase 5 continues under `mvp-factory-control#72`.
- BOARD: `#72` remains `In Progress (NOW)`.
- CODE: removed dead unreferenced admin modules `app/admin/admin.module.css`, `app/admin/categories/Categories.module.css`, and `app/admin/events/Projects.module.css`.
- NEXT: run full gates for `11.60.5`, post SSOT evidence, then continue the duplication audit.

2026-03-06
- CONTEXT: Style hardening Phase 5 continues under `mvp-factory-control#72`.
- BOARD: `#72` remains `In Progress (NOW)`.
- CODE: removed dead `app/styles/utilities.module.css` after confirming the canonical utility layer is `app/styles/utilities.css` via `app/globals.css`.
- NEXT: run full gates for `11.60.4`, post SSOT evidence, then continue the duplication audit.

2026-03-06
- CONTEXT: Style hardening Phase 5 is active under `mvp-factory-control#72`.
- BOARD: `#72` moved to `In Progress (NOW)`.
- CODE: event and partner editor loading/error styles are consolidated into `app/styles/editor-states.module.css`; duplicated local page CSS modules were removed, and dead unreferenced CSS modules were deleted from `/admin/bitly` and `/partner-report`.
- NEXT: finalize `11.60.3`, post SSOT evidence, then continue with the next duplication target if Phase 5 scope remains open.

2026-03-06
- CONTEXT: New production bugs now tracked under:
  - `mvp-factory-control#349` admin event surfaces must use stored `[totalFans]` consistently
  - `mvp-factory-control#348` partner admin card-view report-edit action must match list view
- BOARD: `#348` and `#349` are active on Project 1 and carry the current hotfix work.
- CODE: `getStoredOrDerivedTotalFans(...)` was introduced for admin fan displays and `/api/projects` fan sorting; partner card-view report-edit action is being aligned to `_id || viewSlug`.
- NEXT: finish validation, bump to `11.60.2`, sync release docs, post SSOT evidence, push, then continue with the next tracked delivery item.

2026-03-06
- CONTEXT: Production hotfix tracking split into two SSOT bug cards:
  - `mvp-factory-control#345` partner report related-event cards must show Total Fans Engaged
  - `mvp-factory-control#346` production delete-project failure path
- BOARD: `#345` is `In Progress (NOW)`; `#346` is `Ready (NEXT)`.
- CODE: hotfix code is already on `landing-overhaul` (`31978dfd6`); remaining work is documentation/version alignment and full evidence capture.
- NEXT: finish docs + version bump to `11.60.1`, run gates, post SSOT evidence, then continue with the next tracked item.

2026-02-24
- CONTEXT: Builder mode (clicker) — all chart types show one input per variable from formulas; valuechain supported; image/table infer from title or chartId when formula empty; overflow fix (card-body, min-width: 0, builder-chart-wrapper); unified card layout (title → chartId → label + [registry name] → input) applied to all builders. Committed and pushed to `landing-overhaul` and **preview**. Build passed. Handover doc, brain-dump, release notes, features docs, delivery-focus, and MEMORY updated.
- PROJECT BOARD: Evidence posted on mvp-factory-control [#49](https://github.com/moldovancsaba/mvp-factory-control/issues/49#issuecomment-3957698585) (Variables System Enhancements). No dedicated Builder card on MVP Factory Board to move.
- NEXT: None pending for this delivery. Future: optional Phase 3–4 in `docs/plan-builder-mode-variable-inputs.md` (shared variable-input component).

2026-02-21
- CONTEXT: Style editor preview refresh (v11.59.0) — bar/pie CSS vars, inject on change + after fetch, Value Chain + Landing in preview. Version 11.59.0; release notes, feature docs, MEMORY, brain-dump, handover doc updated.
- Completed: build, commit, push to preview.

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
