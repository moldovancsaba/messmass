# {messmass} Developer Handover

This file is onboarding plus operational context for the next agent. Keep it accurate when behavior, process, or current delivery state changes.

**Last Updated:** 2026-05-22 (auth loading fail-safe audit slice)

## 🚨 CRITICAL MUST-READ FOR ALL AGENTS: STYLING & COMPONENTS 🚨

**NEVER use hardcoded Tailwind utility classes (e.g., `text-gray-700`, `border-gray-300`, `p-4`, `shadow-sm`) or inline styles (`style={{...}}`) for standard UI components. The `{messmass}` architecture is strictly token-based and centralized.**

You MUST completely read and obey `docs/coding-standards.md` and `docs/components/components-reusable-components-inventory.md` before writing ANY UI code.

- **Modals:** MUST use `FormModal` or `BaseModal`. Do not build custom dialogs.
- **Cards:** MUST use `ColoredCard`. Do not build custom containers.
- **Form Inputs:** MUST use `UnifiedTextInput`, `UnifiedNumberInput`, etc. NEVER use raw HTML `<input>` for text/numbers.
- **Form Layouts:** Standard form wrappers MUST use `.form-group`, `.form-label-block`, `.form-input` CSS classes, NOT Tailwind.
- **Design Tokens:** All custom CSS MUST use `var(--mm-*)` design tokens from `app/styles/theme.css`.

**Bypassing the centralized component and design token system is a severe structural violation and will result in immediate rejection by the product owner.**

## SSOT (Work Tracking)
- Board: <https://github.com/users/moldovancsaba/projects/1>
- Issues repo: `moldovancsaba/mvp-factory-control`
- Rules:
  - Track {messmass} delivery work only in `mvp-factory-control` and on Project 1.
  - Do not create or manage product work as local task files.
  - Use [PROJECT_MANAGEMENT.md](PROJECT_MANAGEMENT.md) for the required SSOT cadence.
  - Update this handover doc whenever current truth changes materially.

## Current Repo Truth
- Active branch: `main`
- Last known HEAD during this update: `213d5e25b`
- Working tree should be clean after the latest docs/board-alignment pass.
- Most recent shipped repo work:
  - active documentation overhaul and canonical-doc refresh
  - API comment cleanup aligned to current runtime behavior
  - operations action-plan demoted from task authority to historical/supporting reference
- Current product/doc baseline: `v12.1.12`
- Formally closed on SSOT board (historical): `#354`, `#355`, `#356`, `#357`, `#358`, `#359`

## Current Priorities
- Board-derived priority reference: [operations-delivery-focus.md](operations/operations-delivery-focus.md)
- Execution queue reference: [operations-action-plan.md](operations/operations-action-plan.md)
- Use the GitHub board as final authority when any local doc disagrees.
- `operations-action-plan.md` is now explicitly reference-only memory, not active execution authority.
- Last verified board alignment:
  - `#784` = `Review (ALMOST)`
  - `#788` = `In Progress (NOW)`
  - `#815` through `#821` = `Review (ALMOST)` with `dod:ready-for-review`
  - `#72` remains open and needs a real product decision rather than silent auto-closure

## Pending GitHub Updates

Use this checklist for the next SSOT/board pass so the next agent does not have to reconstruct the required GitHub work.

1. Review-close or punch-list the UI refinement chain:
   - `#815`, `#816`, `#817`, `#818`, `#819`, `#820`, `#821`
   - Current expected board state: `Review (ALMOST)`
   - Current expected DoD label: `dod:ready-for-review`
   - If accepted, move to done/closed on the board and update the issue comments with any review outcome.

2. Keep `#788` as the active product-facing in-progress item until the proof-of-performance workspace is either completed or deliberately split.

3. Do not auto-close `#72`.
   - The repo proves multiple cleanup slices were shipped.
   - The repo does **not** prove the whole remaining card scope is complete.
   - Required next GH action is a product decision: close it with explicit rationale, or split remaining style debt into narrower follow-up issues.

4. Preserve `#784` as review-ready unless new code materially changes the Sponsorship Hub scope.

5. When syncing the board again, also verify these issue labels still match reality:
   - `agent:chappie`
   - `dod:ready-for-review` or `dod:in-progress`
   - `priority:p1` / `priority:p2`
   - `type:plan` / `type:refactor` / `type:feature`

6. If GitHub Project GraphQL rate-limits again:
   - prefer targeted item updates over a full board rewrite
   - trust shipped repo state plus this handover and `operations-delivery-focus.md`
   - leave a note in the updated issue comment instead of guessing a status change

## Docs Index
- [README.md](../README.md) — local dev and high-level overview
- [index.md](index.md) — canonical docs entrypoint
- [messmass-codex-brain-dump.md](messmass-codex-brain-dump.md) — repo structure and current mental model refresher
- [PROJECT_MANAGEMENT.md](PROJECT_MANAGEMENT.md) — SSOT rules and board cadence
- [NEXT_AGENT_PROMPT.md](NEXT_AGENT_PROMPT.md) — continuation package from the last recorded delivery
- [operations-action-plan.md](operations/operations-action-plan.md) — execution queue and state memory
- [operations-delivery-focus.md](operations/operations-delivery-focus.md) — board-derived priority shortlist
- [architecture.md](architecture.md) — system architecture
- [documentation-governance.md](documentation-governance.md) — canonical doc rules

## Quick Runtime Pointers
- Next.js app: `/app`, `/components`, `/lib`
- WebSocket server: `/server` on port `7654`
- Main local dev command: `npm run dev`
- Build gate used across the repo: `npm run build`

## Known Working Context
- Builder mode on `/edit/[slug]` renders one input per chart variable across KPI, Bar, Pie, Text, Table, Image, and Value chain.
- Image and table builders infer variables when formulas are empty.
- Unified builder card layout and overflow controls live in shared builder components and CSS.
- Style editor preview updates immediately for bar/pie CSS vars and includes Value Chain and Landing page sections.

## Handover Log

## 2026-05-22 — Auth loading fail-safe audit slice (#63, #819)
- **Objective:** Check for other permanent-loader risks matching the Report Builder bug and harden any pages that only clear `loading` on one success path.
- **Audit result:** The same structural risk was found in `/app/admin/charts/page.tsx` and `/app/admin/hashtags/page.tsx`. Both pages relied on redirect side effects during auth failure and only cleared `loading` on the authenticated success branch.
- **Fix:** Updated both routes so failed or unauthenticated auth checks now explicitly clear `loading`, mark access as unavailable, and then route to `/admin/login` via the client router. This prevents a permanent spinner if navigation does not complete cleanly.
- **Not found elsewhere:** The other nearby reporting/admin setup routes checked in this pass (`/app/admin/content-library/page.tsx`, `/app/admin/styles/page.tsx`, `/app/admin/mainpage/page.tsx`, `components/BuilderMode.tsx`, `components/ChartConfiguration.tsx`, `components/BitlyLinksEditor.tsx`) already clear their loader states through `finally` or explicit fallback branches and did not share the same stuck-loading pattern.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As usual in this repo, `type-check` was run after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-22 — Report Builder load fail-safe slice (#64, #819)
- **Objective:** Fix the Report Builder route getting stuck on `Loading data visualization blocks...` when initialization fails to select a template or the template set is empty.
- **Initialization hardening:** Updated `/app/admin/visualization/page.tsx` so the route-level initialization now wraps the startup sequence in `try/finally`-style fail-safe behavior, awaits the supporting chart/config fetches, and explicitly clears `loading` when no templates are available instead of leaving the page in a permanent spinner state.
- **Failure behavior:** The Report Builder can now fall through to its existing no-template or empty-state UI instead of appearing to hang indefinitely when the template bootstrap path cannot produce a selected template.
- **Workflow effect:** Operators can distinguish a real empty/configuration state from a broken loading state and continue working in the reporting workspace without hard-refresh guesswork.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As usual in this repo, `type-check` was run after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-21 — Analytics home card hardening slice (#72, #817)
- **Objective:** Fix the broken analytics-home tiles where long labels/descriptions could collapse into narrow vertical text and leave oversized empty card areas.
- **Card layout hardening:** Updated `/app/admin/analytics/page.tsx` and `/app/admin/analytics/page.module.css` so analytics surface tiles now use a stable grid column size, full-width card surfaces, a stronger two-column internal layout, and consistent minimum heights.
- **Text-wrapping fix:** Replaced the overly aggressive `overflow-wrap: anywhere` behavior with safer title/description wrapping rules, preventing letter-by-letter vertical stacking when a card body gets constrained.
- **Responsive effect:** The analytics grid now keeps cards readable at large widths and falls back to one-column tiles cleanly on narrow screens instead of allowing distorted tile geometry.
- **Workflow effect:** Analytics entry cards are now predictable click targets again, and operators can scan the available surfaces without layout corruption or missing content.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As usual in this repo, `type-check` was run after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-21 — Shared menu normalization slice (#72, #816, #817, #818)
- **Objective:** Fix the inconsistent admin menu hierarchy and spacing issues at the shared-component level so sidebar and workspace menus behave like one coherent navigation system.
- **Sidebar hierarchy fix:** Updated `/components/Sidebar.tsx`, `/components/Sidebar.module.css`, and `/lib/adminNavigation.ts` so analytics and reporting children now render as true nested submenus under `Analytics Home` and `Reporting Workspace` instead of flat peer rows. Section titles were restored, child indentation is explicit, active states now apply at both group and child level, and icon/text alignment was normalized.
- **Footer cleanup:** The sidebar footer now uses the current year dynamically and a more compact layout, reducing the visual clash between navigation and version metadata.
- **Workspace menu consistency:** Updated `/components/AnalyticsWorkspaceNav.module.css` and `/components/ReportingWorkspaceNav.module.css` so the in-page workspace menus use the same stronger chip sizing, hover motion, and active emphasis as the sidebar navigation.
- **Workflow effect:** Operators can now scan menu structure more quickly, understand parent/child relationships without guessing, and move between sidebar and in-page menus without hitting a different visual grammar.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As usual in this repo, `type-check` was run after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-21 — Recap proof-gap checklist slice (#788)
- **Objective:** Make partial recap packages easier to assign and recover by turning remaining delivery blockers into a copyable checklist with grouped gap counts.
- **Checklist handoff:** Updated `/app/admin/analytics/sponsorship/activation/recap/[partnerId]/page.tsx` so partial packages now support `Copy Proof Gap Checklist`, generating an ops-ready list with readiness, missing reasons, recommended fixes, and direct action URLs per blocked event.
- **Grouped gap summary:** The recap route now also shows package-level counts for `Missing Bitly`, `Missing Report`, and `Missing Metrics`, making the dominant blocker type visible without scanning every event.
- **Workflow effect:** Commercial and operations users can now hand off a concrete recovery checklist for partial sponsor packages instead of verbally describing blocked proof items or manually transcribing them from the page.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As usual in this repo, `type-check` was run after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-21 — Recap ready-event action slice (#788)
- **Objective:** Remove another navigation step from recap delivery by turning “included ready events” into direct operational/report actions instead of a static name list.
- **Shared recap model:** Updated `/lib/sponsorshipHub.ts` so recap packages now expose a `readyProjects` collection with event ids, dates, report URLs, editor URLs, and admin URLs in addition to the existing summary names.
- **Activation workspace usability:** Updated `/app/admin/analytics/sponsorship/activation/page.tsx` so the selected recap preview now renders ready-event cards with direct `Open Event Report`, `Open Editor`, and `Open Event Admin` actions.
- **Dedicated recap brief usability:** Updated `/app/admin/analytics/sponsorship/activation/recap/[partnerId]/page.tsx` so included ready events now render with per-event action links, and the exported summary/packet content uses the richer ready-event model.
- **Workflow effect:** Delivery and commercial users can move from a partner recap package straight into the exact event proof or edit surface they need, instead of backing out to Events or reconstructing the event path manually.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As usual in this repo, `type-check` was run after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-21 — Recap brief link handoff slice (#788)
- **Objective:** Remove another step from recap coordination by letting operators copy the exact scoped brief URL directly from both the activation workspace and the dedicated recap page.
- **Activation workspace handoff:** Updated `/app/admin/analytics/sponsorship/activation/page.tsx` so each partner recap package and the selected recap preview now support `Copy Brief Link`, using the canonical scoped recap route with the current scope and date-window query state preserved.
- **Dedicated recap route handoff:** Updated `/app/admin/analytics/sponsorship/activation/recap/[partnerId]/page.tsx` so the route-level brief also supports `Copy Brief Link` alongside summary, email, download, and print actions.
- **Workflow effect:** Delivery, commercial, and ops users can now pass around the exact recap surface for a partner without asking teammates to reconstruct filters or navigate back through the activation workspace first.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As usual in this repo, `type-check` was run after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-21 — Recap delivery packet export slice (#788)
- **Objective:** Turn the dedicated recap brief into a stronger handoff artifact by giving users a structured sponsor-delivery packet they can download and forward outside the admin UI.
- **Delivery packet export:** Updated `/app/admin/analytics/sponsorship/activation/recap/[partnerId]/page.tsx` so the recap brief now supports `Download Delivery Packet (.md)` in addition to the existing summary, email, and print actions.
- **Packet contents:** The exported markdown packet includes package status, ready-project counts, fans, media value, Bitly clicks, latest ready event, ready event list, partner report URL, activation queue URL, and any remaining proof gaps with recommended fix links.
- **Workflow effect:** Delivery and commercial users can now hand off a structured sponsor recap packet directly from the recap route instead of stitching together evidence manually from the admin workspace.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As usual in this repo, `type-check` was run after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-21 — Recap proof-gap delivery slice (#788)
- **Objective:** Make partial sponsor recap packages actionable by showing exactly which partner events are still blocked and linking directly into the fix path from the dedicated recap brief.
- **Recap delivery hardening:** Updated `/app/admin/analytics/sponsorship/activation/recap/[partnerId]/page.tsx` and its scoped stylesheet so the recap brief now shows partner-specific delivery readiness, open proof gaps, missing reasons, and direct actions into the recommended fix, editor, or report route.
- **Workflow effect:** Delivery teams can now move from a partial recap package directly into the blocked events instead of bouncing back to the broader activation workspace to rediscover what is missing.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As usual in this repo, `type-check` was run after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-21 — Template lifecycle, setup handoff, and recap artifact slice (#788, #72, #64, #63, #820)
- **Objective:** Ship another concrete usability/foundation pass across the active work: safer report-template lifecycle operations, faster next actions after Event/Partner creation, and a stronger sponsor-delivery recap artifact.
- **Report template lifecycle hardening (`#64`):** Updated `/app/admin/visualization/page.tsx`, `/app/admin/visualization/Visualization.module.css`, and `/app/api/report-templates/route.ts` so template management now shows usage counts, supports explicit copy naming, removes more inline management layout duplication, and blocks deletion when a template is still assigned to live projects or partners.
- **Setup-flow productivity handoff (`#63`, `#820`):** Updated `/app/admin/events/page.tsx` and `/app/admin/partners/page.tsx` so successful creation now yields actionable next-step cards instead of dead-end alerts. Operators can jump directly into Editor, Report, Analytics, Partner assignment, and Google Sheet follow-up from the creation flow.
- **Recap delivery artifact (`#788`):** Updated `/app/admin/analytics/sponsorship/activation/recap/[partnerId]/page.tsx` so the dedicated recap brief now supports `Download Brief (.txt)` in addition to copy, email, and print/PDF handoff actions.
- **Style debt reduction (`#72`):** The template-management modal layout now uses dedicated CSS-module classes instead of repeating ad hoc inline layout for rename/copy/delete sections, reducing duplication in an active reporting admin surface.
- **Issue-program context:** These changes reinforce the already-shipped `#816`, `#817`, and `#818` UI-refinement work by making the staged setup flows and action grammar more operational after creation, rather than only cleaner during navigation.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As usual in this repo, `type-check` was run after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-21 — Dedicated recap brief route slice (#788)
- **Objective:** Move recap delivery from an activation-only preview into a stable sponsor-delivery artifact that can be opened, shared, printed, or exported without relying on the full activation workspace UI.
- **Dedicated recap route:** Added `/app/admin/analytics/sponsorship/activation/recap/[partnerId]/page.tsx` plus a scoped stylesheet so each partner recap package now has its own route-level brief page with package totals, included ready events, delivery guidance, and sponsor-facing summary framing.
- **Delivery actions:** The dedicated recap brief now supports `Copy Brief Summary`, `Draft Delivery Email`, `Print / Export PDF`, and direct jumps into the partner report or scoped activation queue.
- **Activation linking:** Updated `/app/admin/analytics/sponsorship/activation/page.tsx` so recap packages and the inline recap preview both expose direct links into the dedicated brief route while preserving the current scope and date-window query state.
- **Workflow effect:** Delivery and commercial users now have a stable handoff artifact for sponsor recap packaging instead of depending on the broader activation workspace as the presentation layer.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As usual in this repo, `type-check` was rerun after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-21 — Board sync + recap brief slice (#788)
- **Objective:** Keep the live GitHub board aligned with the shipped `#788` progress, then continue the recap-delivery path with a stronger recipient-ready surface.
- **Board update:** Confirmed `#788` still correctly stays `In Progress (NOW)` with `dod:in-progress` and posted a fresh evidence comment summarizing shipped commits `b2d4f6525`, `bc0c51e49`, `69c06acd3`, and `4e0140c36`: <https://github.com/moldovancsaba/mvp-factory-control/issues/788#issuecomment-4506928896>
- **Recap brief UI:** Updated `/app/admin/analytics/sponsorship/activation/page.tsx` so partner recap packages now support a dedicated `Recipient-Ready Recap Brief` preview with package status, totals, included ready events, and direct delivery actions.
- **Workflow effect:** Delivery teams can now move from package identification into a presentation-ready brief without leaving the activation workspace.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As usual in this repo, `type-check` was rerun after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-20 — Partner Activation queue hardening slice (#788)
- **Objective:** Make the activation workspace operationally actionable by exposing the real next fix path for each project instead of only showing passive gap labels.
- **Shared activation model:** Updated `/lib/sponsorshipHub.ts` so proof items now carry exact editor/admin destinations, a recommended next action label/URL/reason, and a separate `needsMetricsProjects` summary for fan/media evidence gaps.
- **Project destination fix:** Activation project actions now resolve to the real event editor route when an `editSlug` exists instead of falling back to unrelated partner analytics routes.
- **Workspace usability:** Updated `/app/admin/analytics/sponsorship/activation/page.tsx` so the proof queue now shows priority, recommended fix actions, an additional metrics-gap KPI, and partner-queue focus toggles.
- **Styling support:** Updated `/app/admin/analytics/sponsorship/page.module.css` so the new queue/focus controls reuse the existing workspace action styling model.
- **Workflow effect:** Operators can now work top-down through the queue by urgency and click directly into the most relevant fix surface for Bitly coverage, report access, or incomplete event evidence.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As usual in this repo, `type-check` was rerun after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-20 — Partner Activation saved-view and shareable-filter slice (#788)
- **Objective:** Remove the need to rebuild activation queues manually by making the current workspace filter state reusable and shareable.
- **URL-backed filters:** Updated `/app/admin/analytics/sponsorship/activation/page.tsx` so `statusFilter` and `partnerFilter` now read from and write to the query string without leaving the page.
- **Reusable queue presets:** Added saved-view style presets for `All Activation Work`, `Bitly Backfill`, `Report Recovery`, `Metrics Proof`, and `Ready to Share`, all mapped onto the current queue logic without introducing a new backend persistence layer.
- **Filtered scope summary:** The activation workspace now shows the current preset name, filtered gap count, filtered ready count, and total media value for the active view.
- **Workflow effect:** Commercial and ops users can now bookmark or share the exact activation queue they want another user to work, instead of describing a manual filter combination.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As usual in this repo, `type-check` was rerun after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-20 — Partner-facing recap packaging slice (#788)
- **Objective:** Turn the internal activation queue into the first reusable partner-facing delivery layer by grouping ready proof into recap packages per partner.
- **Shared recap model:** Updated `/lib/sponsorshipHub.ts` so the activation workspace now includes `readyPartners` and `recapPackages`, with ready-project counts, total proof metrics, latest ready event date, package status (`ready` vs `partial`), and direct partner report/analytics/activation links.
- **Activation UI packaging:** Updated `/app/admin/analytics/sponsorship/activation/page.tsx` so the workspace now shows a `Ready Partners` KPI and a new `Partner Recap Packages` section for teams moving from internal proof readiness into external delivery.
- **Workflow effect:** Users can now see which partners already have enough ready evidence to package into sponsor-facing recaps, instead of stopping at raw project-level queue items.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As usual in this repo, `type-check` was rerun after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-20 — Recap share/export handoff slice (#788)
- **Objective:** Add a lightweight delivery handoff layer on top of the recap packages so teams can export or forward sponsor-facing proof without waiting for a separate backend export system.
- **Recap handoff actions:** Updated `/app/admin/analytics/sponsorship/activation/page.tsx` so each recap package now supports `Copy Recap Summary` and `Draft Recap Email` in addition to the existing report and analytics links.
- **Summary generation:** The copied/email-ready recap summary includes package status, ready-project counts, fans, media value, Bitly clicks, latest ready event, included ready events, and the absolute partner report URL when available.
- **Workflow effect:** Activation no longer stops at “this package is ready”; users can now immediately hand the package to commercial or delivery teams through a reusable summary and prefilled email draft.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As usual in this repo, `type-check` was rerun after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-20 — Active documentation overhaul
- **Objective:** Remove active-documentation drift across the current operator, feature, and API docs rather than only bumping versions.
- **Admin guide rewrite:** Replaced `/docs/admin/admin-end-user-guide.md` so it now matches the live Admin Workspace, Reporting Workspace, and Analytics Workspace model, including staged Event and Partner setup flows and the current canonical routes.
- **Bitly guide rewrite:** Replaced `/docs/features/features-bitly-integration-guide.md` with current link, association, sync, recalculation, and project-metrics behavior based on the live `/api/bitly/*` surface and `/admin/bitly`.
- **API refresh:** Reworked `/docs/api/api-public.md` and `/docs/api/api-analytics.md` so they document the current public partner APIs, sponsorship hub, compare endpoints, trends, and insights summary behavior.
- **Cross-doc cleanup:** Updated `/README.md`, `/docs/features/features-overview.md`, `/docs/features/features-authentication.md`, and `/docs/api/api-reference.md` to remove live inconsistencies such as the obsolete `ADMIN_PASSWORD` environment note and old API reference version metadata.
- **Verification:** `npm run version:verify` passed and `python3 scripts/docs_link_check.py` regenerated `/docs/_meta/meta-docs-link-check.md` with `Broken links found: 0`.

## 2026-05-20 — Board/documentation alignment follow-up
- **Objective:** Reconcile the local state docs with the actual shipped repo and the last verified GitHub board state so future SSOT updates can be done mechanically instead of by rediscovery.
- **Board sync captured:** The current expected board truth is now recorded here: `#784` review-ready, `#788` in progress, `#815` through `#821` review-ready, and `#72` still an unresolved board/product decision.
- **Authority cleanup:** `/docs/operations/operations-action-plan.md` now explicitly defers active task authority to the GitHub board and is preserved as supporting memory only.
- **Next-agent GH checklist:** Added a concrete “Pending GitHub Updates” checklist to this handover so later board cleanup can be executed from one place.

## 2026-05-14 — Documentation consistency cleanup
- **Objective:** Remove the highest-signal documentation drift across the repo entrypoints and state docs without guessing live board state.
- **Entrypoint cleanup:** Updated `/docs/index.md` so its `Last Updated` value and key links match the current lowercase file names and active documentation set.
- **State-doc cleanup:** Updated `/docs/HANDOVER.md`, `/docs/messmass-codex-brain-dump.md`, and `/docs/api/api-reference.md` so current branch, current version, and current workspace framing no longer contradict the shipped repo state.
- **Delivery-focus cleanup:** Reworked `/docs/operations/operations-delivery-focus.md` to stop pretending an old local issue ranking is current board truth. It now explicitly tells agents to re-check the live board before using it for prioritization.
- **Historical handover cleanup:** Updated `/docs/NEXT_AGENT_PROMPT.md` so it is clearly treated as a historical builder-delivery note, not a current execution guide.
- **Verification:** Pending targeted documentation validation after edits.

## 2026-05-13 — v12.1.12 admin workspace regression fix release
- **Objective:** Ship the first post-merge cleanup pass on the current admin workspace model by fixing the most visible broken interactions without changing product scope.
- **Project-partner fix:** Updated `/app/admin/project-partners/page.tsx` so partner assignment and auto-suggest now use the shared CSRF-aware API client instead of raw state-changing `fetch(...)` calls. This resolves the `CSRF token invalid or missing` failure path.
- **Shared hero containment:** Updated `/components/UnifiedAdminHeroWithSearch.module.css` so action buttons wrap and stay inside the hero on mid-width layouts, fixing Bitly-style overflow regressions.
- **Analytics/Bitly cleanup:** Updated `/app/admin/analytics/page.module.css` to keep card text inside card bounds, and updated `/app/admin/bitly/page.tsx` to clear stale error/success state around partner association actions.
- **Version and repo entrypoint sync:** Bumped the product version to `v12.1.12`, refreshed `README.md`, and recorded this release in `/docs/operations/operations-release-notes.md`.
- **Verification:** `npm run lint`, `npm run build`, `npm run type-check`, and `npm run version:verify` all passed.

## 2026-05-12 — Legacy route and help-system alignment slice (#821)
- **Objective:** Finish the current UI refinement track by removing the last live guidance drift between the implemented workspace model and the in-product help/route ownership language.
- **Help rewrite:** Rebuilt `/app/admin/help/page.tsx` around the current Admin Workspace, Reporting Workspace, and Analytics Workspace model. The page now teaches the staged Event and Partner flows, the canonical `/admin/reports` and `/admin/analytics` entry points, and the direct-open/share-second action grammar instead of the old dashboard/KYC-manager wording.
- **Guest access guidance:** Updated the help-page role ladder so Guest, User, Admin, and Superadmin descriptions match the current product map rather than the legacy dashboard-era labels.
- **Route ownership cleanup:** Updated `/lib/routeProtection.ts` so the comments and explicit protection map now recognize `Reporting Workspace`, protect `/admin/reports`, `/admin/styles`, and `/admin/content-library` at the admin level, and label `/admin/dashboard` as a legacy redirect entry point instead of an active home.
- **Repo memory sync:** Updated `/docs/messmass-codex-brain-dump.md` so the canonical workspace map and touched-route list no longer present `/admin/dashboard` and `/admin/insights` as active product homes.
- **Workflow effect:** Users reading in-product guidance are now directed into the same product structure that the navigation, redirects, and staged setup flows already implement, closing the remaining “old map vs live product” mismatch from the UI refinement program.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed.

## 2026-05-12 — Guided setup flow foundation slice (#820)
- **Objective:** Reduce decision overload in the two highest-friction admin setup surfaces by staging creation/edit flows instead of forcing all decisions into one modal.
- **Event setup flow:** Updated `/app/admin/events/page.tsx` so both create and edit now use a two-step flow inside the same modal: `Event Basics` first, then `Reporting` / `Reporting & Distribution`. The first submit now advances the workflow and the final submit persists changes.
- **Partner setup flow:** Updated `/app/admin/partners/page.tsx` so both create and edit now use a two-step flow: `Partner Basics` first, then `Reporting & Integrations`. Identity, emoji, sports enrichment, and hashtags are separated from Bitly, templates, clicker sets, and Google Sheets behavior.
- **Shared interaction pattern:** Both surfaces now use step badges, explicit `Continue to Reporting` / `Back` controls, and close/reset behavior that returns the modal to step 1 on reopen.
- **Workflow effect:** Operators no longer have to make reporting and integration choices before they have finished defining the base event or partner record. This lowers setup friction without removing any existing functionality.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed.

## 2026-05-12 — Reporting dependency consolidation slice (#819)
- **Objective:** Remove the last major report-authoring split by pulling variable schema and clicker layout into the reporting workspace instead of leaving them mentally stranded in a separate data bucket.
- **Workspace scope expansion:** Updated `/lib/adminNavigation.ts` so `getReportingWorkspaceItems()` now includes `KYC Variables` and `Clicker Sets` alongside Builder, Themes, Content Library, and Chart Algorithms.
- **Reporting home copy:** Updated `/app/admin/reports/page.tsx` so the canonical reporting workspace now explicitly frames `KYC Variables` and `Clicker Sets` as report-authoring dependencies rather than isolated data tools.
- **Route ownership:** Updated `/app/admin/kyc/page.tsx` and `/app/admin/clicker-manager/page.tsx` to use `/admin/reports` as their back-link and embedded `/components/ReportingWorkspaceNav.tsx` so authors can move through the full reporting setup workflow without backing out to the main admin workspace.
- **Workflow effect:** Report setup no longer splits across two mental buckets for the most common authoring path. Variables, clicker layout, content, themes, charts, and builder composition are now navigable as one workspace.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed.

## 2026-05-12 — Reporting workspace foundation slice (#819)
- **Objective:** Start the reporting IA consolidation by giving the report-management system one canonical home and one shared movement model, matching the analytics workspace pattern.
- **Canonical reporting home:** Added `/app/admin/reports/page.tsx` plus `/app/admin/reports/page.module.css` as the new reporting workspace landing page. It explains the reporting setup surfaces and routes users into Builder, Themes, Content Library, and Chart Algorithms from one place.
- **Navigation model:** Updated `/lib/adminNavigation.ts` so the Reports section now exposes `Reporting Workspace` as the top-level admin destination, while `Report Builder`, `Report Themes`, `Content Library`, and `Chart Algorithms` remain available as drilldowns and are hidden from the admin workspace card grid. Added the matching permission in `/lib/permissions.ts`.
- **Shared sub-navigation:** Added `/components/ReportingWorkspaceNav.tsx` plus `/components/ReportingWorkspaceNav.module.css` and wired that shared reporting nav into `/app/admin/visualization/page.tsx`, `/app/admin/styles/page.tsx`, `/app/admin/content-library/page.tsx`, and `/app/admin/charts/page.tsx`.
- **Route ownership:** Updated report-management back-links so Builder, Themes, Content Library, and Chart Algorithm Manager now point back to `/admin/reports` instead of `/admin`, reinforcing the reporting workspace ownership model.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed.

## 2026-05-12 — Entity action direct-open slice (#818)
- **Objective:** Remove the remaining extra click in the core entity workflows by making Events and Partners open their working destinations directly instead of forcing a share popup first.
- **Action grammar refinement:** Updated `/lib/adapters/projectsAdapter.tsx`, `/lib/adapters/partnersAdapter.tsx`, and `/lib/adapters/organizationsAdapter.tsx` so the main actions now lead with direct-open behavior: `Open Report` and `Open Editor` are primary actions, while `Share Report` and `Share Editor` remain secondary utilities where they are still useful.
- **Surface simplification:** Restricted share and utility actions to list surfaces where appropriate, keeping cards focused on the main workflow destinations rather than utility buttons.
- **Workflow effect:** The core admin entities now expose a clearer primary path: open the report/editor first, then use share/export/KYC utilities only when needed. This removes one unnecessary modal step from the most common reporting and editing flows.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed.

## 2026-05-12 — Entity action grammar foundation slice (#818)
- **Objective:** Remove the remaining page-local action inconsistency by moving Events onto the same shared entity-action runtime used by Partners and Organizations, and by making action labels describe the real behavior.
- **Shared event contract:** Added `projectsEntityConfig` in `/lib/adapters/projectsAdapter.tsx` and exported it through `/lib/adapters/index.ts`, so Events now declare capabilities and actions through the same admin entity model as the other main admin surfaces.
- **Execution unification:** Updated `/app/admin/events/page.tsx` to use `withAdminEntityActions(...)` instead of remapping row/card actions by checking labels like `Edit Stats`. Event actions now route through stable runtime keys for edit modal, share popup, CSV export, and deletion.
- **Action clarity:** Renamed ambiguous user-facing actions across the entity configs so the click matches the label: Events now expose `Share Report` and `Share Editor`, Partners now use `Share Report` and `Open Editor`, and Organizations now use `Open Report` and `Open Editor`.
- **Capability extension:** Added the `export` capability to `/lib/adminEntitySystem.ts` so export actions can live inside the same shared action grammar instead of remaining a one-off adapter exception.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As elsewhere in this repo, `type-check` was run after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-12 — Analytics workspace nav continuation (#817)
- **Objective:** Finish the shared analytics-workspace movement model so the activation queue behaves like part of analytics instead of a detached operations branch.
- **Workspace nav expansion:** Updated `/lib/adminNavigation.ts` with `getAnalyticsWorkspaceItems()` so the analytics workspace can reuse the canonical analytics lens list while explicitly inserting `Partner Activation` beside `Sponsorship Hub`.
- **Sub-navigation alignment:** Updated `/components/AnalyticsWorkspaceNav.tsx` to render the new workspace item list, which means analytics home, Sponsorship Hub, activation, executive, marketing, operations, and insights now share one internal movement model.
- **Workflow effect:** Users can move between proof-of-performance triage and the rest of the analytics workspace without backing out to `/admin`, which completes the main route-ownership goal of `#817`.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed.

## 2026-05-11 — Admin home and analytics entry-point consolidation slice (#817)
- **Objective:** Remove the next structural inconsistency after `#816`: competing admin and analytics home surfaces that made users choose between `/admin`, `/admin/dashboard`, `/admin/insights`, and `analytics/*` without a clear ownership model.
- **Analytics home:** Added `/app/admin/analytics/page.tsx` plus `/app/admin/analytics/page.module.css` as the canonical analytics landing page. It introduces one analytics entry point and then fans out into Sponsorship Hub, Executive, Marketing, Operations, and Insights drilldowns.
- **Workspace simplification:** Updated `/lib/adminNavigation.ts`, `/components/AdminDashboard.tsx`, `/components/Sidebar.tsx`, `/lib/permissions.ts`, and `/lib/routeProtection.ts` so the main admin workspace now exposes `Analytics Home` as the top-level analytics entry while the sidebar keeps the deeper analytics drilldowns available.
- **Legacy route cleanup:** Replaced `/app/admin/dashboard/page.tsx` with a redirect to `/admin` and `/app/admin/insights/page.tsx` with a redirect to `/admin/analytics/insights` so existing bookmarks still resolve without preserving duplicate product homes.
- **Canonical insights repair:** Rebuilt `/app/admin/analytics/insights/page.tsx` around the real `/api/analytics/insights` contract and the maintained `/components/InsightCard.tsx` renderer, replacing the broken dependency on the missing `/api/analytics/insights/all` endpoint.
- **Drilldown ownership cues:** Updated `/app/admin/analytics/executive/ExecutiveDashboardView.tsx` so executive, marketing, and operations dashboards now expose a direct path back to `/admin/analytics` and a consistent jump into the canonical Insights surface.
- **Workspace sub-navigation:** Added `/components/AnalyticsWorkspaceNav.tsx` plus `/components/AnalyticsWorkspaceNav.module.css` and embedded that shared analytics nav into the analytics home, Sponsorship Hub, activation workspace, Insights, and executive-family dashboards so drilldowns no longer feel isolated.
- **SSO default landing:** Updated `/app/api/auth/sso/login/route.ts`, `/app/api/auth/sso/callback/route.ts`, and the related login commentary so SSO defaults now land in `/admin` instead of the retired legacy dashboard entry.
- **Role consistency:** Admin workspace cards now respect the same role filtering as the sidebar, and analytics route protection now explicitly keeps `/admin/analytics/insights` on the superadmin path.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. As elsewhere in this repo, `type-check` needed to be rerun after the successful build because `tsconfig.json` includes `.next/types/**/*.ts`.

## 2026-05-11 — UI refinement foundation slice (#816)
- **Objective:** Start the UI refinement program by eliminating the first structural inconsistency: the admin dashboard cards and sidebar navigation describing different products.
- **Shared navigation SSOT:** Added `/lib/adminNavigation.ts` as the canonical admin navigation model, grouped by Operations, Entities, Reports, Data, Analytics, and System.
- **Dashboard alignment:** Updated `/components/AdminDashboard.tsx` so the admin landing page now renders grouped cards from the shared navigation definition instead of a separate hardcoded list with conflicting labels.
- **Sidebar alignment:** Updated `/components/Sidebar.tsx` so the sidebar now consumes the same shared navigation source instead of maintaining its own divergent route map.
- **Permission alignment:** Updated `/lib/permissions.ts` so sidebar visibility now matches the new canonical labels (`Report Builder`, `Report Themes`, `Clicker Sets`, `Bitly Links`, `Main Page`, etc.).
- **Entry-point framing:** Updated `/app/admin/page.tsx` from `Admin Dashboard` to `Admin Workspace` so the landing page better reflects the broader IA rather than implying a second analytics dashboard.
- **Visible terminology alignment:** Updated user-facing admin labels to the canonical IA on the highest-traffic surfaces: `Help`, `Bitly Links`, `Report Themes`, `Clicker Sets`, `Main Page`, and `Report Builder`.
- **Workflow copy cleanup:** Updated help guidance, unauthorized recovery CTA, and builder empty/error states so users are directed to canonical names like `Events` and `Report Builder` instead of legacy labels such as `Projects`, `User Guide`, and `Visualization Manager`.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed.

## 2026-05-11 — Activation triage and partner queue slice (#788)
- **Objective:** Turn the first activation workspace from a passive proof list into an operational triage surface for sponsor-delivery follow-up.
- **Shared activation scoring:** Extended `/lib/sponsorshipHub.ts` so each proof item now carries readiness score, priority score, missing-reason labels, and direct partner/report/admin links.
- **Partner queues:** The shared activation payload now includes partner-level queue rollups with ready-vs-gap counts, total media value, total Bitly clicks, and direct navigation actions.
- **Workspace filtering:** Updated `/app/admin/analytics/sponsorship/activation/page.tsx` with status and partner filters so admins can isolate ready packages, Bitly gaps, report gaps, or missing fan/media evidence.
- **Proof queue actions:** The activation queue now exposes readiness percentage, gap reasons, and direct links into project reports, partner analytics, and partner reports.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed.

## 2026-05-10 — Sponsorship evidence, trend, and activation workspace slice (#784, #788)
- **Objective:** Deliver the next five sponsorship actions in one coherent implementation pass instead of layering more ad hoc client fetches onto the existing hub.
- **Shared data model:** Rebuilt `/lib/sponsorshipHub.ts` so the server response now includes scope actions, scope trend points, project-level source drilldowns, partner-level attribution drilldowns, and an activation-workspace proof queue.
- **Source-level drilldown:** The hub now exposes project source breakdowns, Bitly country/referrer evidence, and partner attribution evidence directly from the shared sponsorship payload.
- **Trend views:** Added server-built trend series for the full scope, selected partner rollups, and selected projects (Bitly daily clicks when present, otherwise event snapshots).
- **Scope-to-report actions:** Added direct report/admin/action links at scope level, project level, and partner level so users can move from rollups into reports or admin analytics without manual URL hunting.
- **Attribution transparency:** Partner drilldowns now include attributed project tables plus an explicit summary of the `partnerContext.partnerId` then `partner1` fallback rule.
- **Activation workspace:** Added `/app/admin/analytics/sponsorship/activation/page.tsx` as the first `#788` Partner Activation and Proof-of-Performance workspace. It surfaces readiness score, proof gaps, scoped project queue, and partner proof destinations.
- **Navigation:** Added a `Partner Activation` card to `/components/AdminDashboard.tsx`.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed. `npm run type-check` still requires running after a successful build because this repo includes `.next/types/**/*.ts` in `tsconfig.json`.

## 2026-05-10 — Unified Sponsorship Performance Hub initial slice (#784)
- **Objective:** Start `#784` with a usable admin surface that unifies current sponsorship evidence without introducing new ingestion or schema changes.
- **Server aggregation:** Added `/lib/sponsorshipHub.ts` as the first shared sponsorship rollup layer. It resolves portfolio, partner, organization, and project scopes and combines existing `analytics_aggregates`, `projects`, `partners`, `organizations`, and `bitly_project_links` data.
- **API surface:** Added `/app/api/analytics/sponsorship-hub/route.ts` for authenticated admin access to the unified sponsorship dataset.
- **Admin UI:** Added `/app/admin/analytics/sponsorship/page.tsx` with scope controls, KPI cards, channel attribution cards, coverage indicators, top projects, and partner activity tables.
- **Navigation:** Added a new `Sponsorship Hub` entry to `/components/AdminDashboard.tsx` so the feature is reachable from the admin landing page.
- **Verification:** `npm run type-check` and `npm run lint` passed.

## 2026-05-10 — Unified Sponsorship Performance Hub date-range filtering (#784)
- **Objective:** Extend the first hub slice so sponsorship KPIs can be narrowed to a meaningful reporting window instead of remaining all-time only.
- **Shared filtering:** Updated `/lib/sponsorshipHub.ts` to support range presets (`all`, `30d`, `90d`, `365d`) and apply event-date filtering before building the unified hub response.
- **API support:** Extended `/app/api/analytics/sponsorship-hub/route.ts` to accept `rangePreset` and return the resolved filter window in the response payload.
- **Admin UI controls:** Updated `/app/admin/analytics/sponsorship/page.tsx` so admins can change the time window directly from the hub and see the effective date range in the current scope summary.
- **Verification note:** `npm run lint` passed. `npm run build` passed. `npm run type-check` passed after rerunning against the regenerated `.next/types` output because this repo includes `.next/types/**/*.ts` in `tsconfig.json`.

## 2026-05-10 — Unified Sponsorship Performance Hub partner attribution slice (#784)
- **Objective:** Turn the partner section of the Sponsorship Hub into a real commercial rollup instead of a simple activity count.
- **Attribution rule:** Updated `/lib/sponsorshipHub.ts` so partner totals use a transparent `primary_partner` attribution basis: first `analytics_aggregates.partnerContext.partnerId`, then fallback to the project primary partner. This avoids duplicate credit across multiple partner rows.
- **Partner rollups:** The hub response now includes partner-level fans, media value, Bitly clicks, average engagement rate, and the attribution basis alongside event counts.
- **Admin UI update:** Updated `/app/admin/analytics/sponsorship/page.tsx` so the old “Most Active Partner Entities” table is now a real “Top Partner Rollups” table with sponsorship metrics and an attribution note.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed.

## 2026-05-10 — Unified Sponsorship Performance Hub in-page drilldown slice (#784)
- **Objective:** Make the hub easier to use by letting admins inspect the selected ranked project or partner without leaving the page.
- **Project drilldown:** Updated `/app/admin/analytics/sponsorship/page.tsx` so rows in the top-project table are selectable and drive a dedicated project detail card showing event, partner label, view slug, fans, media value, Bitly clicks, and engagement.
- **Partner drilldown:** Added the same pattern for partner rollups, with a dedicated detail card showing event count, attribution basis, fans, media value, Bitly clicks, and engagement for the selected partner.
- **UI support:** Added focused drilldown and selected-row styles to `/app/admin/analytics/sponsorship/page.module.css`.
- **Verification:** `npm run lint`, `npm run build`, and `npm run type-check` all passed.

## 2026-05-10 — Style hardening Phase 5 duplicate admin dashboard cleanup (#72)
- **Objective:** Continue `#72` by removing inactive duplicate admin dashboard styling assets that no longer power the live admin landing page.
- **Removed duplicate artifacts:**
  - `components/AdminDashboardNew.tsx`
  - `components/AdminDashboard.module.css`
- **Additional duplicate UI cleanup:**
  - Removed `components/ConfirmModal.tsx` after confirming admin flows already use `ConfirmDialog` from `components/modals`.
- **Additional dead V3 UI cleanup:**
  - Removed `components/v3/dashboard/StatsCard.tsx`
  - Removed `components/v3/dashboard/EntityTree.tsx`
  - Removed `components/v3/dashboard/EntityTree.module.css`
- **Why this is safe:** `/app/admin/page.tsx` imports `components/AdminDashboard.tsx`, and no live route or component imports the deleted alternate dashboard implementation.
- **Verification:** Pending local validation after cleanup.

## 2026-05-03 — Unified admin entity contract foundation (#740)
- **Objective:** Replace page-local action remapping on Partner and Organization admin surfaces with a shared entity contract, capability matrix, and action execution layer.
- **Shared contract:** Added `/lib/adminEntitySystem.ts` with the canonical entity config shape, explicit capability vocabulary, action execution modes (`route`, `modal`, `share`, `mutation`), permission gating, and the helper that drives list/card actions from one source.
- **Entity mapping:** Moved the concrete Partner and Organization action/capability declarations into adapter-owned entity configs, eliminating the old `if (label === ...)` remapping pattern in both admin pages.
- **Page integration:** Updated `/app/admin/partners/page.tsx` and `/app/admin/organizations/page.tsx` to bind modal/share/mutation behavior through stable runtime keys instead of label matching.
- **Documentation:** Added `/docs/admin/admin-entity-system.md` as the canonical design note for the contract, capability matrix, and partner/org action mapping; linked it from `/docs/index.md`.
- **Verification:** Pending standard repo gates after implementation.

## 2026-04-24 — Organization report-generation parity
- **Objective:** Deliver organization report-generation parity with partner-level controls while preserving existing organization/member data.
- **Editor parity:** Extended `/organization-edit/[id]` via `OrganizationEditorDashboard` with report-style, report-template, clicker-set, logo URL, and emoji visibility controls, using existing dropdown sources and design-system form classes.
- **Compatibility-safe persistence:** Organization settings persist through `/api/admin/organizations/[id]` metadata updates, with legacy `reportId` mirrored from `reportTemplateId` to avoid regressions.
- **Resolver alignment:** Updated `/api/organizations/report/[id]` to resolve templates via `metadata.reportTemplateId`, fallback `metadata.reportId`, then default partner template.
- **Style wiring fix:** Organization editor now applies styles from `metadata.styleId` instead of `metadata.reportId`.
- **Documentation/version sync:** Bumped product version to `v12.1.8` and updated README, release notes, API docs, architecture notes, admin guide, and in-app API docs content.
- **Verification:** `npm run build` passed.

## 2026-04-24 — Organization admin data flow + docs sync
- **Objective:** Restore the shipped Organizations feature on top of the live `organizations` + `partners` data and synchronize product documentation/versioning.
- **Admin surface recovery:** Rewired `/admin/organizations` to the real admin data source, restored `Report`, `Edit Stats`, `Edit`, `Manage Members`, and `Delete`, and kept the unified predictive-search member selector.
- **API recovery:** Updated `/api/admin/organizations`, `/api/admin/organizations/[id]`, and `/api/admin/organizations/[id]/members` to use the live admin records first with guarded delete behavior and fallback compatibility for older V3 records.
- **Organization reporting:** Added `/api/organizations/report/[id]` and `/api/organizations/report/[id]/activities`, then updated the shared organization report hook to prefer those endpoints before falling back to legacy V3 report routes.
- **Documentation sync:** Bumped the product to `v12.1.7`, updated README, release notes, API reference, organization admin guide, reusable component inventory, API docs page, and embedded admin Help content.
- **Verification:** `npm run build` passed; DB sanity check confirmed `CHF` remained present in `organizations` with `8` assigned partners.
 
 ## 2026-03-17 — Report Content Slots Management (#48)
- **Objective:** Improve report content slot management with markdown presets and preview helpers.
- **Markdown Presets:** Added selector (Standard, Compact, Hero, Callout) for text charts; updated API, calculation engine, and rendering styles.
- **Image Preview Helper:** Implemented `ImagePreviewHelper` in the Builder UI for simultaneous 16:9, 9:16, and 1:1 previews.
- **Verification:** Created `tests/chart-preset-validation.test.ts`; verified preset propagation and rendering consistency. All gates (build, lint, type-check) passed.
- **Status:** Complete.

## 2026-03-16 — V3 Organization Context Middleware (#403)
 - **Objective:** Implement structural foundation for V3 multi-tenant scoping.
 - **Middleware Implementation:** Created `withOrgContext` wrapper in `lib/v3/middleware.ts` to inject `x-v3-org-id` headers derived from admin session.
 - **Hierarchy Scoping:** Implemented logic to map `superadmin` to `MASTER_ORG_ID` and other admins to their primary `organizationId`.
 - **Infrastructure Validation:** Created `/api/v3/health` endpoint to verify context injection.
 - **Quality Gate Compliance:** Verified full resolution through `npm run build` and `npm run lint` with zero errors or warnings.
 - **Status:** Complete.

 ## 2026-03-16 — Style Hardening Phase 5 (#72)
 - **Objective:** Consolidate duplicated hero components and remove dead assets as part of UI hardening.
 - **Admin Hero Migration:** Migrated `AdminDesignPage`, `CacheManagementPage`, `StyleEditorPage`, `QuickAddPage`, `AdminHomePage`, and `ChartAlgorithmManagerPage` from the legacy `AdminHero` to the `UnifiedAdminHeroWithSearch` system.
 - **Asset Deletion:** Deleted orphaned `AdminHero.tsx`, `AdminHero.module.css`, `AdminPageHero.tsx`, and `AdminPageHero.module.css` components and their associated styles.
 - **Inline Style Cleanup:** Removed inline styles from `AdminDesignPage` and moved them to a centralized `.temporaryNotice` class in `Design.module.css`.
 - **Quality Gate Compliance:** Verified full resolution through `npm run build` and `npm run lint` with zero errors or warnings.
 - **Status:** Complete.
 

## 2026-03-14 — Phase 15: Deep Hierarchy & Activity Connectivity
- **Objective:** Finalize the V3 organization hierarchy by connecting Partners to Organizations and enabling aggregated activity reporting.
- **Member Management:** Created `ManageMembersModal` and `POST /api/admin/organizations/[id]/members` to allow superadmins to assign Partners to specific Organizations.
- **Aggregated Reporting:** Implemented `OrganizationActivitiesList` (UI) and a specialized API endpoint to fetch all activities where an organization's members are participants or owners.
- **Sync Stabilization:** Refined `syncEngine.ts` to respect manual organization assignments and automatically inherit organization context for legacy-mapped activities.
- **Verification:** Verified that organization-level reports now aggregate metrics and list all member activities correctly.

## 2026-03-14 — UI Standards Enforcement (Organization Modal)
- **Objective:** Rectify hardcoded Tailwind styling and raw HTML inputs in the Organization creation/edit modals.
- **What changed:** Refactored `app/admin/organizations/page.tsx` to use `UnifiedTextInput` and `.form-input` classes instead of raw HTML inputs with ad-hoc `text-gray-*` and `border-gray-*` utility classes. Added explicit, assertive warning blocks to `HANDOVER.md` for future agents, demanding strict adherence to the global design token system.
- **Validation:** Visual inspection and build passed; inputs correctly inherit `var(--mm-gray-*)` design tokens and form behaviors.
- **Status:** Complete.

## 2026-03-10 15:27 CET — Antigravity Agent — Commit + Audit #367–#370 closure

- **Branch:** `landing-overhaul`
- **Commit:** `1f0c290a0` — `fix(api): expand page-password allow-list + audit core-vs-partner docs (#367 #368 #369 #370)`
- **Pushed:** `7eb3b7d4b..1f0c290a0` → `origin/landing-overhaul`

### What changed
- `app/api/page-passwords/route.ts`: added `partner-edit` and `hashtag` to `allowedPageTypes` in both POST and PUT handlers (audit #368 gap fix)
- `docs/2026-03-09_AUDIT_CORE_VS_PARTNER_FUNCTIONS.md`: new file tracked — full audit plan with completed Sections 5A, 5B, 5C (issues #367, #368, #369)
- `docs/architecture.md`: added `### Core vs Partner Resolution (2026-03-10)` subsection with resolution-order table and pointer to audit doc (issue #370)
- `docs/HANDOVER.md`: appended prior session audit milestone entries

### Quality gates
- `npm run build` ✅ (exit 0)
- `npm run type-check` ✅ (clean)
- `npm run lint` ✅ (warnings only — pre-existing `console` statements, not introduced here)

### SSOT
- #367 ✅ Closed — Checklist & resolution map (Section 5A)
- #368 ✅ Closed — Partner future-readiness artefacts + page-password allow-list gap fix (Section 5B)
- #369 ✅ Closed — Core shared vs partner-facing module list (Section 5C)
- #370 ✅ Closed — architecture.md Core vs Partner Resolution section

### Current state
- Branch `landing-overhaul` is clean (no uncommitted changes)
- PR to `main` remains open at https://github.com/moldovancsaba/messmass/pull/56
- `READMEDEV.md` remains intentionally local-only and untracked

### Next actions (for next agent)
1. Merge or update PR #56 (`landing-overhaul` → `main`) per repo merge policy
2. Pick next open SSOT card (e.g. `#72` style hardening or `#66`) from the board

---

## 2026-03-10 — Audit #367 (Core vs Partner): checklist and resolution map
- **Objective:** Complete audit checklist (Section 5) and resolution map for issue #367.
- **What changed:** Added Section 5A to \`docs/2026-03-09_AUDIT_CORE_VS_PARTNER_FUNCTIONS.md\`: checklist outcomes (Core/Partner/Mixed), resolution map (event report, partner report, event edit, partner edit), gap list. No code changes.
- **SSOT:** Start note and milestone comment posted on mvp-factory-control#367.
- **Next:** #367, #368, #369, #370 all have milestone deliverables. Move to Done when PO accepts. No further audit work pending unless PO requests.

## 2026-03-10 — Audit #368 (Partner future-readiness): routes, auth, API surface
- **Objective:** Deliver partner future-readiness artefacts for issue #368.
- **What changed:** Added Section 5B to \`docs/2026-03-09_AUDIT_CORE_VS_PARTNER_FUNCTIONS.md\`: partner-facing routes and auth table; route-level admin-only vs partner-visible vs shared; API list (admin-only vs partner-callable); notes for subdomain/auth boundary. No code changes.
- **Gap fixed:** \`/api/page-passwords\` allow list now includes \`partner-edit\` and \`hashtag\` in \`app/api/page-passwords/route.ts\` (POST and PUT).
- **SSOT:** Start note and milestone comment posted on mvp-factory-control#368.

## 2026-03-10 — Audit #369 (Core shared vs partner-facing module list)
- **Objective:** Produce list of modules/routes/APIs for SOW and Client Variant fork boundaries (issue #369).
- **What changed:** Added Section 5C to \`docs/2026-03-09_AUDIT_CORE_VS_PARTNER_FUNCTIONS.md\`: routes (admin-only, partner-facing, shared), API routes (admin-only, partner-callable, shared), lib/components (core shared vs partner-facing), fork boundary note.
- **SSOT:** Start note and milestone comment posted on mvp-factory-control#369.

## 2026-03-10 — Audit #370 (Documentation update — Core vs partner resolution)
- **Objective:** Update architecture doc with Core vs partner resolution summary and pointer to audit (issue #370).
- **What changed:** In \`docs/architecture.md\`, added subsection \`### Core vs Partner Resolution (2026-03-10)\` under Reporting System v12: resolution table (event report, partner report, event edit, partner edit × template, style, clicker set); implementation pointer; link to audit doc Sections 5A, 5B, 5C.
- **SSOT:** Start note and milestone comment posted on mvp-factory-control#370.

## 2026-03-07 13:10:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `96b36b037`
- Objective: Deliver `mvp-factory-control#359` by auditing the project root, removing non-canonical root artifacts, tightening ignore rules, and documenting the canonical top-level structure.

### What changed
- Audited the root-level tracked files against runtime/build/test/deploy requirements.
- Removed non-canonical root artifacts:
  - `.ai-plan.json`
  - `.dev-pid`
  - `config.js`
  - `index.html`
  - `kyc-audit-report.json`
  - `package-lock`
  - `test-partner-emoji-visibility.js`
  - `test-title-overflow-fix.js`
- Tightened `.gitignore` for local/debug/generated root artifacts.
- Added canonical root-structure policy doc:
  - `docs/root-structure.md`
- Updated:
  - `README.md`
  - `docs/index.md`
  - `docs/operations/operations-release-notes.md`
  - `docs/operations/operations-action-plan.md`
- Prepared patch version `11.60.16` for the repository-structure cleanup.

### Validation
- Planned final gate set for this delivery:
  - `npm run build`
  - `npm run type-check`
  - `npm run lint`
  - `npm run version:verify`

### Known issues / risks
- The open PR path to `main` still remains PR-only under repository rules.
- `READMEDEV.md` remains intentionally local-only and untracked.

### Immediate next actions
1. Run the final gates for `11.60.16`.
2. Post evidence to SSOT card `#359`.
3. Commit and push the root-structure cleanup onto `landing-overhaul`.

## 2026-03-07 12:35:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `cf81373ad`
- Objective: Deliver `mvp-factory-control#358` by replacing the `__tests__` / `__fixtures__` conventions with a canonical `tests/` tree and updating every tracked reference that depends on those paths.

### What changed
- Moved tracked Jest suites from `__tests__/` into `tests/`.
- Moved LayoutV2 fixtures from `__fixtures__/layoutV2` into `tests/fixtures/layoutV2`.
- Updated:
  - `jest.config.js`
  - `.github/workflows/layout-grammar-tests.yml`
  - `scripts/check-layout-grammar-guardrail.ts`
  - fixture instructions and validation notes under `tests/fixtures/layoutV2`
  - current docs and archived references that named the old paths
- Prepared patch version `11.60.15` and release-note entry for the repository structure cleanup.

### Validation
- Planned final gate set for this delivery:
  - `npm run build`
  - `npm run type-check`
  - `npm run lint`
  - `npm run version:verify`
  - `npm test -- tests/layout-grammar --passWithNoTests`

### Known issues / risks
- The branch still cannot go directly to `main`; repository rules require merge through PR `#56`.
- `READMEDEV.md` remains an untracked local-only file and was not added to Git.
- The renamed layout-grammar Jest command still exposes pre-existing assertion failures in `tests/layout-grammar-runtime-enforcement.test.ts`; those failures are not caused by the directory migration.

### Immediate next actions
1. Run the final gates for `11.60.15`.
2. Post evidence to SSOT card `#358`.
3. Commit and push the path migration onto `landing-overhaul` so PR `#56` reflects the cleanup.

## 2026-03-06 14:05:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `77a8a7f59`
- Objective: Execute style hardening Phase 5 by consolidating duplicated CSS in equivalent editor state shells.

### What changed
- Activated SSOT card `#72` on Project 1.
- Added shared stylesheet `app/styles/editor-states.module.css` for loading/error states used by both event and partner editors.
- Updated:
  - `app/edit/[slug]/page.tsx`
  - `app/partner-edit/[slug]/page.tsx`
- Removed duplicated local CSS modules:
  - `app/edit/[slug]/page.module.css`
  - `app/partner-edit/[slug]/page.module.css`
- Removed dead unreferenced CSS modules:
  - `app/admin/bitly/bitly.module.css`
  - `app/partner-report/[slug]/PartnerReport.module.css`
- Prepared patch version `11.60.3` and release-note entry for the consolidation.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> pending until version artifacts are written for `11.60.3`

### Known issues / risks
- Additional CSS duplication remains elsewhere in the repo; this delivery currently covers the shared editor-state duplication and a pair of dead unreferenced route-local CSS modules.

### Immediate next actions
1. Write version artifacts for `11.60.3`.
2. Post evidence to SSOT card `#72`.
3. Commit, push, and continue with the next actionable duplication target if the card scope remains open.

## 2026-03-06 14:35:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `b9dcfabc1`
- Objective: Continue `#72` by removing dead CSS artifacts that duplicate already-canonical shared style layers.

### What changed
- Removed dead unreferenced utility module:
  - `app/styles/utilities.module.css`
- Confirmed the canonical utility layer remains:
  - `app/styles/utilities.css` imported by `app/globals.css`
- Prepared patch version `11.60.4` and release-note entry for this additional Phase 5 cleanup slice.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- `#72` still has remaining Phase 5 scope if more duplicate or dead CSS artifacts are found, but this slice is isolated to one unused utility module with no active imports.

### Immediate next actions
1. Run validation gates for `11.60.4`.
2. Post evidence to SSOT card `#72`.
3. Commit, push, and continue with the next actionable duplication target if the card scope remains open.

## 2026-03-06 14:55:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `43fd6308f`
- Objective: Continue `#72` by removing additional dead admin CSS modules with no live imports.

### What changed
- Removed dead unreferenced admin modules:
  - `app/admin/admin.module.css`
  - `app/admin/categories/Categories.module.css`
  - `app/admin/events/Projects.module.css`
- Prepared patch version `11.60.5` and release-note entry for this additional Phase 5 cleanup slice.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- `#72` remains open because additional style-system duplication may still exist outside these dead admin artifacts.

### Immediate next actions
1. Run validation gates for `11.60.5`.
2. Post evidence to SSOT card `#72`.
3. Commit, push, and continue with the next actionable duplication target if the card scope remains open.

## 2026-03-06 15:10:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `eaf767a50`
- Objective: Continue `#72` by removing another dead route-local stylesheet with no live import path.

### What changed
- Removed dead unreferenced route module:
  - `app/api-docs/page.module.css`
- Confirmed the active API docs page continues to use:
  - `app/admin/help/page.module.css`
- Prepared patch version `11.60.6` and release-note entry for this additional Phase 5 cleanup slice.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- `#72` remains open because more dead or duplicated CSS may still exist, but this slice is isolated to a single route module with no active imports.

### Immediate next actions
1. Run validation gates for `11.60.6`.
2. Post evidence to SSOT card `#72`.
3. Commit, push, and continue with the next actionable duplication target if the card scope remains open.

## 2026-03-06 15:25:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `1c0ea0c75`
- Objective: Continue `#72` by removing dead backup artifacts from the active partners admin tree.

### What changed
- Removed dead inactive partners backup page:
  - `app/admin/partners/page_old_backup.tsx`
- Removed the orphaned stylesheet only imported by that backup page:
  - `app/admin/partners/PartnerManager.module.css`
- Prepared patch version `11.60.7` and release-note entry for this additional Phase 5 cleanup slice.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- `#72` remains open because additional dead or duplicated style assets may still exist elsewhere in the app tree.

### Immediate next actions
1. Run validation gates for `11.60.7`.
2. Post evidence to SSOT card `#72`.
3. Commit, push, and continue with the next actionable duplication target if the card scope remains open.

## 2026-03-07 09:35:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `fef3937d7`
- Objective: Continue `#72` by removing the remaining `.OLD.css` report artifacts and cleaning the stale audit/doc references to those files.

### What changed
- Removed dead legacy stylesheets:
  - `app/partner-report/[slug]/page.module.OLD.css`
  - `app/report/[slug]/page.module.OLD.css`
- Updated the archived admin UI audit pack so the report evidence points at the live `app/report/[slug]/page.tsx` route instead of a deleted stylesheet.
- Removed obsolete hardcoded-values inventory rows that referenced the deleted partner-report `.OLD.css` file.
- Prepared patch version `11.60.9` and release-note entry for this additional Phase 5 cleanup slice.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- `#72` remains open for any remaining duplicate or dead CSS artifacts outside this low-risk report cleanup slice.

### Immediate next actions
1. Post evidence to SSOT card `#72`.
2. Commit and push `11.60.9`.
3. Continue with the next actionable duplication target if the card scope remains open.

## 2026-03-07 10:05:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `63371a540`
- Objective: Continue `#72` by removing stale current-doc references to deleted CSS modules and syncing the audit inventory with the cleaned source tree.

### What changed
- Updated current docs to reference live shared stylesheets instead of deleted CSS modules:
  - `docs/components/components-reusable-components-inventory.md`
  - `docs/architecture.md`
- Removed obsolete `docs/audits/hardcoded-values-inventory.csv` rows that still referenced deleted `app/partner-report/[slug]/PartnerReport.module.css` and `app/partner-edit/[slug]/page.module.css`.
- Prepared patch version `11.60.10` and release-note entry for this documentation-truth cleanup slice.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- `#72` remains open for any remaining duplicate or dead style assets or stale documentation references outside this low-risk truth-sync slice.

### Immediate next actions
1. Post evidence to SSOT card `#72`.
2. Commit and push `11.60.10`.
3. Continue with the next actionable duplication target if the card scope remains open.

## 2026-03-07 10:35:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `8ac4a2d95`
- Objective: Deliver SSOT issue `#354` by rebuilding the top-level README to the same quality bar as sibling product repos and syncing the related docs/versioning.

### What changed
- Rewrote `README.md` with:
  - centered logo/title presentation
  - badge row
  - quick navigation links
  - updated product overview and quick start
  - current documentation map
  - current delivery/SSOT discipline notes
- Prepared patch version `11.60.11` and release-note entry for the README refresh slice.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- README quality is now aligned with sibling repos, but the broader docs corpus still remains a continuing maintenance surface under active SSOT work.

### Immediate next actions
1. Post evidence to SSOT card `#354`.
2. Commit and push `11.60.11`.
3. Continue the queued work.

## 2026-03-07 11:10:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `ac364fd2b`
- Objective: Deliver SSOT issue `#355` by moving the repo to a runtime-only Git tracking policy.

### What changed
- Updated `.gitignore` to exclude local-only directories:
  - `.cursor/`
  - `.kiro/`
  - `.vscode/`
  - `.swc/`
  - `agentic/`
  - `backups/`
  - `codex_skills/`
  - `memory/`
  - `temp/`
- Removed the already-tracked files in those directories from Git with `git rm --cached`, without deleting the local copies.
- Prepared patch version `11.60.12` and release-note entry for the repository hygiene cleanup.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- These directories will remain on local disk but are no longer part of the tracked source tree. Any future content inside them will stay local unless explicitly force-added.

### Immediate next actions
1. Post evidence to SSOT card `#355`.
2. Commit and push the Git tracking cleanup.
3. Continue the queued work.

## 2026-03-07 11:40:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `9ff1f7281`
- Objective: Deliver SSOT issue `#356` by renaming the tracked product name from `MessMass` to `{messmass}` everywhere in the repository.

### What changed
- Replaced exact tracked `MessMass` occurrences with `{messmass}` across code, docs, metadata, UI copy, styles, scripts, and assets.
- Synced the README badge/version display to the new patch version.
- Prepared patch version `11.60.13` and release-note entry for the branding normalization slice.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- This was an exact-string rename pass. Lowercase `messmass` identifiers, paths, domains, and repo names were intentionally left unchanged.

### Immediate next actions
1. Post evidence to SSOT card `#356`.
2. Commit and push the branding rename.
3. Continue the queued work.

## 2026-03-07 12:10:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `59988926b`
- Objective: Deliver SSOT issue `#357` by removing the remaining root-level local-only artifacts from Git tracking and preparing the branch for `main`.

### What changed
- Updated `.gitignore` to exclude:
  - `.vercel-build-trigger`
  - `MEMORY.md`
  - `SOUL.md`
  - `USER.md`
  - `agent-working-loop-canonical-operating-document.md`
  - `coding-standards.mdc`
  - `.gitignore 2`
- Removed those files from Git tracking while keeping local copies.
- Confirmed that `tests` and `tests/fixtures/layoutV2` remain tracked because they are real validation assets.
- Prepared patch version `11.60.14` and release-note entry for the final visibility cleanup slice.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- The branch is clean for promotion after this slice, but pushing to `main` will still require an explicit Git step after validation.

### Immediate next actions
1. Post evidence to SSOT card `#357`.
2. Commit, push, and promote the cleaned branch to `main`.
3. Continue the queued work from `main`.

## 2026-03-07 09:05:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `fdc4af424`
- Objective: Continue `#72` by removing non-canonical backup files still living under the active `app/` source tree.

### What changed
- Removed dead backup files:
  - `app/admin/design/Design.module.css.backup`
  - `app/api/projects/edit/[slug]/route.ts.backup`
  - `app/api/public/events/[id]/stats/route.ts.bak`
- Updated the one historical release-note reference that still mentioned the old design backup artifact.
- Prepared patch version `11.60.8` and release-note entry for this additional Phase 5 cleanup slice.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- `#72` remains open because the remaining `.OLD.css` files still have audit/doc references and should be handled in a dedicated follow-up cleanup slice.

### Immediate next actions
1. Post evidence to SSOT card `#72`.
2. Commit and push `11.60.8`.
3. Continue with the next actionable duplication target if the card scope remains open.

## 2026-03-06 13:10:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `d464ab33f`
- Objective: Fix admin `totalFans` drift across event surfaces and align partner admin card-view report-edit behavior with the working list-view path.

### What changed
- Created SSOT bug cards `#348` and `#349` in `moldovancsaba/mvp-factory-control`, attached them to Project 1, and moved both into active tracked delivery.
- Added `getStoredOrDerivedTotalFans(...)` in `lib/projectStatsUtils.ts` so admin surfaces prefer stored `stats.totalFans` and only derive from legacy fields when that value is absent.
- Updated admin Total Fans surfaces:
  - `lib/adapters/projectsAdapter.tsx`
  - `app/admin/events/ProjectsPageClient.tsx`
  - `app/admin/dashboard/page.tsx`
  - `app/admin/filter/page.tsx`
  - `/api/projects` total-fans sort path
- Fixed partner admin card-view `Edit Stats` so it uses `_id || viewSlug`, matching the working list-view path.
- Added a dedicated hotfix note at `docs/2026-03-06_ADMIN_TOTALFANS_PARTNER_CARD_EDIT_HOTFIX.md`.
- Prepared the repo for patch version `11.60.2`.

### Validation
- Planned and required for closure:
  - `npm run build`
  - `npm run type-check`
  - `npm run lint`
  - `npm run version:verify`
  - `python3 scripts/docs_inventory.py`
  - `python3 scripts/docs_triage.py`
  - `python3 scripts/docs_link_check.py`
  - `python3 scripts/docs_canonical_map.py`

### Known issues / risks
- Existing unrelated working-tree changes still predate this work and remain untouched.

### Immediate next actions
1. Run the full validation gate set for the new hotfix.
2. Post evidence to SSOT cards `#348` and `#349`.
3. Commit, push, and continue with the next tracked delivery item without stopping.

## 2026-03-06 12:15:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `31978dfd6`
- Objective: Track and document two production hotfixes separately: partner report related-event cards showing Total Fans Engaged and the admin delete-project failure path.

### What changed
- Created SSOT bug cards `#345` and `#346` in `moldovancsaba/mvp-factory-control` and attached them to Project 1.
- Set `#345` to `In Progress (NOW)` with a start note; set `#346` to `Ready (NEXT)` with a planning note.
- Documented the hotfix scope and implementation in `docs/2026-03-06_PARTNER_REPORT_DELETE_HOTFIX.md`.
- Prepared the repo for a patch version update from `11.60.0` to `11.60.1` tied to these production fixes.

### Files touched
- `docs/2026-03-06_PARTNER_REPORT_DELETE_HOTFIX.md`
- `docs/index.md`
- `docs/messmass-codex-brain-dump.md`
- `docs/HANDOVER.md`
- `docs/operations/operations-action-plan.md`
- `docs/operations/operations-release-notes.md`
- `package.json`
- `package-lock.json`

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed after rerunning once `.next/types` was regenerated by build
- `npm run version:verify` -> passed
- `npm run lint` -> failed on pre-existing repo-wide issues outside `#345` / `#346` scope (for example `app/dashboard/filter/[filterSlug]/page.tsx`, `components/ChartBuilderImage.tsx`, `components/LandingKPIChart.tsx`, `components/ReportStylePreview.tsx`)

### Known issues / risks
- Repo-wide lint remains a required gate and may still fail on work outside the two hotfix files.
- Several unrelated working-tree changes predate this work and remain untouched.

### Immediate next actions
1. Commit and push the `11.60.1` release-doc/version follow-up.
2. Decide whether to clear the repo-wide lint backlog now or keep `#345` and `#346` blocked until that broader gate is addressed.
3. Continue with the next tracked board item after the hotfix branch state is recorded.

## 2026-03-06 10:23:04 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `747eb0a40`
- Objective: Restore the missing {messmass} `docs/PROJECT_MANAGEMENT.md` and `docs/HANDOVER.md` using the established structure from the sibling `reply` and `hatori` projects.

### What changed
- Added `docs/PROJECT_MANAGEMENT.md` to define {messmass} SSOT rules, board cadence, and manual GitHub CLI fallback commands.
- Added `docs/HANDOVER.md` to provide onboarding context, current repo truth, canonical doc links, and a dated handover log.
- Updated the docs entrypoints to reference the newly restored files.

### Files touched
- `docs/PROJECT_MANAGEMENT.md`
- `docs/HANDOVER.md`
- `docs/index.md`
- `docs/messmass-codex-brain-dump.md`

### Validation
- `find /Users/moldovancsaba/Projects/reply -type f \( -name 'PROJECT_MANAGEMENT.md' -o -name 'HANDOVER.md' \)` -> confirmed sibling source files exist
- `find /Users/moldovancsaba/Projects/hatori -type f \( -name 'PROJECT_MANAGEMENT.md' -o -name 'HANDOVER.md' \)` -> confirmed sibling source files exist
- `sed -n '1,260p'` on sibling docs -> extracted structure for SSOT and handover format
- `git status --short` before edits -> confirmed dirty tree and avoided unrelated files

### Known issues / risks
- The active SSOT card for the next delivery is still not confirmed in this repo context.
- Existing dirty files predate this change and were left untouched.

### Immediate next actions
1. Confirm the active {messmass} board card before any product implementation work.
2. Add a start note on that card using the cadence in `docs/PROJECT_MANAGEMENT.md`.
3. Keep `docs/HANDOVER.md`, `docs/NEXT_AGENT_PROMPT.md`, and the board in sync after each meaningful milestone.

## 2026-03-06 10:57:03 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `747eb0a40`
- Objective: Deliver `mvp-factory-control#56` with tracked child issues, admin hero standardization, width/content-surface normalization, inline-style cleanup in touched scope, and documentation/version/release-note sync.

### What changed
- Created tracked child issues on the SSOT board for the five-part delivery under parent `#56`.
- Extended `UnifiedAdminHeroWithSearch` to support badges so migrated admin pages can use one canonical hero path.
- Migrated touched admin management pages from `AdminHero` to `UnifiedAdminHeroWithSearch`.
- Normalized touched pages onto `.page-container` as the shared outer shell and removed local outer-width drift from styles/insights/help.
- Removed inline styles from touched scope:
  - help page guest notice moved to CSS modules
  - event action icons moved to CSS class styling
  - style swatches render via SVG instead of React `style`
  - dashboard gender bar uses SVG geometry instead of inline width styles
- Updated canonical admin UI guidance and release artifacts.

### Files touched
- `components/UnifiedAdminHeroWithSearch.tsx`
- `components/UnifiedAdminHeroWithSearch.module.css`
- `app/admin/dashboard/page.tsx`
- `app/admin/styles/page.tsx`
- `app/admin/styles/styles.module.css`
- `app/admin/insights/page.tsx`
- `app/admin/insights/page.module.css`
- `app/admin/content-library/page.tsx`
- `app/admin/mainpage/page.tsx`
- `app/admin/messages/page.tsx`
- `app/admin/help/page.tsx`
- `app/admin/help/page.module.css`
- `app/admin/events/ProjectsPageClient.tsx`
- `app/admin/events/Projects.module.css`
- `app/styles/layout.css`
- `docs/operations/admin-ui-width-and-hero.md`
- `docs/messmass-codex-brain-dump.md`
- `docs/operations/operations-release-notes.md`
- `package.json`

### Validation
- Planned final gate set for this delivery:
  - `npm run build`
  - `npm run lint`
  - `npm run type-check`
  - `npm run version:verify`
  - `python3 scripts/docs_inventory.py`
  - `python3 scripts/docs_triage.py`
  - `python3 scripts/docs_link_check.py`
  - `python3 scripts/docs_canonical_map.py`

### Known issues / risks
- Existing unrelated dirty files predate this delivery and remain untouched.
- All admin pages and report components are now standardized on Unified components.

### Immediate next actions
1. Run the full validation gates and fix any failures.
2. Post milestone/done evidence to child issues `#340`-`#344` and parent `#56`.
3. Commit and push once the build, lint, type-check, docs, version, and release notes are green.
