// lib/analytics/derivedMetrics.ts
// WHAT: Centralized Derived Metrics & Stats Preparation Pipeline
// WHY: Ensures all calculation engines (single-chart previews and multi-chart reports)
//      share an identical data enrichment and derived-metric foundation.

export {
  ensureDerivedMetrics,
  prepareStatsForAnalytics,
  validateProjectStats,
  type ProjectStats,
  type ValidationResult
} from '../dataValidator';
