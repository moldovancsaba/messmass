# Board Migration Record — mvp-factory-control to messmass (2026-07-03, corrected 2026-07-04)

Status: Active
Last Updated: 2026-07-04
Canonical: Yes (migration record)
Owner: Product

## Summary

**Final state (verified 2026-07-04):** `moldovancsaba/messmass` holds all and only messmass
work — 84 open issues (79 migrated messmass issues, pre-existing #85–#87, audit follow-ups
#88–#89). `moldovancsaba/mvp-factory-control` holds all and only non-messmass work — 114
open issues (amanoba, amanoba_courses, hatori, factory infrastructure).

## History

1. **2026-07-03:** All 193 open mvp-factory-control issues were copied to messmass
   (#90–#282) per PO direction, and originals were closed with migration comments.
2. **2026-07-04 correction:** The PO clarified that only messmass work belongs in messmass.
   The 114 non-messmass issues were reverted: originals reopened on the mvp board, messmass
   copies closed as `not_planned` with cross-link comments. GitHub does not allow deleting
   issues via the API, so the closed copies remain visible in messmass but are clearly
   marked and inert.
3. During verification, mvp#831–838 ("Report Variants 1/8–8/8") were confirmed as messmass
   work despite carrying no labels; they remain live in messmass as #245–#252.

Migration fidelity for the 79 live messmass issues: title/body verbatim with a provenance
header; labels verbatim plus `product:messmass`.

## Known Limitations

- **Project 8 board attachment and Projects v2 field values (Status, Product, DoD, Agent)
  could not be set via the API.** Attach the messmass issues to
  <https://github.com/users/moldovancsaba/projects/8> via the board UI or its auto-add
  workflow, and re-set fields there; `priority:*` / `type:*` / `dod:*` / `agent:*` labels
  preserve the values.
- Cross-references inside issue bodies still cite original `mvp-factory-control#N` numbers;
  the table below translates them.

## Mapping (original → copy → outcome)

| Original | Copy | Outcome | Title |
|----------|------|---------|-------|
| mvp-factory-control#3 | messmass#90 | reverted to mvp board 2026-07-04 | Multiple courses: enrolment + prerequisites |
| mvp-factory-control#4 | messmass#91 | reverted to mvp board 2026-07-04 | Live sessions |
| mvp-factory-control#5 | messmass#92 | reverted to mvp board 2026-07-04 | AI-powered personalisation |
| mvp-factory-control#6 | messmass#93 | reverted to mvp board 2026-07-04 | Instructor dashboard |
| mvp-factory-control#7 | messmass#94 | reverted to mvp board 2026-07-04 | Mobile app |
| mvp-factory-control#8 | messmass#95 | reverted to mvp board 2026-07-04 | Video lessons |
| mvp-factory-control#9 | messmass#96 | reverted to mvp board 2026-07-04 | Global default certificate |
| mvp-factory-control#10 | messmass#97 | reverted to mvp board 2026-07-04 | Custom certificate library |
| mvp-factory-control#11 | messmass#98 | reverted to mvp board 2026-07-04 | Design A/B test for one key email (e.g. welcome or day-1); variant selection and |
| mvp-factory-control#12 | messmass#99 | reverted to mvp board 2026-07-04 | Mobile: Scope — Document target (React Native/Expo vs PWA-only); offline data an |
| mvp-factory-control#13 | messmass#100 | reverted to mvp board 2026-07-04 | AI: Define adaptive difficulty for assessments (e.g. next question difficulty fr |
| mvp-factory-control#14 | messmass#101 | reverted to mvp board 2026-07-04 | Instructor: Define instructor role (e.g. RBAC); link instructor to courses they  |
| mvp-factory-control#15 | messmass#102 | reverted to mvp board 2026-07-04 | Instructor: Scope instructor admin — which course/lesson/quiz actions they can d |
| mvp-factory-control#17 | messmass#103 | reverted to mvp board 2026-07-04 | MailerLite or ActiveCampaign integration: sync subscribers, send campaign from p |
| mvp-factory-control#18 | messmass#104 | reverted to mvp board 2026-07-04 | Course achievements: Add more leaderboard metrics (e.g. consistency) |
| mvp-factory-control#20 | messmass#105 | reverted to mvp board 2026-07-04 | Mobile: Strengthen service worker and caching for course/lesson content and key  |
| mvp-factory-control#21 | messmass#106 | reverted to mvp board 2026-07-04 | Mobile: If native — repo or prototype for mobile client; auth and API contract a |
| mvp-factory-control#22 | messmass#107 | reverted to mvp board 2026-07-04 | Live: Data model — LiveSession (courseId, scheduledAt, duration, meetingUrl or p |
| mvp-factory-control#23 | messmass#108 | reverted to mvp board 2026-07-04 | Live: API — CRUD for live sessions (admin); list upcoming for a course; optional |
| mvp-factory-control#24 | messmass#109 | reverted to mvp board 2026-07-04 | Live: UI — Show upcoming live sessions on course page; link to meeting; optional |
| mvp-factory-control#25 | messmass#110 | reverted to mvp board 2026-07-04 | Live: Integrate meeting provider (e.g. Zoom, Meet) — link or embed |
| mvp-factory-control#26 | messmass#111 | reverted to mvp board 2026-07-04 | AI: Recommendation source — use assessment results + course progress to suggest  |
| mvp-factory-control#27 | messmass#112 | reverted to mvp board 2026-07-04 | AI: UI — Surface recommendations (e.g. Recommended for you on dashboard or cours |
| mvp-factory-control#28 | messmass#113 | reverted to mvp board 2026-07-04 | Community: Notifications — New reply (in-thread or in group); optional mentions |
| mvp-factory-control#29 | messmass#114 | reverted to mvp board 2026-07-04 | Community: Reactions/likes on posts (reuse pattern: one model/API/component, dis |
| mvp-factory-control#30 | messmass#115 | reverted to mvp board 2026-07-04 | Community: Moderation tools — Bulk actions, report queue |
| mvp-factory-control#31 | messmass#116 | reverted to mvp board 2026-07-04 | Community: Moderation tools — Bulk actions, report queue |
| mvp-factory-control#32 | messmass#117 | reverted to mvp board 2026-07-04 | Instructor: UI — Instructor view of My courses and course builder (reuse admin p |
| mvp-factory-control#33 | messmass#118 | reverted to mvp board 2026-07-04 | Video: Data model — Lesson supports video URL or embed (e.g. videoUrl, provider) |
| mvp-factory-control#34 | messmass#119 | reverted to mvp board 2026-07-04 | Video: UI — Render video in lesson viewer; optional in-lesson quiz component and |
| mvp-factory-control#35 | messmass#120 | reverted to mvp board 2026-07-04 | Video: Email — Lesson email can link to Watch video or in-platform lesson; no vi |
| mvp-factory-control#41 | messmass#121 | **live in messmass** | Table Chart Height Control (Per-Block / Per-Chart) |
| mvp-factory-control#42 | messmass#122 | **live in messmass** | Performance Optimization Pass |
| mvp-factory-control#43 | messmass#123 | **live in messmass** | Audit Automation &amp; Guardrails |
| mvp-factory-control#44 | messmass#124 | **live in messmass** | Advanced Analytics &amp; Insights Platform (Q1-Q2 2026) |
| mvp-factory-control#48 | messmass#125 | **live in messmass** | Report Content Slots Management |
| mvp-factory-control#49 | messmass#126 | **live in messmass** | Variables System Enhancements (Admin + Reporting) |
| mvp-factory-control#50 | messmass#127 | **live in messmass** | Style System Hardening (Phase 4-6) |
| mvp-factory-control#51 | messmass#128 | **live in messmass** | Search &amp; Paging Unification |
| mvp-factory-control#52 | messmass#129 | **live in messmass** | Bitly Search Enhancements |
| mvp-factory-control#53 | messmass#130 | **live in messmass** | Partner-Level Analytics Dashboard (follow-up work) |
| mvp-factory-control#54 | messmass#131 | **live in messmass** | Bitly Analytics Export &amp; Reporting |
| mvp-factory-control#55 | messmass#132 | **live in messmass** | Variable System Enhancement |
| mvp-factory-control#60 | messmass#133 | **live in messmass** | Milestone: Analytics Platform Phase 4 — Reporting &amp; Exports (Q2 2026) |
| mvp-factory-control#61 | messmass#134 | **live in messmass** | Page Styles System Enhancements |
| mvp-factory-control#62 | messmass#135 | **live in messmass** | CSV and Visualization Enhancement |
| mvp-factory-control#63 | messmass#136 | **live in messmass** | Admin Productivity Enhancements |
| mvp-factory-control#64 | messmass#137 | **live in messmass** | Report Template Management (Rename / Copy / Delete) |
| mvp-factory-control#66 | messmass#138 | **live in messmass** | Move Messmass release notes into Messmass wiki by ISO UTC date |
| mvp-factory-control#67 | messmass#139 | **live in messmass** | Variable Management Guide (P2 2.3) |
| mvp-factory-control#72 | messmass#140 | **live in messmass** | Style hardening Phase 5: consolidate duplicated CSS |
| mvp-factory-control#73 | messmass#141 | **live in messmass** | Style hardening Phase 6: Atlas-managed theme injection plan |
| mvp-factory-control#100 | messmass#142 | reverted to mvp board 2026-07-04 | Amanoba: Migrate board Agent assignments to runtime-valid keys (Gwen/Chappie) |
| mvp-factory-control#105 | messmass#143 | reverted to mvp board 2026-07-04 | Portable cross-repo references standard |
| mvp-factory-control#109 | messmass#144 | reverted to mvp board 2026-07-04 | Lesson quiz governance #9: migration/backfill + conflict reporting |
| mvp-factory-control#226 | messmass#145 | reverted to mvp board 2026-07-04 | Connect and merge identified conversations into contact feed to have unified flo |
| mvp-factory-control#227 | messmass#146 | reverted to mvp board 2026-07-04 | Show latest channel next to contact name |
| mvp-factory-control#230 | messmass#147 | reverted to mvp board 2026-07-04 | Add Agent Training &amp; Annotation Settings UI |
| mvp-factory-control#232 | messmass#148 | reverted to mvp board 2026-07-04 | Capture accepted/refined agent suggestions as Annotations |
| mvp-factory-control#233 | messmass#149 | reverted to mvp board 2026-07-04 | Add Agent Training &amp; Annotation Settings UI |
| mvp-factory-control#259 | messmass#150 | reverted to mvp board 2026-07-04 | {hatori}: Phase 1 — PKS governance complete |
| mvp-factory-control#260 | messmass#151 | reverted to mvp board 2026-07-04 | {hatori}: Phase 2 — Ingestion + retrieval (offline-first RAG) |
| mvp-factory-control#261 | messmass#152 | reverted to mvp board 2026-07-04 | {hatori}: Phase 3 — Agent runtime loop |
| mvp-factory-control#262 | messmass#153 | reverted to mvp board 2026-07-04 | {hatori}: Phase 4 — LLM-swappable model adapter |
| mvp-factory-control#263 | messmass#154 | reverted to mvp board 2026-07-04 | {hatori}: Phase 5 — Ops, security, resilience |
| mvp-factory-control#264 | messmass#155 | reverted to mvp board 2026-07-04 | {hatori}: Phase 6 — Interactive POC loop (Sprint 04) |
| mvp-factory-control#266 | messmass#156 | reverted to mvp board 2026-07-04 | {hatori}: A2 Conflict handling |
| mvp-factory-control#267 | messmass#157 | reverted to mvp board 2026-07-04 | {hatori}: A3 Memory Patch enforcement |
| mvp-factory-control#268 | messmass#158 | reverted to mvp board 2026-07-04 | {hatori}: B1 Explicit negative feedback |
| mvp-factory-control#269 | messmass#159 | reverted to mvp board 2026-07-04 | {hatori}: B2 Implicit positive feedback |
| mvp-factory-control#270 | messmass#160 | reverted to mvp board 2026-07-04 | {hatori}: C1 Artefact registry |
| mvp-factory-control#271 | messmass#161 | reverted to mvp board 2026-07-04 | {hatori}: C2 Chunking + embedding |
| mvp-factory-control#272 | messmass#162 | reverted to mvp board 2026-07-04 | {hatori}: D1 Ask pipeline |
| mvp-factory-control#273 | messmass#163 | reverted to mvp board 2026-07-04 | {hatori}: D2 Verification ladder |
| mvp-factory-control#274 | messmass#164 | reverted to mvp board 2026-07-04 | {hatori}: E1 Golden tests |
| mvp-factory-control#275 | messmass#165 | reverted to mvp board 2026-07-04 | {hatori}: F1 Chat screen (`/chat`) |
| mvp-factory-control#276 | messmass#166 | reverted to mvp board 2026-07-04 | {hatori}: F2 Assistant feedback controls |
| mvp-factory-control#277 | messmass#167 | reverted to mvp board 2026-07-04 | {hatori}: F3 Gated promotion actions |
| mvp-factory-control#278 | messmass#168 | reverted to mvp board 2026-07-04 | {hatori}: G1 Upload route (`/upload`) |
| mvp-factory-control#279 | messmass#169 | reverted to mvp board 2026-07-04 | {hatori}: G2 Search over uploaded artefacts |
| mvp-factory-control#363 | messmass#170 | reverted to mvp board 2026-07-04 | Hatori API crashes on missing is_greeting_only attribute |
| mvp-factory-control#364 | messmass#171 | reverted to mvp board 2026-07-04 | Hatori Chat API returns stub errors instead of clean UX when Ollama is unreachab |
| mvp-factory-control#365 | messmass#172 | reverted to mvp board 2026-07-04 | Hatori greeting-only prompts trigger multiple clarifying questions in Hungarian |
| mvp-factory-control#366 | messmass#173 | reverted to mvp board 2026-07-04 | {hatori}: Remove hardcoded/baked-in messages from UI (e.g. brew commands) |
| mvp-factory-control#427 | messmass#174 | reverted to mvp board 2026-07-04 | {hatori}: API response quality |
| mvp-factory-control#443 | messmass#175 | reverted to mvp board 2026-07-04 | [LLD-007] Wiki/docs integration (BookStack or Outline + MCP resources) |
| mvp-factory-control#444 | messmass#176 | reverted to mvp board 2026-07-04 | [LLD-008] Self-improvement policy (scope, approval, rollback, audit) |
| mvp-factory-control#445 | messmass#177 | reverted to mvp board 2026-07-04 | [LLD-009] Theia panels (chat, backlog, runtime, memory) |
| mvp-factory-control#446 | messmass#178 | reverted to mvp board 2026-07-04 | [LLD-010] Provider abstraction (Ollama + MLX, OpenClaw adapter) |
| mvp-factory-control#447 | messmass#179 | reverted to mvp board 2026-07-04 | [{sovereign}] Hybrid orchestrator v1 — PO acceptance |
| mvp-factory-control#504 | messmass#180 | reverted to mvp board 2026-07-04 | amanoba_courses: Idea Bank - Amanoba live compatibility contract for sovereign c |
| mvp-factory-control#505 | messmass#181 | reverted to mvp board 2026-07-04 | amanoba_courses: Idea Bank - Stage-gated sovereign course-creation run model and |
| mvp-factory-control#506 | messmass#182 | reverted to mvp board 2026-07-04 | amanoba_courses: Idea Bank - Research and source-pack pipeline for current knowl |
| mvp-factory-control#507 | messmass#183 | reverted to mvp board 2026-07-04 | amanoba_courses: Idea Bank - Canonical course blueprint and CCS generation pipel |
| mvp-factory-control#508 | messmass#184 | reverted to mvp board 2026-07-04 | amanoba_courses: Idea Bank - Lesson generation engine with language-pure source- |
| mvp-factory-control#509 | messmass#185 | reverted to mvp board 2026-07-04 | amanoba_courses: Idea Bank - Quiz generation engine with SSOT application-first  |
| mvp-factory-control#510 | messmass#186 | reverted to mvp board 2026-07-04 | amanoba_courses: Idea Bank - Human approval workspace for accept update delete c |
| mvp-factory-control#511 | messmass#187 | reverted to mvp board 2026-07-04 | amanoba_courses: Idea Bank - QC top-priority injection and final draft-to-live p |
| mvp-factory-control#512 | messmass#188 | reverted to mvp board 2026-07-04 | amanoba_courses: Idea Bank - Audit trail provenance rollback and promotion contr |
| mvp-factory-control#513 | messmass#189 | reverted to mvp board 2026-07-04 | amanoba_courses: Idea Bank - Sovereign course creator end-to-end delivery progra |
| mvp-factory-control#747 | messmass#190 | reverted to mvp board 2026-07-04 | {meta} P1: Add {trinity} as a first-class Product option on MVP Factory Board |
| mvp-factory-control#748 | messmass#191 | reverted to mvp board 2026-07-04 | Amanoba ideabank: AI conversation coach with roleplay and video practice |
| mvp-factory-control#749 | messmass#192 | reverted to mvp board 2026-07-04 | Amanoba ideabank: targeted practice hub for mistakes, listening, speaking, and r |
| mvp-factory-control#751 | messmass#193 | reverted to mvp board 2026-07-04 | Amanoba ideabank: collaborative friend quests and accountability challenges |
| mvp-factory-control#753 | messmass#194 | reverted to mvp board 2026-07-04 | Amanoba ideabank: learner skill evaluations and diagnostic starting points |
| mvp-factory-control#754 | messmass#195 | reverted to mvp board 2026-07-04 | Amanoba ideabank: role-based guided learning paths with milestones |
| mvp-factory-control#755 | messmass#196 | reverted to mvp board 2026-07-04 | Amanoba ideabank: mastery-based progression with skip-ahead and reinforcement lo |
| mvp-factory-control#756 | messmass#197 | reverted to mvp board 2026-07-04 | Amanoba ideabank: guided projects in preconfigured environments |
| mvp-factory-control#757 | messmass#198 | reverted to mvp board 2026-07-04 | Amanoba ideabank: instructor-authored guided project builder |
| mvp-factory-control#758 | messmass#199 | reverted to mvp board 2026-07-04 | Amanoba ideabank: virtual lab and coding workspace environments |
| mvp-factory-control#759 | messmass#200 | reverted to mvp board 2026-07-04 | Amanoba ideabank: downloadable exercise files and companion materials |
| mvp-factory-control#760 | messmass#201 | reverted to mvp board 2026-07-04 | Amanoba ideabank: short-form nano tips, audio, and text learning formats |
| mvp-factory-control#761 | messmass#202 | reverted to mvp board 2026-07-04 | Amanoba ideabank: professional certificate tracks with on-platform assessments |
| mvp-factory-control#762 | messmass#203 | reverted to mvp board 2026-07-04 | Amanoba ideabank: external certification exam prep paths and practice exams |
| mvp-factory-control#763 | messmass#204 | reverted to mvp board 2026-07-04 | Amanoba ideabank: credential sharing and profile-ready achievement exports |
| mvp-factory-control#764 | messmass#205 | reverted to mvp board 2026-07-04 | Amanoba ideabank: goal-based recommendation engine tied to labor-market skill si |
| mvp-factory-control#765 | messmass#206 | reverted to mvp board 2026-07-04 | Amanoba ideabank: learning analytics dashboards for adoption and engagement |
| mvp-factory-control#766 | messmass#207 | reverted to mvp board 2026-07-04 | Amanoba ideabank: granular cohort and learner-segment reporting |
| mvp-factory-control#767 | messmass#208 | reverted to mvp board 2026-07-04 | Amanoba ideabank: content ratings and review sentiment for learning effectivenes |
| mvp-factory-control#768 | messmass#209 | reverted to mvp board 2026-07-04 | Amanoba ideabank: offline-first mobile learning with sync-safe progress |
| mvp-factory-control#769 | messmass#210 | reverted to mvp board 2026-07-04 | Amanoba ideabank: mobile engagement analytics and app usage insight |
| mvp-factory-control#772 | messmass#211 | reverted to mvp board 2026-07-04 | Amanoba ideabank: scenario-based simulations and side quests |
| mvp-factory-control#784 | messmass#212 | **live in messmass** | Unified Sponsorship Performance Hub |
| mvp-factory-control#785 | messmass#213 | **live in messmass** | AI Sponsor Asset Detection and Classification |
| mvp-factory-control#786 | messmass#214 | **live in messmass** | Explainable Sponsorship Valuation Engine |
| mvp-factory-control#787 | messmass#215 | **live in messmass** | Sponsorship Inventory Manager |
| mvp-factory-control#788 | messmass#216 | **live in messmass** | Partner Activation and Proof-of-Performance Workspace |
| mvp-factory-control#789 | messmass#217 | **live in messmass** | Sponsorship Proposal Evaluator and Negotiation Guide |
| mvp-factory-control#790 | messmass#218 | **live in messmass** | Sponsorship Benchmarking by Market, Category, and Asset Type |
| mvp-factory-control#791 | messmass#219 | **live in messmass** | Renewal Risk and Whitespace Opportunity Engine |
| mvp-factory-control#792 | messmass#220 | **live in messmass** | Audience-to-Partner Fit Scoring |
| mvp-factory-control#793 | messmass#221 | **live in messmass** | Matchday Content Ingest and Real-Time Distribution |
| mvp-factory-control#794 | messmass#222 | **live in messmass** | Creator, Athlete, and Photographer Media Collection Pipeline |
| mvp-factory-control#795 | messmass#223 | **live in messmass** | Partner Self-Serve Recap Portal |
| mvp-factory-control#796 | messmass#224 | **live in messmass** | Executive Summary Generator for Reports and Renewals |
| mvp-factory-control#797 | messmass#225 | **live in messmass** | Cross-Event Portfolio Reporting |
| mvp-factory-control#798 | messmass#226 | **live in messmass** | Paid and Organic Campaign Measurement |
| mvp-factory-control#799 | messmass#227 | **live in messmass** | Unified Fan Identity Graph |
| mvp-factory-control#800 | messmass#228 | **live in messmass** | Zero- and First-Party Data Activation Builder |
| mvp-factory-control#801 | messmass#229 | **live in messmass** | Loyalty Hub with Quests, Scan-Ins, and Sponsor Missions |
| mvp-factory-control#802 | messmass#230 | **live in messmass** | Sponsor-Branded Activation Template Library |
| mvp-factory-control#803 | messmass#231 | **live in messmass** | External Stakeholder Access and RBAC Model |
| mvp-factory-control#804 | messmass#232 | **live in messmass** | Sponsorship Data Warehouse and BI Connectors |
| mvp-factory-control#805 | messmass#233 | **live in messmass** | Automated Anomaly and Trend Detection |
| mvp-factory-control#806 | messmass#234 | **live in messmass** | Opportunity Feed for Underperforming Assets and Missing Proof |
| mvp-factory-control#807 | messmass#235 | **live in messmass** | Partnership Lifecycle Workspace |
| mvp-factory-control#808 | messmass#236 | **live in messmass** | Multi-Audience Report Pack Composer |
| mvp-factory-control#815 | messmass#237 | **live in messmass** | UI Refinement Program: IA, workflow simplification, and admin consistency |
| mvp-factory-control#816 | messmass#238 | **live in messmass** | UI Refinement 1/6: Canonical navigation, labels, and route ownership map |
| mvp-factory-control#817 | messmass#239 | **live in messmass** | UI Refinement 2/6: Admin home and analytics entry-point consolidation |
| mvp-factory-control#818 | messmass#240 | **live in messmass** | UI Refinement 3/6: Unified entity action grammar across events, partners, and or |
| mvp-factory-control#819 | messmass#241 | **live in messmass** | UI Refinement 4/6: Reporting setup IA consolidation |
| mvp-factory-control#820 | messmass#242 | **live in messmass** | UI Refinement 5/6: Event and partner setup flow simplification |
| mvp-factory-control#821 | messmass#243 | **live in messmass** | UI Refinement 6/6: Legacy route deprecation, redirect cleanup, and help-system r |
| mvp-factory-control#830 | messmass#244 | **live in messmass** | Report Variants Program: time-period selection and multi-report management |
| mvp-factory-control#831 | messmass#245 | **live in messmass** | Report Variants 1/8: compatibility foundation and virtual default resolver |
| mvp-factory-control#832 | messmass#246 | **live in messmass** | Report Variants 2/8: shared time-period engine and API contract |
| mvp-factory-control#833 | messmass#247 | **live in messmass** | Report Variants 3/8: organization reports workspace and variant list |
| mvp-factory-control#834 | messmass#248 | **live in messmass** | Report Variants 4/8: organization variant editor and duplicate-from-default flow |
| mvp-factory-control#835 | messmass#249 | **live in messmass** | Report Variants 5/8: organization runtime variant resolution and period-scoped r |
| mvp-factory-control#836 | messmass#250 | **live in messmass** | Report Variants 6/8: partner variant rollout |
| mvp-factory-control#837 | messmass#251 | **live in messmass** | Report Variants 7/8: hashtag and filter variant rollout |
| mvp-factory-control#838 | messmass#252 | **live in messmass** | Report Variants 8/8: list-view Reports workflow and editor-action cleanup |
| mvp-factory-control#839 | messmass#253 | **live in messmass** | Design System Remediation Program: authority, enforcement, and UI normalization |
| mvp-factory-control#840 | messmass#254 | **live in messmass** | Design System Remediation 1/7: authority model and repo contract alignment |
| mvp-factory-control#841 | messmass#255 | **live in messmass** | Design System Remediation 2/7: drift freeze and enforcement guardrails |
| mvp-factory-control#842 | messmass#256 | **live in messmass** | Design System Remediation 3/7: shared admin and navigation surface normalization |
| mvp-factory-control#843 | messmass#257 | **live in messmass** | Design System Remediation 4/7: reporting and admin workflow primitive normalizat |
| mvp-factory-control#844 | messmass#258 | **live in messmass** | Design System Remediation 5/7: status badge and semantic state consolidation |
| mvp-factory-control#845 | messmass#259 | **live in messmass** | Design System Remediation 6/7: chart and analytics presentation normalization |
| mvp-factory-control#846 | messmass#260 | **live in messmass** | Design System Remediation 7/7: global CSS and legacy cleanup |
| mvp-factory-control#847 | messmass#261 | **live in messmass** | Analytics Chart UX Benchmark Program: reusable chart composition and filter UX w |
| mvp-factory-control#848 | messmass#262 | **live in messmass** | Analytics Chart UX 1/8: shared KPI card system for analytics surfaces |
| mvp-factory-control#849 | messmass#263 | **live in messmass** | Analytics Chart UX 2/8: shared chart card wrapper and section shell |
| mvp-factory-control#850 | messmass#264 | **live in messmass** | Analytics Chart UX 3/8: shared period and filter toolbar for analytics workspace |
| mvp-factory-control#851 | messmass#265 | **live in messmass** | Analytics Chart UX 4/8: legend, tooltip, and chart summary grammar normalization |
| mvp-factory-control#852 | messmass#266 | **live in messmass** | Analytics Chart UX 5/8: loading, empty, and error state system for analytics vie |
| mvp-factory-control#853 | messmass#267 | **live in messmass** | Analytics Chart UX 6/8: responsive dashboard grid and section layout normalizati |
| mvp-factory-control#854 | messmass#268 | **live in messmass** | Analytics Chart UX 7/8: chart and table composite evidence panels |
| mvp-factory-control#855 | messmass#269 | **live in messmass** | Analytics Chart UX 8/8: rollout benchmark-driven chart UX across live analytics  |
| mvp-factory-control#878 | messmass#270 | reverted to mvp board 2026-07-04 | Amanoba: GDS readiness - pre-upstream local convergence program |
| mvp-factory-control#879 | messmass#271 | reverted to mvp board 2026-07-04 | Amanoba: UI shells - prerender-safe auth public article shell convergence |
| mvp-factory-control#880 | messmass#272 | reverted to mvp board 2026-07-04 | Amanoba: Learner shell - canonical header and route-shell convergence |
| mvp-factory-control#881 | messmass#273 | reverted to mvp board 2026-07-04 | Amanoba: Content rendering - rich prose and article body contract hardening |
| mvp-factory-control#882 | messmass#274 | reverted to mvp board 2026-07-04 | Amanoba: Metrics and states - learner-facing contract completion |
| mvp-factory-control#883 | messmass#275 | reverted to mvp board 2026-07-04 | Amanoba: Access recovery - gated-route and permission state unification |
| mvp-factory-control#884 | messmass#276 | reverted to mvp board 2026-07-04 | Amanoba: Course cards - local variant contract extraction |
| mvp-factory-control#885 | messmass#277 | reverted to mvp board 2026-07-04 | Amanoba: Admin data views - full adapter rollout and mobile safety |
| mvp-factory-control#886 | messmass#278 | reverted to mvp board 2026-07-04 | Amanoba: Interactive learning chrome - quiz and game shell standardization |
| mvp-factory-control#887 | messmass#279 | reverted to mvp board 2026-07-04 | Amanoba: Token governance - server-render and chart theme contract |
| mvp-factory-control#888 | messmass#280 | reverted to mvp board 2026-07-04 | Amanoba: GDS compliance - manifest, exception expiry, and import guard hardening |
| mvp-factory-control#889 | messmass#281 | reverted to mvp board 2026-07-04 | Amanoba: Upstream handoff - proven GDS gaps and escalation packet |
| mvp-factory-control#900 | messmass#282 | reverted to mvp board 2026-07-04 | Amanoba: UI: Learner shell adapter - future LearnerAppShell boundary defined |
