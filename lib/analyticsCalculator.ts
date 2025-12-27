/**
 * Analytics Calculator Utility
 * 
 * WHAT: Computes all pre-aggregated metrics from raw project stats
 * WHY: Centralize calculation logic for consistency across aggregation job and API endpoints
 * 
 * This calculator implements the business model with CPM values:
 * - Email opt-in: €4.87 per contact
 * - Email add-on: €1.07 per send
 * - Stadium ads: €6.00 per 1000 attendees per 30s slot (0.2 for 6s)
 * - Social organic: €14.50 CPM
 * - Under-40 premium: €2.14 per youth contact
 * - Social sharing: 20+ users per image average
 * - Email open rate: 35% average
 * - Average views: 300 per shared image
 * 
 * Version: 6.25.0 (Phase 1 - Data Aggregation Infrastructure)
 * Created: 2025-10-19T11:06:37.000Z
 */

import { ObjectId } from 'mongodb';
import type {
  AnalyticsAggregate,
  FanMetrics,
  MerchMetrics,
  AdMetrics,
  DemographicMetrics,
  VisitMetrics,
  BitlyMetrics,
  PartnerContext,
} from './analytics.types';

/**
 * WHAT: Raw project stats interface (matching projects collection schema)
 * WHY: Type-safe input for calculator functions
 */
export interface ProjectStats {
  // Images
  remoteImages: number;
  hostessImages: number;
  selfies: number;
  approvedImages?: number;
  rejectedImages?: number;
  
  // Fans/Location
  remoteFans?: number;                  // May not exist in older projects
  indoor?: number;                      // Legacy field
  outdoor?: number;                     // Legacy field
  stadium: number;
  
  // Demographics
  female: number;
  male: number;
  genAlpha: number;
  genYZ: number;
  genX: number;
  boomer: number;
  
  // Merchandise
  merched: number;
  jersey: number;
  scarf: number;
  flags: number;
  baseballCap: number;
  other: number;
  
  // Event
  eventAttendees: number;
  eventResultHome?: number;
  eventResultVisitor?: number;
  
  // Visits (may not exist in all projects)
  visitQrCode?: number;
  visitShortUrl?: number;
  visitWeb?: number;
  socialVisit?: number;
  eventValuePropositionVisited?: number;
  eventValuePropositionPurchases?: number;
  
  // Bitly (optional - only if integration active)
  bitlyTotalClicks?: number;
  bitlyUniqueClicks?: number;
  bitlyMobileClicks?: number;
  bitlyDesktopClicks?: number;
  bitlyTabletClicks?: number;
  bitlyClicksByCountry?: { [key: string]: number };
  bitlyTopCountry?: string;
  bitlyReferrers?: { [key: string]: number };
  bitlyTopReferrer?: string;
  
  // Games (Added v12.3.0)
  totalGames?: number;
  gamesWithoutAds?: number;
  gamesWithAds?: number;
  gamesWithoutSlideshow?: number;
  gamesWithSlideshow?: number;
  gamesWithoutTech?: number;
  gamesWithSelfie?: number;
  gamesWithoutSelfie?: number;
  
  // Registration
  userRegistration?: number;
  userRegistrationHostess?: number; // Added v12.3.0
  
  // CTA Visits (Added v12.3.0)
  visitCta1?: number;
  visitCta2?: number;
  visitCta3?: number;
}

/**
 * WHAT: Business model constants for advertisement value calculations
 * WHY: Centralize CPM values and multipliers for easy updates
 */
export const AD_MODEL_CONSTANTS = {
  // CPM values (Cost Per Mille - per 1000 impressions)
  EMAIL_OPTIN_CPM: 4.87,                // €4.87 avg market cost per email opt-in in Europe, 2025
  EMAIL_ADDON_CPM: 1.07,                // €1.07 avg CPM email value add per send
  STADIUM_AD_CPM: 6.00,                 // €6.00 per 1,000 attendees per 30s slot
  SOCIAL_ORGANIC_CPM: 14.50,            // €14.50 CPM for social organic impressions
  YOUTH_PREMIUM: 2.14,                  // €2.14 avg value of youth contact vs older groups
  
  // Multipliers and assumptions
  SOCIAL_SHARES_PER_IMAGE: 20,          // 20+ users per image average share rate
  AVG_VIEWS_PER_SHARE: 300,             // 300 avg views per shared image
  EMAIL_OPEN_RATE: 0.35,                // 35% average email open rate
  STADIUM_AD_EXPOSURE_RATIO: 0.2,       // 6s exposure = 0.2 of 30s CPM
} as const;

/**
 * WHAT: Safe division helper to avoid NaN and Infinity
 * WHY: Prevent calculation errors when denominators are zero
 */
function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0 || !isFinite(denominator)) return 0;
  const result = numerator / denominator;
  return isFinite(result) ? result : 0;
}

/**
 * WHAT: Calculate remoteFans (backward compatible with indoor/outdoor)
 * WHY: Older projects stored indoor/outdoor separately, newer use remoteFans directly
 */
function calculateRemoteFans(stats: ProjectStats): number {
  if (stats.remoteFans !== undefined) {
    return stats.remoteFans;
  }
  // Legacy calculation: indoor + outdoor
  const indoor = stats.indoor || 0;
  const outdoor = stats.outdoor || 0;
  return indoor + outdoor;
}

/**
 * WHAT: Calculate fan engagement metrics
 * WHY: Pre-compute totalFans, engagement rates, quality scores for fast queries
 */
export function calculateFanMetrics(stats: ProjectStats): FanMetrics {
  const remoteFans = calculateRemoteFans(stats);
  const stadium = stats.stadium || 0;
  const totalFans = remoteFans + stadium;
  
  const allImages = stats.remoteImages + stats.hostessImages + stats.selfies;
  const eventAttendees = stats.eventAttendees || 1; // Avoid division by zero
  
  return {
    totalFans,
    remoteFans,
    stadium,
    engagementRate: safeDivide(totalFans, eventAttendees) * 100,
    remoteQuality: safeDivide(stats.remoteImages, remoteFans),
    stadiumQuality: safeDivide(stats.hostessImages, stadium),
    selfieRate: safeDivide(stats.selfies, totalFans) * 100,
    coreFanTeam: safeDivide(stats.merched, totalFans) * eventAttendees,
    fanToAttendeeConversion: safeDivide(totalFans, eventAttendees) * 100,
  };
}

/**
 * WHAT: Calculate merchandise analytics
 * WHY: Pre-compute penetration rates, diversity index, high-value vs. casual fans
 */
export function calculateMerchMetrics(stats: ProjectStats, fanMetrics: FanMetrics): MerchMetrics {
  const totalFans = fanMetrics.totalFans || 1; // Avoid division by zero
  const eventAttendees = stats.eventAttendees || 1;
  
  // Count number of different merch types purchased (diversity index)
  const merchTypes = [
    stats.jersey,
    stats.scarf,
    stats.flags,
    stats.baseballCap,
    stats.other,
  ];
  const diversityIndex = merchTypes.filter(count => count > 0).length;
  
  return {
    totalMerched: stats.merched,
    penetrationRate: safeDivide(stats.merched, totalFans) * 100,
    byType: {
      jersey: stats.jersey,
      scarf: stats.scarf,
      flags: stats.flags,
      baseballCap: stats.baseballCap,
      other: stats.other,
    },
    merchToAttendee: safeDivide(stats.merched, eventAttendees),
    diversityIndex,
    highValueFans: stats.jersey + stats.scarf,              // Jersey + scarf = high-value merch
    casualFans: stats.baseballCap + stats.other,            // Cap + other = casual merch
  };
}

/**
 * WHAT: Calculate advertisement value based on CPM business model
 * WHY: Pre-compute ROI metrics using standardized CPM values
 */
export function calculateAdMetrics(stats: ProjectStats, fanMetrics: FanMetrics): AdMetrics {
  const allImages = stats.remoteImages + stats.hostessImages + stats.selfies;
  const totalFans = fanMetrics.totalFans || 1;
  const eventAttendees = stats.eventAttendees || 1;
  const propositionVisits = stats.eventValuePropositionVisited || 0;
  const propositionPurchases = stats.eventValuePropositionPurchases || 0;
  
  // Total impressions: Images × avg views per share
  const totalImpressions = allImages * AD_MODEL_CONSTANTS.AVG_VIEWS_PER_SHARE;
  
  // Social value: Images × social shares × social CPM
  // Formula: allImages × 20 shares × 300 views × (€14.50 / 1000)
  const socialValue = allImages * AD_MODEL_CONSTANTS.SOCIAL_SHARES_PER_IMAGE * 
                     AD_MODEL_CONSTANTS.AVG_VIEWS_PER_SHARE * 
                     (AD_MODEL_CONSTANTS.SOCIAL_ORGANIC_CPM / 1000);
  
  // Email value: Proposition visits × open rate × email add-on CPM
  // Formula: propositionVisits × 35% × (€1.07)
  const emailValue = propositionVisits * AD_MODEL_CONSTANTS.EMAIL_OPEN_RATE * 
                    AD_MODEL_CONSTANTS.EMAIL_ADDON_CPM;
  
  // Total ROI: Social + Email values
  const totalROI = socialValue + emailValue;
  
  // Viral coefficient: Shares per image × 100
  const viralCoefficient = (AD_MODEL_CONSTANTS.SOCIAL_SHARES_PER_IMAGE * allImages / (allImages || 1)) * 100;
  
  // Email conversion: Purchases / visits × 100
  const emailConversion = safeDivide(propositionPurchases, propositionVisits) * 100;
  
  // Cost per engagement: Would need ad spend data (placeholder calculation)
  const costPerEngagement = 0; // TODO: Implement when ad spend data available
  
  // Ad value per fan: Total ROI / total fans (unit economics)
  const adValuePerFan = safeDivide(totalROI, totalFans);
  
  // Reach multiplier: Organic reach vs. paid (placeholder)
  const reachMultiplier = AD_MODEL_CONSTANTS.SOCIAL_SHARES_PER_IMAGE; // Simplified: 1 image → 20 shares
  
  return {
    totalImpressions,
    socialValue,
    emailValue,
    totalROI,
    viralCoefficient,
    emailConversion,
    costPerEngagement,
    adValuePerFan,
    reachMultiplier,
  };
}

/**
 * WHAT: Calculate demographic distribution metrics
 * WHY: Pre-compute youth index, gender balance, diversity score
 */
export function calculateDemographicMetrics(stats: ProjectStats): DemographicMetrics {
  const totalGender = stats.female + stats.male;
  const totalAge = stats.genAlpha + stats.genYZ + stats.genX + stats.boomer;
  
  // Youth index: (Gen Alpha + Gen YZ) / total × 100
  const youthIndex = safeDivide(stats.genAlpha + stats.genYZ, totalAge) * 100;
  
  // Gender balance: abs(female - male) / total × 100 (lower = more balanced)
  const genderBalance = safeDivide(Math.abs(stats.female - stats.male), totalGender) * 100;
  
  // Diversity index: Shannon entropy for age/gender distribution
  // Simplified: Number of non-zero demographic segments
  const demographicSegments = [
    stats.female, stats.male,
    stats.genAlpha, stats.genYZ, stats.genX, stats.boomer,
  ];
  const diversityIndex = demographicSegments.filter(count => count > 0).length;
  
  return {
    gender: {
      female: stats.female,
      male: stats.male,
    },
    ageGroups: {
      genAlpha: stats.genAlpha,
      genYZ: stats.genYZ,
      genX: stats.genX,
      boomer: stats.boomer,
    },
    youthIndex,
    genderBalance,
    diversityIndex,
  };
}

/**
 * WHAT: Calculate visit source metrics and conversion rates
 * WHY: Pre-compute channel mix, fan conversion, proposition effectiveness
 */
export function calculateVisitMetrics(stats: ProjectStats, fanMetrics: FanMetrics): VisitMetrics {
  const qrCode = stats.visitQrCode || 0;
  const shortUrl = stats.visitShortUrl || 0;
  const web = stats.visitWeb || 0;
  const social = stats.socialVisit || 0;
  
  const totalVisits = qrCode + shortUrl + web + social;
  const totalFans = fanMetrics.totalFans || 1;
  
  const propositionVisits = stats.eventValuePropositionVisited || 0;
  const propositionPurchases = stats.eventValuePropositionPurchases || 0;
  
  return {
    bySource: {
      qrCode,
      shortUrl,
      web,
      social,
    },
    totalVisits,
    fanConversion: safeDivide(totalFans, totalVisits) * 100,
    propositionEffectiveness: safeDivide(propositionPurchases, propositionVisits) * 100,
  };
}

/**
 * WHAT: Calculate Bitly analytics metrics (optional - only if data available)
 * WHY: Pre-compute device distribution, click rates, mobile usage
 */
export function calculateBitlyMetrics(stats: ProjectStats): BitlyMetrics | undefined {
  // Only calculate if Bitly data exists
  if (!stats.bitlyTotalClicks) {
    return undefined;
  }
  
  const totalClicks = stats.bitlyTotalClicks || 0;
  const mobile = stats.bitlyMobileClicks || 0;
  const desktop = stats.bitlyDesktopClicks || 0;
  const tablet = stats.bitlyTabletClicks || 0;
  const eventAttendees = stats.eventAttendees || 1;
  
  return {
    clicks: totalClicks,
    uniqueClicks: stats.bitlyUniqueClicks || 0,
    clicksByDevice: {
      mobile,
      desktop,
      tablet,
    },
    clicksByCountry: stats.bitlyClicksByCountry || {},
    topCountry: stats.bitlyTopCountry || '',
    referrers: stats.bitlyReferrers || {},
    topReferrer: stats.bitlyTopReferrer || '',
    hourlyPattern: undefined, // TODO: Implement when hourly data available
    clickRate: safeDivide(totalClicks, eventAttendees) * 100,
    mobileRate: safeDivide(mobile, totalClicks) * 100,
  };
}

/**
 * WHAT: Build partner context from project data
 * WHY: Extract team/league info for partner-based analytics
 */
export function buildPartnerContext(
  project: any // TODO: Replace with proper Project interface
): PartnerContext {
  // Extract venue type from stats
  let venueType: 'indoor' | 'outdoor' | 'stadium' | 'mixed' = 'mixed';
  if (project.stats) {
    const hasIndoor = (project.stats.indoor || 0) > 0;
    const hasOutdoor = (project.stats.outdoor || 0) > 0;
    const hasStadium = (project.stats.stadium || 0) > 0;
    
    if (hasStadium && !hasIndoor && !hasOutdoor) venueType = 'stadium';
    else if (hasIndoor && !hasOutdoor && !hasStadium) venueType = 'indoor';
    else if (hasOutdoor && !hasIndoor && !hasStadium) venueType = 'outdoor';
    else venueType = 'mixed';
  }
  
  return {
    partnerId: project.partner1Id ? new ObjectId(project.partner1Id) : undefined,
    partnerName: project.partner1Name,
    partnerEmoji: project.partner1Emoji,
    opponentId: project.partner2Id ? new ObjectId(project.partner2Id) : undefined,
    opponentName: project.partner2Name,
    leagueId: project.sportsDb?.leagueId,
    leagueName: project.sportsDb?.strLeague,
    venueType,
    venueCapacity: project.sportsDb?.intStadiumCapacity,
    isHomeGame: !!project.partner1Id, // If partner1 exists, assume home game
  };
}

/**
 * WHAT: Main aggregation function - computes complete AnalyticsAggregate document
 * WHY: Single function to generate all pre-computed metrics for one event
 */
export function aggregateEventMetrics(
  project: any, // TODO: Replace with proper Project interface
  aggregationType: 'event' | 'daily' | 'weekly' | 'monthly' | 'yearly' = 'event'
): AnalyticsAggregate {
  const stats = project.stats as ProjectStats;
  
  // Calculate all metric groups
  const fanMetrics = calculateFanMetrics(stats);
  const merchMetrics = calculateMerchMetrics(stats, fanMetrics);
  const adMetrics = calculateAdMetrics(stats, fanMetrics);
  const demographicMetrics = calculateDemographicMetrics(stats);
  const visitMetrics = calculateVisitMetrics(stats, fanMetrics);
  const bitlyMetrics = calculateBitlyMetrics(stats);
  const partnerContext = buildPartnerContext(project);
  
  // Generate ISO 8601 timestamps with milliseconds
  const now = new Date().toISOString();
  
  return {
    _id: new ObjectId(),
    projectId: new ObjectId(project._id),
    eventDate: project.eventDate,
    aggregationType,
    
    fanMetrics,
    merchMetrics,
    adMetrics,
    demographicMetrics,
    visitMetrics,
    bitlyMetrics,
    
    partnerContext,
    
    rawStats: {
      eventAttendees: stats.eventAttendees,
      remoteImages: stats.remoteImages,
      hostessImages: stats.hostessImages,
      selfies: stats.selfies,
      approvedImages: stats.approvedImages || 0,
      rejectedImages: stats.rejectedImages || 0,
    },
    
    createdAt: now,
    updatedAt: now,
    version: '1.0',
  };
}

/**
 * WHAT: Validate project has minimum required data for aggregation
 * WHY: Skip projects with incomplete data to avoid invalid aggregates
 */
export function isProjectAggregatable(project: any): boolean {
  if (!project || !project.stats) return false;
  
  const stats = project.stats;
  
  // Minimum required fields
  const hasEventAttendees = typeof stats.eventAttendees === 'number' && stats.eventAttendees > 0;
  const hasEventDate = !!project.eventDate;
  const hasBasicStats = typeof stats.remoteImages === 'number' &&
                       typeof stats.hostessImages === 'number' &&
                       typeof stats.selfies === 'number';
  
  return hasEventAttendees && hasEventDate && hasBasicStats;
}
