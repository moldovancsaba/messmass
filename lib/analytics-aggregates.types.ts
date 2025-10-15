/**
 * Analytics Aggregation Types
 * 
 * WHAT: TypeScript interfaces for pre-aggregated analytics data
 * WHY: Fast query performance (< 500ms) by pre-computing metrics instead of querying raw data
 * 
 * Collections:
 * - analytics_aggregates: Time-bucketed metrics (daily, weekly, monthly)
 * - partner_analytics: Partner-level aggregated metrics
 * - event_comparisons: Event-to-event comparison data
 * 
 * Version: 6.1.0
 * Created: 2025-01-21T17:00:00.000Z
 */

import { ObjectId } from 'mongodb';

/**
 * Time bucket granularity for aggregated data
 */
export type TimeBucket = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Aggregated metrics for a specific time period
 * Stored in `analytics_aggregates` collection
 */
export interface TimeAggregatedMetrics {
  _id: ObjectId;
  
  // Time period identification
  bucket: TimeBucket;                  // Granularity of this aggregate
  periodStart: string;                 // ISO 8601 start of period
  periodEnd: string;                   // ISO 8601 end of period
  year: number;                        // Year for quick filtering
  month?: number;                      // Month (1-12) for monthly/weekly/daily
  week?: number;                       // Week number (1-53) for weekly
  day?: number;                        // Day of month for daily
  
  // Dimensional filters
  partnerId?: string;                  // If filtered by partner
  partnerName?: string;                // Partner display name
  hashtagCategory?: string;            // If filtered by hashtag category
  hashtag?: string;                    // If filtered by specific hashtag
  
  // Event counts
  eventCount: number;                  // Number of events in period
  eventIds: string[];                  // Array of project IDs
  
  // Aggregated statistics
  totalAttendees: number;
  avgAttendees: number;
  minAttendees: number;
  maxAttendees: number;
  
  totalImages: number;
  avgImages: number;
  
  totalFans: number;
  avgFans: number;
  
  totalMerchedFans: number;
  avgMerchedFans: number;
  merchandiseRate: number;             // Percentage of fans with merch
  
  totalBitlyClicks: number;
  avgBitlyClicks: number;
  
  // Demographics aggregates
  totalFemale: number;
  totalMale: number;
  femalePercent: number;
  malePercent: number;
  
  totalGenAlpha: number;
  totalGenYZ: number;
  totalGenX: number;
  totalBoomer: number;
  
  // Location aggregates
  totalIndoor: number;
  totalOutdoor: number;
  totalStadium: number;
  
  // Calculated KPIs
  avgEngagementRate: number;           // Images per attendee
  avgFanTeamMetric: number;            // (merched / total fans) * attendees
  
  // Metadata
  lastAggregatedAt: string;            // ISO 8601 timestamp of aggregation
  aggregatedEventCount: number;        // Number of events included
  createdAt: string;
  updatedAt: string;
}

/**
 * Partner-level analytics aggregated across all events
 * Stored in `partner_analytics` collection
 */
export interface PartnerAnalytics {
  _id: ObjectId;
  partnerId: string;                   // Reference to partners collection
  partnerName: string;
  partnerEmoji?: string;
  
  // Overall statistics
  totalEvents: number;
  firstEventDate: string;              // ISO 8601 date of first event
  lastEventDate: string;               // ISO 8601 date of most recent event
  
  // Aggregated metrics across all events
  totalAttendees: number;
  avgAttendeesPerEvent: number;
  bestEventAttendance: number;
  bestEventId: string;
  bestEventName: string;
  bestEventDate: string;
  
  totalImages: number;
  avgImagesPerEvent: number;
  
  totalFans: number;
  avgFansPerEvent: number;
  
  totalMerchedFans: number;
  avgMerchandiseRate: number;
  
  totalBitlyClicks: number;
  avgBitlyClicksPerEvent: number;
  
  // Trends (comparison to previous period)
  attendanceTrend: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
  attendanceTrendPercent: number;      // % change vs previous period
  engagementTrend: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
  engagementTrendPercent: number;
  
  // Season-over-season comparison (if applicable)
  seasonOverSeasonChange?: number;     // % change vs same period last year
  
  // Hashtag performance
  topHashtags: Array<{
    hashtag: string;
    eventCount: number;
    avgAttendance: number;
  }>;
  
  // Metadata
  lastAggregatedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Event comparison data for benchmarking
 * Stored in `event_comparisons` collection
 */
export interface EventComparison {
  _id: ObjectId;
  eventId: string;                     // Reference to projects collection
  eventName: string;
  eventDate: string;
  partnerId?: string;
  partnerName?: string;
  
  // Core metrics
  attendees: number;
  images: number;
  fans: number;
  merchedFans: number;
  merchandiseRate: number;
  bitlyClicks: number;
  engagementRate: number;              // Images per attendee
  
  // Comparative rankings (percentile among all events)
  attendeePercentile: number;          // 0-100 (higher = better)
  engagementPercentile: number;
  merchandisePercentile: number;
  
  // Comparative rankings within partner (if applicable)
  partnerAttendeePercentile?: number;
  partnerEngagementPercentile?: number;
  
  // Comparative rankings within hashtag category
  hashtagComparisons?: Array<{
    hashtag: string;
    attendeePercentile: number;
    engagementPercentile: number;
  }>;
  
  // Historical comparison (vs same event type)
  vsHistoricalAvg: {
    attendeeDiff: number;              // Difference from historical average
    attendeeDiffPercent: number;
    engagementDiff: number;
    engagementDiffPercent: number;
    merchandiseDiff: number;
    merchandiseDiffPercent: number;
  };
  
  // Similar event comparisons
  similarEvents: Array<{
    eventId: string;
    eventName: string;
    eventDate: string;
    similarityScore: number;           // 0-1 (how similar)
    attendeeDiff: number;
    engagementDiff: number;
  }>;
  
  // Metadata
  lastCalculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Time-series data point for trend analysis
 */
export interface TimeSeriesDataPoint {
  date: string;                        // ISO 8601 date
  value: number;
  label?: string;                      // Optional label for display
}

/**
 * Aggregation job metadata
 * Tracks aggregation runs for monitoring and debugging
 */
export interface AggregationJobMetadata {
  _id: ObjectId;
  jobType: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'full' | 'partner' | 'comparison';
  status: 'pending' | 'running' | 'completed' | 'failed';
  
  // Execution details
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  
  // Job scope
  periodStart?: string;                // For time-bucketed jobs
  periodEnd?: string;
  partnerId?: string;                  // For partner-specific jobs
  
  // Results
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  errors: string[];
  
  // Performance metrics
  avgQueryTimeMs?: number;
  peakMemoryMb?: number;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Helper types for aggregation operations
 */

export interface AggregationOptions {
  bucket?: TimeBucket;
  startDate?: string;                  // ISO 8601
  endDate?: string;                    // ISO 8601
  partnerId?: string;
  hashtag?: string;
  forceRefresh?: boolean;              // Force re-aggregation even if exists
}

export interface AggregationResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  durationMs: number;
  errors: string[];
}

/**
 * Query filters for retrieving aggregated data
 */
export interface AggregateQueryFilters {
  bucket?: TimeBucket;
  startDate?: string;                  // ISO 8601
  endDate?: string;                    // ISO 8601
  partnerId?: string;
  partnerIds?: string[];               // Multiple partners
  hashtag?: string;
  hashtags?: string[];                 // Multiple hashtags
  year?: number;
  month?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'attendance' | 'engagement' | 'merchandise';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response format for aggregated data API
 */
export interface AggregateDataResponse {
  data: TimeAggregatedMetrics[];
  metadata: {
    totalRecords: number;
    returnedRecords: number;
    hasMore: boolean;
    nextOffset?: number;
    aggregatedAt: string;
    queryTimeMs: number;
  };
}

export interface PartnerAnalyticsResponse {
  data: PartnerAnalytics[];
  metadata: {
    totalPartners: number;
    returnedRecords: number;
    hasMore: boolean;
    nextOffset?: number;
    aggregatedAt: string;
    queryTimeMs: number;
  };
}

export interface EventComparisonResponse {
  data: EventComparison[];
  metadata: {
    totalEvents: number;
    returnedRecords: number;
    hasMore: boolean;
    nextOffset?: number;
    calculatedAt: string;
    queryTimeMs: number;
  };
}
