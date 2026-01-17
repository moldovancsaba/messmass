// lib/layoutV2BlockCalculator.ts
// WHAT: LayoutV2 block height and unit packing calculator
// WHY: Implements LayoutV2 contract (4:1 aspect ratio, 4-unit capacity, deterministic packing)
// HOW: Calculates block height from aspect ratio, validates unit capacity, allocates widths

import type { CellConfiguration } from './layoutGrammar';

/**
 * WHAT: Calculate LayoutV2 block height from aspect ratio
 * WHY: LayoutV2 contract supports variable aspect ratios (4:1 to 4:10) for TEXT-AREA/TABLE blocks
 * HOW: blockHeight = blockWidth / aspectRatioDivisor
 * 
 * @param blockWidth - Block width in pixels
 * @param blockAspectRatio - Optional aspect ratio override (e.g., "4:6" for 4:6 ratio)
 * @returns Block height in pixels
 */
export function calculateLayoutV2BlockHeight(
  blockWidth: number,
  blockAspectRatio?: string
): number {
  if (blockWidth <= 0) {
    console.warn('[LayoutV2] Invalid block width:', blockWidth);
    return 300; // Fallback to reasonable default
  }
  
  // WHAT: Default to 4:1 aspect ratio if not specified
  // WHY: Maintain backward compatibility
  if (!blockAspectRatio) {
    return blockWidth / 4;
  }
  
  // WHAT: Parse aspect ratio string (e.g., "4:6" -> width:height = 4:6)
  // WHY: Support variable aspect ratios for TEXT-AREA/TABLE blocks
  // HOW: Extract width and height from "width:height" format
  const aspectRatioMatch = blockAspectRatio.match(/^(\d+):(\d+)$/);
  if (!aspectRatioMatch) {
    console.warn('[LayoutV2] Invalid aspect ratio format:', blockAspectRatio, '- using default 4:1');
    return blockWidth / 4;
  }
  
  const aspectWidth = parseInt(aspectRatioMatch[1], 10);
  const aspectHeight = parseInt(aspectRatioMatch[2], 10);
  
  if (aspectWidth <= 0 || aspectHeight <= 0) {
    console.warn('[LayoutV2] Invalid aspect ratio values:', blockAspectRatio, '- using default 4:1');
    return blockWidth / 4;
  }
  
  // WHAT: Calculate height from aspect ratio
  // WHY: blockHeight = blockWidth × (aspectHeight / aspectWidth)
  // HOW: For 4:6 ratio: height = width × (6/4) = width × 1.5
  return (blockWidth * aspectHeight) / aspectWidth;
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
 * WHAT: Validate aspect ratio override is allowed for block content
 * WHY: R-LAYOUT-02.1 - Override only allowed when block contains TEXT-AREA or TABLE items
 * HOW: Check if all charts are TEXT or TABLE type
 * 
 * @param charts - Array of charts with type property
 * @returns Validation result
 */
export function validateAspectRatioOverride(
  charts: Array<{ type?: string }>
): { valid: boolean; error?: string } {
  if (charts.length === 0) {
    return { valid: false, error: 'Cannot apply aspect ratio override to empty block' };
  }
  
  // WHAT: Check if all charts are TEXT or TABLE type
  // WHY: Override only allowed for TEXT-AREA/TABLE blocks
  const allowedTypes = ['text', 'table'];
  const allAllowed = charts.every(chart => {
    const chartType = chart.type?.toLowerCase();
    return chartType && allowedTypes.includes(chartType);
  });
  
  if (!allAllowed) {
    const invalidTypes = charts
      .map(c => c.type?.toLowerCase())
      .filter(t => t && !allowedTypes.includes(t));
    return {
      valid: false,
      error: `Aspect ratio override only allowed for TEXT-AREA/TABLE blocks. Found invalid types: ${invalidTypes.join(', ')}`
    };
  }
  
  return { valid: true };
}

/**
 * WHAT: Validate aspect ratio is within supported range (4:1 to 4:10)
 * WHY: R-LAYOUT-02.1 - Constrain aspect ratio to reasonable limits
 * HOW: Parse and check aspect ratio values
 * 
 * @param blockAspectRatio - Aspect ratio string (e.g., "4:6")
 * @returns Validation result
 */
export function validateAspectRatioRange(
  blockAspectRatio: string
): { valid: boolean; error?: string } {
  const aspectRatioMatch = blockAspectRatio.match(/^(\d+):(\d+)$/);
  if (!aspectRatioMatch) {
    return { valid: false, error: `Invalid aspect ratio format: ${blockAspectRatio}. Expected format: "width:height"` };
  }
  
  const aspectWidth = parseInt(aspectRatioMatch[1], 10);
  const aspectHeight = parseInt(aspectRatioMatch[2], 10);
  
  // WHAT: Validate aspect ratio is 4:1 to 4:10
  // WHY: Constrain to reasonable range for TEXT-AREA/TABLE blocks
  if (aspectWidth !== 4) {
    return { valid: false, error: `Aspect ratio width must be 4. Got: ${aspectWidth}` };
  }
  
  if (aspectHeight < 1 || aspectHeight > 10) {
    return { valid: false, error: `Aspect ratio height must be between 1 and 10. Got: ${aspectHeight}` };
  }
  
  return { valid: true };
}

/**
 * WHAT: Calculate LayoutV2 block dimensions and validate capacity
 * WHY: Ensure block complies with LayoutV2 contract before rendering
 * HOW: Validate capacity, calculate height from aspect ratio, allocate widths
 * 
 * @param charts - Array of charts with width and optional type property
 * @param blockWidth - Block width in pixels
 * @param blockAspectRatio - Optional aspect ratio override (e.g., "4:6")
 * @returns Block dimensions and validation result
 */
export function calculateLayoutV2BlockDimensions(
  charts: Array<{ width: number; type?: string }>,
  blockWidth: number,
  blockAspectRatio?: string
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
  
  // WHAT: Validate aspect ratio override if provided
  // WHY: R-LAYOUT-02.1 - Override only allowed for TEXT-AREA/TABLE blocks
  if (blockAspectRatio) {
    // WHAT: Validate aspect ratio range (4:1 to 4:10)
    const rangeValidation = validateAspectRatioRange(blockAspectRatio);
    if (!rangeValidation.valid) {
      console.warn('[LayoutV2] Invalid aspect ratio range:', rangeValidation.error, '- using default 4:1');
      // Fall through to default 4:1
    } else {
      // WHAT: Validate override is allowed for block content
      const overrideValidation = validateAspectRatioOverride(charts);
      if (!overrideValidation.valid) {
        console.warn('[LayoutV2] Aspect ratio override not allowed:', overrideValidation.error, '- using default 4:1');
        // Fall through to default 4:1
      } else {
        // WHAT: Use custom aspect ratio
        const blockHeight = calculateLayoutV2BlockHeight(blockWidth, blockAspectRatio);
        const gridColumns = calculateLayoutV2GridColumns(charts);
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
    }
  }
  
  // WHAT: Calculate block height from default 4:1 aspect ratio
  // WHY: Default behavior unchanged when not specified
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
