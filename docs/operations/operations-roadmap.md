# Operations Roadmap
Status: Active
Last Updated: 2026-02-06
Canonical: Yes
Owner: Product + Engineering

**Reference:** [docs/operations/operations-implementation-complete.md](docs/operations/operations-implementation-complete.md), [docs/archive/_archive/audits/comprehensive-system-audit-plan-2026.md](docs/archive/_archive/audits/comprehensive-system-audit-plan-2026.md)  
**Admin Roadmap Status:** Canonical Admin roadmap tracking lives in [docs/operations/operations-action-plan.md](docs/operations/operations-action-plan.md).

---

## Completed work

Completed and DONE items are not listed here. See release notes in **`docs/archive/_archive/releases/`**.

---

## 🔧 Hardening & Follow-ups (From Audit Residual Risks)

### Layout Grammar Editor Integration
**Priority:** High  
**Status:** Future  
**Dependencies:** Layout Grammar validation logic (exists), Editor UI  
**Source:** `docs/operations/operations-implementation-complete.md` (Explicit Non-Goals)

**Technical Intent:**
- Integrate Layout Grammar validation into editor UI
- Block invalid configurations before save (e.g., scrolling, truncation, clipping violations)
- Provide real-time feedback during report editing

**Trigger:** Editor UI refactoring or new editor features

**Non-Goals:**
- Runtime validation already exists (console warnings)
- This is editor blocking, not runtime enforcement

---

### Height Calculation Accuracy Improvements
**Priority:** Medium  
**Status:** Future  
**Dependencies:** None  
**Source:** `docs/operations/operations-implementation-complete.md` (Residual Risks)

**Technical Intent:**
- Refine BAR chart height calculation (currently uses estimated 40px label height)
- Refine PIE chart legend height calculation (currently assumes 30% → 50% growth)
- Account for actual font size and content wrapping behavior

**Trigger:** Reports with extreme content density or font size variations

**Non-Goals:**
- Current estimates are sufficient for most use cases
- This is fine-tuning, not a critical issue

---

### Table Chart Height Control (Per-Block / Per-Chart)
**Priority:** Low  
**Status:** Future  
**Dependencies:** LayoutV2 contract changes + editor UI changes + renderer changes  
**Source:** `docs/archive/_archive/design/TABLE_CHART_HEIGHT_CONTROL_PLAN.md` (archived design plan)

**Intent:**
- Provide more granular height control for TABLE charts beyond block-level `blockAspectRatio`.
- Support “table height = blockWidth × multiplier” style ergonomics for cases with many rows or dense content.

**Notes:**
- Any implementation must stay aligned with Layout Grammar invariants (no scrolling, no clipping, determinism).
- If editor UI cannot support this cleanly, keep it as a TABLE-only block enhancement first.

---

### Performance Optimization Pass
**Priority:** Low  
**Status:** Future  
**Dependencies:** None  
**Source:** `docs/operations/operations-implementation-complete.md` (Explicit Non-Goals)

**Technical Intent:**
- Performance optimizations beyond correctness requirements
- Render performance improvements for large reports
- Memory optimization for chart rendering

**Trigger:** Performance profiling or user-reported performance issues

**Non-Goals:**
- Correctness was prioritized over performance in audit
- This is optimization, not correctness

---

---

### Audit Automation & Guardrails
**Priority:** Medium
**Status:** Future
**Dependencies:** None
**Source:** `docs/archive/_archive/audits/comprehensive-system-audit-plan-2026.md` (archived audit plan)

Convert "audit should be done" items into durable tooling/guardrails:
- ESLint rules: hardcoded colors; inline styles (allow computed token-driven only); design token usage
- Pre-commit hook (or CI check) for Layout Grammar violations (only if approved as delivery-infra work)
- Automated audit script (repeatable scanning + reporting)
- Audit schedule agreed and documented

## 🚀 Next Engineering Phase (New Work, Not Audit)

### Advanced Analytics & Insights Platform (Q1-Q2 2026)
**Priority:** Critical  
**Status:** Planning  
**Dependencies:** Current v8.x data models, Bitly many-to-many system, Partners system

**Vision:** Transform MessMass from a data collection platform into an intelligent analytics service that provides actionable insights, predictive analytics, and strategic recommendations to clients.

**Core Objectives:**
- Enable deep-dive analytics across events, partners, time periods, and demographics
- Provide comparative analytics (event-to-event, partner-to-partner, period-to-period)
- Build predictive models for attendance, engagement, and ROI
- Create customizable dashboards for different stakeholder types
- Automate insight generation and anomaly detection
- Enable white-label reporting for client presentations

**Implementation Phases:** See detailed breakdown in Milestones section below

---

### Google Sheets Integration (Q4 2025)
**Priority:** High
**Status:** Active — Phase 2.5 testing and rollout
**Dependencies:** Google Cloud Service Account, Google Drive API

**Vision:** Enable bidirectional synchronization between MessMass events and Google Sheets for partners who prefer spreadsheet-based workflows.

**Core Objectives:**
- Auto-provision Google Sheets for new partners (Phase 2.5)
- Bidirectional sync (Pull/Push) of event data
- Support for formula preservation and custom column mapping
- Real-time status monitoring and health checks

**Implementation Phases:**
1. **Phase 2.5:** Auto-provisioning & Drive Integration — ⏳ Planned
2. **Phase 3:** Event-Level Granular Sync — 🔮 Future

**Acceptance Criteria (remaining):**
- ⬜ Auto-create sheets for new partners

*(Delivered phases and criteria: see release notes in `docs/archive/_archive/releases/`.)*

---

### SSO Integration with DoneIsBetter (Q1 2026)
**Priority:** High  
**Status:** Planning  
**Dependencies:** https://sso.doneisbetter.com API, existing PagePassword system

**Vision:** Add modern authentication options WHILE preserving the existing single-page password system for quick sharing.

**Dual Authentication Architecture:**
- **Path 1 (KEEP):** Single-page password protection for public shares
  - Per-page hashed passwords (impossible to guess)
  - Smart URL sharing (`/stats/[slug]`, `/filter/[slug]`, `/partner-report/[slug]`)
  - Use case: Quick event sharing, client access, temporary access
  - Status: ✅ Production-ready, do NOT modify

- **Path 2 (NEW):** DoneIsBetter SSO integration
  - Email + Password authentication
  - Magic Link (passwordless)
  - Facebook Login
  - PIN Verification (enhanced security)
  - Use case: Registered users, admin access, persistent accounts
  - Status: 🆕 To be implemented

**Integration Points:**
1. `/admin` routes → Migrate to SSO (optional, keep cookie auth as fallback)
2. New `/dashboard` route → SSO-only access for registered users
3. Extended report pages → SSO authentication required (see below)

**Technical Requirements:**
- Implement SSOClient integration: `const sso = new SSOClient('https://sso.doneisbetter.com');`
- Session validation: `await sso.validateSession();`
- Preserve existing `lib/auth.ts` for admin cookie sessions
- Preserve existing `lib/pagePassword.ts` for page-level protection
- Add new `lib/ssoAuth.ts` for DoneIsBetter integration

**Acceptance Criteria:**
- ✅ Both authentication systems work in parallel
- ✅ Existing share URLs continue working without changes
- ✅ SSO users can access extended analytics features
- ✅ Zero breaking changes to current authentication flow
- ✅ API documentation followed: https://sso.doneisbetter.com/docs

---

### Extended Report Page Access (Q1-Q2 2026)
**Priority:** High  
**Status:** Planning  
**Dependencies:** SSO Integration, Partner Analytics (v11.39.0), Filter system

**Vision:** Create extended access pages with partner-level reporting and cross-event analytics, accessible only via SSO authentication.

**New Access Tiers:**
- **Tier 1 (EXISTING):** Single-page password access
  - Individual event reports: `/stats/[slug]`
  - Single hashtag filters: `/hashtag/[hashtag]`
  - Single filter slugs: `/filter/[slug]`
  - Single partner reports: `/partner-report/[slug]`
  - Status: ✅ Keep as-is, no changes

- **Tier 2 (NEW):** Extended SSO-authenticated access
  - Partner dashboards: `/dashboard/partner/[partnerId]`
    - All events for partner
    - Cross-event analytics
    - Season-over-season comparisons
    - Historical trends
  - Hashtag analytics: `/dashboard/hashtag/[hashtag]`
    - All events with hashtag
    - Aggregated statistics
    - Trend analysis
  - Filter collections: `/dashboard/filter/[filterSlug]`
    - Multiple event aggregation
    - Comparative insights
  - Status: 🆕 To be implemented

**Key Features:**
1. **Partner + Events:** Full partner analytics with event breakdown
2. **Hashtag + Events:** Cross-event hashtag performance analysis
3. **Filter + Events:** Multi-event aggregation with filters
4. **Access Control:** SSO authentication required, role-based permissions
5. **Data Aggregation:** Pre-computed analytics for fast loading

**Technical Architecture:**
- Route structure: `/dashboard/*` (SSO-protected)
- Reuse existing components: `ReportContent`, `ReportChart`, `ColoredCard`
- Leverage `partner_analytics` collection (v11.39.0)
- Extend filter system with multi-project aggregation
- New API endpoints: `/api/dashboard/partner/[partnerId]`, `/api/dashboard/hashtag/[hashtag]`

**Implementation Phases:**
1. **Phase 1:** SSO middleware for `/dashboard/*` routes
2. **Phase 2:** Partner extended analytics (reuse v11.39.0 dashboard)
3. **Phase 3:** Hashtag cross-event analytics
4. **Phase 4:** Filter multi-event aggregation
5. **Phase 5:** Role-based access control (admin vs. partner users)

**Acceptance Criteria:**
- ✅ SSO authentication required for all `/dashboard/*` routes
- ✅ Existing single-page access URLs unchanged
- ✅ Partner dashboards show all events with aggregated metrics
- ✅ Hashtag analytics span multiple events
- ✅ Filter system supports multi-event queries
- ✅ Performance: < 500ms page load for pre-aggregated data
- ✅ Mobile-responsive design

---

### Report Layout & Rendering Specification v2.0
**Priority:** High  
**Status:** Active  
**Dependencies:** UnifiedDataVisualization, DynamicChart, chart types (PIE/BAR/KPI/TEXT/IMAGE)  
**Goals:** 1/2-unit width system, block-level font sync, image-driven row height, no overflow  
**Next:** Integrate CellWrapper (3-zone), push blockHeight into chart components, admin enforcement of width ≤ 2  

*(Delivered phases: see release notes in `docs/archive/_archive/releases/`.)*

---

### Report Content Slots Management
**Priority:** High  
**Status:** Active  
**Next:** Optional markdown rendering presets for reportTextN; multi-ratio preview helper for images

Future (captured as roadmap; detailed historical plan archived):
- Report text sizing + markdown enhancements (GFM support + fill-space text sizing): `docs/archive/_archive/design/REPORT_TEXT_SIZING_PLAN.md`

*(Delivered scope: see release notes in `docs/archive/_archive/releases/`.)*

---

### Variables System Enhancements (Admin + Reporting)
**Priority:** Medium
**Status:** Future
**Dependencies:** None (Stage 1), then staged migration plan
**Source:** `docs/archive/_archive/admin/ADMIN_UI_VARIABLE_SYSTEM_ENHANCEMENT.md` (staged plan; action items tracked in ACTION_PLAN/ROADMAP)

**Stage 2 (Type and naming normalization):**
- Normalize `variables_metadata.type` values to a stable enum (`count`, `numeric`, `text`, etc.).
- Add a compatibility layer that accepts both legacy and normalized type strings.

**Stage 3 (Deprecation and alias support):**
- Introduce explicit alias mapping for legacy names (instead of ad-hoc `stats.` handling).
- Add deprecation flags + warnings for planned removals.

**Stage 4 (Contracted versioning):**
- Add variable schema versioning + change log.
- Tie compatibility checks to versioned variable sets.

### Style System Hardening (Phase 4-6)
**Priority:** High  
**Status:** Active (Phase 4-6 remaining)  
**Dependencies:** Design tokens (theme.css), CSS Modules

**Remaining Work:**
- **Phase 4:** ⏸️ NEXT — Extract modal/dialog positioning (~30 extractable)
- **Phase 5:** ⏸️ FUTURE — Consolidate duplicated CSS files
- **Phase 6:** ⏸️ FUTURE — Prepare Atlas-managed theme injection plan

**Remaining 112 Inline Styles** (after Phase 3):
- Dynamic charts (~40) - Data-driven visualizations (mostly legitimate)
- Modals/dialogs (~30) - Positioning/z-index
- Minor utilities (~30) - Small components
- Legacy components (~12) - Lower priority

**Acceptance Criteria** (Final State):
- Zero inline styles (except documented computed token-driven styles with WHAT/WHY)
- All layouts use design tokens from theme.css
- ESLint enforcement active
- Visual regression: zero changes to UI appearance

---

### Search & Paging Unification
**Priority:** High  
**Status:** Follow-up deferred  
**Dependencies:** Hashtags API pagination (v5.0.0)

**Deferred:**
- ⏸️ Apply to Admin → Users (deferred to Q2 2026)
- ⏸️ Evaluate public pages (/hashtag) for similar search UX (deferred to Q2 2026)

*(Delivered scope: see release notes in `docs/archive/_archive/releases/`.)*

---

### Bitly Search Enhancements
**Priority:** Medium  
**Dependencies:** Bitly integration (v6.0.0), junction table optimization

**Actions:**
- Extend Bitly search to include project names (leveraging many-to-many relationships)
- Add date range filtering for Bitly analytics
- Abstract loading/isSearching pattern into reusable hook for all admin pages

**Acceptance:**
- Project name search efficiently queries junction table without performance degradation
- Unified search hook reduces code duplication across admin pages
- Date range filters work consistently with temporal attribution system

---

### Partner-Level Analytics Dashboard
**Priority:** High  
**Status:** Active — follow-up work planned  
**Dependencies:** Partners system (v6.0.0), aggregated data models

**Deferred to Future Releases:**
- ⏸️ Demographics Tab: Gender, age, venue distribution charts
- ⏸️ Trends Tab: Time-series charts for attendance, engagement, ad value
- ⏸️ Partner Comparison (Head-to-Head): Compare 2-5 partners side-by-side
- ⏸️ Export Functionality: PDF overview reports and CSV event exports
- ⏸️ Bitly link performance aggregated by partner

*(Delivered scope: see release notes in `docs/archive/_archive/releases/`.)*

---

### Bitly Analytics Export & Reporting
**Priority:** Medium  
**Dependencies:** Bitly many-to-many system (v6.0.0)

**Actions:**
- Create downloadable reports for Bitly link performance
- Enable custom date range selection for analytics
- Add trend visualization (clicks over time, geographic distribution)

**Acceptance:** Exportable PDF/CSV reports with branded headers, visual charts

---

### Variable System Enhancement
**Priority:** Medium  
**Dependencies:** Current variables system (v7.0.0)

**Objectives:**
- Extend variable system capabilities
- Enable variable dependencies and calculated fields
- Improve variable discovery and documentation

**Actions:**
- Support formula-based custom variables (e.g., `[stats.var1] / [stats.var2] * 100`)
- Variable groups with collapsible sections in UI
- In-app documentation for each variable with examples
- Variable usage analytics (which variables are most used)

**Acceptance Criteria:**
- Calculated variables update automatically when dependencies change
- Variable documentation accessible via tooltip/modal in UI
- Variable usage tracked and displayed in admin

---

### Admin UI Consistency
**Priority:** High  
**Dependencies:** None

**Actions:**
- Standardize Admin HERO across all admin pages (single source, consistent background/width)
- Introduce and adopt design-managed `.content-surface` with `--content-bg` for main content areas
- Widen narrow pages to match admin main content width
- Documentation sync, versioning, and clean commit to main

---

## 📍 Milestones

### Milestone: Analytics Platform Phase 1 — Data Aggregation & Storage (Q1 2026)
**Priority:** Critical  
**Dependencies:** Current v8.x schemas, MongoDB Atlas

**Objectives:**
- Design and implement analytics aggregation tables for fast querying
- Create daily/weekly/monthly pre-aggregated metrics
- Build time-series data models for trend analysis
- Implement caching strategy for expensive calculations

**Key Deliverables:**
- `analytics_aggregates` collection with time-bucketed data
- `partner_analytics` collection with partner-level metrics
- `event_comparisons` collection for comparative analysis
- Background jobs for daily aggregation processing
- Cache invalidation and refresh strategies

**Acceptance Criteria:**
- Analytics queries return in < 500ms for 1-year datasets
- Aggregation jobs complete within 5-minute window
- Zero data loss during aggregation process
- Backward compatibility with existing stats queries

---

### Milestone: Analytics Platform Phase 2 — Insights Engine (Q1-Q2 2026)
**Priority:** Critical  
**Dependencies:** Phase 1 aggregation system

**Objectives:**
- Build rule-based insights engine for anomaly detection
- Implement trend analysis algorithms
- Create benchmarking system (compare to historical averages)
- Develop predictive models for attendance and engagement

**Key Deliverables:**
- Insights API (`/api/analytics/insights`) with rule engine
- Automated insight generation service
- Trend detection algorithms (increasing, decreasing, plateau)
- Comparative analytics API for multi-event/partner analysis
- Alert system for significant deviations

**Acceptance Criteria:**
- System generates 5-10 actionable insights per event automatically
- Trend predictions accurate within 15% margin
- Anomaly detection flags outliers with 90%+ accuracy
- Benchmarking compares against similar events/partners

---

### Milestone: Analytics Platform Phase 3 — Advanced Dashboards (Q2 2026)
**Priority:** Critical  
**Dependencies:** Phase 2 insights engine

**Objectives:**
- Create stakeholder-specific dashboard views
- Enable custom KPI tracking and goal setting
- Build interactive data exploration tools
- Implement real-time analytics streaming

**Key Deliverables:**
- Executive dashboard (high-level KPIs, trends, ROI)
- Marketing dashboard (demographics, reach, engagement)
- Operations dashboard (real-time event metrics)
- Partner dashboard (partner-specific performance)
- Custom dashboard builder with drag-and-drop widgets
- Real-time WebSocket updates for live events

**Acceptance Criteria:**
- 4+ pre-built dashboard templates available
- Custom dashboards save user preferences
- Real-time updates with < 2-second latency
- Mobile-responsive dashboard layouts
- Export dashboards as PDF reports

---

### Milestone: Analytics Platform Phase 4 — Reporting & Exports (Q2 2026)
**Priority:** High  
**Dependencies:** Phase 3 dashboards

**Objectives:**
- Build white-label report generation system
- Enable scheduled report delivery
- Create presentation-ready export formats
- Implement report templates with branding

**Key Deliverables:**
- PDF report generator with custom branding
- PowerPoint/Keynote export functionality
- Scheduled email reports (daily/weekly/monthly)
- Report template library (post-event, season summary, partner performance)
- Interactive web reports with shareable URLs

**Acceptance Criteria:**
- PDF reports generated in < 10 seconds
- Reports include charts, tables, insights, and recommendations
- Branding (logos, colors) customizable per client/partner
- Scheduled reports delivered on time with 99.9% reliability

---

## 🧪 Optional / Exploratory (Backlog)

### Page Styles System Enhancements
1. Gradient builder UI (visual editor vs. CSS string input)
2. Theme import/export (JSON format for cross-instance sharing)
3. Theme preview URL (shareable link before production deployment)
4. Animation controls (transition timing, hover effects)
5. Responsive typography (breakpoint-specific font sizes)
6. Admin UI assignment dropdown (project edit modal integration)
7. Theme categories (organize by industry/use case)
8. Font upload (custom font file support)
9. CSS variables export (generate CSS custom properties)
10. A/B testing (compare themes on same project)

### CSV and Visualization Enhancement
- Admin Grid Settings UI to edit desktop/tablet/mobile units
- Derived Metrics in CSV (computed totals as additional rows)
- Chart Label Customization (rename titles/subtitles per block)
- Empty-Block UX (friendly messages for no-data scenarios)
- Performance pass for stats pages
- Export options (download chart data as CSV per chart)

### Admin Productivity
- Bulk chart assignment tools (multi-select charts, assign to blocks)
- Reorder blocks with drag-and-drop
- Audit and simplify unused admin features

### Report Template Management (Rename / Copy / Delete)
**Priority:** Low  
**Status:** Future  
**Dependencies:** Admin Visualization Manager surface (`/admin/visualization`)  
**Source:** `docs/archive/_archive/design/TEMPLATE_MANAGEMENT_PLAN_2026-01-02.md` (archived plan)

**Technical Intent:**
- Add operator-safe template rename/copy/delete flows with confirmation and “in use” protection.
- Keep UX aligned with existing modal primitives (FormModal/BaseModal/ConfirmDialog) and API client helpers.

### Variable Management Guide (P2 2.3)
**Priority:** Low  
**Status:** Future  
**Dependencies:** Variable Dictionary (P0 2.1)  
**Source:** `docs/archive/_archive/audits/comprehensive-system-audit-plan-2026.md` (Phase 2)

**Technical Intent:**
- Create comprehensive guide for variable management
- Document best practices for variable creation and usage
- Provide examples and patterns for common use cases

**Trigger:** User requests or documentation gaps

---

## Priority Summary

**Critical Priority:**
1. Advanced Analytics & Insights Platform (Q1-Q2 2026)
2. SSO Integration with DoneIsBetter (Q1 2026)
3. Extended Report Page Access (Q1-Q2 2026)

**High Priority:**
1. Layout Grammar Editor Integration (from audit residual risks)
2. Google Sheets Integration (Phase 2.5-3)
3. Report Layout & Rendering Specification v2.0 (remaining phases)
4. Style System Hardening (Phase 4-6)
5. Admin UI Consistency

**Medium Priority:**
1. Height Calculation Accuracy Improvements (from audit residual risks)
2. Bitly Search Enhancements
3. Bitly Analytics Export & Reporting
4. Variable System Enhancement

**Low Priority:**
1. Performance Optimization Pass (from audit residual risks)
2. Variable Management Guide (P2 2.3)
3. Optional / Exploratory backlog items

---

*MessMass Roadmap — Strategic Planning Document*  
*Completed/DONE work is not listed here; see release notes in `docs/archive/_archive/releases/`.*
