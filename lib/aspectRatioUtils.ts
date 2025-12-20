// WHAT: Centralized aspect ratio utilities for IMAGE charts
// WHY: Aspect ratio logic was duplicated across 3+ files (audit finding)
// HOW: Single source of truth for aspect ratio calculations and conversions

/**
 * Supported aspect ratios for IMAGE charts
 */
export type AspectRatio = '16:9' | '9:16' | '1:1';

/**
 * Aspect ratio configuration with grid width mapping
 */
export interface AspectRatioConfig {
  ratio: AspectRatio;
  width: number;        // Grid units (1-3)
  widthPercent: number; // CSS percentage
  heightRatio: number;  // For padding-bottom technique
  label: string;        // Human-readable label
}

/**
 * Aspect ratio constants
 * WHAT: Pre-defined configurations for all supported aspect ratios
 * WHY: Consistent grid width and height calculations across app
 */
export const ASPECT_RATIO_CONFIGS: Record<AspectRatio, AspectRatioConfig> = {
  '16:9': {
    ratio: '16:9',
    width: 3,             // Landscape - 3 grid units (wide)
    widthPercent: 100,    // Full width of grid cell
    heightRatio: 56.25,   // (9/16) * 100 = 56.25%
    label: 'Landscape (16:9)'
  },
  '9:16': {
    ratio: '9:16',
    width: 1,             // Portrait - 1 grid unit (narrow)
    widthPercent: 100,    // Full width of grid cell
    heightRatio: 177.78,  // (16/9) * 100 = 177.78%
    label: 'Portrait (9:16)'
  },
  '1:1': {
    ratio: '1:1',
    width: 2,             // Square - 2 grid units (medium)
    widthPercent: 100,    // Full width of grid cell
    heightRatio: 100,     // 1:1 = 100%
    label: 'Square (1:1)'
  }
};

/**
 * Default aspect ratio for IMAGE charts
 */
export const DEFAULT_ASPECT_RATIO: AspectRatio = '16:9';

/**
 * Calculate grid width (in units) from aspect ratio
 * WHAT: Convert aspect ratio to grid unit width (1-3)
 * WHY: Builder mode, chart layout, and PDF export need consistent widths
 * 
 * @param aspectRatio - Aspect ratio string ('16:9', '9:16', '1:1')
 * @returns Grid width in units (1=portrait, 2=square, 3=landscape)
 * 
 * @example
 * ```typescript
 * calculateImageWidth('16:9') // Returns: 3 (landscape)
 * calculateImageWidth('9:16') // Returns: 1 (portrait)
 * calculateImageWidth('1:1')  // Returns: 2 (square)
 * ```
 */
export function calculateImageWidth(aspectRatio: AspectRatio | undefined): number {
  if (!aspectRatio) return ASPECT_RATIO_CONFIGS[DEFAULT_ASPECT_RATIO].width;
  
  const config = ASPECT_RATIO_CONFIGS[aspectRatio];
  return config ? config.width : ASPECT_RATIO_CONFIGS[DEFAULT_ASPECT_RATIO].width;
}

/**
 * Get aspect ratio configuration
 * WHAT: Retrieve full config object for an aspect ratio
 * WHY: Components need width, height ratio, and labels
 * 
 * @param aspectRatio - Aspect ratio string or undefined
 * @returns Configuration object with all aspect ratio properties
 * 
 * @example
 * ```typescript
 * const config = getAspectRatioConfig('16:9');
 * console.log(config.width);        // 3
 * console.log(config.heightRatio);  // 56.25
 * console.log(config.label);        // "Landscape (16:9)"
 * ```
 */
export function getAspectRatioConfig(aspectRatio: AspectRatio | undefined): AspectRatioConfig {
  if (!aspectRatio) return ASPECT_RATIO_CONFIGS[DEFAULT_ASPECT_RATIO];
  
  const config = ASPECT_RATIO_CONFIGS[aspectRatio];
  return config || ASPECT_RATIO_CONFIGS[DEFAULT_ASPECT_RATIO];
}

/**
 * Calculate height ratio percentage for padding-bottom technique
 * WHAT: Convert aspect ratio to CSS percentage for aspect ratio preservation
 * WHY: CSS padding-bottom technique requires percentage for responsive aspect ratios
 * 
 * @param aspectRatio - Aspect ratio string
 * @returns Height as percentage of width
 * 
 * @example
 * ```typescript
 * // CSS usage:
 * const heightRatio = calculateHeightRatio('16:9');
 * <div style={{ paddingBottom: `${heightRatio}%` }} />
 * ```
 */
export function calculateHeightRatio(aspectRatio: AspectRatio | undefined): number {
  const config = getAspectRatioConfig(aspectRatio);
  return config.heightRatio;
}

/**
 * Validate aspect ratio string
 * WHAT: Check if string is a valid aspect ratio
 * WHY: Type safety for runtime validation (API inputs, database values)
 * 
 * @param value - String to validate
 * @returns true if valid aspect ratio, false otherwise
 * 
 * @example
 * ```typescript
 * isValidAspectRatio('16:9')  // true
 * isValidAspectRatio('4:3')   // false (not supported)
 * isValidAspectRatio(null)    // false
 * ```
 */
export function isValidAspectRatio(value: unknown): value is AspectRatio {
  if (typeof value !== 'string') return false;
  return value === '16:9' || value === '9:16' || value === '1:1';
}

/**
 * Get all aspect ratio options for dropdowns/selects
 * WHAT: Return array of aspect ratios with labels
 * WHY: Admin UI dropdowns need human-readable labels
 * 
 * @returns Array of aspect ratio options with value and label
 * 
 * @example
 * ```typescript
 * const options = getAspectRatioOptions();
 * options.forEach(opt => {
 *   console.log(`${opt.label}: ${opt.value}`);
 * });
 * // Output:
 * // Landscape (16:9): 16:9
 * // Square (1:1): 1:1
 * // Portrait (9:16): 9:16
 * ```
 */
export function getAspectRatioOptions(): Array<{ value: AspectRatio; label: string }> {
  return Object.values(ASPECT_RATIO_CONFIGS).map(config => ({
    value: config.ratio,
    label: config.label
  }));
}

/**
 * Calculate actual pixel dimensions from aspect ratio and container width
 * WHAT: Compute exact pixel height based on aspect ratio and known width
 * WHY: PDF export and canvas rendering need exact dimensions
 * 
 * @param aspectRatio - Aspect ratio string
 * @param containerWidth - Width in pixels
 * @returns Height in pixels that maintains aspect ratio
 * 
 * @example
 * ```typescript
 * // For a 1200px wide container with 16:9 aspect ratio:
 * const height = calculatePixelHeight('16:9', 1200);
 * console.log(height); // 675 (1200 * 9/16)
 * ```
 */
export function calculatePixelHeight(
  aspectRatio: AspectRatio | undefined,
  containerWidth: number
): number {
  const config = getAspectRatioConfig(aspectRatio);
  return Math.round(containerWidth * (config.heightRatio / 100));
}

/**
 * Parse aspect ratio string to numeric ratio
 * WHAT: Convert "16:9" string to numeric ratio (1.777...)
 * WHY: Mathematical calculations need numeric ratios
 * 
 * @param aspectRatio - Aspect ratio string
 * @returns Numeric ratio (width/height)
 * 
 * @example
 * ```typescript
 * parseAspectRatioToNumber('16:9')  // 1.777...
 * parseAspectRatioToNumber('9:16')  // 0.5625
 * parseAspectRatioToNumber('1:1')   // 1.0
 * ```
 */
export function parseAspectRatioToNumber(aspectRatio: AspectRatio | undefined): number {
  const config = getAspectRatioConfig(aspectRatio);
  
  // Calculate from height ratio (inverse relationship)
  // heightRatio = (height/width) * 100
  // widthRatio = 100 / heightRatio
  return 100 / config.heightRatio;
}

/**
 * Get CSS style object for aspect ratio container
 * WHAT: Generate CSS properties for aspect ratio preservation
 * WHY: Consistent styling across all IMAGE chart components
 * 
 * @param aspectRatio - Aspect ratio string
 * @returns CSS properties object for React style prop
 * 
 * @example
 * ```typescript
 * const imageStyle = getAspectRatioStyle('16:9');
 * <div style={imageStyle}>
 *   <img src="..." />
 * </div>
 * ```
 */
export function getAspectRatioStyle(aspectRatio: AspectRatio | undefined): React.CSSProperties {
  const config = getAspectRatioConfig(aspectRatio);
  
  return {
    position: 'relative' as const,
    width: '100%',
    paddingBottom: `${config.heightRatio}%`,
    overflow: 'hidden' as const
  };
}
