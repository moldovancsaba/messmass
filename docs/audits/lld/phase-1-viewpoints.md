# Phase 1 — Stakeholders, Concerns & the LLD Section Template

Status: Active
Last Updated: 2026-08-14T18:30:00.000Z
Canonical: Yes (phase record)
Owner: Architecture

**Version:** 12.1.55

Phase 1 of `docs/audits/lld-audit-plan-2026-08-14.md`. This decides what the LLD
is *for* before any of it is written. **The section template in §6 is the item
requiring approval** — every sweep phase writes to it, so changing it later
invalidates work already done.

---

## 1. Method

ISO/IEC/IEEE 42010 in the order the standard prescribes: identify stakeholders,
elicit their concerns, then derive viewpoints from concerns — never the reverse.
A viewpoint that answers no stated concern is cut, however standard it is.

This is the discipline that stops the LLD becoming a 128,700-line restatement of
the code. The current document failed in the opposite direction, by documenting
whatever shipped last; the failure mode available to *this* audit is documenting
everything and being read by nobody.

## 2. Stakeholder classes

Grounded in the system's own role model, not invented personas.
`lib/users.ts:18` defines `UserRole = 'guest' | 'user' | 'admin' | 'superadmin' | 'api'`
and `lib/permissions.ts:13` ranks them `guest 0, user 1, api 1, admin 2, superadmin 3`.

| # | Stakeholder | Code grounding | Who they are |
|---|---|---|---|
| S1 | **Report author** | role `user`; `MENU_PERMISSIONS` grants Partners and AI Analytics to `user` (`lib/permissions.ts:28`) | Builds templates, formulas and variants. Decides which variables a report is built on. |
| S2 | **Event operator** | role `admin`; Quick Add, Messages, Partner Activation are `admin`+ | Runs live events and data collection; owns event setup and delivery follow-up. |
| S3 | **Org controller** | role `superadmin`; Organizations is superadmin-only (`lib/permissions.ts:34`) | Controls organisation structure and partner membership. |
| S4 | **Report recipient** | role `guest` (rank 0) and unauthenticated access to `/partner-report/[slug]`, `/organization-report/[id]`, `/report/[slug]`, `/stats/[slug]`; `lib/pagePassword.ts` | The partner or sponsor who opens a link. Sees output only, never the system. |
| S5 | **Machine integrator** | role `api` (rank 1); token auth across 16 `app/api/integrations/**` routes | fanmass and camera. Reads context, writes stats and summaries. Cannot ask a question — it only has the contract. |
| S6 | **Maintainer / on-call** | not a code role; the audience for this document | Diagnoses a broken report at an event, or changes a subsystem years from now. |

S6 has no representation in the codebase and is the stakeholder the current LLD
serves worst. It is weighted accordingly below.

## 3. Concerns

Each concern is a question a stakeholder actually needs answered. Concerns nobody
holds are not listed, and viewpoints exist only to serve what is here.

| ID | Concern | Held by |
|---|---|---|
| C1 | Which variables and data actually populate, and where do they come from? | S1, S2 |
| C2 | If I change this, what else breaks? | S6 |
| C3 | What is the contract at this boundary — inputs, outputs, errors? | S5, S6 |
| C4 | What happens when this fails, and how do I recover it mid-event? | S2, S6 |
| C5 | Who can see or change this data, and where is that enforced? | S3, S4, S6 |
| C6 | Which collection owns this data, and who else writes to it? | S6 |
| C7 | How is this number computed, and can I defend it to a partner? | S1, S2, S4 |
| C8 | What state is this thing in, and what moves it to the next state? | S2, S6 |

## 4. Concern → viewpoint mapping

| Viewpoint | Serves | IEEE 1016 viewpoint |
|---|---|---|
| V1 Context | C2, C3 | Context |
| V2 Interface | C3 | Interface |
| V3 Information | C1, C6 | Information |
| V4 Interaction | C4 | Interaction |
| V5 Trust boundary | C5 | *(not in 1016 — see below)* |
| V6 Algorithm | C7 | Algorithm |
| V7 State dynamics | C8 | State dynamics |
| V8 Failure & recovery | C4 | *(not in 1016 — see below)* |

V5 and V8 are additions to IEEE 1016, made deliberately. 1016 predates the threat
model this system lives in (three separate auth systems, machine tokens, public
report links), and it has no viewpoint for operational recovery — which is C4, the
concern held by the person paged during an event. Both are justified by a stated
concern, which is the test §1 sets.

## 5. Viewpoints deliberately cut

Cutting is the substance of Phase 1. Each of these is a standard IEEE 1016
viewpoint that will **not** appear in the LLD, with the reason.

| Cut | Why |
|---|---|
| **Composition / Structure** | In a Next.js App Router codebase the directory tree *is* the composition, and `docs/architecture.md` already holds C4 L1–L2. A prose restatement would duplicate both and drift from both. |
| **Dependency** | Genuinely needed (C2) but already answered mechanically and always-current by `docs/audits/lld/graphs/entry-point-graph.md`. The LLD links to the generated artefact instead of copying it into prose that goes stale the next merge. |
| **Logical** | The domain model is thin: this system's logic lives in formulas and calculators, which V6 covers directly. A separate logical view would be near-empty ceremony. |
| **Patterns use** | The repo has no formal pattern catalogue. Writing one during an audit would be inventing architecture, which R2 forbids. |
| **Resource** | Serverless runtime on managed MongoDB. There is no resource contention model to describe that would not be speculation. |

## 6. The LLD section template — FOR APPROVAL

Every documented flow uses exactly this shape. Four sections are mandatory; four
are conditional with a mechanical trigger, so whether a section appears is never a
judgement call.

| § | Section | Viewpoint | When |
|---|---|---|---|
| 1 | **Purpose & trigger** | V1 | Always. What the flow is for, who or what starts it, and its boundary. |
| 2 | **Contract** | V2 | Always. Inputs, outputs, error codes, and what callers may rely on. |
| 3 | **Data touched** | V3 | Always. Every collection, the keys written, ownership, and read/write role — linked to the generated matrix. |
| 4 | **Runtime sequence** | V4 | Always. The happy path and at least one failure path, including partial failure. |
| 5 | **Trust boundary** | V5 | If the flow crosses one: authn, authz, input validation, and the STRIDE threats considered. |
| 6 | **Algorithm** | V6 | If the flow contains non-obvious computation — a formula, ranking, projection, or aggregation. |
| 7 | **State model** | V7 | If the flow has a lifecycle with more than two states. |
| 8 | **Failure & recovery** | V8 | If the flow writes data or can leave partial state. What breaks, what it looks like from outside, and how to recover. |
| 9 | **Verification** | — | Always. The R3 evidence: what was executed, and what was observed. Not "tests exist" — what was run during the audit. |
| 10 | **Open findings** | — | Always, even when empty. Links to the findings register. |

Rules that make the template hold its shape:

- **A section is present or explicitly marked "not applicable — <trigger not met>".**
  A silently missing section is indistinguishable from an unexamined one.
- **§9 may never say "verified by reading".** That is R3's entire point.
- **Every factual claim carries a `file:line`.** R1.
- **Prose describes behaviour, not intent.** R2. Quoting a comment is fine; citing
  it as proof of behaviour is not.

## 7. Worked example

The template applied to a real flow, so the shape is reviewable before it is
applied 100+ times. This one is compressed for illustration; a real entry carries
full citations.

> ### Fanmass analysis-summary ingest
>
> **1. Purpose & trigger.** Receives the structured per-event analysis from
> fanmass. Triggered by fanmass after a batch completes. Boundary: fanmass →
> messmass, `POST /api/integrations/fanmass/events/[eventId]/analysis-summary`.
>
> **2. Contract.** Body must carry `contractVersion` starting
> `fanmass.messmass.analytics-summary.v1` (`lib/aiAnalysisSummary.ts:20`). Errors:
> `400 INVALID_SUMMARY` (missing body or version), `409 CONTRACT_MISMATCH`
> (different major), `422 INVALID_EVENT_ID`. Same-major unknown fields are stored
> untouched — the property that let `emotionProjection` reach production with no
> schema change.
>
> **3. Data touched.** Writes one document per event to `ai_analysis_summaries`,
> latest-wins. `receivedAt` is server-assigned and never producer-supplied;
> `generatedAt` is the producer's stamp and informational only. Matrix: 2 refs,
> 1 write, 1 read, no script access.
>
> **4. Runtime sequence.** Token check → event id validation → contract gate →
> size gate (`MAX_SUMMARY_BYTES` 1MB) → upsert. Failure path: any gate throws with
> a status, `handleRouteError` maps it; the stats push is a separate channel and is
> unaffected — the isolation is deliberate, so a summary failure cannot cost the
> event its stats.
>
> **5. Trust boundary.** Yes. `requireFanmassIntegrationAuth`, the same token as
> the stats push. STRIDE: tampering is bounded by the contract and size gates;
> repudiation is why `receivedAt` is server-assigned; denial-of-service is bounded
> by `MAX_SUMMARY_BYTES` because the lists are producer-controlled.
>
> **6. Algorithm.** Not applicable — no computation, storage only.
>
> **7. State model.** Not applicable — latest-wins snapshot, no lifecycle.
>
> **8. Failure & recovery.** A rejected push leaves the previous summary intact.
> Recovery is a re-push from fanmass; no messmass-side repair needed.
>
> **9. Verification.** Executed 2026-08-14: pushed a corrected summary from
> fanmass (`summaryPushed: True`), then read the stored document back directly and
> observed `genderProjection {male 738, female 371, unknown 21}`,
> `ageProjection {youngAdults 966, children 68, adults 29, unknown 67}`,
> `emotionProjection {happy 1076, neutral 32, angry 1, unknown 21}`,
> `smilingPct 96.7`, `receivedAt 2026-08-14T18:31:13.312Z`.
>
> **10. Open findings.** None.

## 8. What this costs

Six of ten sections are typically written per flow (four mandatory, plus §9 and
§10 which are always present; §5–§8 fire on trigger). Against the 643-unit
non-deferred working set, grouped into flows rather than files.

The single largest lever remains the conditional triggers. They are set so that a
pure read path with no computation gets a short entry, and a state-changing flow
across a trust boundary gets a long one — effort follows risk rather than being
spread evenly.

## 9. Phase 1 exit checklist

- [x] Stakeholders grounded in the code's own role model, with citations
- [x] Concerns stated per stakeholder
- [x] Viewpoints derived from concerns, each traceable to at least one
- [x] Cut viewpoints recorded with reasons (§5)
- [x] Section template defined with mechanical triggers (§6)
- [x] Template demonstrated on a real, already-verified flow (§7)
- [ ] **Template approved** ← the gate before Phase 4 begins
