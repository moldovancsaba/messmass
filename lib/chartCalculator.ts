// lib/chartCalculator.ts - Chart Calculator utility
// Applies formula engine to chart configurations and returns chart-ready data
// Handles PieChart, HorizontalBar, and KPI chart types with "NA" error substitution

import { ChartConfiguration, ChartCalculationResult } from './chartConfigTypes';
import { evaluateFormula, evaluateFormulasBatch, evaluateFormulaSafe, validateStatsForFormula } from './formulaEngine';
import { 
  validateProjectStats, 
  ensureDerivedMetrics, 
  prepareStatsForAnalytics,
  type ValidationResult as DataValidationResult 
} from './dataValidator';

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
 * WHAT: Safe chart calculation with automatic data validation and enrichment
 * WHY: Prevent crashes and misleading results from incomplete data
 * HOW: Validate stats, enrich with derived metrics, then calculate
 * 
 * @param configuration - Chart configuration with formulas
 * @param stats - Project statistics (may be incomplete)
 * @returns Chart calculation result with data quality indicators
 */
export function calculateChartSafe(
  configuration: ChartConfiguration,
  stats: Partial<ProjectStats>
): ChartCalculationResult & { dataQuality?: DataValidationResult } {
  // WHAT: Validate and enrich stats before calculation
  // WHY: Ensure minimum data quality and derived metrics exist
  const { stats: enrichedStats, validation } = prepareStatsForAnalytics(stats);
  
  // WHAT: If data quality is insufficient, return error state
  // WHY: Prevent misleading charts from incomplete data
  if (!validation.hasMinimumData) {
    console.warn(
      `⚠️ Insufficient data for chart "${configuration.title}": ${validation.missingRequired.length} required metrics missing`
    );
    
    return {
      chartId: configuration.chartId,
      title: configuration.title,
      type: configuration.type,
      emoji: configuration.emoji,
      subtitle: `Data incomplete: ${validation.completeness}%`,
      totalLabel: configuration.totalLabel,
      elements: [],
      total: 'NA',
      kpiValue: 'NA',
      hasErrors: true,
      dataQuality: validation
    };
  }
  
  // WHAT: Perform standard chart calculation with enriched stats
  // WHY: Now guaranteed to have minimum required data
  const result = calculateChart(configuration, enrichedStats);
  
  // WHAT: Attach data quality metadata to result
  // WHY: Enable UI to show quality indicators
  return {
    ...result,
    dataQuality: validation
  };
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
      
      // WHAT: Dynamic label resolution from stats fields
      // WHY: Charts like "Top Countries" need labels from dynamic data (e.g., country names)
      // HOW: If label contains {{fieldName}}, replace with value from stats[fieldName]
      // EXAMPLE: label "{{stats.bitlyCountry1}}" becomes "United States" from stats.bitlyCountry1
      let resolvedLabel = element.label;
      if (resolvedLabel.includes('{{') && resolvedLabel.includes('}}')) {
        const fieldMatch = resolvedLabel.match(/\{\{([^}]+)\}\}/);
        if (fieldMatch && fieldMatch[1]) {
          let fieldName = fieldMatch[1].trim();
          
          // WHAT: Handle {{stats.fieldName}} syntax from chart editor
          // WHY: Chart editor uses "stats." prefix, but we need to access stats[fieldName]
          if (fieldName.startsWith('stats.')) {
            fieldName = fieldName.substring(6); // Remove "stats." prefix
          }
          
          const fieldValue = (stats as any)[fieldName];
          if (fieldValue !== undefined && fieldValue !== null) {
            resolvedLabel = fieldValue.toString();
          } else {
            // Fallback if field doesn't exist
            resolvedLabel = element.label.replace(/\{\{[^}]+\}\}/, 'N/A');
          }
        }
      }
      
      return {
        id: element.id,
        label: resolvedLabel,
        value: value,
        color: element.color,
        type: element.type // WHAT: Pass through type for proper formatting (currency, percentage, number)
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
        color: element.color,
        type: element.type // WHAT: Pass through type for proper formatting (currency, percentage, number)
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
  
  // Special handling for image charts
  if (configuration.type === 'image') {
    // WHAT: Image charts display URLs stored in stats fields (e.g., stats.reportImage1)
    // WHY: Images are string URLs, not numeric calculations
    // HOW: Extract string value directly from stats field
    if (elements.length > 0 && configuration.elements.length > 0) {
      kpiValue = elements[0].value;
      
      // WHAT: If numeric evaluation failed, try direct stats field access for strings
      // WHY: evaluateFormula returns 'NA' for string fields
      // HOW: Check if formula is simple [fieldName] pattern and extract string value
      if (kpiValue === 'NA' && configuration.elements[0].formula) {
        // Match [FIELDNAME] or stats.fieldName patterns
        const simpleFieldMatch = configuration.elements[0].formula.match(/^(?:\[([a-zA-Z0-9]+)\]|stats\.([a-zA-Z0-9]+))$/);
        if (simpleFieldMatch) {
          const fieldName = simpleFieldMatch[1] || simpleFieldMatch[2];
          // Convert to camelCase (e.g., reportImage1)
          const camelFieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
          const fieldValue = (stats as any)[camelFieldName];
          if (typeof fieldValue === 'string' && fieldValue.length > 0) {
            kpiValue = fieldValue as any; // Allow string values for image URLs
            console.log(`✅ Image URL for "${configuration.title}": ${fieldValue}`);
          } else {
            console.warn(`⚠️ Image chart "${configuration.title}" has no valid URL in stats.${camelFieldName}`);
          }
        }
      }
    } else {
      kpiValue = 'NA';
      hasErrors = true;
      console.error(`❌ Image chart "${configuration.title}" has no elements`);
    }
  }
  
  // Special handling for text charts
  else if (configuration.type === 'text') {
    // WHAT: Text charts display string content from stats fields (e.g., stats.reportText1)
    // WHY: Text content is strings, not numeric calculations
    // HOW: Extract string value directly from stats field
    if (elements.length > 0 && configuration.elements.length > 0) {
      kpiValue = elements[0].value;
      
      // WHAT: If numeric evaluation failed, try direct stats field access for strings
      // WHY: evaluateFormula returns 'NA' for string fields
      // HOW: Check if formula is simple [fieldName] pattern and extract string value
      if (kpiValue === 'NA' && configuration.elements[0].formula) {
        // Match [FIELDNAME] or stats.fieldName patterns
        const simpleFieldMatch = configuration.elements[0].formula.match(/^(?:\[([a-zA-Z0-9]+)\]|stats\.([a-zA-Z0-9]+))$/);
        if (simpleFieldMatch) {
          const fieldName = simpleFieldMatch[1] || simpleFieldMatch[2];
          // Convert to camelCase (e.g., reportText1)
          const camelFieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
          const fieldValue = (stats as any)[camelFieldName];
          if (typeof fieldValue === 'string' && fieldValue.length > 0) {
            kpiValue = fieldValue as any; // Allow string values for text content
            console.log(`✅ Text content for "${configuration.title}": ${fieldValue.substring(0, 50)}...`);
          } else {
            console.warn(`⚠️ Text chart "${configuration.title}" has no valid content in stats.${camelFieldName}`);
          }
        }
      }
    } else {
      kpiValue = 'NA';
      hasErrors = true;
      console.error(`❌ Text chart "${configuration.title}" has no elements`);
    }
  }
  
  // Special handling for KPI charts
  else if (configuration.type === 'kpi') {
    // KPI charts should have exactly one element with the calculation formula
    if (elements.length > 0 && configuration.elements.length > 0) {
      kpiValue = elements[0].value;
      
      // WHAT: Check if this is a string-value KPI (formula references string field directly)
      // WHY: Some KPIs display text values (e.g., country names) not numbers
      // HOW: If formula is simple [fieldName] and stats[fieldName] is string, use it directly
      if (kpiValue === 'NA' && configuration.elements[0].formula) {
        const simpleFieldMatch = configuration.elements[0].formula.match(/^\[([a-zA-Z0-9]+)\]$/);
        if (simpleFieldMatch) {
          const fieldName = simpleFieldMatch[1];
          // Convert to camelCase (e.g., bitlyTopCountry)
          const camelFieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
          const fieldValue = (stats as any)[camelFieldName];
          if (typeof fieldValue === 'string') {
            kpiValue = fieldValue as any; // Allow string KPI values
            console.log(`✅ String KPI value for "${configuration.title}": ${fieldValue}`);
          } else {
            console.warn(`⚠️ KPI calculation returned NA for "${configuration.title}"`);
          }
        } else {
          console.warn(`⚠️ KPI calculation returned NA for "${configuration.title}"`);
        }
      } else if (kpiValue === 'NA') {
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
 * WHAT: Safe batch calculation with upfront validation
 * WHY: Validate once, calculate many - more efficient
 * HOW: Enrich stats once, then batch calculate all charts
 * 
 * @param configurations - Array of chart configurations
 * @param stats - Project statistics (may be incomplete)
 * @returns Array of results with data quality indicators
 */
export function calculateChartsBatchSafe(
  configurations: ChartConfiguration[],
  stats: Partial<ProjectStats>
): Array<ChartCalculationResult & { dataQuality?: DataValidationResult }> {
  console.log(`🧮 Safe batch calculating ${configurations.length} charts...`);
  
  // WHAT: Validate and enrich stats once for all charts
  // WHY: More efficient than validating per chart
  const { stats: enrichedStats, validation } = prepareStatsForAnalytics(stats);
  
  console.log(`📊 Data quality: ${validation.dataQuality} (${validation.completeness}% complete)`);
  
  // WHAT: If data is insufficient, return error states for all charts
  // WHY: Prevent calculation with incomplete data
  if (!validation.hasMinimumData) {
    console.warn(
      `⚠️ Insufficient data for batch calculation: ${validation.missingRequired.length} required metrics missing`
    );
    
    return configurations.map(config => ({
      chartId: config.chartId,
      title: config.title,
      type: config.type,
      emoji: config.emoji,
      subtitle: `Data incomplete: ${validation.completeness}%`,
      totalLabel: config.totalLabel,
      elements: [],
      total: 'NA',
      kpiValue: 'NA',
      hasErrors: true,
      dataQuality: validation
    }));
  }
  
  // WHAT: Calculate all charts with enriched stats
  // WHY: Standard calculation now guaranteed to have required data
  return configurations.map(config => ({
    ...calculateChart(config, enrichedStats),
    dataQuality: validation
  }));
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
 * WHAT: Safe calculation of only active charts with validation
 * WHY: Filter inactive charts and ensure data quality
 * HOW: Filter by active flag, validate stats, then calculate
 * 
 * @param configurations - Array of chart configurations (active and inactive)
 * @param stats - Project statistics (may be incomplete)
 * @returns Array of calculation results for active charts with data quality
 */
export function calculateActiveChartsSafe(
  configurations: ChartConfiguration[],
  stats: Partial<ProjectStats>
): Array<ChartCalculationResult & { dataQuality?: DataValidationResult }> {
  console.log('🧮 Safe calculateActiveCharts called with:', {
    configurationsCount: configurations.length,
    statsKeys: Object.keys(stats),
    configurations: configurations.map(c => ({ 
      id: c.chartId, 
      title: c.title, 
      active: 'active' in c ? (c as ChartConfiguration & { active: boolean }).active : c.isActive
    }))
  });
  
  // WHAT: Filter to only active charts
  // WHY: Skip unnecessary calculations for inactive charts
  const activeConfigurations = configurations.filter(config => {
    const configWithActive = config as ChartConfiguration & { active?: boolean };
    const hasActiveProperty = configWithActive.active !== undefined || config.isActive !== undefined;
    if (!hasActiveProperty) return true;
    return configWithActive.active === true || config.isActive === true;
  });
  
  console.log(`🧮 Calculating ${activeConfigurations.length} active charts (${configurations.length - activeConfigurations.length} inactive)`);
  
  // WHAT: Use safe batch calculation for active charts
  // WHY: Leverage validation and enrichment
  return calculateChartsBatchSafe(activeConfigurations, stats);
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
  chartTypes: { pie: number; bar: number; kpi: number; text: number; image: number };
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
      if (result.type === 'pie' || result.type === 'bar' || result.type === 'kpi' || result.type === 'text' || result.type === 'image') {
        acc[result.type]++;
      }
      return acc;
    },
    { pie: 0, bar: 0, kpi: 0, text: 0, image: 0 }
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
