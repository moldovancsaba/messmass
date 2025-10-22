// lib/dataValidator.ts - Centralized Data Validation & Quality Assurance
// WHAT: Unified validation layer for project stats, analytics data, and chart calculations
// WHY: Prevent errors, crashes, and misleading results from incomplete or invalid data
// HOW: Pre-flight checks, data completeness scoring, safe defaults, and graceful degradation

/**
 * Project statistics interface matching the application structure
 * Includes all base, optional, and derived metrics
 */
export interface ProjectStats {
  // Core Image Statistics (always required)
  remoteImages: number;
  hostessImages: number;
  selfies: number;
  
  // Location Statistics (always required)
  indoor: number;
  outdoor: number;
  stadium: number;
  
  // Demographics (always required)
  female: number;
  male: number;
  genAlpha: number;
  genYZ: number;
  genX: number;
  boomer: number;
  
  // Merchandise (always required)
  merched: number;
  jersey: number;
  scarf: number;
  flags: number;
  baseballCap: number;
  other: number;
  
  // Optional Success Manager Fields
  approvedImages?: number;
  rejectedImages?: number;
  visitQrCode?: number;
  visitShortUrl?: number;
  visitWeb?: number;
  visitFacebook?: number;
  visitInstagram?: number;
  visitYoutube?: number;
  visitTiktok?: number;
  visitX?: number;
  visitTrustpilot?: number;
  eventAttendees?: number;
  eventTicketPurchases?: number;
  eventResultHome?: number;
  eventResultVisitor?: number;
  eventValuePropositionVisited?: number;
  eventValuePropositionPurchases?: number;
  
  // Merchandise Pricing Variables
  jerseyPrice?: number;
  scarfPrice?: number;
  flagsPrice?: number;
  capPrice?: number;
  otherPrice?: number;
  
  // Bitly Analytics Variables (optional system-generated)
  bitlyTotalClicks?: number;
  bitlyUniqueClicks?: number;
  bitlyClicksByCountry?: Record<string, number>;
  bitlyTopCountry?: string;
  bitlyCountryCount?: number;
  bitlyDirectClicks?: number;
  bitlySocialClicks?: number;
  bitlyTopReferrer?: string;
  bitlyReferrerCount?: number;
  bitlyTopDomain?: string;
  bitlyDomainCount?: number;
  bitlyQrCodeClicks?: number;
  bitlyInstagramMobileClicks?: number;
  bitlyInstagramWebClicks?: number;
  bitlyFacebookMobileClicks?: number;
  bitlyFacebookMessengerClicks?: number;
  bitlyMobileClicks?: number;
  bitlyDesktopClicks?: number;
  bitlyTabletClicks?: number;
  bitlyiOSClicks?: number;
  bitlyAndroidClicks?: number;
  bitlyChromeClicks?: number;
  bitlySafariClicks?: number;
  bitlyFirefoxClicks?: number;
  
  // Derived/Computed Fields (optional - can be calculated)
  remoteFans?: number;
  totalFans?: number;
  allImages?: number;
  
  // Custom Variables (dynamic user-defined metrics)
  [key: string]: number | string | boolean | Record<string, any> | undefined;
}

/**
 * WHAT: Core required metrics that MUST be present for basic analytics
 * WHY: These fields are essential for all calculations and charts
 * HOW: Validation functions check these fields and reject incomplete data
 */
export const REQUIRED_BASE_METRICS = [
  'remoteImages', 'hostessImages', 'selfies',
  'indoor', 'outdoor', 'stadium',
  'female', 'male', 'genAlpha', 'genYZ', 'genX', 'boomer',
  'merched', 'jersey', 'scarf', 'flags', 'baseballCap', 'other'
] as const;

/**
 * WHAT: Derived metrics that can be computed from base metrics
 * WHY: If missing, we can calculate them rather than failing
 */
export const DERIVED_METRICS = ['remoteFans', 'totalFans', 'allImages'] as const;

/**
 * WHAT: Optional metrics that are nice-to-have but not critical
 * WHY: Analytics can proceed without these, but features may be limited
 */
export const OPTIONAL_METRICS = [
  'eventAttendees', 'visitQrCode', 'visitShortUrl', 'visitWeb',
  'eventValuePropositionVisited', 'eventValuePropositionPurchases',
  'eventTicketPurchases', 'eventResultHome', 'eventResultVisitor',
  // All Bitly metrics
  'bitlyTotalClicks', 'bitlyUniqueClicks', 'bitlyMobileClicks'
] as const;

/**
 * Data validation result with quality indicators
 */
export interface ValidationResult {
  isValid: boolean;
  completeness: number; // 0-100 percentage
  missingRequired: string[];
  missingOptional: string[];
  hasMinimumData: boolean; // Can basic charts be rendered?
  hasFullData: boolean; // Can advanced analytics be performed?
  warnings: string[];
  errors: string[];
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'insufficient';
}

/**
 * WHAT: Validates project stats for completeness and quality
 * WHY: Pre-flight check before any analytics computation
 * HOW: Checks required fields, calculates completeness score, returns quality indicators
 * 
 * @param stats - Project statistics object to validate
 * @param context - Optional context (e.g., 'chart', 'insights', 'api')
 * @returns Validation result with detailed quality metrics
 */
export function validateProjectStats(
  stats: Partial<ProjectStats>,
  context?: string
): ValidationResult {
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // WHAT: Check required base metrics
  // WHY: These are mandatory for any analytics operation
  for (const field of REQUIRED_BASE_METRICS) {
    const value = (stats as any)[field];
    if (value === undefined || value === null) {
      missingRequired.push(field);
      errors.push(`Missing required metric: ${field}`);
    } else if (typeof value !== 'number' || isNaN(value)) {
      errors.push(`Invalid value for ${field}: expected number, got ${typeof value}`);
    }
  }

  // WHAT: Check optional metrics (for completeness scoring)
  // WHY: Higher completeness = better insights quality
  for (const field of OPTIONAL_METRICS) {
    const value = (stats as any)[field];
    if (value === undefined || value === null) {
      missingOptional.push(field);
    }
  }

  // WHAT: Validate derived metrics (can be computed if missing)
  // WHY: Warn if missing but don't fail (we can calculate them)
  for (const field of DERIVED_METRICS) {
    const value = (stats as any)[field];
    if (value === undefined || value === null) {
      warnings.push(`Derived metric ${field} is missing (can be computed from base metrics)`);
    }
  }

  // WHAT: Calculate data completeness percentage
  // WHY: Quantify data quality for UI indicators and decision-making
  const totalFields = REQUIRED_BASE_METRICS.length + OPTIONAL_METRICS.length;
  const presentFields = totalFields - missingRequired.length - missingOptional.length;
  const completeness = Math.round((presentFields / totalFields) * 100);

  // WHAT: Determine data quality tier
  // WHY: Simple classification for UI badges and routing logic
  let dataQuality: ValidationResult['dataQuality'];
  if (completeness >= 90) dataQuality = 'excellent';
  else if (completeness >= 75) dataQuality = 'good';
  else if (completeness >= 50) dataQuality = 'fair';
  else if (completeness >= 25) dataQuality = 'poor';
  else dataQuality = 'insufficient';

  const hasMinimumData = missingRequired.length === 0;
  const hasFullData = missingRequired.length === 0 && missingOptional.length === 0;
  const isValid = missingRequired.length === 0;

  return {
    isValid,
    completeness,
    missingRequired,
    missingOptional,
    hasMinimumData,
    hasFullData,
    warnings,
    errors,
    dataQuality
  };
}

/**
 * WHAT: Ensures derived metrics exist by computing them from base metrics
 * WHY: Prevent errors when derived fields are expected but missing
 * HOW: Calculate allImages, remoteFans, totalFans if not present
 * 
 * @param stats - Project statistics (may be incomplete)
 * @returns Stats with derived metrics guaranteed to exist
 */
export function ensureDerivedMetrics(stats: Partial<ProjectStats>): ProjectStats {
  const enriched = { ...stats } as any;

  // WHAT: Compute allImages (Total Images) if missing
  // WHY: Many charts require this aggregated metric
  if (enriched.allImages === undefined || enriched.allImages === null) {
    const remoteImages = enriched.remoteImages || 0;
    const hostessImages = enriched.hostessImages || 0;
    const selfies = enriched.selfies || 0;
    enriched.allImages = remoteImages + hostessImages + selfies;
  }

  // WHAT: Compute remoteFans (Indoor + Outdoor) if missing
  // WHY: Location analytics depend on this aggregation
  if (enriched.remoteFans === undefined || enriched.remoteFans === null) {
    const indoor = enriched.indoor || 0;
    const outdoor = enriched.outdoor || 0;
    enriched.remoteFans = indoor + outdoor;
  }

  // WHAT: Compute totalFans (Remote + Stadium) if missing
  // WHY: Core metric for engagement, merchandise, and ROI calculations
  if (enriched.totalFans === undefined || enriched.totalFans === null) {
    const remoteFans = enriched.remoteFans || ((enriched.indoor || 0) + (enriched.outdoor || 0));
    const stadium = enriched.stadium || 0;
    enriched.totalFans = remoteFans + stadium;
  }

  return enriched as ProjectStats;
}

/**
 * WHAT: Provides safe default values for missing optional metrics
 * WHY: Allow analytics to proceed with reasonable assumptions
 * HOW: Return 0 for counts, null for text, false for flags
 * 
 * @param field - Field name
 * @param type - Expected field type
 * @returns Safe default value
 */
export function getSafeDefault(field: string, type: 'number' | 'string' | 'boolean' = 'number'): any {
  switch (type) {
    case 'number':
      return 0;
    case 'string':
      return null;
    case 'boolean':
      return false;
    default:
      return null;
  }
}

/**
 * WHAT: Validates if a specific metric set is sufficient for a calculation
 * WHY: Pre-flight check before complex analytics operations
 * HOW: Check if required fields for a specific formula/chart exist
 * 
 * @param stats - Project statistics
 * @param requiredFields - List of field names needed
 * @returns Object with validation status and missing fields
 */
export function validateRequiredFields(
  stats: Partial<ProjectStats>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const field of requiredFields) {
    const value = (stats as any)[field];
    if (value === undefined || value === null) {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * WHAT: Checks if stats are sufficient for insights generation
 * WHY: Insights require more complete data than basic charts
 * HOW: Validate presence of key analytics metrics (fans, merchandise, events)
 * 
 * @param stats - Project statistics
 * @returns True if insights can be generated safely
 */
export function canGenerateInsights(stats: Partial<ProjectStats>): boolean {
  // WHAT: Minimum required for meaningful insights
  // WHY: Without these, insights would be speculative and misleading
  const criticalMetrics = [
    'remoteImages', 'hostessImages', 'selfies',
    'stadium', 'indoor', 'outdoor',
    'merched', 'female', 'male'
  ];

  const validation = validateRequiredFields(stats, criticalMetrics);
  return validation.valid;
}

/**
 * WHAT: Checks if stats are sufficient for benchmarking
 * WHY: Benchmarking requires comparable complete datasets
 * HOW: Ensure all core metrics are present (stricter than insights)
 * 
 * @param stats - Project statistics
 * @returns True if benchmarking can be performed safely
 */
export function canBenchmark(stats: Partial<ProjectStats>): boolean {
  // WHAT: All required base metrics must be present
  // WHY: Incomplete data skews percentile calculations
  const validation = validateRequiredFields(stats, REQUIRED_BASE_METRICS as unknown as string[]);
  return validation.valid;
}

/**
 * WHAT: Filters a dataset to only include records with sufficient data quality
 * WHY: Prevent skewed analytics from incomplete legacy data
 * HOW: Apply validation and keep only records meeting quality threshold
 * 
 * @param records - Array of records with stats
 * @param minQuality - Minimum acceptable quality ('excellent', 'good', 'fair', 'poor')
 * @returns Filtered array with quality records only
 */
export function filterByDataQuality<T extends { stats?: Partial<ProjectStats> }>(
  records: T[],
  minQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'fair'
): T[] {
  const qualityOrder = { excellent: 4, good: 3, fair: 2, poor: 1, insufficient: 0 };
  const minScore = qualityOrder[minQuality];

  return records.filter(record => {
    if (!record.stats) return false;
    const validation = validateProjectStats(record.stats);
    const score = qualityOrder[validation.dataQuality];
    return score >= minScore;
  });
}

/**
 * WHAT: Safe getter for any stats field with fallback
 * WHY: Prevent undefined access errors throughout codebase
 * HOW: Return field value or default if missing/invalid
 * 
 * @param stats - Project statistics
 * @param field - Field name to retrieve
 * @param fallback - Default value if field is missing
 * @returns Field value or fallback
 */
export function safeGetStat(
  stats: Partial<ProjectStats>,
  field: string,
  fallback: number = 0
): number {
  const value = (stats as any)[field];
  if (value === undefined || value === null || typeof value !== 'number' || isNaN(value)) {
    return fallback;
  }
  return value;
}

/**
 * WHAT: Validates and enriches stats object for analytics consumption
 * WHY: Single function to prepare any stats object for use
 * HOW: Validate, compute derived metrics, fill safe defaults
 * 
 * @param stats - Raw stats from database
 * @returns Validated and enriched stats ready for analytics
 */
export function prepareStatsForAnalytics(stats: Partial<ProjectStats>): {
  stats: ProjectStats;
  validation: ValidationResult;
} {
  const validation = validateProjectStats(stats);
  const enriched = ensureDerivedMetrics(stats);

  return {
    stats: enriched,
    validation
  };
}

/**
 * Data Quality Insights - KYC-based actionable intelligence
 */

export interface DataConsistencyWarning {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  actualValue: number;
  expectedCondition: string;
}

/**
 * WHAT: Detect data consistency violations (logic errors)
 * WHY: Catch human errors or sync issues early
 * HOW: Validate business rules (e.g., merched ≤ totalFans)
 * 
 * @param stats - Project statistics
 * @returns Array of consistency warnings
 */
export function detectConsistencyWarnings(stats: Partial<ProjectStats>): DataConsistencyWarning[] {
  const warnings: DataConsistencyWarning[] = [];
  const enriched = ensureDerivedMetrics(stats);

  // Rule 1: Merched fans cannot exceed total fans
  const merched = safeGetStat(enriched, 'merched', 0);
  const totalFans = safeGetStat(enriched, 'totalFans', 0);
  if (merched > totalFans && totalFans > 0) {
    warnings.push({
      field: 'merched',
      message: `${merched} merched fans exceeds ${totalFans} total fans. Verify data.`,
      severity: 'error',
      actualValue: merched,
      expectedCondition: `≤ ${totalFans}`
    });
  }

  // Rule 2: All images should equal sum of image types
  const allImages = safeGetStat(enriched, 'allImages', 0);
  const remoteImages = safeGetStat(enriched, 'remoteImages', 0);
  const hostessImages = safeGetStat(enriched, 'hostessImages', 0);
  const selfies = safeGetStat(enriched, 'selfies', 0);
  const expectedAllImages = remoteImages + hostessImages + selfies;
  if (allImages !== expectedAllImages && allImages > 0) {
    warnings.push({
      field: 'allImages',
      message: `Total images (${allImages}) doesn't match sum of types (${expectedAllImages}). Data may be out of sync.`,
      severity: 'warning',
      actualValue: allImages,
      expectedCondition: `= ${expectedAllImages}`
    });
  }

  // Rule 3: Total fans should equal remoteFans + stadium
  const remoteFans = safeGetStat(enriched, 'remoteFans', 0);
  const stadium = safeGetStat(enriched, 'stadium', 0);
  const expectedTotalFans = remoteFans + stadium;
  if (totalFans !== expectedTotalFans && totalFans > 0) {
    warnings.push({
      field: 'totalFans',
      message: `Total fans (${totalFans}) doesn't match remoteFans + stadium (${expectedTotalFans}). Recalculation needed.`,
      severity: 'warning',
      actualValue: totalFans,
      expectedCondition: `= ${expectedTotalFans}`
    });
  }

  // Rule 4: Demographics should not exceed total fans
  const female = safeGetStat(enriched, 'female', 0);
  const male = safeGetStat(enriched, 'male', 0);
  const totalGender = female + male;
  if (totalGender > totalFans && totalFans > 0) {
    warnings.push({
      field: 'demographics',
      message: `Total gender count (${totalGender}) exceeds total fans (${totalFans}). Check demographics data.`,
      severity: 'warning',
      actualValue: totalGender,
      expectedCondition: `≤ ${totalFans}`
    });
  }

  // Rule 5: Merched fans should not exceed total merchandise items
  // WHY: If merched > totalMerchItems, it means we counted fans with merch but no items tracked
  // LOGIC: Merched fans can buy multiple items, so totalMerchItems ≥ merched is valid
  const jersey = safeGetStat(enriched, 'jersey', 0);
  const scarf = safeGetStat(enriched, 'scarf', 0);
  const flags = safeGetStat(enriched, 'flags', 0);
  const baseballCap = safeGetStat(enriched, 'baseballCap', 0);
  const other = safeGetStat(enriched, 'other', 0);
  const totalMerchItems = jersey + scarf + flags + baseballCap + other;
  if (merched > totalMerchItems && totalMerchItems > 0) {
    warnings.push({
      field: 'merchandise',
      message: `Merched fans (${merched}) exceeds total merchandise items (${totalMerchItems}). Every merched fan should have at least one item tracked.`,
      severity: 'error',
      actualValue: merched,
      expectedCondition: `≤ ${totalMerchItems}`
    });
  }

  return warnings;
}

export interface EnrichmentOpportunity {
  field: string;
  label: string;
  category: string;
  impact: number; // 1-5 stars
  unlockedInsights: string[];
  reason: string;
}

/**
 * WHAT: Identify missing fields that unlock the most analytics value
 * WHY: Prioritize data collection efforts for maximum ROI
 * HOW: Score fields by number of dependent calculations and features
 * 
 * @param stats - Project statistics
 * @returns Ranked list of enrichment opportunities
 */
export function identifyEnrichmentOpportunities(stats: Partial<ProjectStats>): EnrichmentOpportunity[] {
  const opportunities: EnrichmentOpportunity[] = [];
  const validation = validateProjectStats(stats);

  // High-impact opportunities
  if (!stats.eventAttendees) {
    opportunities.push({
      field: 'eventAttendees',
      label: 'Event Attendees',
      category: 'Event Context',
      impact: 5,
      unlockedInsights: [
        'Merchandise penetration rate',
        'Fan engagement ratio',
        'Core fan team calculation',
        'Attendance vs. participation gap',
        'ROI per attendee'
      ],
      reason: 'Critical for all engagement and ROI metrics'
    });
  }

  if (!stats.visitQrCode && !stats.visitShortUrl && !stats.visitWeb) {
    opportunities.push({
      field: 'visitQrCode',
      label: 'Visit Tracking (QR/Short URL/Web)',
      category: 'Engagement',
      impact: 4,
      unlockedInsights: [
        'Funnel conversion analytics',
        'Digital engagement rate',
        'Source attribution',
        'Campaign effectiveness'
      ],
      reason: 'Essential for understanding digital touchpoints'
    });
  }

  // Bitly integration check
  const hasBitlyData = stats.bitlyTotalClicks || stats.bitlyUniqueClicks;
  if (!hasBitlyData) {
    opportunities.push({
      field: 'bitlyTotalClicks',
      label: 'Bitly Analytics',
      category: 'System Integration',
      impact: 4,
      unlockedInsights: [
        'Social media ROI',
        'Geographic distribution',
        'Device breakdown',
        'Referrer analysis',
        'Click-through rates'
      ],
      reason: 'Enables comprehensive social and ad value calculations'
    });
  }

  if (!stats.eventValuePropositionVisited || !stats.eventValuePropositionPurchases) {
    opportunities.push({
      field: 'eventValuePropositionVisited',
      label: 'Value Proposition Metrics',
      category: 'Conversion',
      impact: 3,
      unlockedInsights: [
        'Purchase conversion rate',
        'Landing page effectiveness',
        'Revenue attribution'
      ],
      reason: 'Measures bottom-of-funnel performance'
    });
  }

  if (!stats.eventResultHome && !stats.eventResultVisitor) {
    opportunities.push({
      field: 'eventResultHome',
      label: 'Event Results',
      category: 'Event Context',
      impact: 2,
      unlockedInsights: [
        'Win/loss impact on engagement',
        'Score correlation with merch sales',
        'Performance-based benchmarking'
      ],
      reason: 'Context for behavioral analytics'
    });
  }

  // Merchandise pricing (medium impact)
  const hasPricing = stats.jerseyPrice || stats.scarfPrice || stats.flagsPrice || stats.capPrice || stats.otherPrice;
  if (!hasPricing) {
    opportunities.push({
      field: 'jerseyPrice',
      label: 'Merchandise Pricing',
      category: 'Revenue',
      impact: 3,
      unlockedInsights: [
        'Revenue per fan',
        'Average order value',
        'Product mix optimization',
        'Pricing elasticity'
      ],
      reason: 'Converts units to revenue analytics'
    });
  }

  // Sort by impact (descending)
  return opportunities.sort((a, b) => b.impact - a.impact);
}

export interface FieldConfidenceScore {
  field: string;
  confidence: number; // 0-100%
  source: 'manual' | 'derived' | 'system';
  badge: 'high' | 'medium' | 'low';
  explanation: string;
}

/**
 * WHAT: Calculate confidence score for each field based on data source
 * WHY: Weight insights by data reliability
 * HOW: Manual = 100%, Derived = 90%, System = 85%
 * 
 * @param stats - Project statistics
 * @param field - Field name to check
 * @returns Confidence score object
 */
export function getFieldConfidence(stats: Partial<ProjectStats>, field: string): FieldConfidenceScore {
  const value = (stats as any)[field];
  const isDefined = value !== undefined && value !== null;

  // Check if field is derived
  const derivedFields = ['allImages', 'remoteFans', 'totalFans'];
  if (derivedFields.includes(field)) {
    return {
      field,
      confidence: isDefined ? 90 : 0,
      source: 'derived',
      badge: 'medium',
      explanation: 'Auto-computed from base metrics'
    };
  }

  // Check if field is system-generated (Bitly)
  if (field.startsWith('bitly')) {
    return {
      field,
      confidence: isDefined ? 85 : 0,
      source: 'system',
      badge: 'medium',
      explanation: 'Synced from Bitly API (network-dependent)'
    };
  }

  // Default: manual input (highest confidence)
  return {
    field,
    confidence: isDefined ? 100 : 0,
    source: 'manual',
    badge: 'high',
    explanation: 'Manually entered by user'
  };
}

/**
 * WHAT: Check if Bitly data is fresh (< 24 hours old)
 * WHY: Stale click data undermines social/ad analytics
 * HOW: Compare bitlyLastSyncAt timestamp with current time
 * 
 * @param project - Full project object with metadata
 * @returns Sync status object
 */
export function checkBitlySyncStatus(project: any): {
  hasBitlyData: boolean;
  isRecent: boolean;
  lastSyncAt: string | null;
  hoursAgo: number | null;
  status: 'synced' | 'stale' | 'missing';
  message: string;
} {
  const hasBitlyData = project.stats?.bitlyTotalClicks || project.stats?.bitlyUniqueClicks;
  const lastSyncAt = project.bitlyLastSyncAt || project.stats?.bitlyLastSyncAt;

  if (!hasBitlyData) {
    return {
      hasBitlyData: false,
      isRecent: false,
      lastSyncAt: null,
      hoursAgo: null,
      status: 'missing',
      message: 'No Bitly data available. Sync to enable social analytics.'
    };
  }

  if (!lastSyncAt) {
    return {
      hasBitlyData: true,
      isRecent: false,
      lastSyncAt: null,
      hoursAgo: null,
      status: 'stale',
      message: 'Bitly data exists but sync timestamp is missing.'
    };
  }

  const syncDate = new Date(lastSyncAt);
  const now = new Date();
  const hoursAgo = (now.getTime() - syncDate.getTime()) / (1000 * 60 * 60);
  const isRecent = hoursAgo < 24;

  return {
    hasBitlyData: true,
    isRecent,
    lastSyncAt,
    hoursAgo: Math.round(hoursAgo * 10) / 10,
    status: isRecent ? 'synced' : 'stale',
    message: isRecent
      ? `Synced ${Math.round(hoursAgo)} hours ago`
      : `Data is ${Math.round(hoursAgo)} hours old. Re-sync recommended.`
  };
}

/**
 * WHAT: Comprehensive data quality insights package
 * WHY: Single function to generate all 10 insights for UI consumption
 * HOW: Combine all insight functions into one response object
 * 
 * @param stats - Project statistics
 * @param project - Full project object (for metadata like bitlyLastSyncAt)
 * @returns Complete insights object for UI rendering
 */
export interface DataQualityInsights {
  // Insight #1: Data Completeness Score
  completeness: {
    percentage: number;
    quality: 'excellent' | 'good' | 'fair' | 'poor' | 'insufficient';
    tier: string;
    color: string;
  };
  
  // Insight #2: Missing Critical Metrics
  missingCritical: {
    count: number;
    fields: string[];
    blocking: boolean;
    message: string;
  };
  
  // Insight #3: Derived Metrics Status
  derivedMetrics: {
    field: string;
    label: string;
    computed: boolean;
    confidence: number;
  }[];
  
  // Insight #4: Optional Fields Coverage
  optionalCoverage: {
    percentage: number;
    filled: number;
    total: number;
    message: string;
  };
  
  // Insight #5: Bitly Integration Status
  bitlyStatus: {
    hasBitlyData: boolean;
    isRecent: boolean;
    status: 'synced' | 'stale' | 'missing';
    message: string;
    hoursAgo: number | null;
  };
  
  // Insight #6: Data Consistency Warnings
  consistencyWarnings: DataConsistencyWarning[];
  
  // Insight #7: Historical Data Quality Trend (requires multiple projects)
  // Note: This needs to be computed at a higher level with multiple projects
  
  // Insight #8: Field-Level Confidence Scores
  fieldConfidence: Record<string, FieldConfidenceScore>;
  
  // Insight #9: Enrichment Opportunities
  enrichmentOpportunities: EnrichmentOpportunity[];
  
  // Insight #10: Benchmarking Eligibility
  benchmarkingEligibility: {
    eligible: boolean;
    reason: string;
    missingFields: string[];
  };
}

export function generateDataQualityInsights(
  stats: Partial<ProjectStats>,
  project?: any
): DataQualityInsights {
  const validation = validateProjectStats(stats);
  const enriched = ensureDerivedMetrics(stats);
  
  // Insight #1: Completeness
  const qualityColors = {
    excellent: '#10b981',
    good: '#3b82f6',
    fair: '#f59e0b',
    poor: '#ef4444',
    insufficient: '#dc2626'
  };
  
  const qualityTiers = {
    excellent: '90-100% Complete',
    good: '75-89% Complete',
    fair: '50-74% Complete',
    poor: '25-49% Complete',
    insufficient: '<25% Complete'
  };
  
  // Insight #2: Missing Critical Metrics
  const missingCritical = {
    count: validation.missingRequired.length,
    fields: validation.missingRequired,
    blocking: validation.missingRequired.length > 0,
    message: validation.missingRequired.length > 0
      ? `Cannot generate full analytics. Missing: ${validation.missingRequired.slice(0, 3).join(', ')}${validation.missingRequired.length > 3 ? '...' : ''}`
      : 'All critical metrics present'
  };
  
  // Insight #3: Derived Metrics
  const derivedMetrics = [
    { field: 'allImages', label: 'Total Images', computed: !!enriched.allImages, confidence: 90 },
    { field: 'remoteFans', label: 'Remote Fans', computed: !!enriched.remoteFans, confidence: 90 },
    { field: 'totalFans', label: 'Total Fans', computed: !!enriched.totalFans, confidence: 90 }
  ];
  
  // Insight #4: Optional Coverage
  const optionalFilled = OPTIONAL_METRICS.filter(field => (stats as any)[field] !== undefined && (stats as any)[field] !== null).length;
  const optionalCoverage = {
    percentage: Math.round((optionalFilled / OPTIONAL_METRICS.length) * 100),
    filled: optionalFilled,
    total: OPTIONAL_METRICS.length,
    message: optionalFilled < OPTIONAL_METRICS.length
      ? `Add ${OPTIONAL_METRICS.length - optionalFilled} more fields to unlock advanced analytics`
      : 'All optional fields complete'
  };
  
  // Insight #5: Bitly Status
  const bitlyStatus = project ? checkBitlySyncStatus(project) : {
    hasBitlyData: !!(stats.bitlyTotalClicks || stats.bitlyUniqueClicks),
    isRecent: false,
    status: 'missing' as const,
    message: 'No Bitly sync data available',
    hoursAgo: null
  };
  
  // Insight #6: Consistency Warnings
  const consistencyWarnings = detectConsistencyWarnings(stats);
  
  // Insight #8: Field Confidence (compute for all key fields)
  const keyFields = [
    'remoteImages', 'hostessImages', 'selfies', 'allImages',
    'stadium', 'indoor', 'outdoor', 'remoteFans', 'totalFans',
    'merched', 'eventAttendees', 'bitlyTotalClicks'
  ];
  const fieldConfidence: Record<string, FieldConfidenceScore> = {};
  keyFields.forEach(field => {
    fieldConfidence[field] = getFieldConfidence(stats, field);
  });
  
  // Insight #9: Enrichment Opportunities
  const enrichmentOpportunities = identifyEnrichmentOpportunities(stats);
  
  // Insight #10: Benchmarking Eligibility
  const canBench = canBenchmark(stats);
  const benchmarkingEligibility = {
    eligible: canBench,
    reason: canBench
      ? 'Event meets all requirements for benchmarking'
      : 'Incomplete required metrics. Complete missing fields to enable benchmarking.',
    missingFields: validation.missingRequired
  };
  
  return {
    completeness: {
      percentage: validation.completeness,
      quality: validation.dataQuality,
      tier: qualityTiers[validation.dataQuality],
      color: qualityColors[validation.dataQuality]
    },
    missingCritical,
    derivedMetrics,
    optionalCoverage,
    bitlyStatus,
    consistencyWarnings,
    fieldConfidence,
    enrichmentOpportunities,
    benchmarkingEligibility
  };
}
