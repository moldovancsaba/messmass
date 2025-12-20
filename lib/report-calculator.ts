// WHAT: Unified Report Calculation Engine (v12.0.0)
// WHY: Single source of truth for all chart calculations - replaces 5+ scattered calculation files
// HOW: Class-based calculator with formula evaluation, type checking, and error handling

import { evaluateFormula } from './formulaEngine';

/**
 * WHAT: Chart configuration from database
 * WHY: Type-safe interface for chart data
 */
export interface Chart {
  chartId: string;
  title: string;
  type: 'kpi' | 'pie' | 'bar' | 'text' | 'image' | 'value';
  formula: string;
  icon?: string; // Optional - not all charts have icons
  iconVariant?: 'outlined' | 'rounded'; // Material Icons variant
  isActive: boolean;
  order: number;
  elements?: Array<{
    label: string;
    formula: string;
    color?: string;
  }>;
  formatting?: {
    prefix?: string;
    suffix?: string;
    decimals?: number;
  };
  aspectRatio?: '16:9' | '9:16' | '1:1';
  showTitle?: boolean; // Controls whether title/subtitle appear in rendered chart
}

/**
 * WHAT: Project statistics object
 * WHY: Type for stats data passed to calculator
 */
export interface ProjectStats {
  [key: string]: number | string | undefined;
}

/**
 * WHAT: Calculated chart result
 * WHY: Standardized output format for all chart types
 */
export interface ChartResult {
  chartId: string;
  type: Chart['type'];
  title: string;
  icon?: string; // Optional - not all charts have icons
  iconVariant?: 'outlined' | 'rounded'; // Material Icons variant
  kpiValue?: number | string;
  elements?: Array<{
    label: string;
    value: number | string;
    color?: string;
  }>;
  formatting?: Chart['formatting'];
  aspectRatio?: Chart['aspectRatio'];
  showTitle?: boolean; // Controls whether title/subtitle appear in rendered chart
  error?: string;
}

/**
 * WHAT: Unified Report Calculator
 * WHY: Single class to handle all chart calculations for reports
 * HOW: Instantiate with charts and stats, call calculateAll() or calculateChart()
 * 
 * @example
 * ```typescript
 * const calculator = new ReportCalculator(charts, project.stats);
 * const results = calculator.calculateAll(['total-fans', 'demographics']);
 * ```
 */
export class ReportCalculator {
  private charts: Map<string, Chart>;
  private stats: ProjectStats;

  /**
   * WHAT: Initialize calculator with chart configurations and project stats
   * WHY: Pre-load data for fast repeated calculations
   */
  constructor(charts: Chart[], stats: ProjectStats) {
    this.charts = new Map(charts.map(c => [c.chartId, c]));
    this.stats = stats;
  }

  /**
   * WHAT: Calculate all charts for given chart IDs
   * WHY: Batch calculation for report rendering
   * HOW: Map each ID to calculation, filter out null results
   * 
   * @param chartIds - Array of chart IDs to calculate
   * @returns Array of calculated chart results
   */
  public calculateAll(chartIds: string[]): ChartResult[] {
    return chartIds
      .map(id => this.calculateChart(id))
      .filter((result): result is ChartResult => result !== null);
  }

  /**
   * WHAT: Calculate single chart by ID
   * WHY: Individual chart calculation with error handling
   * HOW: Lookup chart config, evaluate formula, build result object
   * 
   * @param chartId - Chart ID to calculate
   * @returns Calculated result or null if failed
   */
  public calculateChart(chartId: string): ChartResult | null {
    const chart = this.charts.get(chartId);
    
    if (!chart) {
      console.warn(`[ReportCalculator] Chart not found: ${chartId}`);
      return null;
    }

    if (!chart.isActive) {
      return null;
    }

    try {
      // Calculate based on chart type
      switch (chart.type) {
        case 'kpi':
          return this.calculateKPI(chart);
        case 'pie':
        case 'bar':
          return this.calculateMultiElement(chart);
        case 'text':
          return this.calculateText(chart);
        case 'image':
          return this.calculateImage(chart);
        case 'value':
          return this.calculateValue(chart);
        default:
          console.warn(`[ReportCalculator] Unknown chart type: ${chart.type}`);
          return null;
      }
    } catch (error) {
      console.error(`[ReportCalculator] Failed to calculate ${chartId}:`, error);
      return {
        chartId: chart.chartId,
        type: chart.type,
        title: chart.title,
        icon: chart.icon,
        iconVariant: chart.iconVariant,
        error: error instanceof Error ? error.message : 'Calculation failed'
      };
    }
  }

  /**
   * WHAT: Calculate KPI chart (single numeric value)
   * WHY: KPI charts display one number prominently
   * HOW: Evaluate formula, return as kpiValue
   */
  private calculateKPI(chart: Chart): ChartResult {
    const value = this.evaluateFormula(chart.formula);
    
    return {
      chartId: chart.chartId,
      type: 'kpi',
      title: chart.title,
      icon: chart.icon,
      iconVariant: chart.iconVariant,
      kpiValue: typeof value === 'number' ? value : 'NA',
      formatting: chart.formatting,
      showTitle: chart.showTitle
    };
  }

  /**
   * WHAT: Calculate multi-element charts (pie, bar)
   * WHY: These charts have multiple labeled segments
   * HOW: Evaluate each element formula, build elements array
   */
  private calculateMultiElement(chart: Chart): ChartResult {
    const elements = (chart.elements || []).map(el => ({
      label: el.label,
      value: this.evaluateFormula(el.formula),
      color: el.color
    }));

    // Filter out invalid elements (non-numeric or negative)
    const validElements = elements.filter(el => 
      typeof el.value === 'number' && el.value >= 0
    );

    return {
      chartId: chart.chartId,
      type: chart.type,
      title: chart.title,
      icon: chart.icon,
      iconVariant: chart.iconVariant,
      elements: validElements,
      formatting: chart.formatting,
      showTitle: chart.showTitle
    };
  }

  /**
   * WHAT: Calculate text chart (string content)
   * WHY: Text charts display formatted text content
   * HOW: For simple variable references, access directly; otherwise evaluate formula
   */
  private calculateText(chart: Chart): ChartResult {
    // WHAT: Detect simple variable reference (e.g., "stats.reportText1" OR "reportText1")
    // WHY: Direct access preserves string values, bypasses numeric evaluation
    // HOW: Check if formula is stats.fieldName OR just fieldName pattern without operators
    const simpleVarMatch = chart.formula?.match(/^(?:stats\.)?([a-zA-Z0-9_]+)$/);
    
    let value: string | number | 'NA';
    
    if (simpleVarMatch) {
      // Direct access for simple variable references
      const fieldName = simpleVarMatch[1];
      const fieldValue = this.stats[fieldName];
      value = fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : 'NA';
    } else {
      // Complex formula evaluation
      value = this.evaluateFormula(chart.formula);
    }
    
    return {
      chartId: chart.chartId,
      type: 'text',
      title: chart.title,
      icon: chart.icon,
      iconVariant: chart.iconVariant,
      kpiValue: typeof value === 'string' && value !== 'NA' ? value : '',
      showTitle: chart.showTitle
    };
  }

  /**
   * WHAT: Calculate image chart (image URL)
   * WHY: Image charts display images with aspect ratio
   * HOW: For simple variable references, access directly; otherwise evaluate formula
   */
  private calculateImage(chart: Chart): ChartResult {
    // WHAT: Detect simple variable reference (e.g., "stats.reportImage1" OR "reportImage1")
    // WHY: Direct access preserves string values, bypasses numeric evaluation
    // HOW: Check if formula is stats.fieldName OR just fieldName pattern without operators
    const simpleVarMatch = chart.formula?.match(/^(?:stats\.)?([a-zA-Z0-9_]+)$/);
    
    let value: string | number | 'NA';
    
    if (simpleVarMatch) {
      // Direct access for simple variable references
      const fieldName = simpleVarMatch[1];
      const fieldValue = this.stats[fieldName];
      value = fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : 'NA';
    } else {
      // Complex formula evaluation
      value = this.evaluateFormula(chart.formula);
    }
    
    return {
      chartId: chart.chartId,
      type: 'image',
      title: chart.title,
      icon: chart.icon,
      iconVariant: chart.iconVariant,
      kpiValue: typeof value === 'string' && value !== 'NA' ? value : '',
      aspectRatio: chart.aspectRatio || '16:9',
      showTitle: chart.showTitle
    };
  }

  /**
   * WHAT: Calculate VALUE chart (composite KPI + BAR)
   * WHY: VALUE charts show both numeric value and breakdown
   * HOW: Return both kpiValue and elements
   * 
   * NOTE: VALUE charts are deprecated in new system but kept for backward compatibility
   */
  private calculateValue(chart: Chart): ChartResult {
    const kpiValue = this.evaluateFormula(chart.formula);
    
    const elements = (chart.elements || []).map(el => ({
      label: el.label,
      value: this.evaluateFormula(el.formula),
      color: el.color
    }));

    return {
      chartId: chart.chartId,
      type: 'value',
      title: chart.title,
      icon: chart.icon,
      iconVariant: chart.iconVariant,
      kpiValue: typeof kpiValue === 'number' ? kpiValue : 0,
      elements: elements.filter(el => typeof el.value === 'number' && el.value >= 0),
      formatting: chart.formatting,
      showTitle: chart.showTitle
    };
  }

  /**
   * WHAT: Evaluate formula string with current stats
   * WHY: Centralize formula evaluation with error handling
   * HOW: Use existing formulaEngine, catch and log errors
   * 
   * @param formula - Formula string (e.g., "stats.remoteFans + stats.stadium")
   * @returns Evaluated result (number or string) or 'NA' on error
   */
  private evaluateFormula(formula: string): number | string {
    // Safety check: handle null/undefined formulas
    if (!formula || typeof formula !== 'string') {
      console.warn(`[ReportCalculator] Invalid formula: ${formula}`);
      return 'NA';
    }
    
    try {
      return evaluateFormula(formula, this.stats as any);
    } catch (error) {
      console.error(`[ReportCalculator] Formula evaluation failed: ${formula}`, error);
      return 'NA';
    }
  }

  /**
   * WHAT: Check if chart has valid calculable data
   * WHY: Avoid rendering empty/NA charts
   * HOW: Type-specific validation rules
   * 
   * @param result - Calculated chart result
   * @returns True if chart should be displayed
   */
  public static hasValidData(result: ChartResult): boolean {
    // Charts with errors are not valid
    if (result.error) {
      return false;
    }

    // Type-specific validation
    switch (result.type) {
      case 'text':
        // Text valid if non-empty string
        return typeof result.kpiValue === 'string' && result.kpiValue.length > 0;

      case 'image':
        // Image valid if URL present
        return typeof result.kpiValue === 'string' && result.kpiValue.length > 0;

      case 'kpi':
        // KPI valid if not NA
        return result.kpiValue !== 'NA' && result.kpiValue !== undefined;

      case 'pie':
      case 'bar':
      case 'value':
        // Multi-element charts valid if at least one element with value > 0
        if (!result.elements || result.elements.length === 0) {
          return false;
        }
        const total = result.elements.reduce((sum, el) => {
          return sum + (typeof el.value === 'number' ? el.value : 0);
        }, 0);
        return total > 0;

      default:
        return false;
    }
  }

  /**
   * WHAT: Update stats data for recalculation
   * WHY: Allow calculator reuse with different data
   * HOW: Replace internal stats reference
   * 
   * @param newStats - New stats object
   */
  public updateStats(newStats: ProjectStats): void {
    this.stats = newStats;
  }

  /**
   * WHAT: Get chart configuration by ID
   * WHY: Access chart metadata without recalculation
   * 
   * @param chartId - Chart ID to lookup
   * @returns Chart configuration or undefined
   */
  public getChart(chartId: string): Chart | undefined {
    return this.charts.get(chartId);
  }

  /**
   * WHAT: Get all chart configurations
   * WHY: Access all loaded charts
   * 
   * @returns Array of all chart configurations
   */
  public getAllCharts(): Chart[] {
    return Array.from(this.charts.values());
  }
}
