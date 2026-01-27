# ROADMAP.md
**Status:** Active  
**Last Updated:** 2026-01-16T16:00:00.000Z  
**Canonical:** Yes  
**Owner:** Product + Engineering  
**Reference:** [AUDIT_ACTION_PLAN.md](AUDIT_ACTION_PLAN.md), [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md), [docs/audits/COMPREHENSIVE_SYSTEM_AUDIT_PLAN_2026.md](docs/audits/COMPREHENSIVE_SYSTEM_AUDIT_PLAN_2026.md)  
**Admin Roadmap Status:** Canonical Admin roadmap tracking lives in [ACTION_PLAN.md](ACTION_PLAN.md).

---

## ✅ Completed (Audit-Verified)

### Layout Grammar Compliance (P0 1.1-1.3)
**Status:** ✅ DONE + VERIFIED  
**Completed:** 2026-01-02  
**Evidence:** `IMPLEMENTATION_COMPLETE.md` (P0 1.1, P0 1.2, P0 1.3)

**Completed Work:**
- ✅ No Scrolling: Removed all `overflow: auto/scroll` from content layers (4 violations fixed)
- ✅ No Truncation: Removed all `text-overflow: ellipsis` from content (4 violations fixed)
- ✅ No Clipping: Removed `overflow: hidden` from content layers (4 violations fixed)

**Impact:** All chart content is now fully visible without scrolling, truncation, or clipping. Layout Grammar rules are enforced structurally.

---

### Deterministic Height Resolution (P1 1.4)
**Status:** ✅ DONE + VERIFIED  
**Completed:** 2026-01-10  
**Evidence:** `IMPLEMENTATION_COMPLETE.md` (P1 1.4)

**Completed Work:**
- ✅ Explicit Height Cascade: block/row calculation → CSS custom property → chart container → chart body → chart content
- ✅ Replaced all implicit height fallbacks (`100%`, `auto`) with design token fallbacks
- ✅ Added explicit height calculation for all chart types (BAR, TEXT, TABLE, PIE)
- ✅ Removed minimum height constraints that caused non-deterministic behavior
- ✅ Added runtime validation for all height CSS variables

**Impact:** All chart heights are now explicitly calculated and traceable. No implicit height behavior remains.

---

### Unified Typography (P1 1.5)
**Status:** ✅ DONE + VERIFIED  
**Completed:** 2026-01-11  
**Evidence:** `IMPLEMENTATION_COMPLETE.md` (P1 1.5)

**Completed Work:**
- ✅ Block-level typography ownership model: one block = one base font size (`--block-base-font-size`)
- ✅ Moved typography calculation from row-level to block-level
- ✅ Updated all CSS consumers to reference block-level variables
- ✅ Removed per-row font size logic and props
- ✅ BAR chart label overlap regression fixed via semantic HTML table structure
- ✅ KPI value exemption preserved (values scale independently)

**Impact:** All typography within a block is now unified. Font sizes are consistent and predictable.

---

### PIE + DONUT Chart Layout Grammar Compliance (P1 1.6)
**Status:** ✅ DONE + VERIFIED  
**Completed:** 2026-01-11  
**Evidence:** `IMPLEMENTATION_COMPLETE.md` (P1 1.6)

**Completed Work:**
- ✅ Removed `overflow: hidden` from `.pieChartContainer` (preventive fix for Chart.js canvas clipping)
- ✅ Verified all Layout Grammar requirements (no scrolling, no truncation, no clipping)

**Impact:** PIE charts fully comply with Layout Grammar rules.

---

### TABLE & LEGEND DENSITY STRESS AUDIT (P1 1.7)
**Status:** ✅ DONE + VERIFIED  
**Completed:** 2026-01-11  
**Evidence:** `IMPLEMENTATION_COMPLETE.md` (P1 1.7)

**Completed Work:**
- ✅ Enhanced PIE chart height calculation to account for legend item count
- ✅ Prevented pie chart compression below minimum readable size when legend grows

**Impact:** PIE charts with many legend items (>5) now have sufficient height to prevent compression.

---

### Layout Grammar Runtime Enforcement (A-05)
**Status:** ✅ DONE + VERIFIED  
**Completed:** 2026-01-15  
**Evidence:** `docs/audits/investigations/A-05-runtime-enforcement.md`, `lib/layoutGrammarRuntimeEnforcement.ts`

**Completed Work:**
- ✅ Production-safe runtime guardrails for critical CSS variable validation
- ✅ Height resolution validation with graceful degradation
- ✅ Element fit validation
- ✅ `safeValidate()` wrapper prevents crashes (error boundary protection)
- ✅ 16 comprehensive tests covering all failure modes
- ✅ Integration in `ReportContent.tsx` and `ReportChart.tsx`

**Impact:** Layout Grammar violations are logged without crashing the application. Production guardrails prevent critical violations from reaching users while preserving development workflow.

---

### Variable Block Aspect Ratio Support (R-LAYOUT-02.1)
**Status:** ✅ DONE + VERIFIED  
**Completed:** 2026-01-15  
**Evidence:** `lib/layoutV2BlockCalculator.ts`, `docs/design/REPORT_LAYOUT_V2_CONTRACT.md` (v1.1.0)

**Completed Work:**
- ✅ Optional `blockAspectRatio` parameter (4:1 to 4:10 range)
- ✅ Validation: TEXT-AREA/TABLE blocks only, rejects mixed types
- ✅ Fallback to default 4:1 for invalid configurations
- ✅ Deterministic layout guarantees maintained
- ✅ 28 comprehensive tests covering all scenarios

**Impact:** TEXT-AREA and TABLE blocks can now use taller aspect ratios (up to 4:10) for text-heavy content while maintaining deterministic layout guarantees.

---

### PIE Chart Mobile Layout Fix
**Status:** ✅ DONE + VERIFIED  
**Completed:** 2026-01-16  
**Evidence:** `app/report/[slug]/ReportChart.module.css`

**Completed Work:**
- ✅ CSS Grid layout with fixed proportions (30%:40%:30%)
- ✅ All grid rows fill full height (`height: 100%`)
- ✅ Fixed proportions prevent overflow on mobile
- ✅ Consistent behavior across desktop and mobile

**Impact:** PIE charts now use the same CSS Grid (table-style) layout as KPI charts. Fixed proportions (30%:40%:30%) keep content within the frame on mobile and prevent overflow.

---

### Variable Dictionary & Naming Standards (P0 2.1, P1 2.2)
**Status:** ✅ COMPLETE + VERIFIED  
**Completed:** 2026-01-09  
**Evidence:** `docs/audits/COMPREHENSIVE_SYSTEM_AUDIT_PLAN_2026.md` (Phase 2)

**Completed Work:**
- ✅ Created `docs/conventions/VARIABLE_DICTIONARY.md` (canonical)
- ✅ Variable naming consistency audit completed (10 violations fixed)

**Impact:** Variable naming standards established and enforced.

---

### Chart Content Density & Typography Optimization (P1 2.5.1)
**Status:** ✅ DONE + VERIFIED  
**Completed:** 2026-01-09  
**Evidence:** `docs/audits/COMPREHENSIVE_SYSTEM_AUDIT_PLAN_2026.md` (Phase 2.5)

**Completed Work:**
- ✅ Pie legend text scaling enhanced (min(20cqh, 12cqw), max 24px)
- ✅ KPI value scaling enhanced (min(30cqh, 25cqw), max 6rem)
- ✅ KPI title scaling enhanced (15cqh, max 1.5rem)

**Impact:** Chart content better utilizes available space while maintaining readability.

---

### Style System Hardening (Phase 1-3)
**Status:** ✅ COMPLETE  
**Completed:** 2025-12-21  
**Evidence:** ROADMAP.md (original entry)

**Completed Work:**
- ✅ Phase 1: Foundation utilities created
- ✅ Phase 2: Systematic refactoring (95 of 185 styles eliminated, 51% reduction)
- ✅ Phase 3: Dynamic component styles refactored (40 of 152 styles eliminated, 26% reduction)

**Impact:** Significant reduction in inline styles, improved design system adherence.

---

## 🔧 Hardening & Follow-ups (From Audit Residual Risks)

### Layout Grammar Editor Integration
**Priority:** High  
**Status:** Future  
**Dependencies:** Layout Grammar validation logic (exists), Editor UI  
**Source:** `IMPLEMENTATION_COMPLETE.md` (Explicit Non-Goals)

**Technical Intent:**
- Integrate Layout Grammar validation into editor UI
- Block invalid configurations before save (e.g., scrolling, truncation, clipping violations)
- Provide real-time feedback during report editing

**Trigger:** Editor UI refactoring or new editor features

**Non-Goals:**
- Runtime validation already exists (console warnings)
- This is editor blocking, not runtime enforcement

---

### Layout Grammar Migration Tooling
**Priority:** Medium  
**Status:** DONE  
**Dependencies:** Analysis tools (exist), Migration scripts  
**Source:** `IMPLEMENTATION_COMPLETE.md` (Explicit Non-Goals)

**Technical Intent:**
- Automated migration of existing reports to Layout Grammar compliance
- Batch analysis and remediation of legacy reports
- Validation reports for pre-migration assessment

**Trigger:** Large-scale report migration or client onboarding

**Non-Goals:**
- Manual migration is currently supported
- Analysis tools already exist

---

### Height Calculation Accuracy Improvements
**Priority:** Medium  
**Status:** Future  
**Dependencies:** None  
**Source:** `IMPLEMENTATION_COMPLETE.md` (Residual Risks)

**Technical Intent:**
- Refine BAR chart height calculation (currently uses estimated 40px label height)
- Refine PIE chart legend height calculation (currently assumes 30% → 50% growth)
- Account for actual font size and content wrapping behavior

**Trigger:** Reports with extreme content density or font size variations

**Non-Goals:**
- Current estimates are sufficient for most use cases
- This is fine-tuning, not a critical issue

---

### Typography Scaling Edge Cases
**Priority:** Low  
**Status:** DONE  
**Dependencies:** None  
**Source:** `IMPLEMENTATION_COMPLETE.md` (Residual Risks)

**Technical Intent:**
- Handle edge cases in `calculateSyncedFontSizes()` (very long titles, extreme aspect ratios)
- Improve BAR chart font size algorithm accuracy (binary search with character estimates)

**Trigger:** Reports with extreme title lengths or aspect ratios

**Non-Goals:**
- Current implementation handles 99% of use cases
- This is optimization, not correctness

---

### Layout Grammar Runtime Enforcement
**Priority:** Medium  
**Status:** ✅ DONE (2026-01-15)  
**Dependencies:** Runtime validation (exists)  
**Source:** A-05 task (ACTION_PLAN.md)

**Completed Work:**
- ✅ Production-safe runtime guardrails implemented
- ✅ `safeValidate()` wrapper prevents crashes
- ✅ Critical CSS variable validation
- ✅ Height resolution and element fit validation
- ✅ 16 comprehensive tests

**Impact:** Layout Grammar violations are logged without crashing. Production guardrails prevent critical violations from reaching users.

---

### Performance Optimization Pass
**Priority:** Low  
**Status:** Future  
**Dependencies:** None  
**Source:** `IMPLEMENTATION_COMPLETE.md` (Explicit Non-Goals)

**Technical Intent:**
- Performance optimizations beyond correctness requirements
- Render performance improvements for large reports
- Memory optimization for chart rendering

**Trigger:** Performance profiling or user-reported performance issues

**Non-Goals:**
- Correctness was prioritized over performance in audit
- This is optimization, not correctness

---

### Reporting System Hardening (A-R-07 through A-R-13)
**Priority:** Medium to Low  
**Status:** ✅ COMPLETE  
**Completed:** 2026-01-13  
**Source:** `ACTION_PLAN.md` (Reporting Roadmap Items)

**Completed Work:**
- ✅ **A-R-07:** Export Correctness & Validation - Pre-export readiness validation, deterministic error handling
  - Evidence: `docs/audits/investigations/A-R-07-export-correctness.md`
  - Commit: `03ae7a80a`
- ✅ **A-R-08:** Render Determinism Guarantees - Investigation of render order stability and timing dependencies
  - Evidence: `docs/audits/investigations/A-R-08-render-determinism.md`
  - Commit: `4350215b5`
- ✅ **A-R-10:** Export Format Consistency - CSV/PDF parity with rendered report (Phase 1: Investigation, Phase 2: Remediation)
  - Evidence: `docs/audits/investigations/A-R-10-export-parity-investigation.md`
  - Commits: Phase 1 and Phase 2 completion commits
- ✅ **A-R-11:** Formula Calculation Error Handling & Recovery - Structured error reporting, user-visible errors, graceful degradation
  - Evidence: `docs/audits/investigations/A-R-11-formula-error-handling.md`
  - Commit: `a4c11e36c`
- ✅ **A-R-12:** Report Template Compatibility Validation - Template compatibility validator, runtime validation, user-visible warnings
  - Evidence: `docs/audits/investigations/A-R-12-template-compatibility.md`
  - Commit: `8662f0bbf`
- ✅ **A-R-13:** Chart Data Validation & Error Boundaries - Comprehensive data validation, React error boundaries, graceful degradation
  - Evidence: `docs/audits/investigations/A-R-13-chart-data-validation.md`
  - Commit: `adcea2138`

**Impact:** Reporting system now has comprehensive error handling, validation, and graceful degradation. Export formats match rendered reports. Template compatibility is validated at runtime.

---

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
**Status:** Active — Phase 2 Implementation Complete (Testing pending)
**Completed:** Phase 1 (Foundation) on 2025-12-25
**Dependencies:** Google Cloud Service Account, Google Drive API

**Vision:** Enable bidirectional synchronization between MessMass events and Google Sheets for partners who prefer spreadsheet-based workflows.

**Core Objectives:**
- Auto-provision Google Sheets for new partners (Phase 2.5)
- Bidirectional sync (Pull/Push) of event data
- Support for formula preservation and custom column mapping
- Real-time status monitoring and health checks

**Implementation Phases:**
1. **Phase 1:** Foundation (Auth, Client, Types) — ✅ Complete
2. **Phase 2:** Partner-Level Sync (APIs, UI) — ✅ Implementation Complete
3. **Phase 2.5:** Auto-provisioning & Drive Integration — ⏳ Planned
4. **Phase 3:** Event-Level Granular Sync — 🔮 Future

**Acceptance Criteria:**
- ✅ Connect/Disconnect Google Sheets via Admin UI
- ✅ Pull events from Sheet → MessMass (create/update)
- ✅ Push events from MessMass → Sheet (create/update rows)
- ✅ Status dashboard shows sync history and health
- ⬜ Auto-create sheets for new partners

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
**Status:** Active — Phase 1 (types + calculators + grid integration) delivered 2025-12-19  
**Dependencies:** UnifiedDataVisualization, DynamicChart, chart types (PIE/BAR/KPI/TEXT/IMAGE)  
**Goals:** 1/2-unit width system, block-level font sync, image-driven row height, no overflow  
**Next:** Integrate CellWrapper (3-zone), push blockHeight into chart components, admin enforcement of width ≤ 2

---

### Report Content Slots Management
**Priority:** High  
**Status:** Active — Phase 1 delivered in v11.7.1 (Clicker integration)  
**Next:** Optional markdown rendering presets for reportTextN; multi-ratio preview helper for images

---

### Style System Hardening (Phase 4-6)
**Priority:** High  
**Status:** Active (Phase 4-6 remaining)  
**Completed:** Phase 1-3 on 2025-12-21  
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
**Status:** ✅ Complete (v11.6.0)  
**Completed:** 2025-11-12  
**Dependencies:** Hashtags API pagination (v5.0.0)

**Completed Work:**
- ✅ Applied to Admin → Hashtags (already complete)
- ✅ Applied to Admin → Categories (v11.6.0)
- ✅ Applied to Admin → Charts (v11.6.0)

**Deferred:**
- ⏸️ Apply to Admin → Users (deferred to Q2 2026)
- ⏸️ Evaluate public pages (/hashtag) for similar search UX (deferred to Q2 2026)

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
**Status:** ✅ Core Complete (v11.39.0) - Phases 1-3, 6 delivered  
**Completed:** 2025-12-20  
**Dependencies:** Partners system (v6.0.0), aggregated data models

**Delivered (v11.39.0):**
- ✅ Background aggregation job populates partner_analytics collection every 5 minutes
- ✅ Backfill script: `npm run analytics:backfill-partners` (processed 140 partners in 12.8s)
- ✅ Dashboard route: `/admin/partners/[partnerId]/analytics` with 5-tab interface
- ✅ Overview Tab: Summary cards, best event, quick stats
- ✅ Events Tab: Full event table with performance metrics
- ✅ Comparisons Tab: Season-over-season analysis + home vs. away performance
- ✅ Analytics button integrated into Partners list (list and card views)
- ✅ Season detection algorithm (Aug-May sports seasons)
- ✅ Delta calculations with visual indicators (↑ ↓ ≈)
- ✅ Automated insights for home/away performance

**Deferred to Future Releases:**
- ⏸️ Demographics Tab: Gender, age, venue distribution charts
- ⏸️ Trends Tab: Time-series charts for attendance, engagement, ad value
- ⏸️ Partner Comparison (Head-to-Head): Compare 2-5 partners side-by-side
- ⏸️ Export Functionality: PDF overview reports and CSV event exports
- ⏸️ Bitly link performance aggregated by partner

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

### Variable Management Guide (P2 2.3)
**Priority:** Low  
**Status:** Future  
**Dependencies:** Variable Dictionary (P0 2.1)  
**Source:** `docs/audits/COMPREHENSIVE_SYSTEM_AUDIT_PLAN_2026.md` (Phase 2)

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
1. Layout Grammar Migration Tooling (from audit residual risks)
2. Height Calculation Accuracy Improvements (from audit residual risks)
4. Bitly Search Enhancements
5. Bitly Analytics Export & Reporting
6. Variable System Enhancement

**Low Priority:**
1. Typography Scaling Edge Cases (from audit residual risks)
2. Performance Optimization Pass (from audit residual risks)
3. Variable Management Guide (P2 2.3)
4. Optional / Exploratory backlog items

---

*MessMass Roadmap — Strategic Planning Document*  
*Version 12.0.0 | Last Updated: 2026-01-12T00:01:54.994Z (UTC)*  
*Refactored based on completed technical audit (P0 1.1-1.3, P1 1.4-1.9)*
