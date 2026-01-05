/* WHAT: Utility functions for font management
 * WHY: Centralized font name to CSS font-family mapping
 * HOW: Uses available fonts from database or defaults */

import { AvailableFont, DEFAULT_FONTS } from './fontTypes';

/**
 * WHAT: Get CSS font-family value from font name
 * WHY: Map font display names to CSS values dynamically
 * HOW: Lookup in available fonts or use defaults
 */
export function getFontFamilyCSS(fontName: string, availableFonts: AvailableFont[] = []): string {
  // Use provided fonts or defaults
  const fonts = availableFonts.length > 0 ? availableFonts : DEFAULT_FONTS;
  
  // Find font by name (case-insensitive)
  const font = fonts.find(f => 
    f.name.toLowerCase() === fontName.toLowerCase() ||
    f.name.toLowerCase().replace(/\s+/g, '') === fontName.toLowerCase().replace(/\s+/g, '')
  );
  
  if (font) {
    return font.fontFamily;
  }
  
  // Fallback: try to construct from name
  // For Google Fonts, use var(--font-*) format
  const normalizedName = fontName.toLowerCase().replace(/\s+/g, '');
  if (['inter', 'roboto', 'poppins', 'montserrat'].includes(normalizedName)) {
    return `var(--font-${normalizedName})`;
  }
  
  // For custom fonts, wrap in quotes
  if (fontName === 'AS Roma' || fontName === 'Aquatic') {
    return `"${fontName}", sans-serif`;
  }
  
  // System default
  if (fontName.toLowerCase().includes('system')) {
    return 'system-ui';
  }
  
  // Final fallback: use name as-is with quotes
  return `"${fontName}", sans-serif`;
}

/**
 * WHAT: Get font key from font name (for API compatibility)
 * WHY: API expects lowercase keys without spaces
 * HOW: Normalize font name to key format
 */
export function getFontKey(fontName: string): string {
  return fontName.toLowerCase().replace(/\s+/g, '');
}

/**
 * WHAT: Get font name from font key (reverse lookup)
 * WHY: Convert API keys back to display names
 * HOW: Match against available fonts
 */
export function getFontNameFromKey(fontKey: string, availableFonts: AvailableFont[] = []): string {
  const fonts = availableFonts.length > 0 ? availableFonts : DEFAULT_FONTS;
  
  const font = fonts.find(f => 
    getFontKey(f.name) === fontKey.toLowerCase()
  );
  
  return font?.name || fontKey;
}

