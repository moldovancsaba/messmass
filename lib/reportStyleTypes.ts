/* WHAT: TypeScript types for Report Style Editor system
 * WHY: Single place to control report + landing colors (35 color properties)
 * HOW: MongoDB-compatible schema with hex color validation */

import { getFontFamilyCSS } from './fontUtils';

/**
 * Report Style - Complete color configuration for report and landing pages
 *
 * WHAT: Report colors (26) + Landing colors (9) matching CSS variables exactly
 * WHY: Style editor drives both report and landing; when a style is applied, landing uses these if set
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

  // Landing page (main site hero, footer, CTA) — when set, overrides theme on landing
  landingHeroBgStart: string;          // Hero gradient start
  landingHeroBgMid: string;            // Hero gradient mid
  landingHeroBgEnd: string;            // Hero gradient end
  landingHeroText: string;             // Hero headline/text
  landingHeroTextMuted: string;        // Hero subtitle/muted
  landingHeroBorder: string;           // Hero CTA border (e.g. outline button)
  landingHeroBorderHover: string;     // Hero CTA border hover
  landingHeroTextHover: string;        // Hero CTA text hover
  landingPageBg: string;               // Main landing page background

  // Optional dimension/length values — when set, override theme on landing & report
  sectionPaddingY?: string;            // e.g. "3.5rem" — section vertical padding
  sectionPaddingYLg?: string;          // e.g. "5rem" — section padding large screens
  heroPaddingYMin?: string;            // e.g. "3.5rem" — hero padding clamp min
  heroPaddingYMax?: string;            // e.g. "5rem" — hero padding clamp max
  landingCardMin?: string;             // e.g. "12.5rem" — card grid min width
  landingCardMinWide?: string;          // e.g. "15rem" — card grid min wide
  landingFaqMaxWidth?: string;         // e.g. "40rem" — FAQ list max width
  landingDiffMax?: string;             // e.g. "65ch" — paragraph max width
  landingIconSize?: string;            // e.g. "3rem" — value/how card icon size
  cardBorderRadius?: string;           // e.g. "0.75rem" — card corner radius
  cardShadow?: string;                 // e.g. "0 1px 3px 0 rgba(0,0,0,0.05)" — card shadow
  landingBlockBaseFontSize?: string;   // e.g. "2rem" — report block title on landing
  landingBlockSubtitleFontSize?: string; // e.g. "0.8125rem" — report block value on landing
  landingMaxIconFont?: string;         // e.g. "4rem" — KPI/value chain icon on landing

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

  // Landing page (messmass.com hero, footer, CTA)
  { key: 'landingHeroBgStart', label: 'Landing hero gradient start', category: 'Landing', description: 'Hero background gradient start' },
  { key: 'landingHeroBgMid', label: 'Landing hero gradient mid', category: 'Landing', description: 'Hero background gradient middle' },
  { key: 'landingHeroBgEnd', label: 'Landing hero gradient end', category: 'Landing', description: 'Hero background gradient end' },
  { key: 'landingHeroText', label: 'Landing hero text', category: 'Landing', description: 'Hero headline and primary text' },
  { key: 'landingHeroTextMuted', label: 'Landing hero muted text', category: 'Landing', description: 'Hero subtitle and secondary text' },
  { key: 'landingHeroBorder', label: 'Landing hero CTA border', category: 'Landing', description: 'Outline button border on hero' },
  { key: 'landingHeroBorderHover', label: 'Landing hero CTA border hover', category: 'Landing', description: 'Outline button border on hover' },
  { key: 'landingHeroTextHover', label: 'Landing hero CTA text hover', category: 'Landing', description: 'Outline button text on hover' },
  { key: 'landingPageBg', label: 'Landing page background', category: 'Landing', description: 'Main landing page background' },
];

/**
 * Dimension/length fields — optional; when set they override theme on landing and report
 * WHAT: Spacing, font size, radius, shadow — editable in style editor
 * WHY: Single place to control layout and surfaces from the style editor
 */
export interface DimensionFieldDefinition {
  key: keyof Pick<ReportStyle,
    'sectionPaddingY' | 'sectionPaddingYLg' | 'heroPaddingYMin' | 'heroPaddingYMax' |
    'landingCardMin' | 'landingCardMinWide' | 'landingFaqMaxWidth' | 'landingDiffMax' |
    'landingIconSize' | 'cardBorderRadius' | 'cardShadow' |
    'landingBlockBaseFontSize' | 'landingBlockSubtitleFontSize' | 'landingMaxIconFont'>;
  label: string;
  category: string;
  description: string;
  default: string;
  placeholder?: string;
}

export const DIMENSION_FIELDS: DimensionFieldDefinition[] = [
  { key: 'sectionPaddingY', label: 'Section padding (vertical)', category: 'Landing dimensions', description: 'Section top/bottom padding', default: '3.5rem', placeholder: 'e.g. 3.5rem' },
  { key: 'sectionPaddingYLg', label: 'Section padding large screens', category: 'Landing dimensions', description: 'Section padding at 1024px+', default: '5rem', placeholder: 'e.g. 5rem' },
  { key: 'heroPaddingYMin', label: 'Hero padding min', category: 'Landing dimensions', description: 'Hero vertical padding (clamp min)', default: '3.5rem', placeholder: 'e.g. 3.5rem' },
  { key: 'heroPaddingYMax', label: 'Hero padding max', category: 'Landing dimensions', description: 'Hero vertical padding (clamp max)', default: '5rem', placeholder: 'e.g. 5rem' },
  { key: 'landingCardMin', label: 'Landing card min width', category: 'Landing dimensions', description: 'Min width for card grid cells', default: '12.5rem', placeholder: 'e.g. 12.5rem' },
  { key: 'landingCardMinWide', label: 'Landing card min wide', category: 'Landing dimensions', description: 'Min width for wider card grids', default: '15rem', placeholder: 'e.g. 15rem' },
  { key: 'landingFaqMaxWidth', label: 'FAQ max width', category: 'Landing dimensions', description: 'Max width of FAQ list', default: '40rem', placeholder: 'e.g. 40rem' },
  { key: 'landingDiffMax', label: 'Paragraph max width', category: 'Landing dimensions', description: 'Max width for body paragraphs (ch)', default: '65ch', placeholder: 'e.g. 65ch' },
  { key: 'landingIconSize', label: 'Landing card icon size', category: 'Landing dimensions', description: 'Value/how card icon size', default: '3rem', placeholder: 'e.g. 3rem' },
  { key: 'cardBorderRadius', label: 'Card border radius', category: 'Surfaces', description: 'Border radius for cards (landing & report)', default: '0.75rem', placeholder: 'e.g. 0.75rem' },
  { key: 'cardShadow', label: 'Card shadow', category: 'Surfaces', description: 'Box shadow for cards', default: '0 1px 3px 0 rgba(0,0,0,0.05)', placeholder: 'e.g. 0 1px 3px 0 rgba(0,0,0,0.05)' },
  { key: 'landingBlockBaseFontSize', label: 'Landing block title size', category: 'Landing typography', description: 'Report block title on landing', default: '2rem', placeholder: 'e.g. 2rem' },
  { key: 'landingBlockSubtitleFontSize', label: 'Landing block value size', category: 'Landing typography', description: 'Report block value/description on landing', default: '0.8125rem', placeholder: 'e.g. 0.8125rem' },
  { key: 'landingMaxIconFont', label: 'Landing block icon size', category: 'Landing typography', description: 'KPI/value chain icon on landing', default: '4rem', placeholder: 'e.g. 4rem' },
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

  // Landing (defaults match theme.css --mm-landing-hero-*)
  landingHeroBgStart: '#0f172aff',
  landingHeroBgMid: '#1e293bff',
  landingHeroBgEnd: '#0f172aff',
  landingHeroText: '#f8fafcff',
  landingHeroTextMuted: '#cbd5e1ff',
  landingHeroBorder: '#475569ff',
  landingHeroBorderHover: '#94a3b8ff',
  landingHeroTextHover: '#f1f5f9ff',
  landingPageBg: '#f8fafcff',

  // Dimension defaults (match theme; optional so old styles still load)
  sectionPaddingY: '3.5rem',
  sectionPaddingYLg: '5rem',
  heroPaddingYMin: '3.5rem',
  heroPaddingYMax: '5rem',
  landingCardMin: '12.5rem',
  landingCardMinWide: '15rem',
  landingFaqMaxWidth: '40rem',
  landingDiffMax: '65ch',
  landingIconSize: '3rem',
  cardBorderRadius: '0.75rem',
  cardShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
  landingBlockBaseFontSize: '2rem',
  landingBlockSubtitleFontSize: '0.8125rem',
  landingMaxIconFont: '4rem',
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

  // Inject dimension fields when set (override theme on landing/report)
  for (const field of DIMENSION_FIELDS) {
    const value = style[field.key];
    if (value && String(value).trim()) {
      root.style.setProperty(`--${field.key}`, String(value).trim());
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
  for (const field of DIMENSION_FIELDS) {
    root.style.removeProperty(`--${field.key}`);
  }
}
