// WHAT: Chart height calculation system based on grid width units
// WHY: Maintain consistent aspect ratios across different block widths
// HOW: Height multiplier determined by total units in block

/**
 * WHAT: Calculate height multiplier based on total grid units in a block
 * WHY: Different block widths require different height ratios for optimal visual balance
 * HOW: Returns multiplier to apply to unit width
 * 
 * Rules (desktop):
 * - 1 unit → height = 0.5 unit → aspect ratio 2:1
 * - 2 units → height = 1 unit → aspect ratio 2:1 (elements can be 1:1 or 2:1 individually)
 * - 3 units → height = 1 unit → aspect ratio 3:1 (individual elements 1:1)
 * - 4 units → height = 1.5 units → aspect ratio 8:3 (1-unit elements 2:3, 2-unit elements 4:3)
 * - 5+ units → height = 1.5 units → aspect ratio varies (1-unit elements 2:3)
 * 
 * @param totalUnits - Total number of grid units in the block
 * @returns Height multiplier to apply to unit width
 */
export function getHeightMultiplier(totalUnits: number): number {
  if (totalUnits <= 0) return 1; // Fallback for invalid input
  
  if (totalUnits === 1) {
    return 0.5; // 1 unit wide → 0.5 unit height → 2:1 aspect ratio
  }
  
  if (totalUnits === 2 || totalUnits === 3) {
    return 1; // 2-3 units wide → 1 unit height → 2:1 or 3:1 aspect ratio
  }
  
  // 4+ units → 1.5 unit height
  return 1.5;
}

/**
 * WHAT: Calculate target height for CHART GRAPHIC AREA ONLY (not title/subtitle)
 * WHY: Provide consistent chart heights based on available width and total units
 * HOW: unitWidth = blockWidth / totalUnits, then height = unitWidth * multiplier
 * 
 * NOTE: This height is ONLY for the chart graphic area. Title and subtitle are
 *       separate layers with their own fixed heights (if alignment is enabled):
 *       - Title: 4rem (or minElementHeight)
 *       - Subtitle: 2rem (or 0.5 × minElementHeight)
 *       - Chart graphic: calculated by this function
 * 
 * @param blockWidth - Width of the block container in pixels
 * @param totalUnits - Total number of grid units in the block
 * @param maxHeight - Optional maximum height cap (default: 800px)
 * @returns Target height in pixels for chart graphic area
 */
export function calculateBlockHeight(
  blockWidth: number,
  totalUnits: number,
  maxHeight: number = 800
): number {
  if (blockWidth <= 0 || totalUnits <= 0) {
    return 0; // Invalid input
  }
  
  const unitWidth = blockWidth / totalUnits;
  const heightMultiplier = getHeightMultiplier(totalUnits);
  const targetHeight = Math.round(unitWidth * heightMultiplier);
  
  // Cap at maximum to prevent unreasonably tall charts
  return Math.min(targetHeight, maxHeight);
}

/**
 * WHAT: Get debug information about height calculation
 * WHY: Help developers understand why charts have certain heights
 * HOW: Return detailed breakdown of calculation
 */
export function getHeightCalculationDebug(
  blockWidth: number,
  totalUnits: number
): {
  blockWidth: number;
  totalUnits: number;
  unitWidth: number;
  heightMultiplier: number;
  targetHeight: number;
  aspectRatio: string;
} {
  const unitWidth = blockWidth / totalUnits;
  const heightMultiplier = getHeightMultiplier(totalUnits);
  const targetHeight = Math.round(unitWidth * heightMultiplier);
  const aspectRatio = `${totalUnits}:${heightMultiplier}`;
  
  return {
    blockWidth,
    totalUnits,
    unitWidth,
    heightMultiplier,
    targetHeight,
    aspectRatio
  };
}
