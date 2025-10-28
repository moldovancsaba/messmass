'use client';

import React, { memo } from 'react';
import { compareChartProps } from '../lib/performanceUtils';
import { PieChart, VerticalBarChart, KPICard } from './charts';
import type { PieChartData, VerticalBarChartData, KPICardProps } from './charts';

/* What: Modernized chart components using Chart.js
   Why: Replace legacy SVG charts with professional Chart.js components
   
   Migration strategy:
   - Use new PieChart for all pie/donut charts
   - Use new VerticalBarChart for horizontal bar charts
   - Use new KPICard for large number displays
   - Maintain backward compatibility with existing props
   - Keep performance optimizations (memoization) */

// Interface for project statistics - SINGLE REFERENCE SYSTEM with BACKWARD COMPATIBILITY
// WHAT: Supports both old (indoor/outdoor) and new (remoteFans) schemas
// WHY: Transparent migration - works with any data state
interface ProjectStats {
  remoteImages: number;
  hostessImages: number;
  selfies: number;
  // SINGLE REFERENCE SYSTEM: remoteFans (preferred)
  remoteFans?: number;  // New: Fans engaging remotely (not at venue)
  stadium: number;      // On-site fans at venue/stadium
  // LEGACY FIELDS: For backward compatibility during migration
  indoor?: number;      // Legacy: Will be removed after migration
  outdoor?: number;     // Legacy: Will be removed after migration
  female: number;
  male: number;
  genAlpha: number;
  genYZ: number;
  genX: number;
  boomer: number;
  merched: number;
  jersey: number;
  scarf: number;
  flags: number;
  baseballCap: number;
  other: number;
  // Success Manager fields - optional
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
}

/**
 * TRANSPARENT MIGRATION HELPER
 * 
 * WHAT: Safely get remoteFans value from either new or legacy schema
 * WHY: System works transparently during migration period
 * HOW: 
 *   - If remoteFans exists, use it
 *   - Otherwise, calculate from indoor + outdoor (legacy)
 *   - If neither exists, return 0
 * 
 * @param stats - Project stats (any schema version)
 * @returns Remote fans count
 */
function getRemoteFans(stats: ProjectStats): number {
  // New schema: remoteFans field exists
  if (stats.remoteFans !== undefined && stats.remoteFans !== null) {
    return stats.remoteFans;
  }
  
  // Legacy schema: calculate from indoor + outdoor
  const indoor = stats.indoor || 0;
  const outdoor = stats.outdoor || 0;
  return indoor + outdoor;
}

/**
 * TRANSPARENT TOTAL FANS CALCULATOR
 * 
 * WHAT: Get total fans from any schema version
 * WHY: Works with both new and legacy data
 * 
 * @param stats - Project stats (any schema version)
 * @returns Total fans count (remote + stadium)
 */
function getTotalFans(stats: ProjectStats): number {
  const remoteFans = getRemoteFans(stats);
  const stadium = stats.stadium || 0;
  return remoteFans + stadium;
}

// Props interface for chart components
interface ChartProps {
  stats: ProjectStats;
  eventName?: string; // Optional event name for export functionality
}

/**
 * Gender Distribution Circle/Pie Chart
 * Modernized with Chart.js donut chart
 * 
 * WHAT: Displays gender distribution with interactive donut chart
 * WHY: Chart.js provides better interactivity, export, and consistent styling
 * PERFORMANCE: Memoized to prevent re-renders when stats haven't changed
 */
const GenderCircleChartComponent: React.FC<ChartProps> = ({ stats, eventName }) => {
  /* What: Prepare data for PieChart component
     Why: Transform stats into PieChartData format with original colors */
  const genderData: PieChartData[] = [
    { label: 'Female', value: stats.female, color: '#ff6b9d' },
    { label: 'Male', value: stats.male, color: '#4a90e2' }
  ];
  
  return (
    <PieChart
      title="Gender Distribution"
      subtitle="👥 Fan demographics"
      data={genderData}
      filename={eventName ? `${eventName}-gender` : 'gender-distribution'}
      cutout="50%"
      legendPosition="bottom"
      height={350}
    />
  );
};

/**
 * Location Distribution Pie Chart
 * Modernized with Chart.js donut chart
 * 
 * WHAT: Shows where fans are located: Remote vs Stadium
 * WHY: Chart.js provides better interactivity, export, and consistent styling
 * SINGLE REFERENCE SYSTEM: Uses remoteFans directly (not indoor+outdoor)
 * PERFORMANCE: Memoized to prevent re-renders when stats haven't changed
 */
const FansLocationPieChartComponent: React.FC<ChartProps> = ({ stats, eventName }) => {
  /* TRANSPARENT MIGRATION: Works with both old and new schema */
  const remoteFans = getRemoteFans(stats);
  const locationData: PieChartData[] = [
    { label: 'Remote Fans', value: remoteFans, color: '#3b82f6' },
    { label: 'Stadium Fans', value: stats.stadium, color: '#f59e0b' }
  ];
  
  return (
    <PieChart
      title="Fans Location"
      subtitle="📍 Where fans engage"
      data={locationData}
      filename={eventName ? `${eventName}-location` : 'fans-location'}
      cutout="50%"
      legendPosition="bottom"
      height={350}
    />
  );
};

/**
 * Age Groups Distribution Pie Chart
 * Modernized with Chart.js donut chart
 * 
 * WHAT: Displays age breakdown: Under 40 (Alpha + Y+Z), Over 40 (X + Boomer)
 * WHY: Chart.js provides better interactivity and consistent styling
 * PERFORMANCE: Memoized to prevent re-renders when stats haven't changed
 */
const AgeGroupsPieChartComponent: React.FC<ChartProps> = ({ stats, eventName }) => {
  /* What: Prepare data for PieChart component with age-based colors
     Why: Transform stats into PieChartData format with cyan/orange scheme */
  const under40Total = stats.genAlpha + stats.genYZ;
  const over40Total = stats.genX + stats.boomer;
  
  const ageData: PieChartData[] = [
    { label: 'Under 40', value: under40Total, color: '#06b6d4' },
    { label: 'Over 40', value: over40Total, color: '#f97316' }
  ];
  
  return (
    <PieChart
      title="Age Groups"
      subtitle="👥 Age demographics"
      data={ageData}
      filename={eventName ? `${eventName}-age-groups` : 'age-groups'}
      cutout="50%"
      legendPosition="bottom"
      height={350}
    />
  );
};

/**
 * Merchandise Horizontal Bar Chart
 * Modernized with Chart.js VerticalBarChart and KPICard
 * 
 * WHAT: Shows merchandise distribution with potential sales KPI
 * WHY: Chart.js provides professional bars with export capability
 * NOTE: Merched is excluded as it represents people who have merch, not merchandise types
 * PERFORMANCE: Memoized to prevent re-renders when stats haven't changed
 */
const MerchandiseHorizontalBarsComponent: React.FC<ChartProps> = ({ stats, eventName }) => {
  /* TRANSPARENT MIGRATION: Works with both old and new schema */
  const totalFans = getTotalFans(stats);
  const merched = stats.merched;
  const potentialSales = (totalFans - merched) * 10;
  
  const merchData: VerticalBarChartData[] = [
    { label: 'Jersey', value: stats.jersey, color: '#7b68ee' },
    { label: 'Scarf', value: stats.scarf, color: '#ff6b9d' },
    { label: 'Flags', value: stats.flags, color: '#ffa726' },
    { label: 'Baseball Cap', value: stats.baseballCap, color: '#66bb6a' },
    { label: 'Other', value: stats.other, color: '#ef5350' }
  ];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mm-space-4)' }}>
      <KPICard
        title="Possible Merch Sales"
        value={potentialSales}
        format="currency"
        color="secondary"
        size="md"
      />
      <VerticalBarChart
        title="Merchandise Distribution"
        subtitle="🛍️ Types of fan gear"
        data={merchData}
        filename={eventName ? `${eventName}-merchandise` : 'merchandise'}
        height={350}
      />
    </div>
  );
};

/**
 * Visitor Sources Distribution Pie Chart
 * Modernized with Chart.js donut chart
 * 
 * WHAT: Shows where visitors come from: QR Code, Short URL, and Web visits
 * WHY: Chart.js provides better interactivity and export capability
 * PERFORMANCE: Memoized to prevent re-renders when stats haven't changed
 */
const VisitorSourcesPieChartComponent: React.FC<ChartProps> = ({ stats, eventName }) => {
  /* What: Prepare visitor source data for PieChart component
     Why: Group QR+ShortURL together vs Other sources for clear attribution */
  const qrAndShortUrl = (stats.visitQrCode || 0) + (stats.visitShortUrl || 0);
  const otherVisits = (stats.visitWeb || 0);
  
  const visitorData: PieChartData[] = [
    { label: 'QR + Short URL', value: qrAndShortUrl, color: '#3b82f6' },
    { label: 'Other', value: otherVisits, color: '#f59e0b' }
  ];
  
  return (
    <PieChart
      title="Visitor Sources"
      subtitle="🌐 How visitors arrive"
      data={visitorData}
      filename={eventName ? `${eventName}-visitor-sources` : 'visitor-sources'}
      cutout="50%"
      legendPosition="bottom"
      height={350}
    />
  );
};

/**
 * Combined Value Horizontal Bar Chart
 * Modernized with Chart.js VerticalBarChart and KPICard
 * 
 * WHAT: Shows 5 different value calculations with total advertisement value KPI
 * WHY: Chart.js provides professional visualization with export capability
 * PERFORMANCE: Memoized to prevent re-renders when stats haven't changed
 */
const ValueHorizontalBarsComponent: React.FC<ChartProps> = ({ stats, eventName }) => {
  /* TRANSPARENT MIGRATION: Works with both old and new schema */
  const totalImages = stats.remoteImages + stats.hostessImages + stats.selfies;
  const totalFans = getTotalFans(stats);
  const under40Fans = stats.genAlpha + stats.genYZ;
  const totalVisitors = (
    (stats.visitQrCode || 0) + 
    (stats.visitShortUrl || 0) + 
    (stats.visitWeb || 0) + 
    (stats.visitFacebook || 0) + 
    (stats.visitInstagram || 0) + 
    (stats.visitYoutube || 0) + 
    (stats.visitTiktok || 0) + 
    (stats.visitX || 0) + 
    (stats.visitTrustpilot || 0)
  );
  const valuePropVisited = stats.eventValuePropositionVisited || 0;
  
  // Calculate values in EUR according to specified rates
  const valuePropValue = valuePropVisited * 15; // Value Prop Visited: Clicks × €15
  const directValue = totalImages * 5; // Direct Value: Images × €5
  const directAdsValue = totalFans * 3; // Direct Ads Value: Fans × €3
  const under40EngagedValue = under40Fans * 4; // Under 40 Engaged: under40fans × €4
  const brandAwarenessValue = totalVisitors * 1; // General Brand Awareness: Visitors × €1
  
  const valueData: VerticalBarChartData[] = [
    { label: 'CPM', value: valuePropValue, color: '#3b82f6' },
    { label: 'eDM', value: directValue, color: '#10b981' },
    { label: 'Ads', value: directAdsValue, color: '#f59e0b' },
    { label: 'U40 Eng.', value: under40EngagedValue, color: '#8b5cf6' },
    { label: 'Branding', value: brandAwarenessValue, color: '#ef4444' }
  ];
  
  const totalValue = valuePropValue + directValue + directAdsValue + under40EngagedValue + brandAwarenessValue;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mm-space-4)' }}>
      <KPICard
        title="Advertisement Value"
        value={totalValue}
        format="currency"
        color="primary"
        size="md"
      />
      <VerticalBarChart
        title="Value Breakdown"
        subtitle="💰 Revenue components"
        data={valueData}
        filename={eventName ? `${eventName}-value-breakdown` : 'value-breakdown'}
        height={350}
      />
    </div>
  );
};

/**
 * Value Proposition Horizontal Bars (Deprecated - kept for backward compatibility)
 * Modernized with Chart.js VerticalBarChart and KPICard
 * 
 * WHAT: Shows value proposition viewed vs visited with conversion percentage
 * WHY: Chart.js provides professional visualization with export capability
 * PERFORMANCE: Memoized to prevent re-renders when stats haven't changed
 */
const ValuePropositionHorizontalBarsComponent: React.FC<ChartProps> = ({ stats, eventName }) => {
  /* What: Calculate value proposition conversion metrics
     Why: Show how many viewers convert to visitors (conversion rate) */
  const valuePropViewed = stats.eventValuePropositionVisited || 0;
  const valuePropPurchases = stats.eventValuePropositionPurchases || 0;
  
  // Calculate percentage - visited as percentage of viewed (if viewed > 0)
  const visitedPercentage = valuePropViewed > 0 ? (valuePropPurchases / valuePropViewed) * 100 : 0;
  
  const valueData: VerticalBarChartData[] = [
    { label: 'Viewed', value: valuePropViewed, color: '#3b82f6' },
    { label: 'Visited', value: valuePropPurchases, color: '#10b981' }
  ];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mm-space-4)' }}>
      <KPICard
        title="Conversion Rate"
        value={visitedPercentage}
        format="percentage"
        color="success"
        size="md"
      />
      <VerticalBarChart
        title="Value Proposition"
        subtitle="🎯 Viewed vs Visited"
        data={valueData}
        filename={eventName ? `${eventName}-value-proposition` : 'value-proposition'}
        height={350}
      />
    </div>
  );
};

/**
 * Engagement Horizontal Bar Chart
 * Modernized with Chart.js VerticalBarChart and KPICard
 * 
 * WHAT: Shows 5 engagement metrics with core fan team KPI
 * WHY: Chart.js provides professional visualization with export capability
 * PERFORMANCE: Memoized to prevent re-renders when stats haven't changed
 */
const EngagementHorizontalBarsComponent: React.FC<ChartProps> = ({ stats, eventName }) => {
  /* TRANSPARENT MIGRATION: Works with both old and new schema */
  const totalFans = getTotalFans(stats);
  const eventAttendees = stats.eventAttendees || 0;
  const totalImages = stats.remoteImages + stats.hostessImages + stats.selfies;
  
  // Calculate social media visits total
  const socialMediaVisits = (
    (stats.visitFacebook || 0) + 
    (stats.visitInstagram || 0) + 
    (stats.visitYoutube || 0) + 
    (stats.visitTiktok || 0) + 
    (stats.visitX || 0) + 
    (stats.visitTrustpilot || 0)
  );
  
  const valueProp = (stats.eventValuePropositionVisited || 0) + (stats.eventValuePropositionPurchases || 0);
  
  // Calculate engagement percentages
  const fanEngagement = eventAttendees > 0 ? (totalFans / eventAttendees) * 100 : 0;
  const fanInteraction = totalImages > 0 ? ((socialMediaVisits + valueProp) / totalImages) * 100 : 0;
  
  const merchedFans = stats.merched;
  const flagsAndScarfs = stats.flags + stats.scarf;
  const nonMerchedFans = totalFans - merchedFans;
  
  const frontRunners = totalFans > 0 ? (merchedFans / totalFans) * 100 : 0;
  const fanaticals = merchedFans > 0 ? (flagsAndScarfs / merchedFans) * 100 : 0;
  const casuals = totalFans > 0 ? (nonMerchedFans / totalFans) * 100 : 0;
  
  const engagementData: VerticalBarChartData[] = [
    { label: 'Engaged', value: fanEngagement, color: '#8b5cf6' },
    { label: 'Interactive', value: fanInteraction, color: '#f59e0b' },
    { label: 'Front-runners', value: frontRunners, color: '#10b981' },
    { label: 'Fanaticals', value: fanaticals, color: '#ef4444' },
    { label: 'Casuals', value: casuals, color: '#06b6d4' }
  ];
  
  // Calculate core fan team metric: (merched / fans) * event attendees
  const coreFanTeam = totalFans > 0 && eventAttendees > 0 ? Math.round((merchedFans / totalFans) * eventAttendees) : 0;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mm-space-4)' }}>
      <KPICard
        title="Core Fan Team"
        value={coreFanTeam}
        format="number"
        color="info"
        size="md"
      />
      <VerticalBarChart
        title="Engagement Metrics"
        subtitle="🔥 Fan participation levels"
        data={engagementData}
        filename={eventName ? `${eventName}-engagement` : 'engagement'}
        height={350}
      />
    </div>
  );
};

/**
 * Advertisement Value Horizontal Bar Chart
 * Modernized with Chart.js VerticalBarChart and KPICard
 * 
 * WHAT: Shows advertising value with detailed cost breakdown and total KPI
 * WHY: Chart.js provides professional visualization with export capability
 * PERFORMANCE: Memoized to prevent re-renders when stats haven't changed
 */
const AdvertisementValueHorizontalBarsComponent: React.FC<ChartProps> = ({ stats, eventName }) => {
  /* TRANSPARENT MIGRATION: Works with both old and new schema */
  const totalImages = stats.remoteImages + stats.hostessImages + stats.selfies;
  const totalFans = getTotalFans(stats);
  const totalVisitors = (
    (stats.visitQrCode || 0) + 
    (stats.visitShortUrl || 0) + 
    (stats.visitWeb || 0) + 
    (stats.visitFacebook || 0) + 
    (stats.visitInstagram || 0) + 
    (stats.visitYoutube || 0) + 
    (stats.visitTiktok || 0) + 
    (stats.visitX || 0) + 
    (stats.visitTrustpilot || 0)
  );
  
  // Calculate values in EUR: Images × €9, Fans × €7, Visitors × €1
  const directValue = totalImages * 9;
  const directAdsValue = totalFans * 7;
  const brandAwarenessValue = totalVisitors * 1;
  
  const adData: VerticalBarChartData[] = [
    { label: `Direct (${totalImages} × €9)`, value: directValue, color: '#3b82f6' },
    { label: `Ads (${totalFans} × €7)`, value: directAdsValue, color: '#10b981' },
    { label: `Awareness (${totalVisitors} × €1)`, value: brandAwarenessValue, color: '#f59e0b' }
  ];
  
  const totalAdValue = directValue + directAdsValue + brandAwarenessValue;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mm-space-4)' }}>
      <KPICard
        title="Total Advertisement Value"
        value={totalAdValue}
        format="currency"
        color="warning"
        size="md"
      />
      <VerticalBarChart
        title="Advertisement Breakdown"
        subtitle="📣 Value by channel"
        data={adData}
        filename={eventName ? `${eventName}-ad-value` : 'ad-value'}
        height={350}
      />
    </div>
  );
};

/**
 * Chart Container Wrapper
 * Provides consistent styling and structure for all chart components
 * Includes title, optional export functionality, and glass card effect
 */
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ 
  title, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`chart-container ${className}`}>
      <div className="chart-header">
        <h4 className="chart-title">{title}</h4>
      </div>
      <div className="chart-content">
        {children}
      </div>
    </div>
  );
};

// WHAT: Memoized chart exports to prevent unnecessary re-renders
// WHY: Charts are computationally expensive; memoization improves dashboard performance
// Each chart is wrapped with React.memo() using custom comparison to skip re-renders
// when stats haven't changed, significantly improving performance in dashboards with
// multiple charts that update independently.
export const GenderCircleChart = memo(GenderCircleChartComponent, compareChartProps);
export const FansLocationPieChart = memo(FansLocationPieChartComponent, compareChartProps);
export const AgeGroupsPieChart = memo(AgeGroupsPieChartComponent, compareChartProps);
export const MerchandiseHorizontalBars = memo(MerchandiseHorizontalBarsComponent, compareChartProps);
export const VisitorSourcesPieChart = memo(VisitorSourcesPieChartComponent, compareChartProps);
export const ValueHorizontalBars = memo(ValueHorizontalBarsComponent, compareChartProps);
export const ValuePropositionHorizontalBars = memo(ValuePropositionHorizontalBarsComponent, compareChartProps);
export const EngagementHorizontalBars = memo(EngagementHorizontalBarsComponent, compareChartProps);
export const AdvertisementValueHorizontalBars = memo(AdvertisementValueHorizontalBarsComponent, compareChartProps);
