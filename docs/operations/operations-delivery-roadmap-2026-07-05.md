# Delivery Roadmap ({messmass})

Status: Active
Last Updated: 2026-07-05
Canonical: No (planning guidance)
Owner: Product

**Source of truth:** the live board at <https://github.com/users/moldovancsaba/projects/8> and the open issues in <https://github.com/moldovancsaba/messmass>. This file records the recommended delivery ORDER for the 47 open issues after the 2026-07-05 board cleanup, sequenced for the safest path to value.

## Guiding rule (applies to every phase)
- Each phase must pass `.github/workflows/ci.yml` + tests before it lands.
- Any DB change is backup-first (`npm run db:backup`) and dry-run before apply.
- Any visual/CSS change ships behind `npm run style:check` + manual QA.
- Finish and verify before starting the next thing; keep each step independently reversible.

## Phase 0 — Close the open loops (near-zero risk)
Nearly-done work; no dependencies.
- #252 Report Variants list-view / editor-action cleanup → then close umbrella #244
- #212 Unified Sponsorship Hub — review pass → close
- #216 Partner Activation workspace — clear remaining #788 punch-list → close
- #284 Analytics engine — decide seasonality (implement or mark unavailable); rest already shipped → close

## Phase 1 — Retire debt & correctness hazards (before new features touch these areas)
- #140 consolidate duplicated CSS → then #85 retire legacy global-CSS `@imports` + finish styled-jsx (paired; guardrail + visual QA gated; consolidate first, then the riskier global retirement)
- #286 remove legacy migration fallbacks — run the production data audit (dry-run) FIRST, migrate stragglers, then delete (data-integrity: never delete before the audit proves zero dependents)
- #283 Bitly device/browser breakdown storage — needs live Bitly data to implement and verify

## Phase 2 — The one high-risk migration (dedicated, staged effort)
- #87 V2/V3 data-layer consolidation. Biggest latent hazard (two persistence systems at once). Comes after the easy wins, not between features. Requires: full DB backup, feature-flagged read-then-write cutover, a migrate+verify script (same pattern as the 2026-07-05 notification rebuild), and a rollback plan.

## Phase 3 — Actionable feature backlog (value; low–medium risk)
Shared infrastructure first so later work inherits it.
- #128 Search & Paging unification (unlocks consistency across every admin list)
- #121 Table Chart Height Control · #131 Bitly Analytics Export · #130 Partner-Level Analytics depth · #125 Report Content Slots · #134 Page Styles · #135 CSV/Visualization · #126 Variables System (scope first)
- Docs (parallel/anytime): #139 Variable Management Guide, #138 release notes → wiki

## Phase 4 — Turn vague umbrellas into measurable work (governance)
- #122 Performance Optimization Pass — decompose into measured slices before executing
- #133 Analytics Platform Phase 4 milestone — reconcile done vs open
- #124 Advanced Analytics and #136 Admin Productivity — keep as tracking epics; split child slices

## Phase 5 — Sponsorship vision epics (largest, greenfield; dependency-ordered; last)
- Foundations first: #227 Fan Identity Graph → #231 External RBAC (prereq for portals) → #232 Data Warehouse/BI
- Intelligence: #218 Benchmarking → #214 Valuation → #219 Renewal Risk → #220 Fit Scoring → #217 Proposal Evaluator
- Content/activation: #221 Matchday Ingest → #222 Media Pipeline → #230 Templates → #228 Data Activation → #229 Loyalty → #213 AI Detection → #215 Inventory
- Delivery surfaces: #223 Self-Serve Portal (needs #231) · #224 Exec Summary · #225 Portfolio · #234 Opportunity Feed · #235 Lifecycle · #236 Multi-Audience Composer · #226 Campaign Measurement

Quick wins that can be safely pulled forward from Phase 5 for early value:
- #233 Anomaly/Trend Detection — engines already exist in `lib/analytics-anomaly.ts` / `lib/analytics-trends.ts`, just unwired
- #225 Portfolio Reporting — partly present in `lib/sponsorshipHub.ts` (portfolio scope)
- #234 Opportunity Feed — missing-proof detection partly shipped in the activation recap flow

## Why this order is safest
Always finish and verify before starting; remove placeholders and debt (Phase 1) before the risky data migration (Phase 2) so it runs against a clean, understood surface; features (Phase 3) build on unified search/data foundations; expensive greenfield epics (Phase 5) come last, ordered so no epic starts before its prerequisite exists.
