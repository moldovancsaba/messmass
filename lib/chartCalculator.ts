/**
 * @deprecated This file is maintained for backward-compatibility only.
 * All chart calculations should directly use ReportCalculator or calculateActiveCharts
 * from 'lib/report-calculator'.
 *
 * @see lib/report-calculator.ts
 */

import { ChartConfiguration, ChartCalculationResult } from './chartConfigTypes';
import { formatChartValue as sharedFormatChartValue } from './formatChartValue';
import { fetchContentAssetsSync } from './formulaEngine';
import { 
  validateProjectStats, 
  ensureDerivedMetrics, 
  prepareStatsForAnalytics,
  type ValidationResult as DataValidationResult 
} from './dataValidator';
import { ReportCalculator, calculateActiveCharts as unifiedCalculateActiveCharts } from './report-calculator';

export type { ProjectStats } from './report-calculator';
export { ensureDerivedMetrics, prepareStatsForAnalytics } from './analytics/derivedMetrics';

/**
 * @deprecated Use ReportCalculator.calculateSingleChart from 'lib/report-calculator'
 */
export function calculateChart(
  configuration: ChartConfiguration,
  stats: Record<string, any>,
  contentAssets?: any[]
): ChartCalculationResult {
  const assets = contentAssets ?? fetchContentAssetsSync();
  return ReportCalculator.calculateSingleChart(configuration, stats, assets) as ChartCalculationResult;
}

/**
 * @deprecated Use ReportCalculator.calculateSingleChart from 'lib/report-calculator'
 */
export function calculateChartSafe(
  configuration: ChartConfiguration,
  stats: Record<string, any>
): ChartCalculationResult & { dataQuality?: DataValidationResult } {
  const contentAssets = fetchContentAssetsSync();
  const { stats: enrichedStats, validation } = prepareStatsForAnalytics(stats);

  if (!validation.hasMinimumData) {
    console.warn(
      `⚠️ Insufficient data for chart "${configuration.title}": ${validation.missingRequired.length} required metrics missing`
    );

    return {
      chartId: configuration.chartId,
      title: configuration.title,
      type: configuration.type,
      icon: configuration.icon,
      iconVariant: configuration.iconVariant,
      subtitle: `Data incomplete: ${validation.completeness}%`,
      totalLabel: configuration.totalLabel,
      elements: [],
      total: 'NA',
      kpiValue: 'NA',
      showTitle: configuration.showTitle !== false,
      hasErrors: true,
      dataQuality: validation
    };
  }

  const result = calculateChart(configuration, enrichedStats, contentAssets);
  return {
    ...result,
    dataQuality: validation
  };
}

/**
 * @deprecated Use ReportCalculator from 'lib/report-calculator'
 */
export function calculateChartsBatch(
  configurations: ChartConfiguration[],
  stats: Record<string, any>
): ChartCalculationResult[] {
  const contentAssets = fetchContentAssetsSync();
  return configurations.map(config => calculateChart(config, stats, contentAssets));
}

/**
 * @deprecated Use ReportCalculator from 'lib/report-calculator'
 */
export function calculateChartsBatchSafe(
  configurations: ChartConfiguration[],
  stats: Record<string, any>
): Array<ChartCalculationResult & { dataQuality?: DataValidationResult }> {
  const contentAssets = fetchContentAssetsSync();
  const { stats: enrichedStats, validation } = prepareStatsForAnalytics(stats);

  if (!validation.hasMinimumData) {
    console.warn(
      `⚠️ Insufficient data for batch calculation: ${validation.missingRequired.length} required metrics missing`
    );

    return configurations.map(config => ({
      chartId: config.chartId,
      title: config.title,
      type: config.type,
      icon: config.icon,
      iconVariant: config.iconVariant,
      subtitle: `Data incomplete: ${validation.completeness}%`,
      totalLabel: config.totalLabel,
      elements: [],
      total: 'NA',
      kpiValue: 'NA',
      showTitle: config.showTitle !== false,
      hasErrors: true,
      dataQuality: validation
    }));
  }

  return configurations.map(config => ({
    ...calculateChart(config, enrichedStats, contentAssets),
    dataQuality: validation
  }));
}

/**
 * @deprecated Use calculateActiveCharts from 'lib/report-calculator'
 */
export function calculateActiveCharts(
  configurations: ChartConfiguration[],
  stats: Record<string, any>
): ChartCalculationResult[] {
  return unifiedCalculateActiveCharts(configurations, stats) as ChartCalculationResult[];
}

/**
 * @deprecated Use calculateActiveCharts from 'lib/report-calculator'
 */
export function calculateActiveChartsSafe(
  configurations: ChartConfiguration[],
  stats: Record<string, any>
): Array<ChartCalculationResult & { dataQuality?: DataValidationResult }> {
  const activeConfigurations = configurations.filter(config => {
    const configWithActive = config as ChartConfiguration & { active?: boolean };
    const hasActiveProperty = configWithActive.active !== undefined || config.isActive !== undefined;
    if (!hasActiveProperty) return true;
    return configWithActive.active === true || config.isActive === true;
  });

  return calculateChartsBatchSafe(activeConfigurations, stats);
}

/**
 * @deprecated Test configurations using ReportCalculator.calculateSingleChart directly
 */
export function validateChartWithStats(
  configuration: ChartConfiguration,
  stats: Record<string, any>
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  calculationResult: ChartCalculationResult;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const contentAssets = fetchContentAssetsSync();
  const calculationResult = calculateChart(configuration, stats, contentAssets);

  calculationResult.elements.forEach(element => {
    if (element.value === 'NA') {
      errors.push(`Formula evaluation failed for element "${element.label}"`);
    }
  });

  if (calculationResult.total === 'NA' && configuration.showTotal) {
    errors.push(`Total calculation failed for ${configuration.type} chart`);
  }

  if (configuration.type === 'pie' && (configuration.elements.length < 2 || configuration.elements.length > 6)) {
    errors.push('Pie charts must have between 2 and 6 elements');
  }

  if (configuration.type === 'bar' && (configuration.elements.length < 1 || configuration.elements.length > 7)) {
    errors.push('Bar charts must have between 1 and 7 elements');
  }

  if (configuration.type === 'kpi' && configuration.elements.length !== 1) {
    errors.push('KPI charts must have exactly 1 element');
  }

  if (configuration.type === 'valuechain' && configuration.elements.length !== 2) {
    errors.push('ValueChain charts must have exactly 2 elements (title + description)');
  }

  if (configuration.type === 'pie') {
    const validValues = calculationResult.elements.filter(el => typeof el.value === 'number');
    const totalValue = validValues.reduce((sum, el) => sum + (el.value as number), 0);
    if (totalValue === 0) {
      warnings.push('All pie chart elements evaluate to zero - chart will show zero-state');
    }
  }

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
 * @deprecated Helper for legacy calculation debugging
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
  chartTypes: { pie: number; bar: number; kpi: number; text: number; image: number; table: number };
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
      if (result.type === 'pie' || result.type === 'bar' || result.type === 'kpi' || result.type === 'text' || result.type === 'image' || result.type === 'table') {
        acc[result.type]++;
      }
      return acc;
    },
    { pie: 0, bar: 0, kpi: 0, text: 0, image: 0, table: 0 }
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
 * @deprecated Use shared formatChartValue from 'lib/formatChartValue'
 */
export function formatChartValue(
  value: number | 'NA',
  options: {
    formatting?: { rounded: boolean; prefix?: string; suffix?: string; };
    type?: 'currency' | 'percentage' | 'number';
    decimals?: number;
    showNA?: string;
  } = {}
): string {
  if (value === 'NA') {
    return options.showNA || 'N/A';
  }

  if (options.formatting) {
    return sharedFormatChartValue(value, options.formatting);
  }

  const decimals = options.decimals ?? 0;
  switch (options.type) {
    case 'currency':
      return `€${value.toLocaleString('en-US', { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals 
      })}`;
    case 'percentage':
      return `${value.toFixed(decimals)}%`;
    case 'number':
    default:
      return value.toLocaleString('en-US', { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals 
      });
  }
}
