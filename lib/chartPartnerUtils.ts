// lib/chartPartnerUtils.ts
// WHAT: Partner-aware chart utilities with TheSportsDB integration
// WHY: Enable capacity-based benchmarks and partner-specific analytics

import { PartnerResponse } from './partner.types';
import { ChartConfiguration, ChartElement } from './chartConfigTypes';

/**
 * WHAT: Partner enrichment data for chart calculations
 * WHY: Extract relevant SportsDB data for formulas
 */
export interface PartnerEnrichment {
  venueCapacity?: number;       // Stadium capacity for utilization calculations
  venueName?: string;           // Venue name for display
  leagueName?: string;          // League context for benchmarking
  country?: string;             // Geographic context
  badge?: string;               // Team badge URL for visual enhancement
  teamId?: string;              // TheSportsDB ID for deep linking
}

/**
 * WHAT: Extract partner enrichment data from partner response
 * WHY: Simplify access to SportsDB data in chart calculations
 */
export function extractPartnerEnrichment(partner?: PartnerResponse): PartnerEnrichment | undefined {
  if (!partner?.sportsDb) return undefined;
  
  return {
    venueCapacity: partner.sportsDb.venueCapacity,
    venueName: partner.sportsDb.venueName,
    leagueName: partner.sportsDb.leagueName,
    country: partner.sportsDb.country,
    badge: partner.sportsDb.badge,
    teamId: partner.sportsDb.teamId,
  };
}

/**
 * WHAT: Calculate venue capacity utilization percentage
 * WHY: Core metric for stadium events - shows % of capacity filled
 * @param attendees - Total event attendees
 * @param capacity - Stadium capacity from SportsDB
 * @returns Utilization percentage (0-100) or undefined if no capacity data
 */
export function calculateCapacityUtilization(
  attendees: number,
  capacity?: number
): number | undefined {
  if (!capacity || capacity <= 0) return undefined;
  if (attendees < 0) return undefined;
  
  return Math.min((attendees / capacity) * 100, 100); // Cap at 100%
}

/**
 * WHAT: Calculate potential stadium reach (fans × capacity multiplier)
 * WHY: Estimate total fan base relative to stadium size
 * @param totalFans - Total fans engaged (remote + stadium)
 * @param capacity - Stadium capacity
 * @returns Projected reach or undefined
 */
export function calculatePotentialReach(
  totalFans: number,
  capacity?: number
): number | undefined {
  if (!capacity || capacity <= 0) return undefined;
  if (totalFans < 0) return undefined;
  
  // WHAT: Estimate full stadium equivalent
  // WHY: Show fan engagement relative to max venue capacity
  const stadiumFillRate = totalFans / capacity;
  return Math.round(stadiumFillRate * capacity);
}

/**
 * WHAT: Calculate capacity-adjusted engagement score
 * WHY: Normalize engagement across different stadium sizes
 * @param engaged - Number of engaged fans
 * @param capacity - Stadium capacity
 * @returns Normalized score (0-100) or undefined
 */
export function calculateCapacityEngagement(
  engaged: number,
  capacity?: number
): number | undefined {
  if (!capacity || capacity <= 0) return undefined;
  if (engaged < 0) return undefined;
  
  // WHAT: Score based on % of stadium capacity engaged
  // WHY: Fair comparison between 10k and 100k venues
  return Math.min((engaged / capacity) * 100, 100);
}

/**
 * WHAT: Generate capacity benchmark thresholds
 * WHY: Categorize performance relative to venue size
 */
export interface CapacityBenchmark {
  excellent: number;    // >90% capacity
  good: number;         // >75% capacity
  average: number;      // >50% capacity
  poor: number;         // <50% capacity
}

export function getCapacityBenchmarks(capacity: number): CapacityBenchmark {
  return {
    excellent: capacity * 0.9,
    good: capacity * 0.75,
    average: capacity * 0.5,
    poor: capacity * 0.5,
  };
}

/**
 * WHAT: Create partner-aware chart configuration
 * WHY: Generate charts that incorporate venue capacity data
 */
export function createCapacityUtilizationChart(
  partnerId: string,
  partnerName: string,
  venueCapacity?: number
): ChartConfiguration {
  // WHAT: Base configuration for capacity utilization KPI
  const baseConfig: Omit<ChartConfiguration, '_id' | 'createdAt' | 'updatedAt'> = {
    chartId: `capacity-utilization-${partnerId}`,
    title: `${partnerName} Venue Utilization`,
    type: 'kpi',
    order: 100, // Display after default charts
    isActive: !!venueCapacity, // Only active if capacity data exists
    emoji: '🏟️',
    subtitle: venueCapacity 
      ? `Capacity: ${venueCapacity.toLocaleString()} seats`
      : 'No capacity data available',
    elements: [
      {
        id: 'capacity-utilization',
        label: 'Capacity Filled',
        // WHAT: Formula uses event attendees ÷ venue capacity × 100
        // WHY: Standard utilization metric for venues
        formula: venueCapacity
          ? `([SEYUATTENDEES] / ${venueCapacity}) * 100`
          : '0', // Fallback if no capacity
        color: '#10b981',
        description: 'Percentage of venue capacity filled by event attendees',
      }
    ]
  };
  
  return baseConfig as ChartConfiguration;
}

/**
 * WHAT: Create fan engagement vs capacity benchmark chart
 * WHY: Compare engaged fans to total venue capacity
 */
export function createEngagementVsCapacityChart(
  partnerId: string,
  partnerName: string,
  venueCapacity?: number
): ChartConfiguration {
  if (!venueCapacity) {
    // WHAT: Return inactive chart if no capacity data
    return {
      chartId: `engagement-capacity-${partnerId}`,
      title: `${partnerName} Engagement vs Capacity`,
      type: 'pie',
      order: 101,
      isActive: false,
      elements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as ChartConfiguration;
  }
  
  return {
    chartId: `engagement-capacity-${partnerId}`,
    title: 'Engaged Fans vs Venue Capacity',
    type: 'pie',
    order: 101,
    isActive: true,
    emoji: '👥',
    subtitle: `Relative to ${venueCapacity.toLocaleString()}-seat capacity`,
    elements: [
      {
        id: 'engaged-fans',
        label: 'Engaged Fans',
        formula: '[SEYUTOTALFANS]',
        color: '#3b82f6',
        description: 'Total engaged fans (remote + stadium)',
      },
      {
        id: 'untapped-capacity',
        label: 'Untapped Capacity',
        // WHAT: Shows remaining venue capacity not filled by engaged fans
        // WHY: Visualize growth potential
        formula: `${venueCapacity} - [SEYUTOTALFANS]`,
        color: '#9ca3af',
        description: 'Remaining venue capacity',
      }
    ]
  } as ChartConfiguration;
}

/**
 * WHAT: Create merchandise potential based on capacity
 * WHY: Benchmark merch sales against full stadium potential
 */
export function createMerchPotentialVsCapacityChart(
  partnerId: string,
  partnerName: string,
  venueCapacity?: number
): ChartConfiguration {
  if (!venueCapacity) {
    return {
      chartId: `merch-potential-capacity-${partnerId}`,
      title: 'Merchandise Potential vs Capacity',
      type: 'bar',
      order: 102,
      isActive: false,
      elements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as ChartConfiguration;
  }
  
  // WHAT: Calculate potential merch sales at various capacity fill rates
  // WHY: Show revenue opportunity scaling with attendance
  return {
    chartId: `merch-potential-capacity-${partnerId}`,
    title: 'Merchandise Revenue Potential',
    type: 'bar',
    order: 102,
    isActive: true,
    emoji: '🛍️',
    subtitle: 'Projected at different venue fill rates',
    showTotal: true,
    totalLabel: 'at 100% capacity',
    elements: [
      {
        id: 'current-merch',
        label: 'Current Event',
        formula: '([SEYUMERCHJERSEY] * [SEYUJERSEYPRICE]) + ([SEYUMERCHSCARF] * [SEYUSCARFPRICE]) + ([SEYUMERCHFLAGS] * [SEYUFLAGSPRICE]) + ([SEYUMERCHBASEBALLCAP] * [SEYUCAPPRICE]) + ([SEYUMERCHOTHER] * [SEYUOTHERPRICE])',
        color: '#10b981',
        description: 'Actual merchandise sales from this event',
      },
      {
        id: 'at-25-capacity',
        label: '25% Fill',
        formula: `(${venueCapacity} * 0.25) * 0.15 * 25`, // 15% merch rate, €25 avg
        color: '#3b82f6',
        description: 'Projected revenue at 25% capacity',
      },
      {
        id: 'at-50-capacity',
        label: '50% Fill',
        formula: `(${venueCapacity} * 0.50) * 0.15 * 25`,
        color: '#8b5cf6',
        description: 'Projected revenue at 50% capacity',
      },
      {
        id: 'at-75-capacity',
        label: '75% Fill',
        formula: `(${venueCapacity} * 0.75) * 0.15 * 25`,
        color: '#f59e0b',
        description: 'Projected revenue at 75% capacity',
      },
      {
        id: 'at-100-capacity',
        label: '100% Fill',
        formula: `(${venueCapacity} * 1.00) * 0.15 * 25`,
        color: '#ef4444',
        description: 'Projected revenue at full capacity',
      }
    ]
  } as ChartConfiguration;
}

/**
 * WHAT: Generate all partner-aware charts for a given partner
 * WHY: One-stop function to create complete partner chart suite
 */
export function generatePartnerCharts(
  partner: PartnerResponse
): ChartConfiguration[] {
  const enrichment = extractPartnerEnrichment(partner);
  const charts: ChartConfiguration[] = [];
  
  // WHAT: Only generate charts if partner has capacity data
  // WHY: Avoid meaningless charts without venue information
  if (enrichment?.venueCapacity) {
    charts.push(
      createCapacityUtilizationChart(partner._id, partner.name, enrichment.venueCapacity),
      createEngagementVsCapacityChart(partner._id, partner.name, enrichment.venueCapacity),
      createMerchPotentialVsCapacityChart(partner._id, partner.name, enrichment.venueCapacity)
    );
  }
  
  return charts;
}

/**
 * WHAT: Add partner context to existing chart calculations
 * WHY: Enrich standard charts with venue-specific benchmarks
 */
export interface PartnerChartContext {
  partnerId: string;
  partnerName: string;
  enrichment?: PartnerEnrichment;
}

/**
 * WHAT: Inject partner-specific variables into chart formulas
 * WHY: Support [CAPACITY], [VENUE], [LEAGUE] tokens in formulas
 */
export function injectPartnerVariables(
  formula: string,
  enrichment?: PartnerEnrichment
): string {
  if (!enrichment) return formula;
  
  let enrichedFormula = formula;
  
  // WHAT: Replace [CAPACITY] token with actual capacity value
  if (enrichment.venueCapacity) {
    enrichedFormula = enrichedFormula.replace(/\[CAPACITY\]/g, enrichment.venueCapacity.toString());
  }
  
  // WHAT: Add more token replacements as needed
  // WHY: Enable flexible partner-aware formulas
  
  return enrichedFormula;
}

/**
 * WHAT: Determine if a chart is partner-specific
 * WHY: Filter charts by context (global vs partner-specific)
 */
export function isPartnerSpecificChart(chartId: string): boolean {
  return chartId.includes('capacity-') || 
         chartId.includes('venue-') || 
         chartId.includes('-vs-capacity');
}

/**
 * WHAT: Get partner-specific chart recommendations
 * WHY: Suggest which charts to enable based on available data
 */
export interface ChartRecommendation {
  chartId: string;
  title: string;
  reason: string;
  requiresData: string[];
  confidence: 'high' | 'medium' | 'low';
}

export function getPartnerChartRecommendations(
  partner: PartnerResponse
): ChartRecommendation[] {
  const recommendations: ChartRecommendation[] = [];
  const enrichment = extractPartnerEnrichment(partner);
  
  // WHAT: Recommend capacity utilization if venue capacity exists
  if (enrichment?.venueCapacity) {
    recommendations.push({
      chartId: 'capacity-utilization',
      title: 'Venue Capacity Utilization',
      reason: `Partner has venue capacity data (${enrichment.venueCapacity.toLocaleString()} seats)`,
      requiresData: ['eventAttendees'],
      confidence: 'high'
    });
    
    recommendations.push({
      chartId: 'engagement-vs-capacity',
      title: 'Fan Engagement vs Venue Size',
      reason: 'Benchmarks fan engagement against maximum venue capacity',
      requiresData: ['totalFans', 'remoteFans', 'stadium'],
      confidence: 'high'
    });
  }
  
  // WHAT: Recommend league benchmarking if league data exists
  if (enrichment?.leagueName) {
    recommendations.push({
      chartId: 'league-benchmark',
      title: 'League Performance Benchmark',
      reason: `Compare metrics against ${enrichment.leagueName} averages`,
      requiresData: ['eventAttendees', 'totalFans'],
      confidence: 'medium'
    });
  }
  
  return recommendations;
}

/**
 * WHAT: Calculate capacity fill rate category
 * WHY: Categorize performance for reporting
 */
export type CapacityCategory = 'sold-out' | 'excellent' | 'good' | 'average' | 'poor' | 'unknown';

export function categorizeCapacityFill(
  attendees?: number,
  capacity?: number
): CapacityCategory {
  if (!attendees || !capacity || capacity <= 0) return 'unknown';
  
  const utilization = (attendees / capacity) * 100;
  
  if (utilization >= 98) return 'sold-out';
  if (utilization >= 90) return 'excellent';
  if (utilization >= 75) return 'good';
  if (utilization >= 50) return 'average';
  return 'poor';
}

/**
 * WHAT: Get display emoji for capacity category
 * WHY: Visual feedback in UI
 */
export function getCapacityCategoryEmoji(category: CapacityCategory): string {
  switch (category) {
    case 'sold-out': return '🎉';
    case 'excellent': return '🔥';
    case 'good': return '✅';
    case 'average': return '⚠️';
    case 'poor': return '📉';
    case 'unknown': return '❓';
  }
}
