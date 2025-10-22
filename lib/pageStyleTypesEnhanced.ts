/* WHAT: Enhanced TypeScript types for comprehensive Page Styles system
 * WHY: Support advanced styling with gradients, typography, and color schemes
 * HOW: Extends basic PageStyle with detailed customization options
 * REPLACES: Legacy pageStyleTypes.ts with richer feature set */

import { PageStyle as LegacyPageStyle } from './pageStyleTypes';

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
 */
export interface Typography {
  fontFamily: 'inter' | 'roboto' | 'poppins';
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
 * WHAT: Enhanced page style configuration with comprehensive options
 * WHY: Single source of truth for all styling customization
 * STORAGE: MongoDB collection 'page_styles'
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
    return background.solidColor || '#ffffff';
  }
  
  if (!background.gradientStops || background.gradientStops.length < 2) {
    return '#ffffff'; // Fallback
  }
  
  const angle = background.gradientAngle || 0;
  const stops = background.gradientStops
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
 * WHAT: Convert legacy PageStyle to enhanced format
 * WHY: Backwards compatibility with existing styles
 */
export function legacyToEnhanced(legacy: LegacyPageStyle): PageStyleEnhanced {
  // Parse legacy gradient format: "0deg, #ffffffff 0%, #ffffffff 100%"
  const parseGradient = (gradientStr: string): BackgroundStyle => {
    const parts = gradientStr.split(',').map(s => s.trim());
    if (parts.length < 2) {
      return { type: 'solid', solidColor: '#ffffff' };
    }
    
    const angle = parseInt(parts[0]);
    const stops: GradientStop[] = [];
    
    for (let i = 1; i < parts.length; i++) {
      const match = parts[i].match(/(#[0-9a-fA-F]{6,8})\s+(\d+)%/);
      if (match) {
        stops.push({
          color: match[1].slice(0, 7), // Remove alpha if present
          position: parseInt(match[2])
        });
      }
    }
    
    return {
      type: 'gradient',
      gradientAngle: angle,
      gradientStops: stops.length >= 2 ? stops : [
        { color: '#ffffff', position: 0 },
        { color: '#ffffff', position: 100 }
      ]
    };
  };
  
  return {
    _id: legacy._id,
    name: legacy.name,
    isGlobalDefault: false, // Legacy styles not global by default
    pageBackground: parseGradient(legacy.backgroundGradient),
    heroBackground: parseGradient(legacy.headerBackgroundGradient),
    contentBoxBackground: {
      type: 'solid',
      solidColor: legacy.contentBackgroundColor || '#ffffff',
      opacity: 0.95
    },
    typography: {
      fontFamily: 'inter',
      primaryTextColor: legacy.titleBubble.textColor,
      secondaryTextColor: '#6b7280',
      headingColor: '#1f2937'
    },
    colorScheme: {
      primary: legacy.titleBubble.backgroundColor,
      secondary: '#10b981',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    createdAt: legacy.createdAt ? new Date(legacy.createdAt) : undefined,
    updatedAt: legacy.updatedAt ? new Date(legacy.updatedAt) : undefined
  };
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
