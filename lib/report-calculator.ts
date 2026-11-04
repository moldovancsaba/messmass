// WHAT: Unified Report Calculation Engine (v12.0.0)
// WHY: Single source of truth for all chart calculations - replaces 5+ scattered calculation files
// HOW: Class-based calculator with formula evaluation, type checking, and error handling

import { evaluateFormula } from './formulaEngine';
import type { ChartError } from './chartErrorTypes';
import { createChartError, getUserFriendlyErrorMessage } from './chartErrorTypes';
import type { ContentAsset } from './contentAssetTypes';
import type { ChartConfiguration } from './chartConfigTypes';
import { ensureDerivedMetrics } from './dataValidator';
import { isContentSlot, resolveContentSlot } from './contentSlots';

/**
 * WHAT: Chart configuration from database
 * WHY: Type-safe interface for chart data
 */
export interface Chart {
  chartId: string;
  title: string;
  type: 'kpi' | 'pie' | 'bar' | 'text' | 'image' | 'value' | 'table' | 'valuechain';
  formula: string;
  icon?: string; // Optional - not all charts have icons
  iconVariant?: 'outlined' | 'rounded'; // Material Icons variant
  isActive: boolean;
  order: number;
  elements?: Array<{
    id?: string;
    label: string;
    formula: string;
    color?: string;
    formatting?: {
      rounded?: boolean;
      prefix?: string;
      suffix?: string;
    };
    type?: string;
    parameters?: Record<string, any>;
    manualData?: Record<string, any>;
  }>;
  formatting?: {
    rounded?: boolean; // true = whole numbers (0 decimals), false = 2 decimals
    prefix?: string;
    suffix?: string;
  };
  aspectRatio?: '16:9' | '9:16' | '1:1';
  showTitle?: boolean; // Controls whether title/subtitle appear in rendered chart
  showPercentages?: boolean; // Controls whether pie charts show percentages in legend (v11.38.0)
  preset?: 'standard' | 'compact' | 'hero' | 'callout'; // Markdown rendering preset (v12.2.0, Issue #48)
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
  subtitle?: string;
  totalLabel?: string;
  icon?: string; // Optional - not all charts have icons
  iconVariant?: 'outlined' | 'rounded'; // Material Icons variant
  kpiValue?: number | string;
  elements?: Array<{
    id?: string;
    label: string;
    value: number | string;
    color?: string;
    formatting?: {
      rounded?: boolean;
      prefix?: string;
      suffix?: string;
    };
    type?: string;
  }>;
  total?: number | 'NA';
  formatting?: Chart['formatting'];
  aspectRatio?: Chart['aspectRatio'];
  showTitle?: boolean; // Controls whether title/subtitle appear in rendered chart
  showPercentages?: boolean; // Controls whether pie charts show percentages in legend (v11.38.0)
  error?: string; // Legacy error field for backward compatibility
  preset?: Chart['preset']; // Markdown rendering preset (v12.2.0, Issue #48)
  /** A-R-11: Structured error information with type and context */
  chartError?: ChartError;
  hasErrors?: boolean;
}

/**
 * Normalizes Chart or ChartConfiguration into standard Chart interface
 */
export function normalizeToChart(input: Chart | ChartConfiguration): Chart {
  const chartId = (input as Chart).chartId || (input as any).id || 'chart';
  const elements = (input.elements || []).map((el: any) => ({
    id: el.id,
    label: el.label,
    formula: el.formula,
    color: el.color,
    formatting: el.formatting,
    parameters: el.parameters,
    manualData: el.manualData,
    type: el.type
  }));

  return {
    chartId,
    title: input.title,
    type: input.type as Chart['type'],
    formula: (input as Chart).formula || (elements[0]?.formula ?? ''),
    icon: input.icon,
    iconVariant: input.iconVariant,
    isActive: input.isActive ?? true,
    order: (input as any).order ?? 0,
    elements,
    formatting: (input as any).formatting,
    aspectRatio: (input as any).aspectRatio,
    showTitle: (input as any).showTitle,
    showPercentages: (input as any).showPercentages,
    preset: (input as any).preset
  };
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
  private contentAssets: ContentAsset[];

  /**
   * WHAT: Initialize calculator with chart configurations and project stats
   * WHY: Pre-load data for fast repeated calculations
   */
  constructor(charts: Chart[], stats: ProjectStats, contentAssets?: ContentAsset[]) {
    this.charts = new Map(charts.map(c => [c.chartId, c]));
    this.stats = ensureDerivedMetrics(stats as any) as ProjectStats;
    this.contentAssets = contentAssets || [];
  }

  /**
   * WHAT: Calculate a single chart directly (Unified Adapter for admin previews and standalone runs)
   * WHY: Replaces separate lib/chartCalculator.ts with zero drift
   */
  public static calculateSingleChart(
    chart: Chart | ChartConfiguration,
    stats: Partial<ProjectStats> | Record<string, any>,
    contentAssets?: ContentAsset[],
    parameters?: Record<string, number>,
    manualData?: Record<string, number>
  ): ChartResult {
    const normalized = normalizeToChart(chart);
    const calculator = new ReportCalculator([normalized], stats as ProjectStats, contentAssets);
    const result = calculator.calculateChart(normalized.chartId);
    if (!result) {
      return {
        chartId: normalized.chartId,
        type: normalized.type,
        title: normalized.title,
        error: 'Chart calculation failed'
      };
    }
    return result;
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
      return {
        chartId,
        type: 'kpi' as const, // Default type for error case
        title: `Chart ${chartId}`,
        chartError: createChartError(
          'MISSING_CHART_CONFIG',
          `Chart configuration not found: ${chartId}`,
          { chartId }
        )
      };
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
        case 'valuechain':
          return this.calculateValueChain(chart);
        case 'image':
          return this.calculateImage(chart);
        case 'table':
          return this.calculateTable(chart);
        case 'value':
          return this.calculateValue(chart);
        default:
          console.warn(`[ReportCalculator] Unknown chart type: ${chart.type}`);
          return {
            chartId: chart.chartId,
            type: chart.type,
            title: chart.title,
            icon: chart.icon,
            iconVariant: chart.iconVariant,
            chartError: createChartError(
              'INVALID_CHART_TYPE',
              `Unknown chart type: ${chart.type}`,
              { chartId: chart.chartId, chartType: chart.type }
            )
          };
      }
    } catch (error) {
      console.error(`[ReportCalculator] Failed to calculate ${chartId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Calculation failed';
      return {
        chartId: chart.chartId,
        type: chart.type,
        title: chart.title,
        icon: chart.icon,
        iconVariant: chart.iconVariant,
        chartError: createChartError(
          'CALCULATION_ERROR',
          errorMessage,
          { chartId: chart.chartId, chartType: chart.type }
        ) as ChartError
      };
    }
  }

  /**
   * WHAT: Calculate KPI chart (single numeric value)
   * WHY: KPI charts display one number prominently
   * HOW: Evaluate formula, return as kpiValue
   * 
   * SPECIAL CASE: If suffix is "%" and formula is a sum of variables, calculate average instead
   * WHY: Percentage values should be averaged, not summed (e.g., 50% + 50% = 50%, not 100%)
   */
  private calculateKPI(chart: Chart): ChartResult {
    // WHAT: Check if this is a percentage KPI that should use average calculation
    // WHY: Summing percentages gives incorrect results (e.g., 50% + 50% = 100% should be 50%)
    // HOW: Detect if suffix is "%" and formula is a simple sum of variables
    // NOTE: Some KPI charts use elements[0].formula instead of chart.formula
    const isPercentage = chart.formatting?.suffix === '%';
    let value: number | 'NA' = 'NA';
    
    // WHAT: Get formula from chart.formula or elements[0].formula
    // WHY: Some KPI charts store formula in elements array
    // HOW: Prefer chart.formula, fallback to first element's formula
    const formula = chart.formula || (chart.elements && chart.elements.length > 0 ? chart.elements[0].formula : null);
    
    if (!formula) {
      return {
        chartId: chart.chartId,
        type: 'kpi',
        title: chart.title,
        icon: chart.icon,
        iconVariant: chart.iconVariant,
        kpiValue: 'NA',
        formatting: chart.formatting,
        showTitle: chart.showTitle
      };
    }
    
    if (isPercentage) {
      // WHAT: Try to detect if formula is a sum of variables (e.g., [var1] + [var2] OR var1 + var2)
      // WHY: For percentage KPIs, we want the average of the percentages, not the sum
      // HOW: Check if formula contains only variable references and addition operators
      const trimmedFormula = formula.trim();
      
      // WHAT: Check if formula contains only additions (no -, *, /, etc.)
      // WHY: Only simple sums should use average calculation, complex formulas should work as-is
      // PATTERN: Must contain + operator and no other arithmetic operators (except +)
      const hasOnlyAdditions = trimmedFormula.includes('+') && 
                               !trimmedFormula.match(/[-*/()]/) &&
                               /^[\s\[\]a-zA-Z0-9_.:+\-]+$/.test(trimmedFormula);
      
      if (hasOnlyAdditions) {
        // WHAT: Extract all variable references from the formula
        // WHY: Need to evaluate each variable separately to calculate average
        // HOW: Handle both bracketed format [var1] and non-bracketed format var1
        const variables: string[] = [];
        
        // First, try to extract from bracketed format: [var1]
        const bracketRegex = /\[([^\]]+)\]/g;
        let match;
        while ((match = bracketRegex.exec(trimmedFormula)) !== null) {
          variables.push(match[1]);
        }
        
        // If no bracketed variables found, try non-bracketed format: var1
        if (variables.length === 0) {
          // Split by + and extract variable names
          const parts = trimmedFormula.split('+').map(p => p.trim()).filter(p => p.length > 0);
          for (const part of parts) {
            // Remove any leading/trailing whitespace and extract variable name
            // Handle varName format (no prefix)
            const varMatch = part.match(/^([a-zA-Z][a-zA-Z0-9_]*)$/);
            if (varMatch) {
              variables.push(varMatch[1]);
            }
          }
        }
        
        if (variables.length > 0) {
          // WHAT: Evaluate each variable and calculate average
          // WHY: Average of percentages is the correct metric (e.g., (50% + 50% + 50%) / 3 = 50%)
          // HOW: Evaluate each variable, filter out invalid values, calculate mean
          const values: number[] = [];
          for (const variable of variables) {
            // WHAT: Create a formula with just this variable to evaluate it
            // WHY: Need individual values to calculate average
            // HOW: Try bracketed format first, fallback to direct variable access
            let varValue: number | 'NA' = 'NA';
            
            // Try bracketed format: [varName]
            const bracketFormula = `[${variable}]`;
            const evalResult = this.evaluateFormula(bracketFormula);
            
            // Handle evaluateFormula return type (string | number | 'NA')
            if (typeof evalResult === 'number' && !isNaN(evalResult)) {
              varValue = evalResult;
            } else {
              // If that fails, try direct variable access from stats
              // Extract field name (no prefix)
              const fieldName = variable;
              // Try direct access
              const directValue = (this.stats as any)[fieldName];
              if (typeof directValue === 'number' && !isNaN(directValue)) {
                varValue = directValue;
              } else {
                varValue = 'NA';
              }
            }
            
            if (typeof varValue === 'number' && !isNaN(varValue)) {
              values.push(varValue);
            }
          }
          
          if (values.length > 0) {
            // WHAT: Calculate average of all percentage values
            // WHY: Average is the correct metric for percentage summaries
            const sum = values.reduce((acc, val) => acc + val, 0);
            value = sum / values.length;
          } else {
            // WHAT: Fallback to normal evaluation if no valid values
            // WHY: Graceful degradation if variable extraction fails
            const evalResult = this.evaluateFormula(formula);
            value = typeof evalResult === 'number' ? evalResult : 'NA';
          }
        } else {
          // WHAT: Fallback to normal evaluation if no variables found
          // WHY: Formula might be more complex than simple sum
          const evalResult = this.evaluateFormula(formula);
          value = typeof evalResult === 'number' ? evalResult : 'NA';
        }
      } else {
        // WHAT: Formula is not a simple sum, use normal evaluation
        // WHY: Complex formulas (with division, multiplication, etc.) should work as-is
        const evalResult = this.evaluateFormula(formula);
        value = typeof evalResult === 'number' ? evalResult : 'NA';
      }
    } else {
      // WHAT: Not a percentage KPI, use normal evaluation
      // WHY: Sum calculation is correct for non-percentage values
      const evalResult = this.evaluateFormula(formula);
      value = typeof evalResult === 'number' ? evalResult : 'NA';
    }
    
    return {
      chartId: chart.chartId,
      type: 'kpi',
      title: chart.title,
      icon: chart.icon,
      iconVariant: chart.iconVariant,
      kpiValue: typeof value === 'number' ? value : 'NA',
      formatting: chart.formatting,
      showTitle: chart.showTitle,
      preset: chart.preset
    };
  }

  /**
   * Helper to resolve dynamic label replacement (e.g., {{stats.bitlyCountry1}})
   */
  private resolveDynamicLabel(rawLabel: string): string {
    if (!rawLabel || !rawLabel.includes('{{') || !rawLabel.includes('}}')) {
      return rawLabel || '';
    }
    const fieldMatch = rawLabel.match(/\{\{([^}]+)\}\}/);
    if (fieldMatch && fieldMatch[1]) {
      let fieldName = fieldMatch[1].trim();
      if (fieldName.startsWith('stats.')) {
        fieldName = fieldName.substring(6);
      }
      const fieldValue = (this.stats as any)[fieldName];
      if (fieldValue !== undefined && fieldValue !== null) {
        return rawLabel.replace(/\{\{[^}]+\}\}/, String(fieldValue));
      } else {
        return rawLabel.replace(/\{\{[^}]+\}\}/, 'N/A');
      }
    }
    return rawLabel;
  }

  /**
   * WHAT: Calculate multi-element charts (pie, bar)
   * WHY: These charts have multiple labeled segments
   * HOW: Evaluate each element formula, build elements array
   */
  private calculateMultiElement(chart: Chart): ChartResult {
    const elements = (chart.elements || [])
      .filter(el => el.formula) // WHAT: Skip elements without formulas
      .map(el => {
        const paramValues: Record<string, number> | undefined = (el as any).parameters
          ? Object.fromEntries(
              Object.entries((el as any).parameters).map(([k, v]) => [k, (v as any)?.value ?? 0])
            )
          : undefined;
        const manualValues: Record<string, number> | undefined = (el as any).manualData;

        return {
          id: (el as any).id,
          label: this.resolveDynamicLabel(el.label),
          value: this.evaluateFormula(el.formula!, paramValues, manualValues),
          color: el.color,
          formatting: (el as any).formatting,
          type: (el as any).type
        };
      });

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
      showTitle: chart.showTitle,
      showPercentages: chart.showPercentages,
      preset: chart.preset
    };
  }

  /**
   * WHAT: Calculate text chart (string content)
   * WHY: Text charts display formatted text content
   * HOW: For simple variable references, access directly; for plain text, return as-is; otherwise evaluate formula
   */
  private calculateText(chart: Chart): ChartResult {
    const formulaToEvaluate = chart.formula || (chart.elements && chart.elements.length > 0 ? chart.elements[0].formula : '');
    if (!formulaToEvaluate) {
      return {
        chartId: chart.chartId,
        type: 'text',
        title: chart.title,
        icon: chart.icon,
        iconVariant: chart.iconVariant,
        kpiValue: '',
        showTitle: chart.showTitle
      };
    }
    
    // Stage 1: Content slot fast path
    if (isContentSlot(formulaToEvaluate)) {
      const slotVal = resolveContentSlot(formulaToEvaluate, this.stats, this.contentAssets);
      return {
        chartId: chart.chartId,
        type: 'text',
        title: chart.title,
        icon: chart.icon,
        iconVariant: chart.iconVariant,
        kpiValue: slotVal !== 'NA' ? slotVal : '',
        showTitle: chart.showTitle,
        preset: chart.preset
      };
    }

    const bracketMatch = formulaToEvaluate.match(/^\[([a-zA-Z0-9_.-]+)\]$/);
    const simpleVarMatch = formulaToEvaluate.match(/^(?:stats\.)?([a-zA-Z0-9_]+)$/);
    
    const hasOperators = /[+\-*/()]/.test(formulaToEvaluate);
    const hasBrackets = /\[|\]/.test(formulaToEvaluate);
    const isPlainText = !hasOperators && !hasBrackets && !bracketMatch && !simpleVarMatch;
    
    let value: string | number | 'NA';
    
    if (bracketMatch) {
      const fieldName = bracketMatch[1].startsWith('stats.') ? bracketMatch[1].substring(6) : bracketMatch[1];
      const fieldValue = (this.stats as any)[fieldName];
      value = fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : '';
    } else if (simpleVarMatch) {
      const fieldName = simpleVarMatch[1];
      const fieldValue = (this.stats as any)[fieldName];
      value = fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : '';
    } else if (isPlainText) {
      value = formulaToEvaluate;
    } else {
      value = this.evaluateFormula(formulaToEvaluate);
    }
    
    return {
      chartId: chart.chartId,
      type: 'text',
      title: chart.title,
      icon: chart.icon,
      iconVariant: chart.iconVariant,
      kpiValue: typeof value === 'string' && value !== 'NA' ? value : (typeof value === 'number' ? String(value) : ''),
      showTitle: chart.showTitle,
      preset: chart.preset
    };
  }

  /**
   * WHAT: Calculate valuechain chart (icon + 2 text fields: title/highlight + description)
   * WHY: Landing value chain cards need icon, title line, and description line from stats
   * HOW: Resolve each of the first 2 elements' formulas as strings (same as text chart)
   */
  private calculateValueChain(chart: Chart): ChartResult {
    const elements = (chart.elements || []).slice(0, 2).map((el, i) => {
      const formula = el.formula?.trim() || '';
      let value: string = '';

      if (isContentSlot(formula)) {
        const slotVal = resolveContentSlot(formula, this.stats, this.contentAssets);
        value = slotVal !== 'NA' ? slotVal : '';
      } else {
        const bracketMatch = formula.match(/^\[([a-zA-Z0-9_.-]+)\]$/);
        const simpleVarMatch = formula.match(/^(?:stats\.)?([a-zA-Z0-9_]+)$/);
        if (bracketMatch) {
          const fieldName = bracketMatch[1].startsWith('stats.') ? bracketMatch[1].substring(6) : bracketMatch[1];
          const v = (this.stats as any)[fieldName];
          value = v !== undefined && v !== null ? String(v) : '';
        } else if (simpleVarMatch) {
          const fieldName = simpleVarMatch[1];
          const v = (this.stats as any)[fieldName];
          value = v !== undefined && v !== null ? String(v) : '';
        } else if (formula) {
          const res = this.evaluateFormula(formula);
          value = res !== 'NA' ? String(res) : '';
        }
      }

      return {
        id: (el as any).id,
        label: el.label || '',
        value,
        color: el.color
      };
    });

    return {
      chartId: chart.chartId,
      type: 'valuechain',
      title: chart.title,
      icon: chart.icon,
      iconVariant: chart.iconVariant,
      elements,
      showTitle: chart.showTitle,
      preset: chart.preset
    };
  }

  /**
   * WHAT: Calculate table chart (markdown table content)
   * WHY: Table charts display markdown tables with styling
   * HOW: For simple variable references, access directly; otherwise evaluate formula
   */
  private calculateTable(chart: Chart): ChartResult {
    const formulaToEvaluate = chart.formula || (chart.elements && chart.elements.length > 0 ? chart.elements[0].formula : '');
    if (!formulaToEvaluate) {
      return {
        chartId: chart.chartId,
        type: 'table',
        title: chart.title,
        icon: chart.icon,
        iconVariant: chart.iconVariant,
        kpiValue: '',
        showTitle: chart.showTitle
      };
    }
    
    if (isContentSlot(formulaToEvaluate)) {
      const slotVal = resolveContentSlot(formulaToEvaluate, this.stats, this.contentAssets);
      return {
        chartId: chart.chartId,
        type: 'table',
        title: chart.title,
        icon: chart.icon,
        iconVariant: chart.iconVariant,
        kpiValue: slotVal !== 'NA' ? slotVal : '',
        showTitle: chart.showTitle,
        preset: chart.preset
      };
    }

    const bracketMatch = formulaToEvaluate.match(/^\[([a-zA-Z0-9_.-]+)\]$/);
    const simpleVarMatch = formulaToEvaluate.match(/^(?:stats\.)?([a-zA-Z0-9_]+)$/);
    
    let value: string | number | 'NA';
    
    if (bracketMatch) {
      const fieldName = bracketMatch[1].startsWith('stats.') ? bracketMatch[1].substring(6) : bracketMatch[1];
      const fieldValue = (this.stats as any)[fieldName];
      value = fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : '';
    } else if (simpleVarMatch) {
      const fieldName = simpleVarMatch[1];
      const fieldValue = (this.stats as any)[fieldName];
      value = fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : '';
    } else {
      value = this.evaluateFormula(formulaToEvaluate);
    }
    
    return {
      chartId: chart.chartId,
      type: 'table',
      title: chart.title,
      icon: chart.icon,
      iconVariant: chart.iconVariant,
      kpiValue: typeof value === 'string' && value !== 'NA' ? value : '',
      showTitle: chart.showTitle,
      preset: chart.preset
    };
  }

  /**
   * WHAT: Calculate image chart (image URL)
   * WHY: Image charts display images with aspect ratio
   * HOW: For simple variable references, access directly; otherwise evaluate formula
   */
  private calculateImage(chart: Chart): ChartResult {
    const formulaToEvaluate = chart.formula || (chart.elements && chart.elements.length > 0 ? chart.elements[0].formula : '');
    
    if (isContentSlot(formulaToEvaluate)) {
      const slotVal = resolveContentSlot(formulaToEvaluate, this.stats, this.contentAssets);
      return {
        chartId: chart.chartId,
        type: 'image',
        title: chart.title,
        icon: chart.icon,
        iconVariant: chart.iconVariant,
        kpiValue: slotVal !== 'NA' ? slotVal : '',
        aspectRatio: chart.aspectRatio || '16:9',
        showTitle: chart.showTitle,
        preset: chart.preset
      };
    }

    const bracketMatch = formulaToEvaluate?.match(/^\[([a-zA-Z0-9_.-]+)\]$/);
    const simpleVarMatch = formulaToEvaluate?.match(/^(?:stats\.)?([a-zA-Z0-9_]+)$/);
    
    let value: string | number | 'NA';
    
    if (bracketMatch) {
      const fieldName = bracketMatch[1].startsWith('stats.') ? bracketMatch[1].substring(6) : bracketMatch[1];
      const fieldValue = (this.stats as any)[fieldName];
      value = fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : '';
    } else if (simpleVarMatch) {
      const fieldName = simpleVarMatch[1];
      const fieldValue = (this.stats as any)[fieldName];
      value = fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : '';
    } else {
      value = this.evaluateFormula(formulaToEvaluate);
    }
    
    return {
      chartId: chart.chartId,
      type: 'image',
      title: chart.title,
      icon: chart.icon,
      iconVariant: chart.iconVariant,
      kpiValue: typeof value === 'string' && value !== 'NA' ? value : '',
      aspectRatio: chart.aspectRatio || '16:9',
      showTitle: chart.showTitle,
      preset: chart.preset
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
      id: (el as any).id,
      label: this.resolveDynamicLabel(el.label),
      value: this.evaluateFormula(el.formula),
      color: el.color,
      formatting: (el as any).formatting,
      type: (el as any).type
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
      showTitle: chart.showTitle,
      preset: chart.preset
    };
  }

  /**
   * WHAT: Evaluate formula string with current stats
   * WHY: Centralize formula evaluation with error handling
   * HOW: Use existing formulaEngine, catch and log errors
   * 
   * @param formula - Formula string (e.g., "stats.remoteFans + stats.stadium")
   * @param parameters - Optional parameters for [PARAM:x] tokens
   * @param manualData - Optional manual data for [MANUAL:x] tokens
   * @returns Evaluated result (number or string) or 'NA' on error
   */
  private evaluateFormula(
    formula: string,
    parameters?: Record<string, number>,
    manualData?: Record<string, number>
  ): number | string {
    // Safety check: handle null/undefined formulas
    if (!formula || typeof formula !== 'string') {
      console.warn(`[ReportCalculator] Invalid formula: ${formula}`);
      return 'NA';
    }
    
    try {
      const result = evaluateFormula(formula, this.stats as any, parameters, manualData, this.contentAssets);
      // WHAT: Debug logging for complex formulas with division
      // WHY: Help diagnose why formulas like ([marketingOptin]+1)/([uniqueUsers]+1)*100 fail
      if (formula.includes('/') && formula.includes('(') && (result === 'NA' || result === null || result === undefined)) {
        console.warn(`[ReportCalculator] Complex formula returned NA: "${formula}"`, {
          result,
          resultType: typeof result,
          statsSample: {
            marketingOptin: (this.stats as any).marketingOptin,
            uniqueUsers: (this.stats as any).uniqueUsers
          }
        });
      }
      return result;
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
    // A-R-11: Charts with errors are not valid (but errors are now displayed, not hidden)
    if (result.chartError || result.error) {
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

      case 'table':
        // Table valid if non-empty string (markdown table content)
        return typeof result.kpiValue === 'string' && result.kpiValue.length > 0;

      case 'kpi':
        // KPI valid if not NA (0 is valid)
        return result.kpiValue !== undefined && result.kpiValue !== null && result.kpiValue !== 'NA';

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

/**
 * WHAT: Calculate all active charts for an array of configurations
 * WHY: Drop-in replacement for calculateActiveCharts in lib/chartCalculator.ts
 */
export function calculateActiveCharts(
  configurations: (Chart | ChartConfiguration)[],
  stats: Partial<ProjectStats> | Record<string, any>
): (ChartResult & { hasErrors: boolean })[] {
  const activeConfigurations = configurations.filter(config => {
    const configWithActive = config as any;
    if (configWithActive.active !== undefined) return configWithActive.active === true;
    if (config.isActive !== undefined) return config.isActive === true;
    return true;
  });

  return activeConfigurations.map(config => {
    const res = ReportCalculator.calculateSingleChart(config, stats);
    const hasErrors = !!(
      res.chartError ||
      res.error ||
      (res.elements && res.elements.some(e => e.value === 'NA')) ||
      res.total === 'NA' ||
      res.kpiValue === 'NA'
    );
    return {
      elements: [],
      ...res,
      hasErrors
    };
  });
}
