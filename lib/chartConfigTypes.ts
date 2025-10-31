// lib/chartConfigTypes.ts - Chart configuration types and schemas
// This module defines all TypeScript interfaces and validation schemas for the Chart Algorithm Manager

/**
 * Chart configuration element for PieChart (always 2 elements), HorizontalBar (always 5 elements), or KPI (1 element)
 * Each element represents a segment/bar with its label, formula, and color
 * For KPI charts, only one element is used with the main calculation formula
 */
export interface ChartValueFormatting {
  /**
   * WHAT: Formatting controls for numeric values
   * WHY: Replace hardcoded type-based formatting with flexible prefix/suffix + rounding
   */
  rounded: boolean; // true = whole numbers, false = 2 decimals
  prefix?: string;  // e.g., "€", "$", "£"
  suffix?: string;  // e.g., "%", " pts"
}

export interface ChartElement {
  id: string; // Unique identifier for this element
  label: string; // Display label (e.g., "Female", "CPM", "Jersey")
  formula: string; // Mathematical formula using variables (e.g., "[FEMALE]", "[INDOOR] + [OUTDOOR]")
  color: string; // Hex color code (e.g., "#ff6b9d")
  
  /**
   * WHAT: Legacy value type for formatting (currency/percentage/number)
   * WHY: Backward compatibility during migration to flexible formatting
   * NOTE: Deprecated in favor of `formatting`
   */
  type?: 'currency' | 'percentage' | 'number';
  
  /**
   * WHAT: New flexible formatting configuration
   * WHY: Supports custom prefix/suffix and rounding per element
   */
  formatting?: ChartValueFormatting;

  // WHY: Enables proper display formatting without hardcoding currency detection logic
  description?: string; // Optional description for documentation
  
  // WHAT: Optional per-element parameters used by the formula via [PARAM:key] tokens
  // WHY: Allows marketing multipliers and configurable values to be tuned without hardcoding numbers in formulas
  parameters?: {
    [key: string]: {
      value: number; // Numeric value used during evaluation
      label: string; // Human-readable name for the parameter
      description: string; // Context on how/why this parameter is used
      unit?: string; // Optional unit, e.g., "EUR", "%", "count", "multiplier"
    }
  };
  
  // WHAT: Optional manually computed data used by the formula via [MANUAL:key] tokens
  // WHY: Enables aggregated analytics (e.g., hashtag seasonality, partner benchmarks) without storing in stats
  manualData?: {
    [key: string]: number; // Simple key-value map for aggregated data points
  };
}

/**
 * Complete chart configuration document structure for MongoDB
 * Supports PieChart (2 elements), HorizontalBar (5 elements), and KPI (1 element) types
 */
export interface ChartConfiguration {
  _id?: string; // MongoDB ObjectId (optional for new documents)
  chartId: string; // Unique identifier for the chart (e.g., "gender-distribution", "merchandise-sales")
  title: string; // Display title (e.g., "Gender Distribution", "Merchandise Sales")
  type: 'pie' | 'bar' | 'kpi' | 'text' | 'image' | 'value'; // WHAT: Added 'value' type (KPI + BAR combined)
  // WHY: text displays reportText* variables as formatted text blocks, image shows reportImage* URLs as full-width images
  order: number; // Display order in admin grid (1, 2, 3, etc.)
  isActive: boolean; // Whether this chart is currently enabled/visible
  elements: ChartElement[]; // Array of chart elements (2 for pie, 5 for bar/value, 1 for kpi/text/image)
  
  // VALUE TYPE ONLY: Dual formatting configs
  /** WHAT: Formatting for KPI total area (VALUE charts) */
  kpiFormatting?: ChartValueFormatting;
  /** WHAT: Unified formatting for all bars (VALUE charts) */
  barFormatting?: ChartValueFormatting;
  
  // Metadata fields with ISO 8601 millisecond precision
  createdAt: string; // ISO 8601: "2025-08-18T10:18:40.123Z"
  updatedAt: string; // ISO 8601: "2025-08-18T10:18:40.123Z"
  createdBy?: string; // Admin user ID who created this configuration
  lastModifiedBy?: string; // Admin user ID who last modified this configuration
  
  // Optional configuration properties
  emoji?: string; // Chart center emoji for pie charts (e.g., "👥", "📍", "🌐")
  subtitle?: string; // Optional subtitle/description
  showTotal?: boolean; // Whether to show total value above bars
  totalLabel?: string; // Custom label for total (e.g., "possible merch sales", "Advertisement Value")
}

/**
 * DYNAMIC VARIABLE SYSTEM - KYC as Single Source of Truth
 * 
 * WHAT: Variables are stored in MongoDB variables_metadata collection (92 variables)
 * WHY: Enable dynamic variable creation without code changes, support white-label customization
 * HOW: Chart system fetches variables from /api/variables-config (KYC system)
 * 
 * BREAKING CHANGE v7.0.0:
 * - Removed hardcoded AVAILABLE_VARIABLES array (was only 37 variables)
 * - All variables now fetched dynamically from KYC/variables_metadata (92 variables)
 * - Chart Configurator loads variables via API, not code imports
 */

/**
 * Available variable interface - matches KYC variable structure
 * Each variable corresponds to a field in variables_metadata collection
 */
export interface AvailableVariable {
  name: string; // Full database path: "stats.female", "stats.remoteImages", "hashtags"
  label: string; // Display label (can be customized via KYC alias)
  displayName?: string; // Backward compatibility - use label instead
  category: string; // Category for organization ("Images", "Demographics", "Bitly", etc.)
  type: 'count' | 'percentage' | 'currency' | 'numeric' | 'text' | 'boolean' | 'date';
  description?: string; // Detailed description
  unit?: string; // "€", "%", "clicks"
  derived?: boolean; // True for computed fields (totalFans, allImages)
  formula?: string; // For derived variables
  exampleUsage?: string; // Example formula using this variable
  flags?: {
    visibleInClicker: boolean;
    editableInManual: boolean;
  };
  isSystem?: boolean; // True for schema fields, false for custom
  order?: number; // Sort order within category
  alias?: string; // User-defined display alias for white-labeling
}

/**
 * DEPRECATED: Use fetchAvailableVariables() from formulaEngine.ts
 * 
 * This constant is kept for backward compatibility only.
 * All new code MUST fetch variables dynamically from KYC system.
 * 
 * @deprecated Use `await fetchAvailableVariables()` instead
 */
export const AVAILABLE_VARIABLES: AvailableVariable[] = [];

/**
 * RULE: Chart system MUST fetch variables from KYC
 * 
 * Correct usage in Chart Configurator:
 * ```typescript
 * const response = await fetch('/api/variables-config');
 * const { variables } = await response.json();
 * // Use `variables` array for variable picker dropdown
 * ```
 * 
 * Correct usage in formula validation:
 * ```typescript
 * import { fetchAvailableVariables } from '@/lib/formulaEngine';
 * const variables = await fetchAvailableVariables();
 * const isValid = variables.some(v => v.name === variableName);
 * ```
 */

/**
 * Formula validation result
 * Used to check if a formula is syntactically correct and uses valid variables
 */
export interface FormulaValidationResult {
  isValid: boolean;
  error?: string;
  usedVariables: string[]; // List of variables used in the formula
  evaluatedResult?: number | 'NA'; // Test evaluation result
}

/**
 * Chart calculation result
 * Returned when applying formulas to actual project statistics
 */
export interface ChartCalculationResult {
  chartId: string;
  title: string;
  type: 'pie' | 'bar' | 'kpi' | 'text' | 'image' | 'value'; // WHAT: Added 'value' chart type
  emoji?: string; // Chart emoji from configuration
  subtitle?: string; // Chart subtitle from configuration
  totalLabel?: string; // Custom total label from configuration
  elements: {
    id: string;
    label: string;
    value: number | string | 'NA'; // WHAT: Support string values for text/image content
    color: string;
    /**
     * WHAT: Legacy type for backward compatibility (to be removed after migration)
     */
    type?: 'currency' | 'percentage' | 'number';
    /**
     * WHAT: New flexible formatting (preferred)
     */
    formatting?: ChartValueFormatting;
  }[];
  total?: number | 'NA'; // Total value for bar/value charts
  kpiValue?: number | string | 'NA'; // WHAT: Support string for text/image charts
  
  // VALUE TYPE ONLY: Dual formatting
  kpiFormatting?: ChartValueFormatting;
  barFormatting?: ChartValueFormatting;

  hasErrors: boolean; // Whether any element had calculation errors
}

/**
 * DEPRECATED: Hardcoded chart configurations removed
 * 
 * WHAT: All chart configurations are now stored in MongoDB only
 * WHY: Single source of truth, no fallbacks, full database control
 * HOW: Use `node scripts/seed-default-charts.js` to initialize database
 * 
 * @deprecated All charts must be managed via database. No hardcoded fallbacks.
 */
export const DEFAULT_CHART_CONFIGURATIONS: Omit<ChartConfiguration, '_id' | 'createdAt' | 'updatedAt'>[] = [];
