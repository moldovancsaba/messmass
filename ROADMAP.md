# ROADMAP.md

Current Version: 11.1.0
Last Updated: 2025-11-11T13:53:00.000Z (UTC)

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

### Style System Hardening (Q1 2026)
**Priority**: Critical  
**Status**: Active - Phase 1  
**Dependencies**: Design tokens (theme.css), CSS Modules

**Problem**: Hardcoded inline styles violate design system principles, making global updates impossible and cluttering JSX.

**Actions**:
- **Phase 1**: Create foundation utilities (✅ Complete - AdminDashboardNew.tsx refactored)
- **Phase 2**: Systematic refactoring of all components with inline styles
- **Phase 3**: Create reusable CSS modules for common layouts
- **Phase 4**: Add ESLint rule to prevent inline styles
- **Phase 5**: Consolidate duplicated CSS files
- **Phase 6**: Prepare Atlas-managed theme injection plan

**Acceptance Criteria**:
- Zero inline styles (except computed token-driven styles)
- All layouts use design tokens from theme.css
- ESLint enforcement active
- Visual regression: zero changes to UI appearance

---

### Search & Paging Unification (Q2 2026)
**Priority**: High  
**Dependencies**: Hashtags API pagination (v5.0.0)

**Objective**: Extend server-side search + pagination to all admin pages for consistent UX.

**Actions**:
- Apply to Admin → Hashtags
- Apply to Admin → Categories
- Apply to Admin → Charts  
- Apply to Admin → Users
- Evaluate public pages (/hashtag) for similar search UX

**Acceptance**: Consistent HERO search, server search with offset/limit, and "Load 20 more" button on each page.

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
**Dependencies**: Partners system (v6.0.0), aggregated data models

**Actions**:
- Create dedicated analytics views for each partner showing:
  - All events by partner with performance metrics
  - Season-over-season comparisons
  - Home vs. away performance (for sports partners)
  - Audience demographics and trends
  - Bitly link performance aggregated by partner
- Enable partner comparison views (head-to-head analytics)

**Acceptance**:
- Partner detail page shows comprehensive analytics
- Comparison tools allow selecting 2+ partners for side-by-side metrics
- Export functionality for partner reports

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
