# Board Migration Record — mvp-factory-control to messmass (2026-07-03)

Status: Active
Last Updated: 2026-07-03
Canonical: Yes (migration record)
Owner: Product

## Summary

All **193 open issues** on the `moldovancsaba/mvp-factory-control` board were migrated
into `moldovancsaba/messmass` on 2026-07-03, at the Product Owner's direction, so that
all open board work lives in one repository. `mvp-factory-control` now has **0 open
issues**; each original carries a migration comment linking its successor and is closed
as `not_planned`. Closed historical issues remain in `mvp-factory-control` as archive.

Migration fidelity:
- title and body copied verbatim, prefixed with a provenance header linking the original
- labels copied verbatim; the 71 messmass-scoped issues additionally received `product:messmass`
- non-messmass product issues (amanoba, amanoba_courses) keep their original labels
  (`agent:tribeca`, `agent:gwen`, `product:amanoba`, `product:amanoba_courses`) for filtering

## Known Limitations

- **Project 8 board attachment and board fields (Status, Product, DoD, Agent field values)
  could not be carried over via the API.** New issues must be attached to
  <https://github.com/users/moldovancsaba/projects/8> by the board's auto-add workflow or
  manually, and board field values re-set there. Labels preserve priority/type/agent hints.
- Sub-issue / parent relationships (if any existed on the board) are not recreated; program
  issues reference their children by original number in their bodies.
- Cross-references inside issue bodies still point at original `mvp-factory-control#N`
  numbers; the mapping below translates them.

## Mapping (original → new)

| Original | New | Title |
|----------|-----|-------|
| mvp-factory-control#3 | messmass#90 | Multiple courses: enrolment + prerequisites |
| mvp-factory-control#4 | messmass#91 | Live sessions |
| mvp-factory-control#5 | messmass#92 | AI-powered personalisation |
| mvp-factory-control#6 | messmass#93 | Instructor dashboard |
| mvp-factory-control#7 | messmass#94 | Mobile app |
| mvp-factory-control#8 | messmass#95 | Video lessons |
| mvp-factory-control#9 | messmass#96 | Global default certificate |
| mvp-factory-control#10 | messmass#97 | Custom certificate library |
| mvp-factory-control#11 | messmass#98 | Design A/B test for one key email (e.g. welcome or day-1); variant selection and track whi |
| mvp-factory-control#12 | messmass#99 | Mobile: Scope — Document target (React Native/Expo vs PWA-only); offline data and sync str |
| mvp-factory-control#13 | messmass#100 | AI: Define adaptive difficulty for assessments (e.g. next question difficulty from last N  |
| mvp-factory-control#14 | messmass#101 | Instructor: Define instructor role (e.g. RBAC); link instructor to courses they own |
| mvp-factory-control#15 | messmass#102 | Instructor: Scope instructor admin — which course/lesson/quiz actions they can do vs admin |
| mvp-factory-control#17 | messmass#103 | MailerLite or ActiveCampaign integration: sync subscribers, send campaign from platform or |
| mvp-factory-control#18 | messmass#104 | Course achievements: Add more leaderboard metrics (e.g. consistency) |
| mvp-factory-control#20 | messmass#105 | Mobile: Strengthen service worker and caching for course/lesson content and key API respon |
| mvp-factory-control#21 | messmass#106 | Mobile: If native — repo or prototype for mobile client; auth and API contract alignment |
| mvp-factory-control#22 | messmass#107 | Live: Data model — LiveSession (courseId, scheduledAt, duration, meetingUrl or provider id |
| mvp-factory-control#23 | messmass#108 | Live: API — CRUD for live sessions (admin); list upcoming for a course; optional enrolment |
| mvp-factory-control#24 | messmass#109 | Live: UI — Show upcoming live sessions on course page; link to meeting; optional calendar  |
| mvp-factory-control#25 | messmass#110 | Live: Integrate meeting provider (e.g. Zoom, Meet) — link or embed |
| mvp-factory-control#26 | messmass#111 | AI: Recommendation source — use assessment results + course progress to suggest next lesso |
| mvp-factory-control#27 | messmass#112 | AI: UI — Surface recommendations (e.g. Recommended for you on dashboard or course page) |
| mvp-factory-control#28 | messmass#113 | Community: Notifications — New reply (in-thread or in group); optional mentions |
| mvp-factory-control#29 | messmass#114 | Community: Reactions/likes on posts (reuse pattern: one model/API/component, discriminator |
| mvp-factory-control#30 | messmass#115 | Community: Moderation tools — Bulk actions, report queue |
| mvp-factory-control#31 | messmass#116 | Community: Moderation tools — Bulk actions, report queue |
| mvp-factory-control#32 | messmass#117 | Instructor: UI — Instructor view of My courses and course builder (reuse admin patterns wi |
| mvp-factory-control#33 | messmass#118 | Video: Data model — Lesson supports video URL or embed (e.g. videoUrl, provider); optional |
| mvp-factory-control#34 | messmass#119 | Video: UI — Render video in lesson viewer; optional in-lesson quiz component and submit |
| mvp-factory-control#35 | messmass#120 | Video: Email — Lesson email can link to Watch video or in-platform lesson; no video in ema |
| mvp-factory-control#41 | messmass#121 | Table Chart Height Control (Per-Block / Per-Chart) |
| mvp-factory-control#42 | messmass#122 | Performance Optimization Pass |
| mvp-factory-control#43 | messmass#123 | Audit Automation &amp; Guardrails |
| mvp-factory-control#44 | messmass#124 | Advanced Analytics &amp; Insights Platform (Q1-Q2 2026) |
| mvp-factory-control#48 | messmass#125 | Report Content Slots Management |
| mvp-factory-control#49 | messmass#126 | Variables System Enhancements (Admin + Reporting) |
| mvp-factory-control#50 | messmass#127 | Style System Hardening (Phase 4-6) |
| mvp-factory-control#51 | messmass#128 | Search &amp; Paging Unification |
| mvp-factory-control#52 | messmass#129 | Bitly Search Enhancements |
| mvp-factory-control#53 | messmass#130 | Partner-Level Analytics Dashboard (follow-up work) |
| mvp-factory-control#54 | messmass#131 | Bitly Analytics Export &amp; Reporting |
| mvp-factory-control#55 | messmass#132 | Variable System Enhancement |
| mvp-factory-control#60 | messmass#133 | Milestone: Analytics Platform Phase 4 — Reporting &amp; Exports (Q2 2026) |
| mvp-factory-control#61 | messmass#134 | Page Styles System Enhancements |
| mvp-factory-control#62 | messmass#135 | CSV and Visualization Enhancement |
| mvp-factory-control#63 | messmass#136 | Admin Productivity Enhancements |
| mvp-factory-control#64 | messmass#137 | Report Template Management (Rename / Copy / Delete) |
| mvp-factory-control#66 | messmass#138 | Move Messmass release notes into Messmass wiki by ISO UTC date |
| mvp-factory-control#67 | messmass#139 | Variable Management Guide (P2 2.3) |
| mvp-factory-control#72 | messmass#140 | Style hardening Phase 5: consolidate duplicated CSS |
| mvp-factory-control#73 | messmass#141 | Style hardening Phase 6: Atlas-managed theme injection plan |
| mvp-factory-control#100 | messmass#142 | Amanoba: Migrate board Agent assignments to runtime-valid keys (Gwen/Chappie) |
| mvp-factory-control#105 | messmass#143 | Portable cross-repo references standard |
| mvp-factory-control#109 | messmass#144 | Lesson quiz governance #9: migration/backfill + conflict reporting |
| mvp-factory-control#226 | messmass#145 | Connect and merge identified conversations into contact feed to have unified flow |
| mvp-factory-control#227 | messmass#146 | Show latest channel next to contact name |
| mvp-factory-control#230 | messmass#147 | Add Agent Training &amp; Annotation Settings UI |
| mvp-factory-control#232 | messmass#148 | Capture accepted/refined agent suggestions as Annotations |
| mvp-factory-control#233 | messmass#149 | Add Agent Training &amp; Annotation Settings UI |
| mvp-factory-control#259 | messmass#150 | {hatori}: Phase 1 — PKS governance complete |
| mvp-factory-control#260 | messmass#151 | {hatori}: Phase 2 — Ingestion + retrieval (offline-first RAG) |
| mvp-factory-control#261 | messmass#152 | {hatori}: Phase 3 — Agent runtime loop |
| mvp-factory-control#262 | messmass#153 | {hatori}: Phase 4 — LLM-swappable model adapter |
| mvp-factory-control#263 | messmass#154 | {hatori}: Phase 5 — Ops, security, resilience |
| mvp-factory-control#264 | messmass#155 | {hatori}: Phase 6 — Interactive POC loop (Sprint 04) |
| mvp-factory-control#266 | messmass#156 | {hatori}: A2 Conflict handling |
| mvp-factory-control#267 | messmass#157 | {hatori}: A3 Memory Patch enforcement |
| mvp-factory-control#268 | messmass#158 | {hatori}: B1 Explicit negative feedback |
| mvp-factory-control#269 | messmass#159 | {hatori}: B2 Implicit positive feedback |
| mvp-factory-control#270 | messmass#160 | {hatori}: C1 Artefact registry |
| mvp-factory-control#271 | messmass#161 | {hatori}: C2 Chunking + embedding |
| mvp-factory-control#272 | messmass#162 | {hatori}: D1 Ask pipeline |
| mvp-factory-control#273 | messmass#163 | {hatori}: D2 Verification ladder |
| mvp-factory-control#274 | messmass#164 | {hatori}: E1 Golden tests |
| mvp-factory-control#275 | messmass#165 | {hatori}: F1 Chat screen (`/chat`) |
| mvp-factory-control#276 | messmass#166 | {hatori}: F2 Assistant feedback controls |
| mvp-factory-control#277 | messmass#167 | {hatori}: F3 Gated promotion actions |
| mvp-factory-control#278 | messmass#168 | {hatori}: G1 Upload route (`/upload`) |
| mvp-factory-control#279 | messmass#169 | {hatori}: G2 Search over uploaded artefacts |
| mvp-factory-control#363 | messmass#170 | Hatori API crashes on missing is_greeting_only attribute |
| mvp-factory-control#364 | messmass#171 | Hatori Chat API returns stub errors instead of clean UX when Ollama is unreachable |
| mvp-factory-control#365 | messmass#172 | Hatori greeting-only prompts trigger multiple clarifying questions in Hungarian |
| mvp-factory-control#366 | messmass#173 | {hatori}: Remove hardcoded/baked-in messages from UI (e.g. brew commands) |
| mvp-factory-control#427 | messmass#174 | {hatori}: API response quality |
| mvp-factory-control#443 | messmass#175 | [LLD-007] Wiki/docs integration (BookStack or Outline + MCP resources) |
| mvp-factory-control#444 | messmass#176 | [LLD-008] Self-improvement policy (scope, approval, rollback, audit) |
| mvp-factory-control#445 | messmass#177 | [LLD-009] Theia panels (chat, backlog, runtime, memory) |
| mvp-factory-control#446 | messmass#178 | [LLD-010] Provider abstraction (Ollama + MLX, OpenClaw adapter) |
| mvp-factory-control#447 | messmass#179 | [{sovereign}] Hybrid orchestrator v1 — PO acceptance |
| mvp-factory-control#504 | messmass#180 | amanoba_courses: Idea Bank - Amanoba live compatibility contract for sovereign course crea |
| mvp-factory-control#505 | messmass#181 | amanoba_courses: Idea Bank - Stage-gated sovereign course-creation run model and checkpoin |
| mvp-factory-control#506 | messmass#182 | amanoba_courses: Idea Bank - Research and source-pack pipeline for current knowledge |
| mvp-factory-control#507 | messmass#183 | amanoba_courses: Idea Bank - Canonical course blueprint and CCS generation pipeline |
| mvp-factory-control#508 | messmass#184 | amanoba_courses: Idea Bank - Lesson generation engine with language-pure source-grounded w |
| mvp-factory-control#509 | messmass#185 | amanoba_courses: Idea Bank - Quiz generation engine with SSOT application-first gates |
| mvp-factory-control#510 | messmass#186 | amanoba_courses: Idea Bank - Human approval workspace for accept update delete checkpoints |
| mvp-factory-control#511 | messmass#187 | amanoba_courses: Idea Bank - QC top-priority injection and final draft-to-live publish gat |
| mvp-factory-control#512 | messmass#188 | amanoba_courses: Idea Bank - Audit trail provenance rollback and promotion controls |
| mvp-factory-control#513 | messmass#189 | amanoba_courses: Idea Bank - Sovereign course creator end-to-end delivery program |
| mvp-factory-control#747 | messmass#190 | {meta} P1: Add {trinity} as a first-class Product option on MVP Factory Board |
| mvp-factory-control#748 | messmass#191 | Amanoba ideabank: AI conversation coach with roleplay and video practice |
| mvp-factory-control#749 | messmass#192 | Amanoba ideabank: targeted practice hub for mistakes, listening, speaking, and review mode |
| mvp-factory-control#751 | messmass#193 | Amanoba ideabank: collaborative friend quests and accountability challenges |
| mvp-factory-control#753 | messmass#194 | Amanoba ideabank: learner skill evaluations and diagnostic starting points |
| mvp-factory-control#754 | messmass#195 | Amanoba ideabank: role-based guided learning paths with milestones |
| mvp-factory-control#755 | messmass#196 | Amanoba ideabank: mastery-based progression with skip-ahead and reinforcement logic |
| mvp-factory-control#756 | messmass#197 | Amanoba ideabank: guided projects in preconfigured environments |
| mvp-factory-control#757 | messmass#198 | Amanoba ideabank: instructor-authored guided project builder |
| mvp-factory-control#758 | messmass#199 | Amanoba ideabank: virtual lab and coding workspace environments |
| mvp-factory-control#759 | messmass#200 | Amanoba ideabank: downloadable exercise files and companion materials |
| mvp-factory-control#760 | messmass#201 | Amanoba ideabank: short-form nano tips, audio, and text learning formats |
| mvp-factory-control#761 | messmass#202 | Amanoba ideabank: professional certificate tracks with on-platform assessments |
| mvp-factory-control#762 | messmass#203 | Amanoba ideabank: external certification exam prep paths and practice exams |
| mvp-factory-control#763 | messmass#204 | Amanoba ideabank: credential sharing and profile-ready achievement exports |
| mvp-factory-control#764 | messmass#205 | Amanoba ideabank: goal-based recommendation engine tied to labor-market skill signals |
| mvp-factory-control#765 | messmass#206 | Amanoba ideabank: learning analytics dashboards for adoption and engagement |
| mvp-factory-control#766 | messmass#207 | Amanoba ideabank: granular cohort and learner-segment reporting |
| mvp-factory-control#767 | messmass#208 | Amanoba ideabank: content ratings and review sentiment for learning effectiveness |
| mvp-factory-control#768 | messmass#209 | Amanoba ideabank: offline-first mobile learning with sync-safe progress |
| mvp-factory-control#769 | messmass#210 | Amanoba ideabank: mobile engagement analytics and app usage insight |
| mvp-factory-control#772 | messmass#211 | Amanoba ideabank: scenario-based simulations and side quests |
| mvp-factory-control#784 | messmass#212 | Unified Sponsorship Performance Hub |
| mvp-factory-control#785 | messmass#213 | AI Sponsor Asset Detection and Classification |
| mvp-factory-control#786 | messmass#214 | Explainable Sponsorship Valuation Engine |
| mvp-factory-control#787 | messmass#215 | Sponsorship Inventory Manager |
| mvp-factory-control#788 | messmass#216 | Partner Activation and Proof-of-Performance Workspace |
| mvp-factory-control#789 | messmass#217 | Sponsorship Proposal Evaluator and Negotiation Guide |
| mvp-factory-control#790 | messmass#218 | Sponsorship Benchmarking by Market, Category, and Asset Type |
| mvp-factory-control#791 | messmass#219 | Renewal Risk and Whitespace Opportunity Engine |
| mvp-factory-control#792 | messmass#220 | Audience-to-Partner Fit Scoring |
| mvp-factory-control#793 | messmass#221 | Matchday Content Ingest and Real-Time Distribution |
| mvp-factory-control#794 | messmass#222 | Creator, Athlete, and Photographer Media Collection Pipeline |
| mvp-factory-control#795 | messmass#223 | Partner Self-Serve Recap Portal |
| mvp-factory-control#796 | messmass#224 | Executive Summary Generator for Reports and Renewals |
| mvp-factory-control#797 | messmass#225 | Cross-Event Portfolio Reporting |
| mvp-factory-control#798 | messmass#226 | Paid and Organic Campaign Measurement |
| mvp-factory-control#799 | messmass#227 | Unified Fan Identity Graph |
| mvp-factory-control#800 | messmass#228 | Zero- and First-Party Data Activation Builder |
| mvp-factory-control#801 | messmass#229 | Loyalty Hub with Quests, Scan-Ins, and Sponsor Missions |
| mvp-factory-control#802 | messmass#230 | Sponsor-Branded Activation Template Library |
| mvp-factory-control#803 | messmass#231 | External Stakeholder Access and RBAC Model |
| mvp-factory-control#804 | messmass#232 | Sponsorship Data Warehouse and BI Connectors |
| mvp-factory-control#805 | messmass#233 | Automated Anomaly and Trend Detection |
| mvp-factory-control#806 | messmass#234 | Opportunity Feed for Underperforming Assets and Missing Proof |
| mvp-factory-control#807 | messmass#235 | Partnership Lifecycle Workspace |
| mvp-factory-control#808 | messmass#236 | Multi-Audience Report Pack Composer |
| mvp-factory-control#815 | messmass#237 | UI Refinement Program: IA, workflow simplification, and admin consistency |
| mvp-factory-control#816 | messmass#238 | UI Refinement 1/6: Canonical navigation, labels, and route ownership map |
| mvp-factory-control#817 | messmass#239 | UI Refinement 2/6: Admin home and analytics entry-point consolidation |
| mvp-factory-control#818 | messmass#240 | UI Refinement 3/6: Unified entity action grammar across events, partners, and organization |
| mvp-factory-control#819 | messmass#241 | UI Refinement 4/6: Reporting setup IA consolidation |
| mvp-factory-control#820 | messmass#242 | UI Refinement 5/6: Event and partner setup flow simplification |
| mvp-factory-control#821 | messmass#243 | UI Refinement 6/6: Legacy route deprecation, redirect cleanup, and help-system rewrite |
| mvp-factory-control#830 | messmass#244 | Report Variants Program: time-period selection and multi-report management |
| mvp-factory-control#831 | messmass#245 | Report Variants 1/8: compatibility foundation and virtual default resolver |
| mvp-factory-control#832 | messmass#246 | Report Variants 2/8: shared time-period engine and API contract |
| mvp-factory-control#833 | messmass#247 | Report Variants 3/8: organization reports workspace and variant list |
| mvp-factory-control#834 | messmass#248 | Report Variants 4/8: organization variant editor and duplicate-from-default flow |
| mvp-factory-control#835 | messmass#249 | Report Variants 5/8: organization runtime variant resolution and period-scoped reports |
| mvp-factory-control#836 | messmass#250 | Report Variants 6/8: partner variant rollout |
| mvp-factory-control#837 | messmass#251 | Report Variants 7/8: hashtag and filter variant rollout |
| mvp-factory-control#838 | messmass#252 | Report Variants 8/8: list-view Reports workflow and editor-action cleanup |
| mvp-factory-control#839 | messmass#253 | Design System Remediation Program: authority, enforcement, and UI normalization |
| mvp-factory-control#840 | messmass#254 | Design System Remediation 1/7: authority model and repo contract alignment |
| mvp-factory-control#841 | messmass#255 | Design System Remediation 2/7: drift freeze and enforcement guardrails |
| mvp-factory-control#842 | messmass#256 | Design System Remediation 3/7: shared admin and navigation surface normalization |
| mvp-factory-control#843 | messmass#257 | Design System Remediation 4/7: reporting and admin workflow primitive normalization |
| mvp-factory-control#844 | messmass#258 | Design System Remediation 5/7: status badge and semantic state consolidation |
| mvp-factory-control#845 | messmass#259 | Design System Remediation 6/7: chart and analytics presentation normalization |
| mvp-factory-control#846 | messmass#260 | Design System Remediation 7/7: global CSS and legacy cleanup |
| mvp-factory-control#847 | messmass#261 | Analytics Chart UX Benchmark Program: reusable chart composition and filter UX without new |
| mvp-factory-control#848 | messmass#262 | Analytics Chart UX 1/8: shared KPI card system for analytics surfaces |
| mvp-factory-control#849 | messmass#263 | Analytics Chart UX 2/8: shared chart card wrapper and section shell |
| mvp-factory-control#850 | messmass#264 | Analytics Chart UX 3/8: shared period and filter toolbar for analytics workspaces |
| mvp-factory-control#851 | messmass#265 | Analytics Chart UX 4/8: legend, tooltip, and chart summary grammar normalization |
| mvp-factory-control#852 | messmass#266 | Analytics Chart UX 5/8: loading, empty, and error state system for analytics views |
| mvp-factory-control#853 | messmass#267 | Analytics Chart UX 6/8: responsive dashboard grid and section layout normalization |
| mvp-factory-control#854 | messmass#268 | Analytics Chart UX 7/8: chart and table composite evidence panels |
| mvp-factory-control#855 | messmass#269 | Analytics Chart UX 8/8: rollout benchmark-driven chart UX across live analytics surfaces |
| mvp-factory-control#878 | messmass#270 | Amanoba: GDS readiness - pre-upstream local convergence program |
| mvp-factory-control#879 | messmass#271 | Amanoba: UI shells - prerender-safe auth public article shell convergence |
| mvp-factory-control#880 | messmass#272 | Amanoba: Learner shell - canonical header and route-shell convergence |
| mvp-factory-control#881 | messmass#273 | Amanoba: Content rendering - rich prose and article body contract hardening |
| mvp-factory-control#882 | messmass#274 | Amanoba: Metrics and states - learner-facing contract completion |
| mvp-factory-control#883 | messmass#275 | Amanoba: Access recovery - gated-route and permission state unification |
| mvp-factory-control#884 | messmass#276 | Amanoba: Course cards - local variant contract extraction |
| mvp-factory-control#885 | messmass#277 | Amanoba: Admin data views - full adapter rollout and mobile safety |
| mvp-factory-control#886 | messmass#278 | Amanoba: Interactive learning chrome - quiz and game shell standardization |
| mvp-factory-control#887 | messmass#279 | Amanoba: Token governance - server-render and chart theme contract |
| mvp-factory-control#888 | messmass#280 | Amanoba: GDS compliance - manifest, exception expiry, and import guard hardening |
| mvp-factory-control#889 | messmass#281 | Amanoba: Upstream handoff - proven GDS gaps and escalation packet |
| mvp-factory-control#900 | messmass#282 | Amanoba: UI: Learner shell adapter - future LearnerAppShell boundary defined |
