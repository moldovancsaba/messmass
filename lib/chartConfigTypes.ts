// lib/chartConfigTypes.ts - Chart configuration types and schemas
// This module defines all TypeScript interfaces and validation schemas for the Chart Algorithm Manager

/**
 * Chart configuration element for PieChart (always 2 elements), HorizontalBar (always 5 elements), or KPI (1 element)
 * Each element represents a segment/bar with its label, formula, and color
 * For KPI charts, only one element is used with the main calculation formula
 */
export interface ChartElement {
  id: string; // Unique identifier for this element
  label: string; // Display label (e.g., "Female", "CPM", "Jersey")
  formula: string; // Mathematical formula using variables (e.g., "[FEMALE]", "[INDOOR] + [OUTDOOR]")
  color: string; // Hex color code (e.g., "#ff6b9d")
  type?: 'currency' | 'percentage' | 'number'; // WHAT: Value type for formatting (e.g., currency shows €, percentage shows %)
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
  type: 'pie' | 'bar' | 'kpi'; // Chart type: pie (2 elements), bar (5 elements), kpi (1 element)
  order: number; // Display order in admin grid (1, 2, 3, etc.)
  isActive: boolean; // Whether this chart is currently enabled/visible
  elements: ChartElement[]; // Array of chart elements (2 for pie, 5 for bar, 1 for kpi)
  
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
  type: 'pie' | 'bar' | 'kpi';
  emoji?: string; // Chart emoji from configuration
  subtitle?: string; // Chart subtitle from configuration
  totalLabel?: string; // Custom total label from configuration
  elements: {
    id: string;
    label: string;
    value: number | 'NA';
    color: string;
    type?: 'currency' | 'percentage' | 'number'; // WHAT: Value type for formatting
  }[];
  total?: number | 'NA'; // Total value for bar charts
  kpiValue?: number | 'NA'; // Single value for KPI charts
  hasErrors: boolean; // Whether any element had calculation errors
}

/**
 * Default chart configurations that match existing charts
 * Used for migrating current hardcoded charts to the new system
 */
export const DEFAULT_CHART_CONFIGURATIONS: Omit<ChartConfiguration, '_id' | 'createdAt' | 'updatedAt'>[] = [
  // 1. Gender Distribution Pie Chart
  {
    chartId: 'gender-distribution',
    title: 'Gender Distribution',
    type: 'pie',
    order: 1,
    isActive: true,
    emoji: '👥',
    elements: [
      { id: 'female', label: 'Female', formula: '[stats.female]', color: '#ff6b9d', description: 'Female attendees' },
      { id: 'male', label: 'Male', formula: '[stats.male]', color: '#4a90e2', description: 'Male attendees' }
    ]
  },
  
  // 2. Fans Location Pie Chart
  {
    chartId: 'fans-location',
    title: 'Fans Location',
    type: 'pie',
    order: 2,
    isActive: true,
    emoji: '📍',
    elements: [
      { id: 'remote', label: 'Remote', formula: '[stats.remoteFans]', color: '#3b82f6', description: 'Remote fans (indoor + outdoor)' },
      { id: 'event', label: 'Event', formula: '[stats.stadium]', color: '#f59e0b', description: 'Stadium fans' }
    ]
  },
  
  // 3. Age Groups Pie Chart  
  {
    chartId: 'age-groups',
    title: 'Age Groups',
    type: 'pie',
    order: 3,
    isActive: true,
    emoji: '👥',
    elements: [
      { id: 'under-40', label: 'Under 40', formula: '[stats.genAlpha] + [stats.genYZ]', color: '#06b6d4', description: 'Gen Alpha + Gen Y/Z' },
      { id: 'over-40', label: 'Over 40', formula: '[stats.genX] + [stats.boomer]', color: '#f97316', description: 'Gen X + Boomer' }
    ]
  },
  
  // 4. Visitor Sources Pie Chart
  {
    chartId: 'visitor-sources',
    title: 'Visitor Sources',
    type: 'pie',
    order: 4,
    isActive: true,
    emoji: '🌐',
    elements: [
      { id: 'qr-short', label: 'QR + Short URL', formula: '[stats.visitQrCode] + [stats.visitShortUrl]', color: '#3b82f6', description: 'QR code and short URL visits' },
      { id: 'other', label: 'Other', formula: '[stats.visitWeb]', color: '#f59e0b', description: 'Other web visits' }
    ]
  },
  
  // 5. Merchandise Sales Horizontal Bar Chart
  {
    chartId: 'merchandise-sales',
    title: 'Merchandise Sales',
    type: 'bar',
    order: 5,
    isActive: true,
    showTotal: true,
    totalLabel: 'possible merch sales',
    emoji: '🛍️',
    elements: [
      { id: 'jersey-sales', label: 'Jersey', formula: '[stats.jersey] * [PARAM:jerseyPrice]', color: '#7b68ee', description: 'Jersey sales in EUR' },
      { id: 'scarf-sales', label: 'Scarf', formula: '[stats.scarf] * [PARAM:scarfPrice]', color: '#ff6b9d', description: 'Scarf sales in EUR' },
      { id: 'flags-sales', label: 'Flags', formula: '[stats.flags] * [PARAM:flagsPrice]', color: '#ffa726', description: 'Flag sales in EUR' },
      { id: 'cap-sales', label: 'Baseball Cap', formula: '[stats.baseballCap] * [PARAM:capPrice]', color: '#66bb6a', description: 'Baseball cap sales in EUR' },
      { id: 'other-sales', label: 'Other', formula: '[stats.other] * [PARAM:otherPrice]', color: '#ef5350', description: 'Other merchandise sales in EUR' }
    ]
  },
  
  // 6. Generated Value Horizontal Bar Chart
  {
    chartId: 'value',
    title: 'Generated Value',
    type: 'bar',
    order: 6,
    isActive: true,
    showTotal: true,
    totalLabel: 'Total Generated Value',
    emoji: '📊',
    subtitle: 'Breakdown of Event-Generated Brand Value',
    elements: [
      { 
        id: 'marketing-optin', 
        label: 'Marketing Opt-in Users', 
        formula: '([stats.remoteImages] + [stats.hostessImages] + [stats.selfies]) * 4.87',
        color: '#3b82f6', 
        description: 'Every image corresponds to a GDPR-compliant opt-in fan. Each contact has measurable acquisition cost in digital marketing (€4.87 avg market cost per email opt-in in Europe, 2025)' 
      },
      { 
        id: 'value-prop-emails', 
        label: 'Value Proposition Emails', 
        formula: '([stats.remoteImages] + [stats.hostessImages] + [stats.selfies]) * 1.07',
        color: '#10b981', 
        description: 'Every email delivered includes branded fan photo plus sponsor offer. Add-on ad space valued at €1.07 avg CPM email value add per send' 
      },
      { 
        id: 'giant-screen-ads', 
        label: 'Ads on Giant Screen', 
        formula: '([stats.eventAttendees] / 1000) * 6 * 0.2 * ([stats.remoteImages] + [stats.hostessImages] + [stats.selfies])',
        color: '#f59e0b', 
        description: 'Fans + brands shown on stadium big screen = in-stadium advertising equivalent. Stadium advertising CPM ≈ €6.00 per 1,000 attendees per 30s slot. 6s exposure = 0.2 of CPM' 
      },
      { 
        id: 'under40-engagement', 
        label: 'Under-40 Engagement', 
        formula: '([stats.genAlpha] + [stats.genYZ]) * 2.14',
        color: '#8b5cf6', 
        description: '80% of engaged fans are under 40 - critical target for most brands. Each identified contact carries premium value (€2.14 avg value of youth contact vs older groups)' 
      },
      { 
        id: 'brand-awareness', 
        label: 'Brand Awareness Boost', 
        formula: '200 * 300 * 0.0145', 
        color: '#ef4444', 
        description: 'Organic shares amplify brand presence into social feeds. 200 shared images × 300 avg views = 60,000 impressions. Benchmarked to €14.50 CPM for social organic impressions (2025)' 
      }
    ]
  },
  
  // 7. Engagement Horizontal Bar Chart  
  {
    chartId: 'engagement',
    title: 'Engagement',
    type: 'bar',
    order: 7,
    isActive: true,
    showTotal: true,
    totalLabel: 'Core Fan Team',
    elements: [
      { id: 'engaged', label: 'Engaged', formula: '([stats.remoteFans] + [stats.stadium]) / [stats.eventAttendees] * 100', color: '#8b5cf6', description: 'Fan Engagement %' },
      { id: 'interactive', label: 'Interactive', formula: '([stats.socialVisit] + [stats.eventValuePropositionVisited] + [stats.eventValuePropositionPurchases]) / ([stats.remoteImages] + [stats.hostessImages] + [stats.selfies]) * 100', color: '#f59e0b', description: 'Fan Interaction %' },
      { id: 'front-runners', label: 'Front-runners', formula: '[stats.merched] / ([stats.remoteFans] + [stats.stadium]) * 100', color: '#10b981', description: 'Merched fans %' },
      { id: 'fanaticals', label: 'Fanaticals', formula: '([stats.flags] + [stats.scarf]) / [stats.merched] * 100', color: '#ef4444', description: 'Flags & scarfs of merched %' },
      { id: 'casuals', label: 'Casuals', formula: '(([stats.remoteFans] + [stats.stadium]) - [stats.merched]) / ([stats.remoteFans] + [stats.stadium]) * 100', color: '#06b6d4', description: 'Non-merched fans %' }
    ]
  },
  
  // 8. Faces per Image KPI Chart
  {
    chartId: 'faces-per-image',
    title: 'Faces per Image',
    type: 'kpi',
    order: 8,
    isActive: true,
    emoji: '👀',
    elements: [
      { 
        id: 'faces-per-image-value', 
        label: 'Average faces per approved image', 
        formula: '([stats.female] + [stats.male]) / [stats.approvedImages]',
        color: '#10b981', 
        description: 'Calculation from your totals: total faces by gender divided by images to show authentic reach per asset. Target audience: Brand owner, media planners, sponsorship sales. Quantify how many branded faces appear per image on average. Capture the multiplier effect for on-screen brand exposure.' 
      }
    ]
  },
  
  // 9. Image Density KPI Chart
  {
    chartId: 'image-density',
    title: 'Image Density',
    type: 'kpi',
    order: 9,
    isActive: true,
    emoji: '🧮',
    elements: [
      { 
        id: 'image-density-value', 
        label: 'Images per 100 fans', 
        formula: '([stats.remoteImages] + [stats.hostessImages] + [stats.selfies]) / ([stats.female] + [stats.male]) * 100',
        color: '#3b82f6', 
        description: 'Show how actively fans created content. Help venues and rights holders benchmark activation performance. Derived from your counts - a simple, comparable index across events. Target audience: Event ops, sponsorship sales, client success.' 
      }
    ]
  }
];
