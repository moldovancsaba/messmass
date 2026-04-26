# {messmass} v3 -- Reporting Engine Architecture

Purpose: Define how {messmass} generates analytics and reports from
activities, entities, and metrics.

------------------------------------------------------------------------

# 1. Reporting Architecture

Core components:

Data Sources Entity Activity ActivityParticipant MetricValue

Processing Layer Aggregation pipelines Metric calculations Filters and
dimensions

Delivery Layer Dashboards Export APIs Scheduled reports

------------------------------------------------------------------------

# 2. Reporting Pipeline

Flow:

User Request → Reporting API → Aggregation Builder → MongoDB Aggregation
→ Report Formatter → Dashboard

------------------------------------------------------------------------

# 3. Aggregation Strategy

MongoDB aggregation pipelines should be used.

Example pipeline steps:

1.  Match relevant activities
2.  Join participants
3.  Join metric values
4.  Group results
5.  Calculate totals

------------------------------------------------------------------------

# 4. Report Types

Supported report types:

Entity Activity Report Activity Metric Report Organisation Summary
Custom Metric Dashboards

------------------------------------------------------------------------

# 5. Caching Strategy

Reports must support caching.

Recommended cache types:

Short cache (30s) Dashboard cache (5 minutes) Export cache (1 hour)

Use Redis or in-memory cache layer.

------------------------------------------------------------------------

# 6. Pre-Aggregated Metrics

Large systems require summary collections.

Example:

DailyMetricSummary MonthlyMetricSummary

Fields:

entityId activityType metricId value

------------------------------------------------------------------------

# 7. Example League Report

League → Teams → Matches → Attendance

Pipeline:

1.  Find teams in league
2.  Find activities involving teams
3.  Fetch attendance metrics
4.  Sum values

------------------------------------------------------------------------

# 8. Dashboard Queries

Dashboards require optimized queries.

Indexes required:

activityId entityId metricId

------------------------------------------------------------------------

# 9. Export System

Exports supported:

CSV Excel JSON

Large exports processed via background jobs.

------------------------------------------------------------------------

End of Reporting Engine Design.
