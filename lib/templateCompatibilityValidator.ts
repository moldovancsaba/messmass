// lib/templateCompatibilityValidator.ts
// WHAT: Template compatibility validation utilities (A-R-12)
// WHY: Ensure templates are compatible with available data before rendering
// HOW: Validate chart configs, formulas, and data blocks

import type { ReportTemplate } from './reportTemplateTypes';
import type { Chart } from './report-calculator';
import type { ProjectStats } from './report-calculator';
import { extractVariablesFromFormula, validateStatsForFormula } from './formulaEngine';

/**
 * WHAT: Compatibility issue with type and details
 * WHY: Structured error information for display and debugging
 */
export interface CompatibilityIssue {
  type: 'MISSING_CHART_CONFIG' | 'MISSING_VARIABLE' | 'MISSING_DATA_BLOCK' | 'TYPE_MISMATCH';
  severity: 'error' | 'warning';
  message: string;
  context?: {
    chartId?: string;
    variableName?: string;
    blockId?: string;
    templateType?: string;
    entityType?: string;
    formula?: string;
  };
}

/**
 * WHAT: Template compatibility validation result
 * WHY: Structured result with issues list and compatibility status
 */
export interface CompatibilityResult {
  compatible: boolean;
  issues: CompatibilityIssue[];
  summary: {
    totalCharts: number;
    missingCharts: number;
    missingVariables: number;
    missingBlocks: number;
    typeMismatches: number;
  };
}

/**
 * WHAT: Validate that all chart IDs in template exist in chart configurations
 * WHY: Missing chart configs cause charts to be silently skipped
 * HOW: Check each chartId in template blocks against provided charts array
 */
function validateChartConfigs(
  template: ReportTemplate,
  charts: Chart[]
): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const chartIds = new Set(charts.map(c => c.chartId));

  // Extract all chart IDs from template data blocks
  const templateChartIds = new Set<string>();
  for (const block of template.dataBlocks || []) {
    // Note: Blocks are populated with charts array, but we validate against chartIds
    // This validation happens before charts are fetched, so we check chartIds from blocks
    // The actual chart configs are fetched separately and may not match
  }

  // For now, we validate after charts are fetched (in validateTemplateCompatibility)
  // This function is called with the actual chart IDs from blocks
  return issues;
}

/**
 * WHAT: Validate that all chart formulas reference variables available in stats
 * WHY: Missing variables cause charts to show 'NA' or incorrect values (0)
 * HOW: Extract variables from formulas, check against stats using validateStatsForFormula
 */
function validateChartFormulas(
  charts: Chart[],
  stats: ProjectStats
): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];

  for (const chart of charts) {
    // Validate main formula (for KPI, TEXT, IMAGE, TABLE charts)
    if (chart.formula) {
      const validation = validateStatsForFormula(chart.formula, stats);
      if (!validation.valid && validation.missingVariables.length > 0) {
        issues.push({
          type: 'MISSING_VARIABLE',
          severity: 'error',
          message: `Chart '${chart.chartId}' formula references missing variables: ${validation.missingVariables.join(', ')}`,
          context: {
            chartId: chart.chartId,
            variableName: validation.missingVariables[0],
            formula: chart.formula
          }
        });
      }
    }

    // Validate element formulas (for PIE, BAR charts)
    if (chart.elements) {
      for (const element of chart.elements) {
        if (element.formula) {
          const validation = validateStatsForFormula(element.formula, stats);
          if (!validation.valid && validation.missingVariables.length > 0) {
            issues.push({
              type: 'MISSING_VARIABLE',
              severity: 'error',
              message: `Chart '${chart.chartId}' element '${element.label}' references missing variables: ${validation.missingVariables.join(', ')}`,
              context: {
                chartId: chart.chartId,
                variableName: validation.missingVariables[0],
                formula: element.formula
              }
            });
          }
        }
      }
    }
  }

  return issues;
}

/**
 * WHAT: Validate that template type matches entity type (warning, not error)
 * WHY: Type mismatch may indicate incorrect template selection, but global templates work for both
 * HOW: Check template.type against entityType, warn if mismatch (except global)
 */
function validateTemplateType(
  template: ReportTemplate,
  entityType: 'project' | 'partner'
): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];

  // Global templates work for both project and partner
  if (template.type === 'global') {
    return issues;
  }

  // Check type compatibility
  if (entityType === 'project' && template.type !== 'event') {
    issues.push({
      type: 'TYPE_MISMATCH',
      severity: 'warning',
      message: `Template type '${template.type}' may not be intended for event reports`,
      context: {
        templateType: template.type,
        entityType: 'project'
      }
    });
  }

  if (entityType === 'partner' && template.type !== 'partner') {
    issues.push({
      type: 'TYPE_MISMATCH',
      severity: 'warning',
      message: `Template type '${template.type}' may not be intended for partner reports`,
      context: {
        templateType: template.type,
        entityType: 'partner'
      }
    });
  }

  return issues;
}

/**
 * WHAT: Validate that all chart IDs referenced in template blocks exist in chart configurations
 * WHY: Missing chart configs cause charts to be silently skipped
 * HOW: Compare chart IDs from template blocks against provided charts array
 */
function validateTemplateChartIds(
  template: ReportTemplate,
  charts: Chart[],
  blockChartIds: string[] // Chart IDs from populated blocks
): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const availableChartIds = new Set(charts.map(c => c.chartId));

  // Check each chart ID from template blocks
  for (const chartId of blockChartIds) {
    if (!availableChartIds.has(chartId)) {
      issues.push({
        type: 'MISSING_CHART_CONFIG',
        severity: 'error',
        message: `Chart configuration not found: ${chartId}`,
        context: {
          chartId
        }
      });
    }
  }

  return issues;
}

/**
 * WHAT: Validate template compatibility with available data
 * WHY: Ensure template can render correctly with available charts and stats
 * HOW: Check chart configs, formulas, and template type
 * 
 * @param template - Resolved report template
 * @param charts - Available chart configurations
 * @param stats - Available project statistics
 * @param entityType - Entity type ('project' or 'partner')
 * @param blockChartIds - Chart IDs from populated template blocks
 * @returns Compatibility validation result
 */
export function validateTemplateCompatibility(
  template: ReportTemplate,
  charts: Chart[],
  stats: ProjectStats,
  entityType: 'project' | 'partner',
  blockChartIds: string[]
): CompatibilityResult {
  const issues: CompatibilityIssue[] = [];

  // Validate chart configs exist
  const chartConfigIssues = validateTemplateChartIds(template, charts, blockChartIds);
  issues.push(...chartConfigIssues);

  // Validate chart formulas reference available variables
  const formulaIssues = validateChartFormulas(charts, stats);
  issues.push(...formulaIssues);

  // Validate template type (warning only)
  const typeIssues = validateTemplateType(template, entityType);
  issues.push(...typeIssues);

  // Calculate summary
  const summary = {
    totalCharts: blockChartIds.length,
    missingCharts: issues.filter(i => i.type === 'MISSING_CHART_CONFIG').length,
    missingVariables: issues.filter(i => i.type === 'MISSING_VARIABLE').length,
    missingBlocks: issues.filter(i => i.type === 'MISSING_DATA_BLOCK').length,
    typeMismatches: issues.filter(i => i.type === 'TYPE_MISMATCH').length
  };

  // Template is compatible if no errors (warnings are OK)
  const compatible = issues.filter(i => i.severity === 'error').length === 0;

  return {
    compatible,
    issues,
    summary
  };
}

/**
 * WHAT: Format compatibility issue for user display
 * WHY: Provide clear, actionable error messages
 */
export function formatCompatibilityIssue(issue: CompatibilityIssue): string {
  const { type, message, context } = issue;

  switch (type) {
    case 'MISSING_CHART_CONFIG':
      return context?.chartId
        ? `Chart '${context.chartId}' configuration not found`
        : 'Chart configuration not found';
    
    case 'MISSING_VARIABLE':
      return context?.chartId && context?.variableName
        ? `Chart '${context.chartId}' requires variable '${context.variableName}' which is not available`
        : message;
    
    case 'MISSING_DATA_BLOCK':
      return context?.blockId
        ? `Data block '${context.blockId}' not found`
        : 'Data block not found';
    
    case 'TYPE_MISMATCH':
      return message;
    
    default:
      return message;
  }
}
