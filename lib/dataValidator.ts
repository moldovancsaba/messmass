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
