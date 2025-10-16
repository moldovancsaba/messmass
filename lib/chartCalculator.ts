// lib/chartCalculator.ts - Chart Calculator utility
// Applies formula engine to chart configurations and returns chart-ready data
// Handles PieChart, HorizontalBar, and KPI chart types with "NA" error substitution

import { ChartConfiguration, ChartCalculationResult } from './chartConfigTypes';
import { evaluateFormula, evaluateFormulasBatch } from './formulaEngine';

/**
 * Project statistics interface matching the existing structure
 * This should match the interface used throughout the application
 */
interface ProjectStats {
  remoteImages: number;
  hostessImages: number;
  selfies: number;
  indoor: number;
  outdoor: number;
  stadium: number;
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
  // Optional Success Manager fields
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
  // Merchandise pricing variables
  jerseyPrice?: number;
  scarfPrice?: number;
  flagsPrice?: number;
  capPrice?: number;
  otherPrice?: number;
}

/**
 * Calculates chart data from a single chart configuration
 * Applies formula evaluation to each element and handles errors gracefully
 * @param configuration - Chart configuration with formulas
 * @param stats - Project statistics for variable substitution
 * @returns Chart calculation result with evaluated values or "NA" for errors
 */
export function calculateChart(
  configuration: ChartConfiguration,
  stats: ProjectStats
): ChartCalculationResult {
  console.log(`🧮 Calculating chart: ${configuration.title} (${configuration.type})`);
  console.log('Configuration elements:', configuration.elements);
  console.log('Available stats:', Object.keys(stats));
  
  let hasErrors = false;
  
  // Evaluate each element's formula
  const elements = configuration.elements.map(element => {
    try {
      console.log(`Evaluating element: ${element.label} with formula: ${element.formula}`);

      // WHAT: Extract parameter values from element.parameters to support [PARAM:key] tokens
      // WHY: Ensures parameterized formulas evaluate using configurable multipliers rather than hardcoded numbers
      const paramValues: Record<string, number> | undefined = element.parameters
        ? Object.fromEntries(
            Object.entries(element.parameters).map(([k, v]) => [k, (v as any)?.value ?? 0])
          )
        : undefined;

      // WHAT: Extract manual data for [MANUAL:key] tokens (aggregated analytics)
      // WHY: Supports hashtag seasonality and partner benchmark charts with pre-computed data
      const manualValues: Record<string, number> | undefined = (element as any).manualData;

      const value = evaluateFormula(element.formula, stats, paramValues, manualValues);
      console.log(`Result for ${element.label}: ${value}`);
      
      if (value === 'NA') {
        hasErrors = true;
        console.warn(`⚠️ Formula evaluation returned NA for element "${element.label}": ${element.formula}`);
      }
      
      return {
        id: element.id,
        label: element.label,
        value: value,
        color: element.color
      };
    } catch (error) {
      hasErrors = true;
      console.error(`❌ Error evaluating formula for element "${element.label}":`, error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      
      return {
        id: element.id,
        label: element.label,
        value: 'NA' as const,
        color: element.color
      };
    }
  });
  
  // Calculate total for bar charts or kpiValue for KPI charts
  let total: number | 'NA' | undefined;
  let kpiValue: number | 'NA' | undefined;
  
  // Ensure synthetic fields exist for downstream logic without breaking formulas
  const syntheticStats: any = { ...stats };
  const remoteFansSynth = (syntheticStats.remoteFans ?? (syntheticStats.indoor + syntheticStats.outdoor));
  syntheticStats.totalFans = remoteFansSynth + (syntheticStats.stadium || 0);
  
  // Special handling for KPI charts
  if (configuration.type === 'kpi') {
    // KPI charts should have exactly one element with the calculation formula
    if (elements.length > 0) {
      kpiValue = elements[0].value;
      
      // For KPI charts, if the value is NA, it's likely due to division by zero or missing data
      if (kpiValue === 'NA') {
        console.warn(`⚠️ KPI calculation returned NA for "${configuration.title}"`);
      }
    } else {
      kpiValue = 'NA';
      hasErrors = true;
      console.error(`❌ KPI chart "${configuration.title}" has no elements`);
    }
  } else if (configuration.type === 'bar' && configuration.showTotal) {
    try {
      // For bar charts, total is the sum of all elements (excluding NA values)
      const validValues = elements
        .map(el => el.value)
        .filter((value): value is number => typeof value === 'number');
      
      if (validValues.length === 0) {
        total = 'NA';
        hasErrors = true;
      } else if (validValues.length < elements.length) {
        // Some elements are NA, but we can still calculate partial total
        total = validValues.reduce((sum, value) => sum + value, 0);
        hasErrors = true; // Mark as having errors due to partial data
      } else {
        // All elements are valid numbers
        total = validValues.reduce((sum, value) => sum + value, 0);
      }
    } catch (error) {
      total = 'NA';
      hasErrors = true;
      console.error(`❌ Error calculating total for chart "${configuration.title}":`, error);
    }
  }
  
  // Special handling for Engagement chart's Core Fan Team calculation
  if (configuration.chartId === 'engagement' && configuration.showTotal) {
    try {
      // Core Fan Team = (merched / total_fans) * event_attendees
      const remoteFans = (stats as any).remoteFans ?? (stats.indoor + stats.outdoor);
      const totalFans = remoteFans + stats.stadium;
      const merched = stats.merched;
      const eventAttendees = stats.eventAttendees || 0;
      
      if (totalFans > 0 && eventAttendees > 0) {
        total = Math.round((merched / totalFans) * eventAttendees);
      } else {
        total = 'NA';
        hasErrors = true;
      }
    } catch (error) {
      total = 'NA';
      hasErrors = true;
      console.error(`❌ Error calculating Core Fan Team:`, error);
    }
  }
  
  // Special handling for Merchandise chart's potential sales calculation
  if (configuration.chartId === 'merchandise' && configuration.showTotal) {
    try {
      // Potential Sales = (total_fans - merched) * €10
      const remoteFans = (stats as any).remoteFans ?? (stats.indoor + stats.outdoor);
      const totalFans = remoteFans + stats.stadium;
      const merched = stats.merched;
      
      if (totalFans >= merched) {
        total = (totalFans - merched) * 10;
      } else {
        total = 'NA';
        hasErrors = true;
      }
    } catch (error) {
      total = 'NA';
      hasErrors = true;
      console.error(`❌ Error calculating potential merchandise sales:`, error);
    }
  }
  
  console.log(`✅ Chart calculation complete: ${elements.length} elements, ${hasErrors ? 'with' : 'without'} errors`);
  
  return {
    chartId: configuration.chartId,
    title: configuration.title,
    type: configuration.type,
    emoji: configuration.emoji,
    subtitle: configuration.subtitle,
    totalLabel: configuration.totalLabel,
    elements,
    total,
    kpiValue,
    hasErrors
  };
}

/**
 * Batch calculates multiple charts from configurations
 * More efficient than calling calculateChart multiple times with same stats
 * @param configurations - Array of chart configurations
 * @param stats - Project statistics for all calculations
 * @returns Array of chart calculation results
 */
export function calculateChartsBatch(
  configurations: ChartConfiguration[],
  stats: ProjectStats
): ChartCalculationResult[] {
  console.log(`🧮 Batch calculating ${configurations.length} charts...`);
  
  return configurations.map(config => calculateChart(config, stats));
}

/**
 * Calculates only active charts from a set of configurations
 * Filters out inactive charts before calculation
 * @param configurations - Array of chart configurations (active and inactive)
 * @param stats - Project statistics for calculations
 * @returns Array of calculation results for active charts only
 */
export function calculateActiveCharts(
  configurations: ChartConfiguration[],
  stats: ProjectStats
): ChartCalculationResult[] {
  console.log('🧮 calculateActiveCharts called with:', {
    configurationsCount: configurations.length,
    statsKeys: Object.keys(stats),
    configurations: configurations.map(c => ({ 
      id: c.chartId, 
      title: c.title, 
      active: 'active' in c ? (c as ChartConfiguration & { active: boolean }).active : c.isActive
    }))
  });
  
  // Handle both 'active' and 'isActive' property names - if neither exists, assume active
  const activeConfigurations = configurations.filter(config => {
    const configWithActive = config as ChartConfiguration & { active?: boolean };
    const hasActiveProperty = configWithActive.active !== undefined || config.isActive !== undefined;
    if (!hasActiveProperty) {
      // If no active property exists, assume the chart is active
      return true;
    }
    return configWithActive.active === true || config.isActive === true;
  });
  
  console.log(`🧮 Calculating ${activeConfigurations.length} active charts (${configurations.length - activeConfigurations.length} inactive)`);
  console.log('Active configurations:', activeConfigurations.map(c => c.title));
  
  return calculateChartsBatch(activeConfigurations, stats);
}

/**
 * Validates that a chart configuration will work with given project stats
 * Useful for testing configurations before saving them
 * @param configuration - Chart configuration to validate
 * @param stats - Project statistics to test against
 * @returns Validation result with details about any issues
 */
export function validateChartWithStats(
  configuration: ChartConfiguration,
  stats: ProjectStats
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  calculationResult: ChartCalculationResult;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Perform the calculation
  const calculationResult = calculateChart(configuration, stats);
  
  // Check for formula evaluation errors
  calculationResult.elements.forEach(element => {
    if (element.value === 'NA') {
      errors.push(`Formula evaluation failed for element "${element.label}"`);
    }
  });
  
  // Check for total calculation issues
  if (calculationResult.total === 'NA' && configuration.showTotal) {
    errors.push(`Total calculation failed for ${configuration.type} chart`);
  }
  
  // Check for chart type constraints
  if (configuration.type === 'pie' && configuration.elements.length !== 2) {
    errors.push('Pie charts must have exactly 2 elements');
  }
  
  if (configuration.type === 'bar' && configuration.elements.length !== 5) {
    errors.push('Bar charts must have exactly 5 elements');
  }
  
  if (configuration.type === 'kpi' && configuration.elements.length !== 1) {
    errors.push('KPI charts must have exactly 1 element');
  }
  
  
  // Check for potential issues with zero values in pie charts
  if (configuration.type === 'pie') {
    const validValues = calculationResult.elements.filter(el => typeof el.value === 'number');
    const totalValue = validValues.reduce((sum, el) => sum + (el.value as number), 0);
    
    if (totalValue === 0) {
      warnings.push('All pie chart elements evaluate to zero - chart will not be visible');
    }
  }
  
  // Check for negative values in certain contexts
  calculationResult.elements.forEach(element => {
    if (typeof element.value === 'number' && element.value < 0) {
      warnings.push(`Element "${element.label}" has negative value: ${element.value}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    calculationResult
  };
}

/**
 * Gets a summary of chart calculation performance
 * Useful for debugging and monitoring chart calculation efficiency
 * @param configurations - Chart configurations that were calculated
 * @param results - Calculation results from those configurations
 * @returns Performance summary with timing and error information
 */
export function getCalculationSummary(
  configurations: ChartConfiguration[],
  results: ChartCalculationResult[]
): {
  totalCharts: number;
  activeCharts: number;
  chartsWithErrors: number;
  elementsWithErrors: number;
  totalElements: number;
  chartTypes: { pie: number; bar: number; kpi: number };
} {
  const activeCharts = configurations.filter(config => config.isActive).length;
  const chartsWithErrors = results.filter(result => result.hasErrors).length;
  
  let elementsWithErrors = 0;
  let totalElements = 0;
  
  results.forEach(result => {
    totalElements += result.elements.length;
    result.elements.forEach(element => {
      if (element.value === 'NA') {
        elementsWithErrors++;
      }
    });
  });
  
  const chartTypes = results.reduce(
    (acc, result) => {
      acc[result.type]++;
      return acc;
    },
    { pie: 0, bar: 0, kpi: 0 }
  );
  
  return {
    totalCharts: configurations.length,
    activeCharts,
    chartsWithErrors,
    elementsWithErrors,
    totalElements,
    chartTypes
  };
}

/**
 * Helper function to format chart values for display
 * Handles "NA" values and number formatting consistently
 * @param value - The value to format (number or "NA")
 * @param options - Formatting options
 * @returns Formatted string for display
 */
export function formatChartValue(
  value: number | 'NA',
  options: {
    type?: 'currency' | 'percentage' | 'number';
    decimals?: number;
    showNA?: string;
  } = {}
): string {
  if (value === 'NA') {
    return options.showNA || 'N/A';
  }
  
  const decimals = options.decimals ?? 0;
  
  switch (options.type) {
    case 'currency':
      return `€${value.toLocaleString(undefined, { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals 
      })}`;
    
    case 'percentage':
      return `${value.toFixed(decimals)}%`;
    
    case 'number':
    default:
      return value.toLocaleString(undefined, { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals 
      });
  }
}
