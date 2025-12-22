/* WHAT: Enhanced TypeScript types for comprehensive Page Styles system
 * WHY: Support advanced styling with gradients, typography, and color schemes
 * HOW: Extends basic PageStyle with detailed customization options
 * REPLACES: Legacy pageStyleTypes.ts with richer feature set */

/**
 * WHAT: Gradient stop with color and position
 * WHY: Define individual color stops in linear gradients
 */
export interface GradientStop {
  color: string;      // Hex color code (e.g., "#3b82f6")
  position: number;   // Position percentage (0-100)
}

/**
 * WHAT: Background style configuration
 * WHY: Support both solid colors and gradients for flexible styling
 */
export interface BackgroundStyle {
  type: 'solid' | 'gradient';
  solidColor?: string;           // Used when type is 'solid'
  gradientAngle?: number;        // Degrees (0-360), used when type is 'gradient'
  gradientStops?: GradientStop[]; // Array of stops, min 2 for gradients
}

/**
 * WHAT: Content box background with opacity support
 * WHY: Allow semi-transparent backgrounds for content boxes
 */
export interface ContentBoxBackground {
  type: 'solid' | 'gradient';
  solidColor?: string;
  opacity?: number;  // 0-1 for transparency (0 = fully transparent, 1 = opaque)
}

/**
 * WHAT: Typography settings for the style theme
 * WHY: Customize fonts and text colors throughout the page
 * HOW: fontFamily supports built-in fonts OR custom font names (e.g., "AS Roma")
 */
export interface Typography {
  fontFamily: 'inter' | 'roboto' | 'poppins' | 'AS Roma' | string;  // WHAT: Allow custom fonts
  primaryTextColor: string;    // Main text color
  secondaryTextColor: string;  // Secondary/caption text color
  headingColor: string;        // Heading elements color
}

/**
 * WHAT: Color scheme for semantic colors
 * WHY: Define brand colors and semantic states (success, warning, error)
 */
export interface ColorScheme {
  primary: string;    // Primary brand color
  secondary: string;  // Secondary accent color
  success: string;    // Success state color
  warning: string;    // Warning state color
  error: string;      // Error state color
}

/**
 * WHAT: Chart-specific color customization
 * WHY: Allow full control over chart colors independent of main color scheme
 * HOW: Each property controls a specific chart element color
 */
export interface ChartColorScheme {
  // Chart container colors
  chartBackground: string;          // Chart card background (default: #ffffff)
  chartBorder: string;              // Chart card border color (default: #f3f4f6)
  
  // Chart text colors
  chartTitleColor: string;          // Chart titles (default: uses primary color)
  chartLabelColor: string;          // Axis labels, legend text (default: #374151)
  chartValueColor: string;          // KPI values, data labels (default: #111827)
  
  // KPI-specific colors
  kpiIconColor: string;             // KPI icon color (default: uses primary color)
  
  // Bar chart colors (5 bars)
  barColor1: string;                // First bar color
  barColor2: string;                // Second bar color
  barColor3: string;                // Third bar color
  barColor4: string;                // Fourth bar color
  barColor5: string;                // Fifth bar color
  
  // Pie chart colors (2 slices for now, expandable)
  pieColor1: string;                // First pie slice color
  pieColor2: string;                // Second pie slice color
  
  // Chart states
  chartNoDataBackground: string;    // No data background (default: #f9fafb)
  chartNoDataBorder: string;        // No data border (default: #d1d5db)
  chartNoDataText: string;          // No data text (default: #6b7280)
  
  chartErrorBackground: string;     // Error background (default: #fef2f2)
  chartErrorText: string;           // Error text (default: #991b1b)
  
  // Interactive elements
  chartTooltipBackground: string;   // Chart.js tooltip background (default: rgba(0,0,0,0.85))
  chartTooltipText: string;         // Tooltip text (default: #ffffff)
  
  // Hero elements
  exportButtonBackground: string;   // Export PDF button (default: #ffffff)
  exportButtonText: string;         // Export button text (default: uses primary color)
  exportButtonHoverBackground: string; // Hover state (default: #f9fafb)
}

/**
 * WHAT: Enhanced page style configuration with comprehensive options
 * WHY: Single source of truth for all styling customization
 * STORAGE: MongoDB collection 'page_styles_enhanced'
 */
export interface PageStyleEnhanced {
  _id?: string;                       // MongoDB ObjectId
  name: string;                       // Display name (e.g., "Dark Theme", "Brand Theme")
  description?: string;               // Optional description
  isGlobalDefault: boolean;           // Only one can be true across all styles
  
  // Background configurations
  pageBackground: BackgroundStyle;    // Full page background
  heroBackground: BackgroundStyle;    // Hero box background
  contentBoxBackground: ContentBoxBackground;  // Main content boxes
  
  // Typography and colors
  typography: Typography;             // Font and text color settings
  colorScheme: ColorScheme;           // Brand and semantic colors
  chartColors?: ChartColorScheme;     // Optional chart-specific colors (uses defaults if not set)
  
  // Metadata
  createdAt?: Date;                   // ISO 8601 timestamp
  updatedAt?: Date;                   // ISO 8601 timestamp
  createdBy?: string;                 // User ID or email
  
  // Project associations
  projectIds?: string[];              // Projects using this style
}

/**
 * WHAT: Helper to generate CSS gradient string from BackgroundStyle
 * WHY: Convert PageStyleEnhanced gradient config to valid CSS
 */
export function generateGradientCSS(background: BackgroundStyle): string {
  if (background.type === 'solid') {
    // WHAT: Validate solidColor is a non-empty string
    // WHY: Prevent undefined/null from being returned
    const solidColor = background.solidColor;
    if (solidColor && typeof solidColor === 'string' && solidColor.trim()) {
      return solidColor;
    }
    return '#ffffff'; // Fallback for invalid solid color
  }
  
  if (!background.gradientStops || background.gradientStops.length < 2) {
    return '#ffffff'; // Fallback
  }
  
  // WHAT: Validate all gradient stops have valid color and position values
  // WHY: Prevent "undefined 50%" or "null 50%" in CSS output
  const validStops = background.gradientStops.filter(stop => 
    stop.color && 
    typeof stop.color === 'string' && 
    stop.color.trim() &&
    typeof stop.position === 'number' &&
    !isNaN(stop.position)
  );
  
  if (validStops.length < 2) {
    return '#ffffff'; // Fallback if not enough valid stops
  }
  
  const angle = background.gradientAngle || 0;
  const stops = validStops
    .map(stop => `${stop.color} ${stop.position}%`)
    .join(', ');
  
  return `linear-gradient(${angle}deg, ${stops})`;
}

/**
 * WHAT: Convert hex color to rgba with opacity
 * WHY: Support semi-transparent backgrounds
 */
export function hexToRgba(hex: string, opacity: number): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * WHAT: Default enhanced page style (system fallback)
 * WHY: Use when no custom style is selected
 */
export const DEFAULT_PAGE_STYLE_ENHANCED: PageStyleEnhanced = {
  name: 'System Default',
  description: 'Clean, professional default theme',
  isGlobalDefault: true,
  pageBackground: {
    type: 'solid',
    solidColor: '#ffffff'
  },
  heroBackground: {
    type: 'gradient',
    gradientAngle: 0,
    gradientStops: [
      { color: '#f8fafc', position: 0 },
      { color: '#f1f5f9', position: 100 }
    ]
  },
  contentBoxBackground: {
    type: 'solid',
    solidColor: '#ffffff',
    opacity: 0.95
  },
  typography: {
    fontFamily: 'inter',
    primaryTextColor: '#111827',
    secondaryTextColor: '#6b7280',
    headingColor: '#1f2937'
  },
  colorScheme: {
    primary: '#3b82f6',
    secondary: '#10b981',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  }
};

/**
 * WHAT: Sample dark theme
 * WHY: Provide alternative styling option out of the box
 */
export const DARK_THEME_SAMPLE: PageStyleEnhanced = {
  name: 'Dark Theme',
  description: 'Modern dark mode theme',
  isGlobalDefault: false,
  pageBackground: {
    type: 'solid',
    solidColor: '#1f2937'
  },
  heroBackground: {
    type: 'gradient',
    gradientAngle: 135,
    gradientStops: [
      { color: '#111827', position: 0 },
      { color: '#1f2937', position: 100 }
    ]
  },
  contentBoxBackground: {
    type: 'solid',
    solidColor: '#374151',
    opacity: 0.9
  },
  typography: {
    fontFamily: 'roboto',
    primaryTextColor: '#f9fafb',
    secondaryTextColor: '#d1d5db',
    headingColor: '#ffffff'
  },
  colorScheme: {
    primary: '#8b5cf6',
    secondary: '#ec4899',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  }
};

/**
 * WHAT: Generate default chart colors from color scheme
 * WHY: Provide sensible defaults when chartColors not configured
 * HOW: Use primary color for accents, neutral grays for text/backgrounds
 */
export function getDefaultChartColors(colorScheme: ColorScheme): ChartColorScheme {
  return {
    chartBackground: '#ffffff',
    chartBorder: '#f3f4f6',
    chartTitleColor: colorScheme.primary,
    chartLabelColor: '#374151',
    chartValueColor: '#111827',
    // KPI colors
    kpiIconColor: colorScheme.primary,
    // Bar colors (use colorScheme colors in order)
    barColor1: colorScheme.primary,
    barColor2: colorScheme.secondary,
    barColor3: colorScheme.success,
    barColor4: colorScheme.warning,
    barColor5: colorScheme.error,
    // Pie colors
    pieColor1: colorScheme.primary,
    pieColor2: colorScheme.secondary,
    // States
    chartNoDataBackground: '#f9fafb',
    chartNoDataBorder: '#d1d5db',
    chartNoDataText: '#6b7280',
    chartErrorBackground: '#fef2f2',
    chartErrorText: '#991b1b',
    // Interactive
    chartTooltipBackground: 'rgba(0, 0, 0, 0.85)',
    chartTooltipText: '#ffffff',
    // Export button
    exportButtonBackground: '#ffffff',
    exportButtonText: colorScheme.primary,
    exportButtonHoverBackground: '#f9fafb'
  };
}

/**
 * WHAT: Get default page style function
 * WHY: Provide consistent fallback when no styles exist in database
 * HOW: Returns the system default enhanced page style
 */
export function getDefaultPageStyle(): PageStyleEnhanced {
  return DEFAULT_PAGE_STYLE_ENHANCED;
}
