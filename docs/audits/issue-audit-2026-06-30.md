# Issue Audit — 2026-06-30

Status: Active
Last Updated: 2026-06-30
Canonical: No (audit report)
Owner: Product

## Summary

This audit reviews every GitHub issue tracked for `{messmass}` and verifies, issue
by issue, that the work each one claims was actually delivered into the codebase.

Scope reviewed: the **23 issues that physically live in `moldovancsaba/messmass`**
(issue numbers #58–#83). All 23 are **CLOSED / completed** — there are **zero open
issues** in this repository at audit time.

Headline result: **every one of the 23 closed issues has a verifiable code
deliverable in the repository**, and every commit cited in a closure comment is
present in `git` history. No "closed but never built" issue was found.

The findings below are therefore about **process, traceability, and risk to the
already-delivered work** — not about missing features.

> **Access scope note.** This session's GitHub access is scoped to
> `moldovancsaba/messmass` only. The project's own SSOT doc names a separate
> board (GitHub **Project 8**, `github.com/users/moldovancsaba/projects/8`) and,
> in one doc, a separate issue repo (`mvp-factory-control`). Those are **outside
> the audit's reach** — see Finding 2 and Finding 7. This audit covers the 23
> in-repo issues, which is the complete in-repo issue set.

---

## 1. Issue Inventory (23 closed issues)

| # | Title | Closed | Closure evidence | Labels |
|---|-------|--------|------------------|--------|
| 58 | V3 Admin & Designer Alignment (Phase 3) | 2026-03-13 | Narrative comment only, no commit/validation | none |
| 59 | V3 Quantitative Data Migration (Phase 4) | 2026-03-13 | Narrative comment only | none |
| 60 | V3 Legacy Sync Hook & Stability (Phase 5) | 2026-03-13 | Narrative comment only | none |
| 64 | Admin UX: Mobile action contract — shared GDS action rail | 2026-06-24 | Commit `ea9bd63` + full gate list + Vercel Ready | p0, refactor, gds, a11y, mobile |
| 65 | Admin UX: Unified list/card actions — mobile visibility | 2026-06-24 | (cluster of `ea9bd63`) | p0, refactor, gds, a11y, mobile |
| 66 | Admin Entities: Mobile-safe action surface policy | 2026-06-24 | (cluster) | p0, refactor, gds, a11y, mobile |
| 67 | Organizations: Mobile management cards | 2026-06-24 | (cluster) | p0, refactor, gds, a11y, mobile |
| 68 | Admin Workspaces: Custom mobile action surfaces | 2026-06-24 | (cluster) | p1, refactor, gds, a11y, mobile |
| 69 | Quality: Mobile action visibility regression suite | 2026-06-24 | (cluster) | p1, test, validation |
| 70 | Release: Mobile admin action UX gate | 2026-06-24 | (cluster) | p1, validation, docs |
| 71 | Report Variants: Period API contract | 2026-06-24 | Commit `8218de8` + full gate list + Vercel Ready | p0, bug, api, report-variants |
| 72 | Report Variants: Modal select contract | 2026-06-24 | (cluster of `8218de8`) | p0, bug, refactor, report-variants |
| 73 | Report Variants: Create form UX | 2026-06-24 | (cluster) | p0, bug, report-variants |
| 74 | Report Variants: Period data integrity | 2026-06-24 | (cluster) | p1, validation, data-integrity |
| 75 | Report Variants: Period selector regression suite | 2026-06-24 | (cluster) | p1, test, validation |
| 76 | Report Variants: Period selector release gate | 2026-06-24 | (cluster) | p1, validation, docs |
| 77 | Docs: synchronize v12.1.13 release, architecture, LLD | 2026-06-24 | Doc updates | docs |
| 78 | [MF-101] Messmass event context API for Fanmass | 2026-06-26 | Commit `fb5acf2`, `dod:passed` | p0, api, integration |
| 79 | [MF-103] Fanmass link registry and sync state | 2026-06-26 | `dod:passed` | p0, api, integration, ops |
| 80 | [MF-107] Fanmass analytics ingestion / stats namespace | 2026-06-26 | `dod:passed` | p0, api, integration, ops |
| 81 | [MF-108] Report variables / analytics mapping for Fanmass | 2026-06-26 | Commit `cdaab89`, `dod:passed` | p0, api, integration, docs |
| 82 | [MF-109] GDS admin UX for Fanmass sync controls | 2026-06-26 | `dod:passed` | p0, integration, frontend, ops |
| 83 | [MF-111] Cross-project release gate for Fanmass MVP | 2026-06-26 | `dod:passed` | p0, integration, ops, docs |

### Thematic clusters

- **V3 platform migration (Phases 3–5)** — #58, #59, #60
- **Mobile admin action UX / GDS action rail** — #64–#70 (7 issues, one delivery `ea9bd63`)
- **Report-variant period selector reliability** — #71–#76 (6 issues, one delivery `8218de8`)
- **Documentation sync** — #77
- **Fanmass integration MVP (MF-101…MF-111)** — #78–#83 (6 issues)

---

## 2. Delivery Verification (claim → code)

Each closed issue's claimed artifact was located in the working tree. All present:

| Issue(s) | Claimed deliverable | Verified artifact in repo |
|----------|---------------------|---------------------------|
| 58 | `withOrgContext` middleware on admin routes; Designer→V3 | `lib/middleware/v3/orgContext.ts`, `lib/v3/middleware.ts`; applied in `app/api/report-templates/route.ts`, `app/api/v3/**` |
| 59 | V2→V3 metric migration; `V3MetricValue` | `lib/models/v3/{MetricDefinition,MetricValue,MetricThreshold}.ts`; `scripts/v3/migrate-stats-to-metrics.ts` |
| 60 | Bidirectional V2/V3 sync hook; export alignment | `lib/v3/syncEngine.ts`, `lib/v3/reporting/resolver.ts` |
| 64–68 | Shared `AdminActionRail` + adopters | `components/admin/AdminActionRail.tsx` (+ `.module.css`) |
| 69, 75 | Regression suites | `tests/admin-action-rail.test.tsx`, `tests/report-period-validation.test.ts` |
| 71–74 | Period API contract, modal fix, data-integrity audit | `app/api/report-variants/**`; `scripts/audit-report-variant-periods.ts` (`npm run audit:report-variant-periods`) |
| 78 | Event context API (MF-101) | `app/api/integrations/fanmass/events/[eventId]/context/route.ts` |
| 79 | Link registry + sync state (MF-103) | `app/api/integrations/fanmass/events/[eventId]/{link,sync}/route.ts`; `lib/fanmassIntegration.ts` |
| 80, 81 | Analytics ingestion + report variables (MF-107/108) | `lib/fanmassIntegration.ts`; `tests/fanmass-report-variables.test.ts`; commit `cdaab89` |
| 83 | Cross-project release gate (MF-111) | `scripts/verify-fanmass-integration-contracts.ts` (`npm run test:fanmass`) |

Referenced closure commits all resolve in history: `ea9bd63`, `8218de8`,
`fb5acf2`, `cdaab89`.

**Verdict:** No phantom closures. The 23-issue backlog is genuinely delivered.

---

## 3. Findings

### Finding 1 — Release-gate CI cited as DoD was deleted after the issues closed (HIGH)

Commit `38c87cd` ("Remove GitHub Actions workflows", **2026-06-29** — the current
repo HEAD) deleted **all 8** workflows:

```
build.yml · lint.yml · type-check.yml · eval-guard.yml
dependency-guardrail.yml · date-placeholder-guardrail.yml
layout-grammar-guardrail.yml · layout-grammar-tests.yml
```

These are the **exact checks** that the closure comments on #71–#76 (and #64–#70)
present as proof of done — e.g. #71: *"GitHub Actions: Eval Guard, Dependency
Guardrail, Date Placeholder Guardrail, Layout Grammar Test Suite, Layout Grammar
Guardrail, Type Check, Lint, and Build all completed successfully."*

Consequence: the regression suites those issues shipped (period validation,
action-rail visibility, layout grammar) **no longer run automatically** on push or
PR. The release gates that justified closing P0/P1 issues are gone, so a future
change can silently regress delivered work. **Recommend:** restore the workflows
(or an equivalent CI), or record an explicit decision documenting why automated
gating was intentionally removed and what replaces it.

### Finding 2 — The two governance docs disagree on where issues live (MEDIUM)

- `docs/PROJECT_MANAGEMENT.md`: *"SSOT issues repo: `moldovancsaba/mvp-factory-control`"*
  and *"{messmass} issues live in `mvp-factory-control`, not in this product repo."*
- `docs/HANDOVER.md` (newer, 2026-06-25): *"Issues repo: `moldovancsaba/messmass`"*
  and *"Track {messmass} delivery work in `moldovancsaba/messmass`."*

The 23 real issues are in `messmass`, matching the **newer** HANDOVER. So
`PROJECT_MANAGEMENT.md` is stale on its single most important rule (the SSOT
location). Anyone following it would look in the wrong repo. **Recommend:**
update `PROJECT_MANAGEMENT.md` §2 to name `moldovancsaba/messmass` as the issue
SSOT, or explicitly document the mirroring relationship if both repos are in play.

### Finding 3 — Issues closed with unchecked acceptance criteria / DoD (MEDIUM)

Every spec-style issue carries an `## Acceptance Criteria` / DoD checklist of
`- [ ]` items, and these remained **unchecked at close** across the board
(#58–#60 most starkly: their original task lists *and* acceptance checks are all
`[ ]`, closed the same day they were filed via an "SSOT Remediation" template that
simply states `status: Done`). Closure relied on a free-text comment instead of a
completed checklist. This breaks at-a-glance traceability between the stated DoD
and what was verified. **Recommend:** either tick the DoD boxes (or link evidence
per box) before closing, or drop the checkbox template if narrative-comment closure
is the accepted convention — but pick one and apply it consistently.

### Finding 4 — Closure-evidence quality is bimodal (MEDIUM)

- **Weak (March, V3 trio #58–#60):** one-line narrative, **no commit SHA, no
  validation command list, no deploy evidence,** filed-and-closed same day, **no
  labels** (no priority/type/product). Code *does* exist (Finding/§2), so these are
  recoverable, but the issue record alone would not let a reviewer verify them.
- **Strong (June, #64–#83):** commit SHA + explicit gate list (`lint`,
  `type-check`, `test --runInBand`, `style:check`, `gds:sync`, build) + Vercel
  deployment readiness + (Fanmass) a `dod:passed` label.

**Recommend:** backfill #58–#60 with their delivering commit(s) and a one-line
validation note, or annotate them "code-verified 2026-06-30 (this audit)" so the
trail is closed.

### Finding 5 — Label / field taxonomy is inconsistent (LOW)

The June issues use a rich, consistent label set (`priority:p#`, `type:*`,
`product:messmass`, `gds`, `accessibility`, …). The March V3 trio has **no labels
at all**. Per `PROJECT_MANAGEMENT.md` §5, every card should carry `Status`,
`Product`, `Type`, `Priority`. **Recommend:** retro-label #58–#60 (`product:messmass`,
`type:migration`/`refactor`, a priority) for board hygiene and future filtering.

### Finding 6 — "Partial close" pattern on #81 (LOW / informational)

#81 was first commented *"Partially unblocked … remaining acceptance requires
report-template adoption, GDS operator UI, and live E2E"* and only later fully
delivered (`cdaab89`) and closed. The end state is correct, but the intermediate
"partial" status on a still-open issue is the kind of ambiguity §1 of the PM doc
warns against. Informational — flagging the pattern, not a defect.

### Finding 7 — The live board (Project 8) and `mvp-factory-control` are unauditable from here (INFO)

This audit cannot see GitHub **Project 8** board columns/fields or any
`mvp-factory-control` issues, because session GitHub access is scoped to
`moldovancsaba/messmass`. If the canonical roadmap genuinely lives on Project 8
(as both docs state for the *board*), then **board-level status accuracy, ordering,
and any draft/backlog items are out of scope** of this pass. **Recommend:** if a
full board audit is wanted, grant access to `mvp-factory-control` / Project 8 (or
run the audit from a session scoped to them).

### Finding 8 — Untracked code TODOs and minor version drift (LOW)

- Code carries `TODO` markers (e.g. `lib/googleSheets/rowMapper.ts` default-column
  removal, `lib/analyticsCalculator.ts`, `lib/logger.ts`) with **no corresponding
  issue**. With the backlog at zero open issues, this is the only visible
  forward-work signal and it lives only in code. **Recommend:** triage TODOs into
  tracked issues so "0 open" reflects reality.
- `package.json` is `v12.1.16` while `HANDOVER.md`'s baseline still reads
  `v12.1.15`. Minor doc drift; refresh on next handover update.

---

## 4. Recommendations (priority order)

1. **Restore CI or document its removal** (Finding 1) — highest risk to delivered
   work; the regression suites shipped by #69/#75 and the layout/lint/type gates
   need an automated home again.
2. **Fix the SSOT-location contradiction** between `PROJECT_MANAGEMENT.md` and
   `HANDOVER.md` (Finding 2).
3. **Standardize closure discipline** — checked DoD *or* commit-SHA-plus-validation
   comment, applied to every issue (Findings 3 & 4); backfill the V3 trio.
4. **Retro-label #58–#60** and align to the §5 board-field policy (Finding 5).
5. **Triage code TODOs into issues** so the empty backlog is honest (Finding 8).
6. **If board-level audit is required**, extend access to Project 8 /
   `mvp-factory-control` (Finding 7).

---

## 5. Remediation Status (2026-06-30, same-day follow-up)

| Finding | Action taken |
|---------|--------------|
| 1 — CI removed | All 8 workflows restored verbatim from `38c87cd^` on branch `claude/repo-sandbox-issue-audit-1b6wvq`; decision tracked in issue **#88** (restore vs. documented replacement is the PO's call). |
| 2 — SSOT contradiction | `PROJECT_MANAGEMENT.md` §2/§3/§7 updated: issue SSOT is `moldovancsaba/messmass`; `mvp-factory-control` references marked historical. |
| 3/4 — Weak V3 closures | #58, #59, #60 backfilled with code-verification comments naming the verified artifacts and the earliest traceable commit `e7aaf59` (2026-05-21; original delivering commits predate a history rewrite and are not individually traceable). |
| 5 — Missing labels | #58–#60 retro-labeled (`product:messmass`, priority, type). |
| 8 — Untracked TODOs | Tracked in issue **#89**; `HANDOVER.md` baseline synced to `v12.1.16`. |
| 7 — Board access | Unchanged — requires access to Project 8 / `mvp-factory-control`. |

## 6. Audit Method

- Enumerated issues via GitHub MCP (`list_issues`, `search_issues`) over
  `moldovancsaba/messmass`; both open- and all-state queries → 23 issues, all
  `state=closed`, `state_reason=completed`.
- Read every issue body and the closure comments for a representative span of each
  cluster (#58, #60, #64, #71, #81).
- Cross-checked each claimed deliverable against the working tree (component files,
  API routes, scripts, tests) and confirmed every cited commit
  (`ea9bd63`, `8218de8`, `fb5acf2`, `cdaab89`) exists in history.
- Confirmed CI state by inspecting commit `38c87cd` (`git show --stat`).
- Cross-read `docs/PROJECT_MANAGEMENT.md`, `docs/HANDOVER.md`, and
  `docs/NEXT_AGENT_PROMPT.md` for governance/SSOT rules.
