// lib/imageLayoutUtils.ts
// WHAT: Image layout utility for aspect ratio → grid width calculation
// WHY: Consistent image sizing based on 3 fixed aspect ratios (v9.3.0)
// HOW: Portrait (1 unit), Square (2 units), Landscape (3 units)

/**
 * WHAT: Calculate grid width units from aspect ratio
 * WHY: Maintain consistent row heights regardless of image orientation
 * HOW: Width calculated to match reference height (portrait as baseline)
 * 
 * @param aspectRatio - Image aspect ratio ('16:9', '9:16', '1:1')
 * @returns Grid width in units (1, 2, or 3)
 * 
 * CALCULATION LOGIC:
 * - Portrait (9:16): 1 unit width → reference height
 * - Square (1:1): To match portrait height with 1:1 ratio = 1.78× width → rounded to 2 units
 * - Landscape (16:9): To match portrait height with 16:9 ratio = 2.8× width → rounded to 3 units
 * 
 * EXAMPLE:
 * If portrait image is 300px wide × 533px tall (9:16 ratio):
 * - Square must be 533px × 533px → width = 533/300 = 1.78× → 2 units
 * - Landscape must be 947px × 533px → width = 947/300 = 3.16× → 3 units
 */
export function calculateImageWidth(aspectRatio: '16:9' | '9:16' | '1:1'): number {
  switch (aspectRatio) {
    case '9:16': // Portrait
      // WHAT: Baseline reference - 1 grid unit
      // WHY: Portrait is tallest, other ratios scale to match
      return 1;
      
    case '16:9': // Landscape
      // WHAT: 3 grid units for landscape images
      // WHY: To match portrait height with 16:9 ratio requires ~2.8× width
      // HOW: Rounded to 3 for clean grid math
      return 3;
      
    case '1:1': // Square
      // WHAT: 2 grid units for square images
      // WHY: To match portrait height with 1:1 ratio requires ~1.78× width
      // HOW: Rounded to 2 for clean grid math
      return 2;
      
    default:
      // WHAT: Fallback to 1 unit for unknown ratios
      // WHY: Graceful degradation if new ratio added without updating this function
      console.warn(`Unknown aspect ratio: ${aspectRatio}, defaulting to 1 unit`);
      return 1;
  }
}

/**
 * WHAT: Get human-readable label for aspect ratio
 * WHY: Display friendly names in UI (admin panels, tooltips)
 * HOW: Map ratio codes to descriptive labels with emojis
 * 
 * @param aspectRatio - Image aspect ratio
 * @returns Formatted label (e.g., "🖼️ Landscape (16:9)")
 */
export function getAspectRatioLabel(aspectRatio: '16:9' | '9:16' | '1:1'): string {
  switch (aspectRatio) {
    case '16:9':
      return '🖼️ Landscape (16:9)';
    case '9:16':
      return '📱 Portrait (9:16)';
    case '1:1':
      return '⬜ Square (1:1)';
    default:
      return aspectRatio;
  }
}

/**
 * WHAT: Get CSS aspect ratio string for background-size calculations
 * WHY: Used by ImageChart component for consistent rendering
 * HOW: Returns decimal ratio for CSS aspect-ratio property
 * 
 * @param aspectRatio - Image aspect ratio
 * @returns CSS-compatible ratio (e.g., "16/9", "9/16", "1/1")
 */
export function getCSSAspectRatio(aspectRatio: '16:9' | '9:16' | '1:1'): string {
  // WHAT: Return slash-separated ratio for CSS
  // WHY: CSS aspect-ratio property uses "width / height" format
  return aspectRatio.replace(':', '/');
}

/**
 * WHAT: Validate aspect ratio value
 * WHY: Ensure only supported ratios are used
 * HOW: Type guard for TypeScript safety
 * 
 * @param value - Value to validate
 * @returns True if valid aspect ratio
 */
export function isValidAspectRatio(value: string): value is '16:9' | '9:16' | '1:1' {
  return value === '16:9' || value === '9:16' || value === '1:1';
}

/**
 * WHAT: Get default aspect ratio for new image charts
 * WHY: Landscape is most common use case
 * HOW: Returns '16:9' as sensible default
 * 
 * @returns Default aspect ratio
 */
export function getDefaultAspectRatio(): '16:9' {
  return '16:9';
}
