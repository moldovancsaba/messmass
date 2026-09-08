import type { PageStyleEnhanced } from '../pageStyleTypesEnhanced';

// WHAT: Page-style preset DATA — the system default / dark sample page styles, the neutral
//       chart colours derived for a colour scheme, and the presets scripts/seedPageStyles.ts
//       inserts into page_styles_enhanced.
// WHY: These objects are persisted to MongoDB and rendered from there, so their colours are
//      content rather than UI chrome and stay literal here (the one lane the GDS compliance
//      check reserves for colour values). Every UI surface uses app/styles/theme.css tokens.

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

/** Neutral chart chrome used by getDefaultChartColors() in lib/pageStyleTypesEnhanced.ts. */
export const CHART_COLOR_NEUTRALS = {
  chartBackground: '#ffffff',
  chartBorder: '#f3f4f6',
  chartLabelColor: '#374151',
  chartValueColor: '#111827',
  chartNoDataBackground: '#f9fafb',
  chartNoDataBorder: '#d1d5db',
  chartNoDataText: '#6b7280',
  chartErrorBackground: '#fef2f2',
  chartErrorText: '#991b1b',
  chartTooltipBackground: 'rgba(0, 0, 0, 0.85)',
  chartTooltipText: '#ffffff',
  exportButtonBackground: '#ffffff',
  exportButtonHoverBackground: '#f9fafb',
} as const;

/** Presets written by scripts/seedPageStyles.ts (npm run seed:page-styles). */
export const SEED_PAGE_STYLE_PRESETS: Omit<PageStyleEnhanced, '_id' | 'createdAt' | 'updatedAt' | 'projectIds'>[] = [
  {
    name: 'Clean Light',
    description: 'Professional light theme with subtle gradients',
    isGlobalDefault: true,
    pageBackground: {
      type: 'gradient',
      gradientAngle: 180,
      gradientStops: [
        { color: '#ffffff', position: 0 },
        { color: '#f9fafb', position: 100 }
      ]
    },
    heroBackground: {
      type: 'gradient',
      gradientAngle: 135,
      gradientStops: [
        { color: '#3b82f6', position: 0 },
        { color: '#2563eb', position: 100 }
      ]
    },
    contentBoxBackground: {
      type: 'solid',
      solidColor: '#ffffff',
      opacity: 0.95
    },
    typography: {
      fontFamily: 'inter',
      primaryTextColor: '#1f2937',
      secondaryTextColor: '#6b7280',
      headingColor: '#111827'
    },
    colorScheme: {
      primary: '#3b82f6',
      secondary: '#10b981',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    createdBy: 'system'
  },
  {
    name: 'Dark Mode',
    description: 'Modern dark theme with vibrant accents',
    isGlobalDefault: false,
    pageBackground: {
      type: 'solid',
      solidColor: '#111827'
    },
    heroBackground: {
      type: 'gradient',
      gradientAngle: 135,
      gradientStops: [
        { color: '#1f2937', position: 0 },
        { color: '#374151', position: 100 }
      ]
    },
    contentBoxBackground: {
      type: 'solid',
      solidColor: '#1f2937',
      opacity: 0.9
    },
    typography: {
      fontFamily: 'inter',
      primaryTextColor: '#f9fafb',
      secondaryTextColor: '#d1d5db',
      headingColor: '#ffffff'
    },
    colorScheme: {
      primary: '#60a5fa',
      secondary: '#34d399',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171'
    },
    createdBy: 'system'
  },
  {
    name: 'Sports Blue',
    description: 'Bold blue theme perfect for sports events',
    isGlobalDefault: false,
    pageBackground: {
      type: 'gradient',
      gradientAngle: 180,
      gradientStops: [
        { color: '#eff6ff', position: 0 },
        { color: '#dbeafe', position: 100 }
      ]
    },
    heroBackground: {
      type: 'gradient',
      gradientAngle: 135,
      gradientStops: [
        { color: '#1e40af', position: 0 },
        { color: '#3b82f6', position: 100 }
      ]
    },
    contentBoxBackground: {
      type: 'solid',
      solidColor: '#ffffff',
      opacity: 0.95
    },
    typography: {
      fontFamily: 'roboto',
      primaryTextColor: '#1e3a8a',
      secondaryTextColor: '#3b82f6',
      headingColor: '#1e40af'
    },
    colorScheme: {
      primary: '#3b82f6',
      secondary: '#f59e0b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    createdBy: 'system'
  },
  {
    name: 'Vibrant Gradient',
    description: 'Eye-catching gradient theme with bold colors',
    isGlobalDefault: false,
    pageBackground: {
      type: 'gradient',
      gradientAngle: 135,
      gradientStops: [
        { color: '#fdf2f8', position: 0 },
        { color: '#fce7f3', position: 50 },
        { color: '#fbcfe8', position: 100 }
      ]
    },
    heroBackground: {
      type: 'gradient',
      gradientAngle: 135,
      gradientStops: [
        { color: '#ec4899', position: 0 },
        { color: '#8b5cf6', position: 100 }
      ]
    },
    contentBoxBackground: {
      type: 'solid',
      solidColor: '#ffffff',
      opacity: 0.9
    },
    typography: {
      fontFamily: 'poppins',
      primaryTextColor: '#831843',
      secondaryTextColor: '#9f1239',
      headingColor: '#701a75'
    },
    colorScheme: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    createdBy: 'system'
  },
  {
    name: 'Minimal Gray',
    description: 'Clean, minimal design with grayscale palette',
    isGlobalDefault: false,
    pageBackground: {
      type: 'solid',
      solidColor: '#fafafa'
    },
    heroBackground: {
      type: 'solid',
      solidColor: '#e5e5e5'
    },
    contentBoxBackground: {
      type: 'solid',
      solidColor: '#ffffff',
      opacity: 1
    },
    typography: {
      fontFamily: 'inter',
      primaryTextColor: '#404040',
      secondaryTextColor: '#737373',
      headingColor: '#262626'
    },
    colorScheme: {
      primary: '#525252',
      secondary: '#737373',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    createdBy: 'system'
  }
];
