// lib/chartCalculator.ts - Chart Calculator utility
// Applies formula engine to chart configurations and returns chart-ready data
// Handles both PieChart and HorizontalBar chart types with "NA" error substitution

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
  
  let hasErrors = false;
  
  // Evaluate each element's formula
  const elements = configuration.elements.map(element => {
    try {
      const value = evaluateFormula(element.formula, stats);
      
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
      
      return {
        id: element.id,
        label: element.label,
        value: 'NA' as const,
        color: element.color
      };
    }
  });
  
  // Calculate total for bar charts (optional for pie charts)
  let total: number | 'NA' | undefined;
  
  if (configuration.type === 'bar' && configuration.showTotal) {
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
      const totalFans = stats.indoor + stats.outdoor + stats.stadium;
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
      const totalFans = stats.indoor + stats.outdoor + stats.stadium;
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
    elements,
    total,
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
  const activeConfigurations = configurations.filter(config => config.isActive);
  
  console.log(`🧮 Calculating ${activeConfigurations.length} active charts (${configurations.length - activeConfigurations.length} inactive)`);
  
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
  chartTypes: { pie: number; bar: number };
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
    { pie: 0, bar: 0 }
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
