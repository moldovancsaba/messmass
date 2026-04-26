# Audit Plan: Separating Core vs Partner-Level Functions

**Status:** Draft (audit plan only — no code changes)  
**Last Updated:** 2026-03-09  
**Owner:** Product / Engineering  
**Canonical:** No  

**Contract reference:** Private Label Product Licence and Agile Delivery Agreement (Licensor: Moldován Csaba Kft; Client: Seyu Solutions Kft). Key terms summarised in Section 6. This audit prepares future partner solutions and planning in line with that contract.

---

## 1. Purpose

Define how to **audit and separate** platform **core** functions from **partner-manageable** functions, building on the existing partner-level clickers, reports, and styles. The goal is a clear inventory of what is core-only vs already partner-scoped, and a repeatable process to move or expose more functions at partner level where appropriate.

**Future vision (to prepare for):** Partner-level separation with dedicated **partner UI, functions, and access** — e.g. a dedicated partner surface such as **`https://partner.messmass.com`** (or equivalent subdomain/host), where partners log in and use only partner-scoped features (reports, content edit, analytics, settings) without seeing admin or other partners. The audit should identify what to investigate and how to prepare planning for that evolution.

---

## 2. Definitions

| Term | Meaning |
|------|--------|
| **Core** | Platform-level: single source of truth, default/global behaviour, admin-only configuration. Not overridable per partner. |
| **Partner-level (partner-manageable)** | Configurable or assignable per partner. Partners (or admins on behalf of partners) can choose or customize within allowed options. |
| **Separation** | Clearly identifying and, where needed, refactoring code/APIs/UI so that partner-level behaviour is resolved from partner context (e.g. `partner.styleId`, `partner.reportTemplateId`, `partner.clickerSetId`) and core remains the fallback. |

---

## 3. Current State: What Is Already Partner-Level

These are **already** managed at partner level (assigned or resolved per partner).

### 3.1 Clicker sets (variable groups)

- **Data:** `partner.clickerSetId` → links partner to a clicker set; events under that partner use that set for clicker/manual mode.
- **Admin:** Partner create/edit has “Clicker Set” dropdown; null = default set.
- **Editor:** `EditorDashboard` (event edit) resolves groups via project’s partner `clickerSetId`; fallback to default set with non-blocking warning.
- **APIs:** `GET/POST /api/variables-groups` require `clickerSetId`; `GET /api/clicker-sets` lists sets with usage.
- **Docs:** `docs/admin/admin-clicker-manager.md`.

### 3.2 Report template (layout)

- **Data:** `partner.reportTemplateId` (in UI/API; resolver may use `reportId` in DB — confirm mapping).
- **Resolution:** `ReportResolver.resolveForPartner(partner)` → partner report → system default. Event report uses `resolveForProject(project)` → project → partner → default.
- **API:** `GET /api/reports/resolve?partnerId=...` for partner report layout.
- **Hooks:** `useReportLayoutForPartner(partnerId)` used by `PartnerReportView`.
- **Docs:** `lib/report-resolver.ts`, `hooks/useReportLayout.ts`.

### 3.3 Report style (theme/colors)

- **Data:** `partner.styleId` → 26-color report theme.
- **Resolution:** Event: `project.styleIdEnhanced || partner.styleId || template.styleId`. Partner report: `partner.styleId || template.styleId`.
- **Admin:** Partner form has “Report Visual Style” dropdown.
- **APIs:** Styles CRUD at `/api/report-styles`; report config resolution applies hierarchy.
- **Docs:** `docs/admin/admin-style-model-and-assignment-rules.md`.

### 3.4 Partner report page and editor

- **Routes:** `/partner-report/[slug]` (public), `/dashboard/partner/[partnerId]` (SSO), `/partner-edit/[slug]` (content editor).
- **Partner edit:** `PartnerEditorDashboard` — partner-level content (e.g. report text/image placeholders); style applied via `partner.styleId`; layout from partner report template.
- **APIs:** `GET /api/partners/edit/[slug]`, `GET /api/partners/report/[slug]`.

### 3.5 Partner-level content (stats placeholders)

- **Data:** `partner.stats` — report content fields (e.g. `reportText*`, `reportImage*`) for partner report; numeric/aggregate data comes from events.
- **Scope:** Content only; no duplication of core calculation logic.

---

## 4. Core vs Partner: Audit Dimensions

Use these dimensions to classify each function/feature.

| Dimension | Core-only | Partner-manageable (or mixed) |
|-----------|-----------|--------------------------------|
| **Configuration** | Global defaults, system-wide settings | Per-partner assignment (e.g. style, template, clicker set) |
| **Data scope** | All partners/events | Scoped by `partnerId` or partner slug |
| **API** | No `partnerId`/partner context | Accepts partner context or resolves via partner |
| **UI** | Admin global only | Partner edit and/or partner report/editor |
| **Resolution order** | N/A or single level | Explicit hierarchy (e.g. event → partner → default) |

---

## 5. Audit Checklist: Functions to Classify

Work through these areas and mark each as **Core**, **Partner**, or **Mixed** (and note gaps).

### 5.1 Report / layout

- [ ] **Report template list** (`/api/report-templates`, admin Visualization): Core (admin) or any partner visibility?
- [ ] **Report template assignment**: Partner has `reportTemplateId`; event has project-level report override. Document resolution path in one place.
- [ ] **Report config API** (`/api/report-config/[identifier]`): Confirm it uses partner when identifier is partner-scoped.
- [ ] **Layout resolution** (`/api/reports/resolve`): Already supports `projectId` and `partnerId`. Confirm all consumers pass the right id.

### 5.2 Styles

- [ ] **Style list/CRUD** (`/api/report-styles`, `/api/report-styles/[id]`): Core (admin). No partner-specific CRUD; partners only *choose*.
- [ ] **Style resolution**: Already hierarchical (event → partner → template). Confirm no code paths bypass partner.
- [ ] **Filter/hashtag reports**: Per docs, they use resolved template’s style; confirm no partner leakage where not intended.

### 5.3 Clicker / variable groups

- [ ] **Variable groups API** (`/api/variables-groups`): Requires `clickerSetId`; scoped per set. Core: default set; partner: sets assigned via `partner.clickerSetId`.
- [ ] **Clicker sets API** (`/api/clicker-sets`): Core (admin). Partners do not create sets; they are only assigned one.
- [ ] **EditorDashboard**: Already uses partner’s `clickerSetId` (from project’s partner). Confirm fallback message and no global write.

### 5.4 Event edit vs partner edit

- [ ] **Event edit** (`/edit/[slug]`): Uses project; report/clicker/style resolved via project → partner → default. List which of these are already partner-derived.
- [ ] **Partner edit** (`/partner-edit/[slug]`): Uses partner only; style and layout from partner. No event-level overrides.
- [ ] **Builder mode**: Event edit has Builder; partner edit has content only. Confirm no shared code path that wrongly uses event when in partner context.

### 5.5 Page passwords / access

- [ ] **Page passwords** (`lib/pagePassword.ts`, `/api/page-passwords`): Types include `partner-report`, `partner-edit`. Confirm all partner entry points use these types and correct `pageId` (slug/id).

### 5.6 Other APIs that might need partner scope

- [ ] **Landing/static** (`/api/admin/landing-static-generate`): Core or per-partner landing?
- [ ] **Hashtag/filter** APIs: Resolve style/template via filter/hashtag config; confirm no direct partner assignment unless designed.
- [ ] **Analytics** (`/api/analytics/partner/[partnerId]`, etc.): Already partner-scoped; confirm no cross-partner data.

### 5.7 Partner subdomain / dedicated access (future: e.g. partner.messmass.com)

- [ ] **Current access model:** Today partner entry is via main domain paths (`/partner-report/[slug]`, `/partner-edit/[slug]`, `/dashboard/partner/[partnerId]`). Document all partner-facing URLs and auth (page password, SSO).
- [ ] **Routing / host split:** What would need to change to serve a dedicated partner host (e.g. `partner.messmass.com`): middleware, env (e.g. `NEXT_PUBLIC_PARTNER_ORIGIN`), cookie/session scope, CORS?
- [ ] **Auth boundary:** How does SSO and page-password scope today? Single tenant vs future multi-tenant (partner A cannot see partner B). List any shared session or global state that would need to be partner-scoped.
- [ ] **Partner-only UI surface:** Which routes/components must be **hidden** from partner users (admin-only) vs **shown** (partner dashboard, report, edit, settings). Produce a route-level list: admin-only vs partner-visible vs shared.
- [ ] **API surface for partner-only:** Which APIs are admin-only vs safe to call in a partner context (with `partnerId` or partner identity from auth). List APIs that would need partner-scoping or new partner-only endpoints.

---

## 5A. Audit Results (Issue #367 — Checklist & Resolution Map)

*Executed 2026-03-10. No code changes.*

### Checklist outcomes (Core / Partner / Mixed)

| Area | Item | Classification | Notes |
|------|------|-----------------|--------|
| **5.1 Report/layout** | Report template list | **Core** | Admin only. |
| | Report template assignment | **Partner** | Partner/project have reportTemplateId; resolution in report-config: project → partner → default. Note: report-resolver uses reportId/reports; report-config uses reportTemplateId/report_templates. |
| | Report config API | **Mixed** | Uses partner when type=partner; project→partner→default when type=project. Style hierarchy applied. |
| | Layout resolution | **Partner** | projectId/partnerId supported; useReportLayout uses report-config, not /api/reports/resolve. |
| **5.2 Styles** | Style list/CRUD | **Core** | Admin only. |
| | Style resolution | **Partner** | Event→partner→template in report-config. |
| | Filter/hashtag | **Core/Mixed** | Via config; no direct partner. |
| **5.3 Clicker** | Variable groups API | **Mixed** | clickerSetId scoped; default = core. |
| | Clicker sets API | **Core** | Admin only. |
| | EditorDashboard | **Partner** | partner clickerSetId → default fallback. |
| **5.4 Edit** | Event edit | **Mixed** | Template/style/clicker from project→partner→default. |
| | Partner edit | **Partner** | Partner only. |
| | Builder mode | **Core (event)** | Event only; partner edit content only. |
| **5.5 Page passwords** | Types | **Partner** | partner-report, partner-edit in pagePassword.ts. |
| **5.6 Other** | Landing, hashtag/filter, analytics | **Core / Mixed / Partner** | Analytics partner-scoped. |

### Resolution map (template, style, clicker set)

| Surface | Template | Style | Clicker set |
|---------|----------|-------|-------------|
| Event report | project → partner → default (report-config) | project → partner → template | N/A |
| Partner report | partner → default | partner → template | N/A |
| Event edit | same as event report | same as event report | partner.clickerSetId → default |
| Partner edit | partner → default | partner.styleId | N/A |

### Gap list

- Align reportId (report-resolver) vs reportTemplateId (report-config, partner.types) in docs.
- Section 5.7 (partner subdomain) → Issue #368.

---

## 5B. Partner Future-Readiness Artefacts (Issue #368)

*Executed 2026-03-10. No code changes.*

### Partner-facing routes and auth

| Route | Auth | Notes |
|-------|------|--------|
| \`/partner-report/[slug]\` | Page password (\`partner-report\`) | Public shareable; PagePasswordLogin; \`pageId\` = partner slug (viewSlug or _id). |
| \`/partner-edit/[slug]\` | Page password (\`partner-edit\`) | Content editor; \`pageId\` = partner slug. **Fixed (2026-03-10):** \`/api/page-passwords\` allow list now includes \`partner-edit\` and \`hashtag\` (was audit #368 gap). |
| \`/dashboard/partner/[partnerId]\` | SSO | Partner-level aggregated report; reuses PartnerReportView. |

### Route-level: admin-only vs partner-visible vs shared

| Classification | Routes |
|----------------|--------|
| **Admin-only** | \`/admin/*\` (login, events, partners, styles, clicker-manager, bitly, filter, users, dashboard, help, etc.). Must never render on a dedicated partner host. |
| **Partner-visible (today)** | \`/partner-report/[slug]\`, \`/partner-edit/[slug]\`, \`/dashboard/partner/[partnerId]\`. |
| **Shared (depends on context)** | \`/report/[slug]\`, \`/edit/[slug]\` (event; could be linked from partner context), \`/filter/[slug]\`, \`/hashtag/[hashtag]\` (password or public). \`/dashboard/filter/[filterSlug]\`, \`/dashboard/hashtag/[hashtag]\` (SSO). |

### APIs: admin-only vs partner-callable

| API | Used by partner surfaces? | Classification |
|-----|----------------------------|----------------|
| \`GET /api/partners/report/[slug]\` | Partner report | **Partner-callable** |
| \`GET /api/partners/edit/[slug]\` | Partner edit page load | **Partner-callable** |
| \`PUT /api/partners\` | Partner edit save (apiPut from PartnerEditorDashboard) | **Partner-callable** (writes partner-scoped content; must enforce slug/identity) |
| \`GET /api/reports/resolve?partnerId=\` | Partner report (useReportData) | **Partner-callable** |
| \`GET /api/report-config/[id]?type=partner\` | Partner report layout (useReportLayout) | **Partner-callable** |
| \`GET /api/report-styles/[id]\`, \`GET /api/report-styles\` | useReportStyle (partner report, partner edit) | **Partner-callable** (read-only) |
| \`GET /api/chart-config/public\` | Partner report | **Partner-callable** (public read) |
| \`POST /api/page-passwords\` (generate), \`GET /api/page-passwords\` (validate) | PagePasswordLogin for partner-report, partner-edit | **Partner-callable** (add \`partner-edit\` to allow list — see gap above) |
| \`/api/admin/*\` | Admin pages only | **Admin-only** |
| \`/api/analytics/partner/[partnerId]\`, \`/api/analytics/insights/partners/[partnerId]\` | Could be used by partner dashboard | **Partner-callable** if called with same partnerId as auth |

### Notes for subdomain / auth boundary (e.g. partner.messmass.com)

- **Current access:** All partner entry is on main domain; no host-based split today.
- **Routing/host split:** To serve a dedicated partner host (e.g. \`partner.messmass.com\`): middleware to detect host and restrict to partner-visible routes; env (e.g. \`NEXT_PUBLIC_PARTNER_ORIGIN\`); cookie/session scope (e.g. \`domain=partner.messmass.com\` or separate session store); CORS if partner frontend calls main-domain APIs.
- **Auth boundary:** Page passwords are per pageId+pageType (stored in \`page_passwords\`); no cross-partner leakage by design. SSO: dashboard/partner uses same SSO as rest of dashboard; for multi-tenant partner portal, SSO claims or session would need to include partnerId and APIs would need to enforce partnerId match. No shared global state that would leak across partners identified; session is the main boundary to define per partner host.

---

## 5C. Core Shared vs Partner-Facing / Client-Specific (Issue #369)

*Executed 2026-03-10. No code changes. For SOW and Client Variant fork boundaries.*

### Routes (app/)

| Classification | Paths |
|----------------|--------|
| **Admin-only** | \`app/admin/*\` (login, register, dashboard, events, partners, styles, clicker-manager, visualization, filter, bitly, kyc, charts, help, users, cache, analytics/*, etc.). Must not be exposed on a dedicated partner host. |
| **Partner-facing** | \`app/partner-report/[slug]/page.tsx\`, \`app/partner-edit/[slug]/page.tsx\`, \`app/dashboard/partner/[partnerId]/page.tsx\`. Can live in Client Variant; entry points for partner portal. |
| **Shared (platform)** | \`app/report/[slug]\`, \`app/edit/[slug]\`, \`app/filter/[slug]\`, \`app/hashtag/[hashtag]\`, \`app/dashboard/filter/[filterSlug]\`, \`app/dashboard/hashtag/[hashtag]\`, \`app/page.tsx\`, \`app/terms\`, \`app/privacy\`, \`app/api-docs\`. Used by both admin-linked flows and partner/public; core shared. |

### API routes (app/api/)

| Classification | Paths |
|----------------|--------|
| **Admin-only** | \`app/api/admin/*\` (auth, login, register, partners, projects, project-partners, filter-style, landing-*, local-users, users, clear-cache, clear-cookies, contact-inquiries, permissions, ui-settings, etc.). Not forked to Client as callable from partner UI. |
| **Partner-callable (partner-facing)** | \`api/partners/report/[slug]\`, \`api/partners/edit/[slug]\`, \`api/partners\` (PUT for partner content), \`api/reports/resolve\`, \`api/report-config/[identifier]\`, \`api/report-styles\`, \`api/report-styles/[id]\`, \`api/chart-config/public\`, \`api/page-passwords\`, \`api/analytics/partner/[partnerId]\`, \`api/analytics/insights/partners/[partnerId]\`, \`api/analytics/aggregates/partners\`. Safe to expose in partner context when caller identity/partnerId is enforced. |
| **Shared (platform)** | \`api/report-config\`, \`api/report-styles\`, \`api/projects/edit/[slug]\`, \`api/projects/stats/[slug]\`, \`api/variables-groups\`, \`api/page-passwords\`, \`api/csrf-token\`, \`api/upload-image\`, \`api/content-assets\`, \`api/chart-config\`, \`api/landing-report\`, \`api/public/partners\`, \`api/public/partners/[id]\`, \`api/public/partners/[id]/events\`, \`api/public/events/[id]\`, \`api/hashtags/filter-by-slug/[slug]\`, \`api/filter-slug\`, \`api/stats\`, \`api/me\`, \`api/auth/*\`. Used by both admin and partner or public; core shared. |

### Lib and components

| Classification | Examples |
|----------------|----------|
| **Core shared (Licensor)** | \`lib/db.ts\`, \`lib/report-resolver.ts\`, \`lib/pagePassword.ts\`, \`lib/partner.types.ts\`, \`lib/formulaEngine.ts\`, \`lib/report-calculator.ts\`, \`lib/config.ts\`, \`lib/slugUtils.ts\`, \`lib/auth.ts\`, \`lib/csrf.ts\`, \`lib/apiClient.ts\`, \`lib/logger.ts\`, design tokens and theme. Used across platform; not client-specific. Do not fork to Client as standalone; Client uses them via Client Variant build. |
| **Partner-facing (entry / UI)** | \`components/PartnerEditorDashboard.tsx\`, \`app/partner-report/PartnerReportView.tsx\`, \`app/partner-report/[slug]/PartnerEventsList.tsx\`, \`app/partner-edit/[slug]/page.tsx\`, \`app/partner-report/[slug]/page.tsx\`, \`app/dashboard/partner/[partnerId]/page.tsx\`. Can live in Client Variant; partner-only UI. |
| **Shared (used by partner and admin)** | \`components/ReportContent.tsx\`, \`components/ReportHero\`, \`components/ColoredCard.tsx\`, \`components/PagePasswordLogin.tsx\`, \`hooks/useReportStyle.ts\`, \`hooks/useReportLayout.ts\`, \`hooks/useReportData.ts\`, \`lib/report-calculator.ts\`, \`lib/reportTemplateTypes.ts\`. Core shared; part of platform. |

### Fork boundary (contract)

- **Client Variant branch may include:** Partner-facing routes and pages (5C routes/API tables above), partner-only components, Client branding assets and config, client-specific feature flags or env. Client does **not** receive ownership of core shared lib or shared API implementations; they receive a deployable instance that **uses** them.
- **Core shared modules (excluded from fork as “owned” code):** All of \`lib/*\` and shared \`components/*\`, \`hooks/*\`, and shared API route handlers remain Licensor’s; Client gets the right to use them as part of the Client Variant build and deploy.

---

## 6. Contract & Future Planning (Agile Client Contract)

### 6.1 Contract summary (key terms)

| Term | Meaning (contract) |
|------|--------------------|
| **Core Product** | {messmass} platform at messmass.com — source code, architecture, modules, APIs, documentation, know-how; owned/controlled by Licensor. |
| **Client Variant** | Private label, branded, configured version of the Core Product for Client: Client-specific branding, configuration, integrations, and feature development delivered for Client. |
| **Licence** | Perpetual, worldwide, **exclusive within the Sports Industry**: Client may use, operate, brand, market, distribute, commercialise, and **sublicense** the Client Variant to affiliates, resellers, partners, and end customers in the Sports Industry. |
| **Deliverable** | Separately identifiable work output: software increment, documentation, configuration, design, integration, etc. Each is **separately scoped, scored, accepted, releasable, and billable** (SOW / Sprint Backlog / Written Confirmation). |
| **Acceptance Criteria** | Agreed criteria for a Deliverable, Sprint item, or work output (in SOW, Sprint Backlog, or Written Confirmation). |
| **Definition of Done (DoD)** | Minimum quality, completion, testing, documentation, and deployment standards for work to be treated as complete. Schedule 1 example: coded and reviewed, acceptance criteria met, tested, demonstrated, documentation updated, deployed to agreed environment. |
| **Product Backlog** | Ordered list of features, user stories, tasks, defects, technical work, integrations, configurations for the Client Variant. Backlog-led agile; no single fixed-scope project unless SOW says so. |
| **Release Train** | Grouping of Deliverables into a managed release flow; each Deliverable remains separately identified, accepted, and priced. |
| **Source code access** | Client receives **branch access to fork the Client Variant only**: branding layer, configuration, client-specific modules, dedicated branches, deployable full instance **excluding core shared modules**. Client does **not** receive ownership of Core Product source code; may not fork the Core Product itself. |

### 6.2 Core Product capabilities (contract baseline)

The contract describes the Core Product as supporting, among other things:

- Real-time event statistics; partner and project administration; **public and partner report surfaces**; export flows
- Bitly analytics; sports fixture enrichment; quick event creation; **branded report-style configuration**
- **KYC / variable-driven custom reporting**; sponsor and partner reporting; event intelligence
- Sport-specific dashboards, analytics, report exports; **partner, activation, campaign, attribution** workflows
- Custom forms, KYC, variable-driven data collection, sport-specific reporting logic

**Audit implication:** The existing partner-level features (reports, styles, clickers, partner edit, partner report) are **Core Product** capabilities. Delivering a **partner portal** or **partner subdomain** (e.g. partner.messmass.com) as a coherent surface is a candidate **Deliverable** for the Client Variant (or for the Core Product). The audit's separation of core vs partner-level identifies what is already there and what must be scoped as distinct Deliverables with clear Acceptance Criteria and DoD.

### 6.3 How the audit supports the contract

| Contract requirement | How the audit helps |
|----------------------|---------------------|
| **Deliverables separately scoped** | Checklist (Section 5) and gap list identify discrete work items (e.g. Partner subdomain routing, Partner-only nav, Partner-scoped API layer). Each can be written as a Deliverable with a Delivery Score and Acceptance Criteria. |
| **Acceptance Criteria** | Resolution map and Core/Partner classification provide a verifiable baseline; audit evidence can support criteria such as no admin routes exposed on partner host. |
| **Definition of Done** | Audit deliverables support DoD: documentation updated, deployed to agreed environment — the audit states what docs to update and what partner environment implies (routes, APIs, auth). |
| **Client Variant fork (excl. core shared modules)** | Separation of core shared vs partner-facing / client-specific allows correct branching: partner-facing and client-specific modules in Client Variant branch; core shared modules remain Licensor's. |
| **Backlog prioritisation** | Gap list and what to investigate (6.4) feed the Product Backlog with concrete items; each can be estimated, scored, and scheduled in Sprints or Release Trains. |

### 6.4 What to investigate (for future partner solutions and SOWs)

1. **URL and access** — All partner-facing routes and which auth they use (page password, SSO). What a partner home or partner dashboard would need (links, nav, branding). Required for partner portal or partner.messmass.com Deliverable scoping.
2. **Data and API boundaries** — Every API that reads/writes partner-scoped or event data; mark admin-only vs partner-callable. Any API with no partner context: decide if it stays admin-only or gets a partner-scoped variant (backlog item).
3. **UI separation** — Admin-only routes/components (must never render on partner host). Partner-safe / partner-only components (reports, edit, analytics, partner settings). Defines what goes into partner surface Deliverable.
4. **Core shared vs client-specific / partner-facing** — Core shared: used across all tenants; stay in Licensor Core Product; not forked to Client. Partner-facing / client-specific: partner UI, partner-scoped API wrappers, Client branding, Client configuration; can live in Client Variant branch. Audit output: list of modules/routes/APIs in each category so SOWs and fork boundaries are unambiguous.
5. **Environments and deployment** — What agreed environment means for a partner portal (e.g. partner.messmass.com vs Client domain). Informs DoD and release steps.

### 6.5 How this audit prepares future planning

- **Phase 1 (this audit):** Produce checklist results, resolution map, gap list, route/API/UI lists (Sections 5 and 5.7), and core shared vs partner-facing / client-specific list. No code changes.
- **Phase 2 (backlog and SOW):** Turn gap list and investigation output into Product Backlog items and, where appropriate, SOW Deliverables with Acceptance Criteria and DoD. Prioritise per contract and Client Business Sponsor.
- **Phase 3 (implementation):** Each Deliverable implemented per READMEDEV.md; Acceptance Criteria and DoD from contract (and SOW) applied; Release Train used for release and invoicing.

---

## 7. Naming and Data Consistency

- **reportId vs reportTemplateId:** Resolver and some code use `reportId`; partner UI/API use `reportTemplateId`. Audit that DB field names and API contracts are consistent and documented (e.g. in `lib/report-resolver.ts` and partner types).
- **Style:** Codebase uses `styleId` and `styleIdEnhanced` (event). Keep one clear rule: event overrides partner, partner overrides template.

---

## 8. Recommended Audit Steps (Execution Order)

1. **Inventory**  
   - List every API route and major UI flow that touches report template, style, or clicker.  
   - For each, note: accepts partner context? Resolves via partner? Core-only?

2. **Map resolution paths**  
   - One diagram or table: for “event report”, “partner report”, “event edit”, “partner edit”, which of (template, style, clicker set) come from project vs partner vs default.

3. **Classify**  
   - Fill the checklist above (Core / Partner / Mixed) and note any function that is still core-only but should be partner-manageable.

4. **Gap list**  
   - Produce a short “Gap list”: functions that are currently core-only but desired at partner level, with priority.

5. **Document**  
   - Update `docs/architecture.md` (or a dedicated “Core vs partner resolution” section) with the resolution order and which functions are partner-manageable.  
   - Keep `docs/admin/admin-style-model-and-assignment-rules.md` and `docs/admin/admin-clicker-manager.md` in sync.

6. **Do not change code in this audit**  
   - This plan is audit-only. Implementation (e.g. adding new partner-level options or refactors) should be separate SSOT cards and follow READMEDEV.md.

7. **Investigate for partner subdomain / future access (Section 5.7)**  
   - Document partner-facing routes and auth; list what would be needed for a dedicated partner host (e.g. partner.messmass.com) and partner-only UI/API surface.

---

## 9. Deliverables of the Audit

- [ ] Completed checklist (Section 5) with Core / Partner / Mixed and notes.
- [ ] Resolution map (event report, partner report, event edit, partner edit) for template, style, clicker.
- [ ] Gap list: candidate functions to make partner-manageable (with PO priority).
- [ ] One architecture doc update: “Core vs partner resolution” summary and pointer to this audit.
- [ ] Partner future-readiness artefacts: partner-facing route list and auth; route-level admin-only vs partner-visible; API list (admin-only vs partner-callable); notes for subdomain/routing and auth boundary (for use with contract and roadmap).

---

## 10. References

| Doc / location | Purpose |
|----------------|--------|
| `docs/admin/admin-clicker-manager.md` | Clicker sets and partner assignment |
| `docs/admin/admin-style-model-and-assignment-rules.md` | Style hierarchy and assignment |
| `docs/features/features-partners-system-guide.md` | Partners system overview |
| `lib/report-resolver.ts` | Report resolution project/partner/default |
| `hooks/useReportLayout.ts` | Front-end layout resolution (projectId/partnerId) |
| `app/partner-edit/[slug]/page.tsx`, `components/PartnerEditorDashboard.tsx` | Partner editor |
| `app/partner-report/PartnerReportView.tsx` | Partner report view |
| `README.md` / `READMEDEV.md` | Rulebook; no autonomous implementation without SSOT card |
| Private Label Product Licence and Agile Delivery Agreement (Licensor: Moldován Csaba Kft; Client: Seyu Solutions Kft) | Contract: Core Product vs Client Variant, Deliverables, Acceptance Criteria, DoD, source code fork; Schedule 1 (SOW template), Schedule 2 (Sports Industry value areas) |

---

**End of audit plan.**
