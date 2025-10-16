# ROADMAP.md

Current Version: 6.5.0
Last Updated: 2025-10-16T07:52:00.000Z (UTC)

---

## 🎯 Strategic Initiatives

### Initiative: Advanced Analytics & Insights Platform (Q1-Q2 2026)
**Priority**: Critical
**Status**: Planning
**Dependencies**: Current v6.0.0 data models, Bitly many-to-many system, Partners system

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

## 🔧 Operational Tasks

### Bitly Search Enhancements (Q2 2026)
**Priority**: Medium
**Dependencies**: Bitly integration (v6.0.0), junction table optimization
- **Action**: Extend Bitly search to include project names (leveraging many-to-many relationships)
- **Action**: Add date range filtering for Bitly analytics
- **Action**: Abstract loading/isSearching pattern into reusable hook for all admin pages
- **Acceptance**:
  - Project name search efficiently queries junction table without performance degradation
  - Unified search hook reduces code duplication across admin pages
  - Date range filters work consistently with temporal attribution system
Logged at: 2025-01-21T12:52:00.000Z
Author: Agent Mode

### Partner-Level Analytics Dashboard (Q2 2026)
**Priority**: High
**Dependencies**: Partners system (v6.0.0), aggregated data models
- **Action**: Create dedicated analytics views for each partner showing:
  - All events by partner with performance metrics
  - Season-over-season comparisons
  - Home vs. away performance (for sports partners)
  - Audience demographics and trends
  - Bitly link performance aggregated by partner
- **Action**: Enable partner comparison views (head-to-head analytics)
- **Acceptance**:
  - Partner detail page shows comprehensive analytics
  - Comparison tools allow selecting 2+ partners for side-by-side metrics
  - Export functionality for partner reports
Logged at: 2025-01-21T12:52:00.000Z
Author: Agent Mode

### Style System Hardening (Q2 2026)
**Priority**: Medium
**Dependencies**: Design tokens, AdminHero, Layout utilities
- **Action**: Remove remaining inline styles; centralize into CSS Modules using tokens
- **Action**: Consolidate duplicated CSS files — keep only canonical imports
- **Action**: Prepare Atlas-managed theme injection plan (GET/PUT /api/admin/theme)
- **Acceptance**: < 5 inline styles remaining, all design tokens centralized
Logged at: 2025-01-21T12:52:00.000Z
Author: Agent Mode

### Bitly Analytics Export & Reporting (Q2 2026)
**Priority**: Medium
**Dependencies**: Bitly many-to-many system (v6.0.0)
- **Action**: Create downloadable reports for Bitly link performance
- **Action**: Enable custom date range selection for analytics
- **Action**: Add trend visualization (clicks over time, geographic distribution)
- **Acceptance**: Exportable PDF/CSV reports with branded headers, visual charts
Logged at: 2025-01-21T12:52:00.000Z
Author: Agent Mode

---

## 📍 Milestones

### Milestone: Analytics Platform Phase 1 — Data Aggregation & Storage (Q1 2026)
**Priority**: Critical
**Dependencies**: Current v6.0.0 schemas, MongoDB Atlas

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

Logged at: 2025-01-21T12:52:00.000Z
Author: Agent Mode

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

Logged at: 2025-01-21T12:52:00.000Z
Author: Agent Mode

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

Logged at: 2025-01-21T12:52:00.000Z
Author: Agent Mode

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

Logged at: 2025-01-21T12:52:00.000Z
Author: Agent Mode

---

### Milestone: Variable System Enhancement (Q2 2026)
**Priority**: Medium
**Dependencies**: Current variables system (v6.0.0)

**Objectives**:
- Extend SEYU reference token system
- Enable variable dependencies and calculated fields
- Improve variable discovery and documentation

**Actions**:
- Support formula-based custom variables (e.g., `[SEYUVAR1] / [SEYUVAR2] * 100`)
- Variable groups with collapsible sections in UI
- In-app documentation for each variable with examples
- Variable usage analytics (which variables are most used)

**Acceptance Criteria**:
- Calculated variables update automatically when dependencies change
- Variable documentation accessible via tooltip/modal in UI
- Variable usage tracked and displayed in admin

Logged at: 2025-01-21T12:52:00.000Z
Author: Agent Mode

### Milestone: Search & Paging Unification (Q2 2026)
Priority: High
Dependencies: Hashtags API pagination (v5.0.0)
- Extend server-side search + 20-per-page pagination to:
  - Admin → Hashtags
  - Admin → Categories
  - Admin → Charts
  - Admin → Users
- Evaluate public pages (/hashtag) for similar search UX without admin dependencies
- Acceptance: Consistent HERO search, server search with offset/limit, and Load 20 more on each page; documentation updated
Priority: High
Dependencies: Governance kickoff; sequential steps as listed
- P0: Settings governance and loader hardening
  - 1) Inventory baked settings (CSV under docs/audit)
  - 2) Define config schema and .env.example; document loader
  - 3) Plan Atlas settings collection (non-secrets) + caching; precedence env > DB
  - 4) Implement/extend config loader; replace direct env usages; remove baked defaults; remove hard-coded service base URLs
- P1: Styling migration
  - 5) Phase 1 (shared components) — extract repeated inline styles to CSS Modules with theme tokens
  - 6) Phase 2 (pages) — migrate remaining page-level inline styles
- Governance & Release
  - 7) Align documentation with actual stack (CSS Modules + theme.css)
  - 8) Versioning, build, release, deployment per DoD
  - 9) Guardrail scripts to prevent regressions

Acceptance summary
- Zero baked settings remaining in code grep (outside config and bootstrap)
- InlineStyles reduced to ≤ 5 (excluding computed token-driven cases)
- .env.example present; docs updated with ISO 8601 ms timestamps

Artifacts
- Settings inventory CSV: docs/audit/settings-inventory.csv (generated 2025-09-23T12:32:28.000Z)

### Milestone: Admin UI Consistency (Q2 2026)
Priority: High
Dependencies: None
- Standardize Admin HERO across all admin pages (single source, consistent background/width)
- Introduce and adopt design-managed `.content-surface` with `--content-bg` for main content areas
- Widen narrow pages to match admin main content width
- Documentation sync, versioning, and clean commit to main

### Milestone: CSV and Visualization Enhancement (Q2 2026)
Priority: High
Dependencies: Completed v3.0.0 parity, v3.1.0 hide no-data
- Admin Grid Settings UI (High)
  - Build UI under /admin/visualization to edit desktop/tablet/mobile units via /api/grid-settings
  - Dependency: grid-settings API (done)
- Derived Metrics in CSV (Medium)
  - Include computed totals (e.g., totalImages, totalFans) as additional rows
  - Optional: toggle for including derived metrics
- Chart Label Customization (Medium)
  - Allow renaming chart titles/subtitles per block for public display
  - Dependency: block editing model

### Milestone: Data Quality and UX (Q2 2026)
Priority: Medium
Dependencies: None
- Empty-Block UX (Medium)
  - If a block hides all charts due to no data, provide an optional friendly message toggle (admin-configurable)
- Performance pass for stats pages (Medium)
  - Audit inline CSS generation and ensure minimal reflows
- Export options (Low)
  - Download chart data as CSV (per chart) in addition to PNG

### Milestone: Admin Productivity (Q2 2026)
Priority: Medium
Dependencies: None
- Bulk chart assignment tools (Medium)
  - Multi-select charts and assign to blocks quickly
- Reorder blocks with drag-and-drop (Medium)
  - Improve ordering UX
- Audit and simplify unused admin features (Low)
  - Remove stale preview-only code paths

---

## 📦 Completed (v6.0.0)

### ✅ Partners Management System
- Complete CRUD for organizations (clubs, federations, venues, brands)
- Partner-level hashtag and Bitly link associations
- Reusable PartnerSelector component with predictive search

### ✅ Sports Match Builder
- Quick Add enhancement for rapid event creation
- Intelligent hashtag merging from two partners
- Automated event naming and Bitly link inheritance

### ✅ Bitly Many-to-Many System
- Temporal attribution with smart date ranges
- Junction table for link-project associations
- Automatic recalculation triggers and daily refresh

### ✅ Hashtag Categories System
- Category-based hashtag organization
- Color inheritance from categories
- Unified hashtag input component

### ✅ Comprehensive Documentation
- Complete user guides and technical documentation
- API reference with code examples
- Component library reference
- Architectural learnings documented

---

*MessMass Roadmap — Strategic Planning Document*  
*Version 6.5.0 | Last Updated: 2025-10-16T07:52:00.000Z (UTC)*
