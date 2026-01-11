/* WHAT: TypeScript types for Report Style Editor system
 * WHY: Simple, effective style management with 26 color properties
 * HOW: MongoDB-compatible schema with hex color validation */

import { getFontFamilyCSS } from './fontUtils';

/**
 * Report Style - Complete color configuration for report pages
 * 
 * WHAT: 26 color properties matching CSS variables exactly
 * WHY: Simple 1:1 mapping between MongoDB fields and CSS variables
 * HOW: All fields use 8-character hex codes (#RRGGBBAA) for transparency support
 */
export interface ReportStyle {
  _id?: string;
  name: string;
  description?: string;
  
  // Typography
  fontFamily?: string;                  // Font family for all text
  
  // Hero Section (5 properties)
  heroBackground: string;               // Hero card background
  headingColor: string;                 // Event title color
  exportButtonBackground: string;       // PDF button background
  exportButtonText: string;             // PDF button text
  exportButtonHoverBackground: string;  // PDF button hover state
  
  // Chart Container (2 properties)
  chartBackground: string;              // Chart card background
  chartBorder: string;                  // Chart border color
  
  // Chart Typography (4 properties)
  chartTitleColor: string;              // Chart titles
  chartLabelColor: string;              // Labels and legends
  chartValueColor: string;              // Numbers and values
  textColor: string;                    // TEXT chart content
  
  // KPI Charts (1 property)
  kpiIconColor: string;                 // Icon color
  
  // Bar Charts (5 properties)
  barColor1: string;                    // First bar
  barColor2: string;                    // Second bar
  barColor3: string;                    // Third bar
  barColor4: string;                    // Fourth bar
  barColor5: string;                    // Fifth bar
  
  // Pie Charts (3 properties)
  pieColor1: string;                    // First slice
  pieColor2: string;                    // Second slice
  pieBorderColor: string;               // Pie chart border
  
  // Chart States (6 properties)
  chartNoDataBackground: string;        // Empty state background
  chartNoDataBorder: string;            // Empty state border
  chartNoDataText: string;              // Empty state text
  chartErrorBackground: string;         // Error background
  chartErrorText: string;               // Error text
  chartTooltipBackground: string;       // Tooltip background
  chartTooltipText: string;             // Tooltip text
  
  createdAt?: string;                   // ISO 8601 timestamp
  updatedAt?: string;                   // ISO 8601 timestamp
}

/**
 * Color field metadata for rendering forms
 */
export interface ColorFieldDefinition {
  key: keyof Omit<ReportStyle, '_id' | 'name' | 'description' | 'createdAt' | 'updatedAt'>;
  label: string;
  category: string;
  description: string;
}

/**
 * All 26 color fields with metadata
 * WHAT: Defines order, labels, and categories for UI rendering
 * WHY: Single source of truth for form generation
 */
export const COLOR_FIELDS: ColorFieldDefinition[] = [
  // Hero Section
  { key: 'heroBackground', label: 'Hero Background', category: 'Hero Section', description: 'Background color for hero card' },
  { key: 'headingColor', label: 'Heading Color', category: 'Hero Section', description: 'Event name/title color' },
  { key: 'exportButtonBackground', label: 'Export Button BG', category: 'Hero Section', description: 'PDF export button background' },
  { key: 'exportButtonText', label: 'Export Button Text', category: 'Hero Section', description: 'PDF export button text color' },
  { key: 'exportButtonHoverBackground', label: 'Export Button Hover', category: 'Hero Section', description: 'PDF button hover state' },
  
  // Chart Container
  { key: 'chartBackground', label: 'Chart Background', category: 'Chart Container', description: 'Chart card background color' },
  { key: 'chartBorder', label: 'Chart Border', category: 'Chart Container', description: 'Chart border color' },
  
  // Chart Typography
  { key: 'chartTitleColor', label: 'Chart Title', category: 'Chart Typography', description: 'Chart heading color' },
  { key: 'chartLabelColor', label: 'Chart Label', category: 'Chart Typography', description: 'Axis labels, legends' },
  { key: 'chartValueColor', label: 'Chart Value', category: 'Chart Typography', description: 'Numbers, KPI values' },
  { key: 'textColor', label: 'Text Content', category: 'Chart Typography', description: 'TEXT chart body text' },
  
  // KPI Charts
  { key: 'kpiIconColor', label: 'KPI Icon Color', category: 'KPI Charts', description: 'Material icon color' },
  
  // Bar Charts
  { key: 'barColor1', label: 'Bar Color 1', category: 'Bar Charts', description: 'First bar color' },
  { key: 'barColor2', label: 'Bar Color 2', category: 'Bar Charts', description: 'Second bar color' },
  { key: 'barColor3', label: 'Bar Color 3', category: 'Bar Charts', description: 'Third bar color' },
  { key: 'barColor4', label: 'Bar Color 4', category: 'Bar Charts', description: 'Fourth bar color' },
  { key: 'barColor5', label: 'Bar Color 5', category: 'Bar Charts', description: 'Fifth bar color' },
  
  // Pie Charts
  { key: 'pieColor1', label: 'Pie Color 1', category: 'Pie Charts', description: 'First pie slice fill' },
  { key: 'pieColor2', label: 'Pie Color 2', category: 'Pie Charts', description: 'Second pie slice fill' },
  { key: 'pieBorderColor', label: 'Pie Border', category: 'Pie Charts', description: 'Pie chart border color' },
  
  // Chart States
  { key: 'chartNoDataBackground', label: 'No Data Background', category: 'Chart States', description: 'Empty chart background' },
  { key: 'chartNoDataBorder', label: 'No Data Border', category: 'Chart States', description: 'Empty chart border' },
  { key: 'chartNoDataText', label: 'No Data Text', category: 'Chart States', description: 'Empty state text color' },
  { key: 'chartErrorBackground', label: 'Error Background', category: 'Chart States', description: 'Error state background' },
  { key: 'chartErrorText', label: 'Error Text', category: 'Chart States', description: 'Error message color' },
  { key: 'chartTooltipBackground', label: 'Tooltip Background', category: 'Chart States', description: 'Chart.js tooltip background' },
  { key: 'chartTooltipText', label: 'Tooltip Text', category: 'Chart States', description: 'Tooltip text color' },
];

/**
 * Default style values
 * WHAT: System default colors for new styles
 * WHY: Provide sensible starting point
 */
export const DEFAULT_STYLE: Omit<ReportStyle, '_id' | 'createdAt' | 'updatedAt'> = {
  name: 'New Style',
  description: '',
  fontFamily: 'Inter',
  
  // Hero Section
  heroBackground: '#f8fafcff',
  headingColor: '#1f2937ff',
  exportButtonBackground: '#ffffffff',
  exportButtonText: '#3b82f6ff',
  exportButtonHoverBackground: '#f9fafbff',
  
  // Chart Container
  chartBackground: '#ffffffff',
  chartBorder: '#f3f4f6ff',
  
  // Chart Typography
  chartTitleColor: '#3b82f6ff',
  chartLabelColor: '#374151ff',
  chartValueColor: '#111827ff',
  textColor: '#111827ff',
  
  // KPI Charts
  kpiIconColor: '#3b82f6ff',
  
  // Bar Charts
  barColor1: '#3b82f6ff',
  barColor2: '#10b981ff',
  barColor3: '#10b981ff',
  barColor4: '#f59e0bff',
  barColor5: '#ef4444ff',
  
  // Pie Charts
  pieColor1: '#3b82f6ff',
  pieColor2: '#10b981ff',
  pieBorderColor: '#3b82f6ff',
  
  // Chart States
  chartNoDataBackground: '#f9fafbff',
  chartNoDataBorder: '#d1d5dbff',
  chartNoDataText: '#6b7280ff',
  chartErrorBackground: '#fef2f2ff',
  chartErrorText: '#991b1bff',
  chartTooltipBackground: '#1f2937f2',
  chartTooltipText: '#ffffffff',
};

/**
 * Validate hex color format
 * WHAT: Check if string is valid hex color (6 or 8 characters)
 * WHY: Prevent invalid colors from being saved
 */
export function isValidHexColor(hex: string): boolean {
  if (!hex || typeof hex !== 'string') return false;
  
  // Remove # if present
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
  
  // Check length (6 for RGB, 8 for RGBA)
  if (cleanHex.length !== 6 && cleanHex.length !== 8) return false;
  
  // Check all characters are valid hex
  return /^[0-9A-Fa-f]+$/.test(cleanHex);
}

/**
 * Normalize hex color to 8-character format
 * WHAT: Convert 6-char hex to 8-char by adding 'ff' alpha
 * WHY: Consistent format for storage and CSS injection
 */
export function normalizeHexColor(hex: string): string {
  if (!hex || typeof hex !== 'string') return '#000000ff';
  
  // Remove # if present
  let cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
  
  // Add 'ff' alpha if only 6 characters
  if (cleanHex.length === 6) {
    cleanHex += 'ff';
  }
  
  // Ensure # prefix
  return `#${cleanHex.toLowerCase()}`;
}

/**
 * Convert hex to rgba CSS format
 * WHAT: Convert #RRGGBBAA to rgba(r, g, b, a)
 * WHY: Some CSS properties prefer rgba format
 */
export function hexToRgba(hex: string): string {
  const normalized = normalizeHexColor(hex);
  const cleanHex = normalized.slice(1);
  
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  const a = parseInt(cleanHex.slice(6, 8), 16) / 255;
  
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Validate complete style object
 * WHAT: Check all required fields are present and valid
 * WHY: Prevent saving incomplete styles
 */
export function validateStyle(style: Partial<ReportStyle>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check name
  if (!style.name || style.name.trim() === '') {
    errors.push('Style name is required');
  }
  
  // Check all color fields
  for (const field of COLOR_FIELDS) {
    const value = style[field.key];
    if (!value || !isValidHexColor(value)) {
      errors.push(`${field.label} must be a valid hex color`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Inject style as CSS variables
 * WHAT: Apply style to document root
 * WHY: Make colors available to all report components
 */
export function injectStyleAsCSS(style: ReportStyle): void {
  const root = document.documentElement;
  
  // WHAT: Inject font family if specified, converting name to CSS font-family value
  // WHY: Report styles store font name (e.g., "Aquatic"), but CSS needs full value (e.g., '"Aquatic", sans-serif')
  // HOW: Use getFontFamilyCSS to convert font name to proper CSS value
  if (style.fontFamily) {
    // WHAT: Convert font name to CSS font-family value
    // WHY: Font names in database are display names, but CSS needs full font-family declaration
    // HOW: Use fontUtils to map name to CSS value, with fallback to name as-is
    const fontFamilyCSS = getFontFamilyCSS(style.fontFamily);
    root.style.setProperty('--reportFontFamily', fontFamilyCSS);
  }
  
  // Inject all color fields as CSS variables
  for (const field of COLOR_FIELDS) {
    const value = style[field.key];
    if (value) {
      root.style.setProperty(`--${field.key}`, normalizeHexColor(value));
    }
  }
}

/**
 * Remove style CSS variables
 * WHAT: Clean up injected CSS variables
 * WHY: Prevent memory leaks and style conflicts
 */
export function removeStyleCSS(): void {
  const root = document.documentElement;
  
  // Remove font family
  root.style.removeProperty('--reportFontFamily');
  
  for (const field of COLOR_FIELDS) {
    root.style.removeProperty(`--${field.key}`);
  }
}
