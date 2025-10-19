/**
 * Analytics Aggregation Type Definitions
 * 
 * WHAT: TypeScript interfaces for pre-aggregated analytics data
 * WHY: Fast query performance (<500ms) for 1-year datasets by pre-computing metrics
 * 
 * Collections:
 * - analytics_aggregates: Event-level pre-computed metrics
 * - partner_analytics: Partner/team-level aggregated summaries
 * - event_comparisons: Comparative analysis data for benchmarking
 * 
 * Version: 6.25.0 (Phase 1 - Data Aggregation Infrastructure)
 * Created: 2025-10-19T11:06:37.000Z
 */

import { ObjectId } from 'mongodb';

/**
 * WHAT: Time bucket granularity for aggregated data
 * WHY: Support different time-series analysis needs (daily trends, monthly summaries, etc.)
 */
export type TimeBucket = 'event' | 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * WHAT: Trend direction indicator
 * WHY: Quick visual indication of metric trajectory over time
 */
export type TrendDirection = 'increasing' | 'stable' | 'declining' | 'insufficient_data';

/**
 * WHAT: Fan engagement metrics pre-computed for fast queries
 * WHY: Avoid calculating totalFans, engagement rates, and quality scores on every request
 */
export interface FanMetrics {
  totalFans: number;                    // remoteFans + stadium
  remoteFans: number;                   // Indoor + outdoor (aggregated)
  stadium: number;                      // On-site fans
  engagementRate: number;               // totalFans / eventAttendees × 100
  remoteQuality: number;                // remoteImages / remoteFans (engagement quality)
  stadiumQuality: number;               // hostessImages / stadium (engagement quality)
  selfieRate: number;                   // selfies / totalFans × 100
  coreFanTeam: number;                  // (merched / totalFans) × eventAttendees
  fanToAttendeeConversion: number;      // totalFans / eventAttendees × 100
}

/**
 * WHAT: Merchandise analytics pre-computed
 * WHY: Calculate penetration rates, revenue potential, and merch diversity once
 */
export interface MerchMetrics {
  totalMerched: number;                 // Total fans with any merchandise
  penetrationRate: number;              // merched / totalFans × 100
  byType: {
    jersey: number;
    scarf: number;
    flags: number;
    baseballCap: number;
    other: number;
  };
  merchToAttendee: number;              // merched / eventAttendees
  diversityIndex: number;               // Number of different merch types purchased
  highValueFans: number;                // jersey + scarf count
  casualFans: number;                   // cap + other count
}

/**
 * WHAT: Advertisement value calculations based on CPM model
 * WHY: Pre-compute ROI metrics using business model constants (€4.87 email opt-in CPM, etc.)
 */
export interface AdMetrics {
  totalImpressions: number;             // allImages × 300 avg views
  socialValue: number;                  // images × 20 shares × CPM (€14.50)
  emailValue: number;                   // propositionVisits × 35% open rate × CPM (€1.07)
  totalROI: number;                     // socialValue + emailValue
  viralCoefficient: number;             // shares / images × 100
  emailConversion: number;              // purchases / propositionVisits × 100
  costPerEngagement: number;            // ad spend / total engagements (if available)
  adValuePerFan: number;                // totalROI / totalFans (unit economics)
  reachMultiplier: number;              // organic reach vs. paid (if applicable)
}

/**
 * WHAT: Demographic distribution pre-computed
 * WHY: Calculate gender balance, age diversity, youth index once per event
 */
export interface DemographicMetrics {
  gender: {
    female: number;
    male: number;
  };
  ageGroups: {
    genAlpha: number;
    genYZ: number;
    genX: number;
    boomer: number;
  };
  youthIndex: number;                   // (genAlpha + genYZ) / total × 100
  genderBalance: number;                // abs(female - male) / total × 100 (lower = more balanced)
  diversityIndex: number;               // Entropy calculation for age/gender distribution
}

/**
 * WHAT: Visit source tracking and conversion metrics
 * WHY: Understand which channels drive fan engagement and conversions
 */
export interface VisitMetrics {
  bySource: {
    qrCode: number;
    shortUrl: number;
    web: number;
    social: number;
  };
  totalVisits: number;                  // Sum of all visit sources
  fanConversion: number;                // totalFans / totalVisit × 100
  propositionEffectiveness: number;     // purchases / visited × 100
}

/**
 * WHAT: Bitly analytics integration (when available)
 * WHY: Track link performance, traffic sources, device types, geographic reach
 */
export interface BitlyMetrics {
  clicks: number;                       // Total Bitly clicks
  uniqueClicks: number;                 // Unique visitors
  clicksByDevice: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  clicksByCountry: {
    [countryCode: string]: number;      // e.g., { "HU": 150, "RO": 80 }
  };
  topCountry: string;                   // Country code with most clicks
  referrers: {
    [source: string]: number;           // e.g., { "instagram": 200, "facebook": 150 }
  };
  topReferrer: string;                  // Referrer with most clicks
  hourlyPattern?: number[];             // 24-element array for time-of-day analysis
  clickRate: number;                    // clicks / eventAttendees × 100
  mobileRate: number;                   // mobile / total × 100
}

/**
 * WHAT: Partner/team context for event
 * WHY: Enable team-based analytics, venue comparisons, league benchmarking
 */
export interface PartnerContext {
  partnerId?: ObjectId;                 // Primary partner (home team)
  partnerName?: string;                 // Partner display name
  partnerEmoji?: string;                // Partner emoji
  opponentId?: ObjectId;                // Secondary partner (away team) if applicable
  opponentName?: string;                // Opponent display name
  leagueId?: string;                    // League identifier (from SportsDB)
  leagueName?: string;                  // League display name
  venueType: 'indoor' | 'outdoor' | 'stadium' | 'mixed';
  venueCapacity?: number;               // Stadium capacity (from SportsDB)
  isHomeGame?: boolean;                 // True if partnerId is home team
}

/**
 * WHAT: Single event aggregated metrics document
 * WHY: Store all pre-computed analytics for one event in a single document for fast retrieval
 * 
 * Collection: analytics_aggregates
 * Indexes: projectId, eventDate, aggregationType, (partnerContext.partnerId, eventDate)
 */
export interface AnalyticsAggregate {
  _id: ObjectId;
  projectId: ObjectId;                  // Reference to projects collection
  eventDate: string;                    // ISO 8601 date for time-series indexing
  aggregationType: TimeBucket;          // 'event' for single event, 'daily', 'weekly', etc.
  
  // Pre-computed metric groups
  fanMetrics: FanMetrics;
  merchMetrics: MerchMetrics;
  adMetrics: AdMetrics;
  demographicMetrics: DemographicMetrics;
  visitMetrics: VisitMetrics;
  bitlyMetrics?: BitlyMetrics;          // Optional - only if Bitly integration active
  
  // Partner/team context
  partnerContext: PartnerContext;
  
  // Raw event data (stored for reference)
  rawStats: {
    eventAttendees: number;
    remoteImages: number;
    hostessImages: number;
    selfies: number;
    approvedImages: number;
    rejectedImages: number;
  };
  
  // Metadata
  createdAt: string;                    // ISO 8601 with milliseconds
  updatedAt: string;                    // ISO 8601 with milliseconds
  version: string;                      // Schema version for migrations (e.g., "1.0")
}

/**
 * WHAT: Partner-level analytics aggregated across all events
 * WHY: Provide team/partner summaries, trends, and benchmarks without re-aggregating
 * 
 * Collection: partner_analytics
 * Indexes: partnerId, partnerType, (partnerId, timeframe)
 */
export interface PartnerAnalytics {
  _id: ObjectId;
  partnerId: ObjectId;                  // Team/league/sponsor ID
  partnerName: string;                  // Partner display name
  partnerEmoji?: string;                // Partner emoji
  partnerType: 'team' | 'league' | 'sponsor' | 'venue';
  timeframe: 'month' | 'quarter' | 'year' | 'alltime';
  startDate: string;                    // ISO 8601
  endDate: string;                      // ISO 8601
  
  // Aggregate metrics across all events in timeframe
  summary: {
    totalEvents: number;
    totalFans: number;
    totalAttendees: number;
    totalAdValue: number;               // Sum of all ad value generated
    avgFansPerEvent: number;
    avgEngagementRate: number;          // Average fan engagement rate
    avgMerchRate: number;               // Average merchandise penetration
    avgBitlyClicks?: number;            // Average Bitly clicks (if applicable)
  };
  
  // Trend data (vs. previous period)
  trends: {
    fanGrowthRate: number;              // % change vs. previous timeframe
    engagementTrend: TrendDirection;    // Trend direction
    performanceScore: number;           // Composite 0-100 score (multiple metrics)
  };
  
  // Benchmarking (vs. league/category)
  benchmarks: {
    vsLeagueAvg: number;                // % difference from league average fans
    ranking: number;                    // Position in league (1 = best)
    percentile: number;                 // 0-100 percentile ranking
  };
  
  // Top events by performance
  topEvents: Array<{
    projectId: ObjectId;
    eventDate: string;
    totalFans: number;
    adValue: number;
  }>;
  
  // Metadata
  createdAt: string;                    // ISO 8601 with milliseconds
  updatedAt: string;                    // ISO 8601 with milliseconds
}

/**
 * WHAT: Event comparison data for benchmarking
 * WHY: Pre-compute comparisons (YoY, team history, rivalry games, best/worst) for fast retrieval
 * 
 * Collection: event_comparisons
 * Indexes: primaryProjectId, comparisonType
 */
export interface EventComparison {
  _id: ObjectId;
  comparisonType: 'yoy' | 'team_history' | 'rivalry' | 'best_worst' | 'custom';
  primaryProjectId: ObjectId;           // Main event being compared
  
  // Comparison events with metrics
  comparisonProjects: Array<{
    projectId: ObjectId;
    label: string;                      // e.g., "Same event last year", "Team average"
    eventDate: string;
    metrics: {
      totalFans: number;
      engagementRate: number;
      merchRate: number;
      adValue: number;
    };
  }>;
  
  // Delta metrics (difference from primary event)
  deltaMetrics: {
    fanDelta: number;                   // Difference in fans
    fanDeltaPercent: number;            // % change
    engagementDelta: number;            // Difference in engagement rate
    engagementDeltaPercent: number;     // % change
    merchDelta: number;                 // Difference in merch rate
    merchDeltaPercent: number;          // % change
    adValueDelta: number;               // Difference in ad value
    adValueDeltaPercent: number;        // % change
  };
  
  // Metadata
  createdAt: string;                    // ISO 8601 with milliseconds
  updatedAt: string;                    // ISO 8601 with milliseconds
}

/**
 * WHAT: Aggregation job log entry
 * WHY: Track aggregation performance, errors, and processing times for monitoring
 * 
 * Collection: aggregation_logs
 * Indexes: startTime, status
 */
export interface AggregationLog {
  _id: ObjectId;
  jobType: 'event' | 'partner' | 'comparison';
  startTime: string;                    // ISO 8601 with milliseconds
  endTime?: string;                     // ISO 8601 with milliseconds
  duration?: number;                    // Duration in milliseconds
  status: 'running' | 'success' | 'partial_failure' | 'failed';
  projectsProcessed: number;            // Number of projects processed
  projectsFailed: number;               // Number of projects that failed
  errors?: Array<{
    projectId: ObjectId;
    errorMessage: string;
  }>;
  performanceMetrics: {
    avgProcessingTime: number;          // Average ms per project
    maxProcessingTime: number;          // Max ms for any project
    totalQueries: number;               // Total DB queries executed
  };
  createdAt: string;                    // ISO 8601 with milliseconds
}

/**
 * WHAT: API response type for aggregated analytics
 * WHY: Consistent response structure for analytics API endpoints
 */
export interface AnalyticsAPIResponse {
  success: boolean;
  data?: AnalyticsAggregate;
  error?: string;
  timestamp: string;                    // ISO 8601 with milliseconds
}

/**
 * WHAT: API response type for partner analytics
 * WHY: Consistent response structure for partner analytics API
 */
export interface PartnerAnalyticsAPIResponse {
  success: boolean;
  data?: PartnerAnalytics;
  error?: string;
  timestamp: string;                    // ISO 8601 with milliseconds
}

/**
 * WHAT: API response type for event comparisons
 * WHY: Consistent response structure for comparison API
 */
export interface ComparisonAPIResponse {
  success: boolean;
  data?: EventComparison;
  error?: string;
  timestamp: string;                    // ISO 8601 with milliseconds
}

/**
 * WHAT: Query parameters for analytics API endpoints
 * WHY: Type-safe API request parameters
 */
export interface AnalyticsQueryParams {
  projectId?: string;
  partnerId?: string;
  timeframe?: 'month' | 'quarter' | 'year' | 'alltime';
  startDate?: string;                   // ISO 8601 date
  endDate?: string;                     // ISO 8601 date
  includeComparisons?: boolean;
  includeBitly?: boolean;
}
