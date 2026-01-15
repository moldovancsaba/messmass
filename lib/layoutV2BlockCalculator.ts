// lib/layoutV2BlockCalculator.ts
// WHAT: LayoutV2 block height and unit packing calculator
// WHY: Implements LayoutV2 contract (4:1 aspect ratio, 4-unit capacity, deterministic packing)
// HOW: Calculates block height from aspect ratio, validates unit capacity, allocates widths

import type { CellConfiguration } from './layoutGrammar';

/**
 * WHAT: Calculate LayoutV2 block height from aspect ratio
 * WHY: LayoutV2 contract specifies fixed 4:1 aspect ratio
 * HOW: blockHeight = blockWidth / 4
 * 
 * @param blockWidth - Block width in pixels
 * @returns Block height in pixels (4:1 aspect ratio)
 */
export function calculateLayoutV2BlockHeight(blockWidth: number): number {
  if (blockWidth <= 0) {
    console.warn('[LayoutV2] Invalid block width:', blockWidth);
    return 300; // Fallback to reasonable default
  }
  return blockWidth / 4;
}

/**
 * WHAT: Validate block unit capacity per LayoutV2 contract
 * WHY: Blocks must not exceed 4 units total
 * HOW: Sum all chart widths and check if ≤ 4
 * 
 * @param charts - Array of charts with width property
 * @returns Validation result with error message if invalid
 */
export function validateLayoutV2BlockCapacity(
  charts: Array<{ width: number }>
): { valid: boolean; error?: string; totalUnits: number } {
  const totalUnits = charts.reduce((sum, chart) => sum + (chart.width || 1), 0);
  
  if (totalUnits > 4) {
    return {
      valid: false,
      error: `Block capacity exceeded: sum of chart widths (${totalUnits}) exceeds maximum (4 units)`,
      totalUnits
    };
  }
  
  return { valid: true, totalUnits };
}

/**
 * WHAT: Calculate unit-based width allocation per LayoutV2 contract
 * WHY: Each item's width = (itemUnits / totalUnits) × blockWidth
 * HOW: Deterministic calculation based on unit proportions
 * 
 * @param itemUnits - Units allocated to this item (1 or 2)
 * @param totalUnits - Total units in block (sum of all item units)
 * @param blockWidth - Block width in pixels
 * @returns Item width in pixels
 */
export function calculateLayoutV2ItemWidth(
  itemUnits: number,
  totalUnits: number,
  blockWidth: number
): number {
  if (totalUnits <= 0) {
    console.warn('[LayoutV2] Invalid total units:', totalUnits);
    return blockWidth; // Fallback to full width
  }
  return (itemUnits / totalUnits) * blockWidth;
}

/**
 * WHAT: Calculate grid-template-columns for LayoutV2 deterministic packing
 * WHY: LayoutV2 contract requires unit-based width allocation
 * HOW: Convert chart widths to fr units (e.g., [2,1,1] → "2fr 1fr 1fr")
 * 
 * @param charts - Array of charts with width property
 * @returns CSS grid-template-columns string
 */
export function calculateLayoutV2GridColumns(
  charts: Array<{ width: number }>
): string {
  if (charts.length === 0) return '1fr';
  
  // WHAT: Use chart widths as fr units for deterministic packing
  // WHY: LayoutV2 contract: unit-based width allocation
  // HOW: Each width becomes a fr unit (e.g., width: 2 → 2fr)
  const weights = charts.map(c => c.width || 1);
  return weights.map(w => `${w}fr`).join(' ');
}

/**
 * WHAT: Calculate LayoutV2 block dimensions and validate capacity
 * WHY: Ensure block complies with LayoutV2 contract before rendering
 * HOW: Validate capacity, calculate height from aspect ratio, allocate widths
 * 
 * @param charts - Array of charts with width property
 * @param blockWidth - Block width in pixels
 * @returns Block dimensions and validation result
 */
export function calculateLayoutV2BlockDimensions(
  charts: Array<{ width: number }>,
  blockWidth: number
): {
  valid: boolean;
  error?: string;
  blockHeight: number;
  totalUnits: number;
  gridColumns: string;
  itemWidths: Array<{ chartIndex: number; width: number }>;
} {
  // WHAT: Validate block capacity
  // WHY: LayoutV2 contract requires sum(itemUnits) ≤ 4
  const capacityValidation = validateLayoutV2BlockCapacity(charts);
  if (!capacityValidation.valid) {
    return {
      valid: false,
      error: capacityValidation.error,
      blockHeight: calculateLayoutV2BlockHeight(blockWidth), // Calculate anyway for fallback
      totalUnits: capacityValidation.totalUnits,
      gridColumns: calculateLayoutV2GridColumns(charts),
      itemWidths: charts.map((_, idx) => ({ chartIndex: idx, width: 0 }))
    };
  }
  
  // WHAT: Calculate block height from 4:1 aspect ratio
  // WHY: LayoutV2 contract specifies fixed aspect ratio
  const blockHeight = calculateLayoutV2BlockHeight(blockWidth);
  
  // WHAT: Calculate grid columns for deterministic packing
  // WHY: LayoutV2 contract requires unit-based width allocation
  const gridColumns = calculateLayoutV2GridColumns(charts);
  
  // WHAT: Calculate individual item widths
  // WHY: For validation and debugging
  const itemWidths = charts.map((chart, idx) => ({
    chartIndex: idx,
    width: calculateLayoutV2ItemWidth(chart.width || 1, capacityValidation.totalUnits, blockWidth)
  }));
  
  return {
    valid: true,
    blockHeight,
    totalUnits: capacityValidation.totalUnits,
    gridColumns,
    itemWidths
  };
}
