# Low-Level Design — Deep Audit Plan

Status: Active
Last Updated: 2026-08-14T18:30:00.000Z
Canonical: Yes (audit plan)
Owner: Architecture

**Version:** 12.1.55

---

## 1. Why the current LLD cannot simply be "updated"

Measured, not assumed. `docs/low-level-design.md` is 197 lines and documents five
slices: Report Variant Period Selector, Mobile Admin Actions, Comment Maintenance,
Unified Admin Entity Forms, Public Report Shell.

Its own opening sentence is the problem: *"implementation-level contracts for
recently changed high-risk flows."* It is a running log of whatever shipped
recently, not a design description of the system. Three consequences follow:

1. **It is marked `Canonical: No`.** By this repo's own governance
   (`docs/documentation-governance.md`), no topic in it has a single source of
   truth. Nothing in the repo is currently canonical for low-level design.
2. **Its coverage is arbitrary.** It has a section on comment style and none on
   the formula engine, the report calculator, authentication, or the data layer.
3. **"Recently" is stale.** Last content update 2026-06-25. Everything since —
   the AI Analytics subsystem, the Drive ingestion pipeline, the fanmass summary
   contract — is absent.

Appending new sections would preserve all three defects. The document has to be
rebuilt from an audit, which is what this plan describes.

### What the system actually is (measured 2026-08-14)

| Surface | Count | Lines |
|---|---:|---:|
| `app/` | 273 files | 55,009 |
| `lib/` | 210 files | 48,289 |
| `components/` | 111 files | 23,502 |
| `hooks/` | 12 files | 1,898 |
| `tests/` | 37 files | 5,803 |
| `scripts/` | 402 files | 49,627 |
| **API routes** (`route.ts`) | **182** | — |
| **Pages** (`page.tsx`) | **69** | — |
| CSS modules | 110 | — |
| Distinct Mongo collection names referenced | **69** | — |

An LLD covering 5 flows against a 128,700-line application (excluding scripts) is
documenting roughly the surface area of one feature.

---

## 2. Standards this audit is anchored to

Not invented structure. Each standard is used for one specific job, and the job is
named — a standard cited without a job is decoration.

| Standard | Used for |
|---|---|
| **IEEE 1016-2009** (Software Design Descriptions) | The LLD's *structure*. Its design viewpoints — context, composition, logical, dependency, information, interface, interaction, state dynamics, algorithm, resource — become the mandatory subsection set for every documented flow. This is the governing standard for the deliverable. |
| **ISO/IEC/IEEE 42010:2022** (Architecture description) | Justifying *what to document*: identify stakeholders and their concerns first, derive viewpoints from concerns, and document only views that answer a real concern. Prevents an exhaustive-but-useless document. |
| **C4 model** (Brown), Levels 3–4 | The two levels an LLD occupies: Component (L3) and Code (L4). `docs/architecture.md` already covers L1–L2; the LLD must not duplicate it. Sets the boundary between the two documents. |
| **arc42** §5, §6, §8, §9, §11 | Section templates for Building Block View, Runtime View, Crosscutting Concepts, Decisions, Risks — proven prose scaffolding under the IEEE 1016 viewpoints. |
| **ADR** (Nygard) | Every non-obvious decision found during the audit gets a dated, numbered record with context/decision/consequences. The repo currently has **zero** ADRs — verified: no file matching `*adr*` or `*decision*` under `docs/`. |
| **ISO/IEC 25010** (quality model) | The fixed checklist of quality attributes each flow is assessed against, so "is this good" is answered against a taxonomy rather than taste. |
| **OWASP ASVS 4.0** | The verification checklist for the security/trust-boundary viewpoint (authn, authz, session, input validation, secrets). |
| **STRIDE** | Threat enumeration at each trust boundary identified in the audit. |
| **Tornhill, behavioural code analysis** | Prioritisation only: churn × blast-radius ranks the traversal order. It never reduces scope — see §4 completeness rule. |

---

## 3. Governing rules (non-negotiable)

These exist because the failure mode of a large audit is confident fiction.

**R1 — Evidence or silence.** Every factual claim in the audit ledger and the
resulting LLD carries a citation: `path/to/file.ts:LINE`, a command with its
output, or a rendered-page observation. A claim with no evidence is deleted, not
softened.

**R2 — Never document intent as behaviour.** A comment saying a function
validates input is evidence of *intent*. Behaviour is established by reading the
implementation or executing it. Where the two disagree, that disagreement is a
finding.

**R3 — Runtime verification for every state-changing flow.** Reading code
establishes what it should do. For any flow that writes data, crosses a trust
boundary, or is user-visible, the audit executes it — against a scratch database
or a fixture route — and records the observed result. This repo has already shown
that type-check, lint and 336 tests pass over a live denominator bug that only
rendering the page exposed.

**R4 — Completeness is accounted for, not asserted.** Every one of the 182 routes,
210 lib modules, 111 components, 69 pages and 68 collection names appears in the
coverage ledger with an explicit disposition: `documented`, `deferred (reason)`,
or `n/a (reason)`. "Audited the important parts" is not an acceptable end state.

**R5 — Findings are separated from design.** The audit produces two distinct
artefacts: the **LLD** (how the system is designed) and the **findings register**
(where it is wrong, risky, or drifting). A defect discovered mid-audit is logged
and the traversal continues; it is not fixed inline, because an audit that becomes
a refactor stops being an audit.

**R6 — No fixes land inside the audit branch.** Findings become issues on the
board to the GDS #81 standard. This keeps the audit reviewable as a document.

---

## 4. Prioritisation input (already computed)

Churn over the last 12 months, code files only. This sets traversal *order* under
R4; it does not shrink scope.

| Commits | File |
|---:|---|
| 85 | `app/report/[slug]/ReportChart.tsx` |
| 79 | `app/admin/visualization/page.tsx` |
| 67 | `components/ChartAlgorithmManager.tsx` |
| 63 | `app/admin/partners/page.tsx` |
| 53 | `app/report/[slug]/ReportContent.tsx` |
| 51 | `components/DynamicChart.tsx` |
| 50 | `components/EditorDashboard.tsx` |
| 47 | `components/UnifiedDataVisualization.tsx` |
| 44 | `app/admin/design/page.tsx` |
| 41 | `app/admin/projects/ProjectsPageClient.tsx` |

Largest `lib` modules by line count, as a complexity proxy:
`sponsorshipHub.ts` (1,432), `formulaEngine.ts` (1,325), `chartCalculator.ts`
(962), `dataValidator.ts` (931), `analytics-aggregator.ts` (760),
`report-calculator.ts` (726).

The report/chart pipeline dominates both lists. It is Phase 2.

---

## 5. Phase plan

Ten phases. Each has fixed inputs, a defined method, and a deliverable that can be
reviewed independently. Phases 2–8 are the domain sweeps and share one method,
defined once in §6.

### Phase 0 — Instrumentation and the coverage ledger

Build the machinery before auditing anything, so completeness is mechanical rather
than remembered.

- Generate the full inventory: every route, page, lib module, component, hook,
  collection reference, test file, and npm script, with line counts and last-commit
  dates. Committed as `docs/audits/lld/ledger.csv`.
- Build the **route → handler → lib → collection** call graph by static analysis,
  so orphaned code and undocumented data paths surface by construction.
- Build the **collection → writer/reader** matrix across `app`, `lib` and
  `scripts`.
- Stand up a disposable Mongo instance and a seed script, so R3 runtime
  verification has somewhere safe to run.

**Deliverable:** `ledger.csv` (every unit, disposition `pending`), the call graph,
the collection matrix, and a reproducible environment.
**Exit criterion:** ledger row count equals the measured unit counts in §1.

### Phase 1 — Stakeholders, concerns, and viewpoint selection (ISO 42010)

Decide what the LLD is *for* before writing any of it. Named stakeholder classes
with their actual concerns — operator, report author, integrator (fanmass/camera),
partner-facing viewer, on-call engineer, future maintainer — each mapped to the
questions the LLD must answer for them. Viewpoints not answering a stated concern
are cut.

**Deliverable:** viewpoint specification + the LLD's fixed section template, both
reviewed and approved **before** Phase 2 starts.
**Why this gates the rest:** without it the audit produces 128,700 lines of
description that nobody reads.

### Phase 2 — Report & chart pipeline

Highest churn, highest complexity, and the product's core value path.
`formulaEngine` → `ReportCalculator` → `chartCalculator` → `DynamicChart`, plus
template hierarchy resolution, layout grammar, and the public report shell.

### Phase 3 — Data layer and the collection surface

All 69 collection names: owner, schema-in-practice (sampled, not assumed),
indexes, write paths, and lifecycle. This phase resolves the drift already
surfaced in §8.

### Phase 4 — Authentication, authorisation, and trust boundaries

The three separate systems — admin session, page passwords, machine tokens — plus
CSRF. Audited against OWASP ASVS, with STRIDE enumeration per boundary. This phase
is not churn-prioritised; it is done early because a finding here changes the risk
posture of every later phase.

### Phase 5 — Integration boundaries

fanmass (both channels), camera, Drive ingestion, Bitly, Google Sheets,
sports/football data, webhooks, cron. Contract versioning, retry/timeout policy,
failure isolation, and idempotency for each.

### Phase 6 — Admin surfaces and the entity system

32 admin routes, the unified entity/form/list/card system, the adapter layer, and
the navigation/permission model.

### Phase 7 — Analytics and AI Analytics

22 analytics routes, the aggregation and insights engines, and the AI Analytics
read model. Partly documented already (v12.1.54); this phase verifies that
documentation against code rather than trusting it.

### Phase 8 — Cross-cutting concerns (arc42 §8)

Error handling, logging/observability, caching and invalidation, configuration and
secrets, the design-token/styling contract, accessibility, and internationalisation
posture. Each documented once, centrally, rather than repeated per flow.

### Phase 9 — Synthesis: write the LLD

Assemble from the ledger. Every section traces to evidence rows. Anything without
evidence does not get written.

### Phase 10 — Verification and governance close-out

- Independent re-verification of a random sample of ledger claims (target: 10%),
  by re-executing the cited commands. A sample failure rate above a pre-agreed
  threshold invalidates the phase and it is redone.
- Full CI gate: `type-check`, `lint`, `test`, `style:check`, `version:verify`,
  `docs:audit`, both guardrails, `build` (per `.github/workflows/ci.yml`).
- Doc governance: `docs_inventory`, `docs_triage`, `docs_link_check`,
  `docs_canonical_map` all clean.
- Flip `docs/low-level-design.md` to `Canonical: Yes`, and merge-then-delete the
  superseded material per the governance merge rule.

---

## 6. The per-unit method (Phases 2–8)

Applied identically to every flow, so output is comparable across phases. This is
the "bit by bit" loop, extending the repo's existing
*Investigate → Document → Fix → Verify → Report* playbook with an explicit
verification obligation.

For each flow:

1. **Delimit** — entry points, exits, and every file involved. Mark those files in
   the ledger.
2. **Read completely** — the whole implementation, not the parts that look
   relevant. Note invariants, error paths, and every branch.
3. **Trace the data** — what is read, what is written, which collection, under
   which key, and what happens on partial failure.
4. **Identify the contract** — inputs, outputs, error codes, and what callers are
   entitled to rely on.
5. **Execute it (R3)** — against the scratch DB or a fixture route. Record the
   observed behaviour, including at least one failure case.
6. **Compare** — behaviour vs. comments vs. existing docs vs. tests. Every
   divergence is a finding.
7. **Assess** — against ISO 25010 attributes and, at trust boundaries, ASVS/STRIDE.
8. **Record** — one LLD section under the IEEE 1016 viewpoints; findings to the
   register; decisions to ADRs.
9. **Update the ledger** — disposition and evidence pointer.

**Definition of done for a unit:** every file marked, contract stated with
citations, at least one executed verification recorded, findings logged, ledger
updated. Anything less leaves the unit `pending`.

---

## 7. Deliverables

| Artefact | Path | Purpose |
|---|---|---|
| Coverage ledger | `docs/audits/lld/ledger.csv` | Mechanical proof of completeness (R4) |
| Evidence log | `docs/audits/lld/evidence/<phase>.md` | Every claim's citation and command output |
| Findings register | `docs/audits/lld/findings.md` | Defects, drift, risks — with severity |
| ADRs | `docs/adr/NNNN-*.md` | Decisions discovered or made; currently zero exist |
| Call graph + collection matrix | `docs/audits/lld/graphs/` | Generated, regenerable |
| **The LLD** | `docs/low-level-design.md` | The deliverable, `Canonical: Yes` |
| Board issues | GitHub Project 8 | Remediation, GDS #81 standard, never fixed inline (R6) |

---

> **Correction (Phase 0, 2026-08-14):** this plan was drafted with grep and stated
> 68 collection names. The verified figure is **69**. grep missed 70 references of
> the form `db.collection<T>('name')` and invented a `categories` collection that
> exists only inside a documentation string. See
> `docs/audits/lld/phase-0-evidence.md` §2. Figures above are corrected; the
> episode is itself the argument for rule R1.

## 8. Signals already surfaced while scoping this plan

Found in roughly twenty minutes of measurement. Recorded here as evidence that the
audit has a real target, and as Phase 3's first inputs. **Each is a candidate
requiring Phase 3 verification** — the divergences are confirmed to exist in code;
their runtime impact is not yet established.

**Collection-name drift in the chart domain.** Four distinct names are used as
Mongo collections. Mongo collection names are case-sensitive, so these are four
different collections, not aliases:

| Name | Files | Where |
|---|---:|---|
| `chart_configurations` | 105 | the dominant, presumed-real one |
| `chartConfigurations` | 8 | includes **live app code**: `app/api/content-assets/usage/route.ts:52` |
| `chart_configs` | 2 | migration scripts only |
| `chartconfigurations` | 1 | `scripts/drop-lowercase.js` — an intentional cleanup script |

The live-code instance is the one that matters: a production route queries a
collection name no other route writes to. Whether it returns stale data, empty
results, or is harmless is exactly what Phase 3 must establish.

**Comparable drift elsewhere**, each to be resolved in Phase 3:
`users` / `admin_users` / `local_users`; `reports` / `reports_v12`;
`variablesGroups` / `variables_groups`; `pageStyles` / `page_styles_enhanced`;
`bitly_link_project_junction` / `bitly_project_links`;
`chart_algorithms` / `chart_algorithms_backup`.

**Zero ADRs exist.** Every architectural decision in this repo is currently
recoverable only from commit messages, code comments, or the half-changelog in
`docs/architecture.md`.

**Test-to-code ratio.** 37 test files against 594 source files across
`app`/`lib`/`components`. Not a defect on its own, but it means the audit cannot
lean on tests as evidence of behaviour — R3 exists because of this.

---

## 9. Effort, sequencing, and honesty about scale

This is a multi-session programme, not a single pass. Roughly 640 units require
disposition. At genuine depth — read fully, execute, verify, record — the sweep
phases are the bulk of the work.

Proposed sequencing with review gates:

1. **Phase 0 + 1 first, and stop.** Instrumentation plus the viewpoint spec. You
   review the LLD's section template before any content is written. Getting this
   wrong wastes every later phase.
2. **Phase 4 next** (auth/trust boundaries), out of churn order, because a
   security finding changes everything downstream.
3. **Phases 2, 3, 5, 6, 7, 8** in that order, each landing its own evidence log
   and findings, each independently reviewable.
4. **Phases 9–10** last.

Each phase lands on its own branch with its own gate run. If the programme is
stopped after any phase, what has landed is complete and correct for its scope —
there is no half-written LLD state.

**Two things that would make this cheaper, if you want them:** narrowing Phase 1's
viewpoint set (fewer viewpoints, less per-unit writing), or accepting
`deferred (low risk)` dispositions for the `scripts/` tree, which is 402 files and
49,627 lines of mostly one-off migrations. My recommendation is to defer `scripts/`
explicitly in the ledger rather than audit it — but that is a scope decision, and
it is yours, not mine.

---

## 10. Risks to the audit itself

| Risk | Mitigation |
|---|---|
| Audit becomes a refactor and never finishes | R5/R6: findings are logged and become issues; no fixes on the audit branch |
| Confident fiction from reading intent instead of behaviour | R1/R2/R3: citations, and execution for every state-changing flow |
| Silent gaps presented as completeness | R4: mechanical ledger, row count checked against measured totals |
| The document is exhaustive but unread | Phase 1 gates on stakeholder concerns; viewpoints without a concern are cut |
| Drift resumes the day after it ships | Phase 10 flips it `Canonical: Yes`; ADRs capture decisions going forward |
| Findings destabilise production if fixed hastily | Severity-ranked register; remediation sequenced separately from the audit |
