# ROADMAP.md

Current Version: 11.40.0
Last Updated: 2025-12-21T09:02:35.000Z (UTC)

---

## 🎯 Strategic Initiatives

### Initiative: Advanced Analytics & Insights Platform (Q1-Q2 2026)
**Priority**: Critical  
**Status**: Planning  
**Dependencies**: Current v8.x data models, Bitly many-to-many system, Partners system

**Vision**: Transform MessMass from a data collection platform into an intelligent analytics service that provides actionable insights, predictive analytics, and strategic recommendations to clients.

**Core Objectives**:
- Enable deep-dive analytics across events, partners, time periods, and demographics
- Provide comparative analytics (event-to-event, partner-to-partner, period-to-period)
- Build predictive models for attendance, engagement, and ROI
- Create customizable dashboards for different stakeholder types
- Automate insight generation and anomaly detection
- Enable white-label reporting for client presentations

**Implementation Phases**: See detailed breakdown in Milestones section below

---

## 🔧 Operational Initiatives

### Report Layout & Rendering Specification v2.0 (Q4 2025)
- Priority: High
- Status: Active — Phase 1 (types + calculators + grid integration) delivered 2025-12-19T10:46:34.000Z
- Dependencies: UnifiedDataVisualization, DynamicChart, chart types (PIE/BAR/KPI/TEXT/IMAGE)
- Goals: 1/2-unit width system, block-level font sync, image-driven row height, no overflow
- Next: Integrate CellWrapper (3-zone), push blockHeight into chart components, admin enforcement of width ≤ 2

### Report Content Slots Management (Q4 2025)
- Priority: High
- Status: Active — Phase 1 delivered in v11.7.1 (Clicker integration)
- Next: Optional markdown rendering presets for reportTextN; multi-ratio preview helper for images

### Style System Hardening (Q1 2026)
**Priority**: Critical  
**Status**: ✅ **Phase 1-2 Complete** — Active (Phase 3-5)  
**Completed**: Phase 2 on 2025-12-21T09:02:35.000Z (UTC)  
**Dependencies**: Design tokens (theme.css), CSS Modules

**Problem**: Hardcoded inline styles violate design system principles, making global updates impossible and cluttering JSX.

**Progress**:
- **Phase 1**: ✅ COMPLETE — Foundation utilities created (AdminDashboardNew.tsx refactored)
- **Phase 2**: ✅ COMPLETE — Systematic refactoring (95 of 185 styles eliminated, 51% reduction)
  - Batch 1: KYC Data Pages (37 styles) → kyc-data.module.css
  - Batch 2: Partner Analytics (20 styles) → analytics.module.css
  - Batch 3: Component Utilities (14 styles) → Enhanced components.css
  - Batch 4: Admin Pages (18 styles) → admin-pages.module.css
  - Batch 5/6: Miscellaneous (6 styles) → Utility classes
  - ESLint rule enforcement active (react/forbid-dom-props)
  - Documented 4 legitimate dynamic styles with WHAT/WHY comments
  - Deleted 3 backup files (9 additional styles removed)
  - 8 commits pushed to GitHub main (96fd199, c09e8a1, febb83f, f7257e0, f8c6f21, 55f4f0f, 12d77b3, 2cc23b8)
- **Phase 3**: ⏸️ NEXT — Refactor remaining dynamic chart styles (~40 extractable)
- **Phase 4**: ⏸️ FUTURE — Extract modal/dialog positioning (~30 extractable)
- **Phase 5**: ⏸️ FUTURE — Consolidate duplicated CSS files
- **Phase 6**: ⏸️ FUTURE — Prepare Atlas-managed theme injection plan

**Phase 2 Achievements**:
- ✅ 51% reduction in extractable inline styles (95 eliminated)
- ✅ 3 new CSS modules created (698 lines total)
- ✅ 25+ utility classes added to components.css
- ✅ ESLint enforcement prevents new violations
- ✅ Core components documented (StylePreview, ColoredCard, hashtag bubbles)
- ✅ Build passing, zero visual regressions

**Remaining 151 Inline Styles** (after Phase 2):
- Dynamic charts (~40) - Data-driven visualizations
- Modals/dialogs (~30) - Positioning/z-index
- Minor utilities (~30) - Small components
- Legacy components (~50) - Lower priority

**Acceptance Criteria** (Final State):
- Zero inline styles (except documented computed token-driven styles with WHAT/WHY)
- All layouts use design tokens from theme.css
- ESLint enforcement active
- Visual regression: zero changes to UI appearance

---

### Search & Paging Unification (v11.6.0 - COMPLETED)
**Priority**: High  
**Status**: ✅ **Complete**  
**Completed**: 2025-11-12T18:02:00.000Z (UTC)  
**Dependencies**: Hashtags API pagination (v5.0.0)

**Objective**: Extend server-side search + pagination to all admin pages for consistent UX.

**Actions**:
- ✅ Apply to Admin → Hashtags (already complete)
- ✅ Apply to Admin → Categories (v11.6.0)
- ✅ Apply to Admin → Charts (v11.6.0)
- ⏸️ Apply to Admin → Users (deferred to Q2 2026)
- ⏸️ Evaluate public pages (/hashtag) for similar search UX (deferred to Q2 2026)

**Acceptance**: ✅ Consistent HERO search, server search with offset/limit, and "Load 20 more" button on Categories and Charts pages.

**Implementation Notes**:
- All admin pages now use consistent pagination pattern
- Debounced search (300ms) reduces API calls
- "Load 20 more" button with remaining count display
- Pagination stats show "X of Y" results
- Performance improved for large datasets (1000+ items)

---

### Bitly Search Enhancements (Q2 2026)
**Priority**: Medium  
**Dependencies**: Bitly integration (v6.0.0), junction table optimization

**Actions**:
- Extend Bitly search to include project names (leveraging many-to-many relationships)
- Add date range filtering for Bitly analytics
- Abstract loading/isSearching pattern into reusable hook for all admin pages

**Acceptance**:
- Project name search efficiently queries junction table without performance degradation
- Unified search hook reduces code duplication across admin pages
- Date range filters work consistently with temporal attribution system

---

### Partner-Level Analytics Dashboard (Q2 2026)
**Priority**: High  
**Status**: ✅ **Core Complete (v11.39.0)** - Phases 1-3, 6 delivered  
**Completed**: 2025-12-20T20:25:00.000Z (UTC)  
**Dependencies**: Partners system (v6.0.0), aggregated data models

**Delivered (v11.39.0)**:
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

**Deferred to Future Releases**:
- ⏸️ Demographics Tab: Gender, age, venue distribution charts
- ⏸️ Trends Tab: Time-series charts for attendance, engagement, ad value
- ⏸️ Partner Comparison (Head-to-Head): Compare 2-5 partners side-by-side
- ⏸️ Export Functionality: PDF overview reports and CSV event exports
- ⏸️ Bitly link performance aggregated by partner

---

### Bitly Analytics Export & Reporting (Q2 2026)
**Priority**: Medium  
**Dependencies**: Bitly many-to-many system (v6.0.0)

**Actions**:
- Create downloadable reports for Bitly link performance
- Enable custom date range selection for analytics
- Add trend visualization (clicks over time, geographic distribution)

**Acceptance**: Exportable PDF/CSV reports with branded headers, visual charts

---

## 📍 Milestones

### Milestone: Analytics Platform Phase 1 — Data Aggregation & Storage (Q1 2026)
**Priority**: Critical  
**Dependencies**: Current v8.x schemas, MongoDB Atlas

**Objectives**:
- Design and implement analytics aggregation tables for fast querying
- Create daily/weekly/monthly pre-aggregated metrics
- Build time-series data models for trend analysis
- Implement caching strategy for expensive calculations

**Key Deliverables**:
- `analytics_aggregates` collection with time-bucketed data
- `partner_analytics` collection with partner-level metrics
- `event_comparisons` collection for comparative analysis
- Background jobs for daily aggregation processing
- Cache invalidation and refresh strategies

**Acceptance Criteria**:
- Analytics queries return in < 500ms for 1-year datasets
- Aggregation jobs complete within 5-minute window
- Zero data loss during aggregation process
- Backward compatibility with existing stats queries

---

### Milestone: Analytics Platform Phase 2 — Insights Engine (Q1-Q2 2026)
**Priority**: Critical  
**Dependencies**: Phase 1 aggregation system

**Objectives**:
- Build rule-based insights engine for anomaly detection
- Implement trend analysis algorithms
- Create benchmarking system (compare to historical averages)
- Develop predictive models for attendance and engagement

**Key Deliverables**:
- Insights API (`/api/analytics/insights`) with rule engine
- Automated insight generation service
- Trend detection algorithms (increasing, decreasing, plateau)
- Comparative analytics API for multi-event/partner analysis
- Alert system for significant deviations

**Acceptance Criteria**:
- System generates 5-10 actionable insights per event automatically
- Trend predictions accurate within 15% margin
- Anomaly detection flags outliers with 90%+ accuracy
- Benchmarking compares against similar events/partners

---

### Milestone: Analytics Platform Phase 3 — Advanced Dashboards (Q2 2026)
**Priority**: Critical  
**Dependencies**: Phase 2 insights engine

**Objectives**:
- Create stakeholder-specific dashboard views
- Enable custom KPI tracking and goal setting
- Build interactive data exploration tools
- Implement real-time analytics streaming

**Key Deliverables**:
- Executive dashboard (high-level KPIs, trends, ROI)
- Marketing dashboard (demographics, reach, engagement)
- Operations dashboard (real-time event metrics)
- Partner dashboard (partner-specific performance)
- Custom dashboard builder with drag-and-drop widgets
- Real-time WebSocket updates for live events

**Acceptance Criteria**:
- 4+ pre-built dashboard templates available
- Custom dashboards save user preferences
- Real-time updates with < 2-second latency
- Mobile-responsive dashboard layouts
- Export dashboards as PDF reports

---

### Milestone: Analytics Platform Phase 4 — Reporting & Exports (Q2 2026)
**Priority**: High  
**Dependencies**: Phase 3 dashboards

**Objectives**:
- Build white-label report generation system
- Enable scheduled report delivery
- Create presentation-ready export formats
- Implement report templates with branding

**Key Deliverables**:
- PDF report generator with custom branding
- PowerPoint/Keynote export functionality
- Scheduled email reports (daily/weekly/monthly)
- Report template library (post-event, season summary, partner performance)
- Interactive web reports with shareable URLs

**Acceptance Criteria**:
- PDF reports generated in < 10 seconds
- Reports include charts, tables, insights, and recommendations
- Branding (logos, colors) customizable per client/partner
- Scheduled reports delivered on time with 99.9% reliability

---

### Milestone: Variable System Enhancement (Q2 2026)
**Priority**: Medium  
**Dependencies**: Current variables system (v7.0.0)

**Objectives**:
- Extend variable system capabilities
- Enable variable dependencies and calculated fields
- Improve variable discovery and documentation

**Actions**:
- Support formula-based custom variables (e.g., `[stats.var1] / [stats.var2] * 100`)
- Variable groups with collapsible sections in UI
- In-app documentation for each variable with examples
- Variable usage analytics (which variables are most used)

**Acceptance Criteria**:
- Calculated variables update automatically when dependencies change
- Variable documentation accessible via tooltip/modal in UI
- Variable usage tracked and displayed in admin

---

### Milestone: Admin UI Consistency (Q2 2026)
**Priority**: High  
**Dependencies**: None

**Actions**:
- Standardize Admin HERO across all admin pages (single source, consistent background/width)
- Introduce and adopt design-managed `.content-surface` with `--content-bg` for main content areas
- Widen narrow pages to match admin main content width
- Documentation sync, versioning, and clean commit to main

---

## 📦 Future Enhancements (Backlog)

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

---

*MessMass Roadmap — Strategic Planning Document*  
*Version 8.24.0 | Last Updated: 2025-11-01T15:20:00.000Z (UTC)*
