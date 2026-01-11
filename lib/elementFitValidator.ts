// lib/elementFitValidator.ts
// WHAT: Element fit validation for Layout Grammar system
// WHY: Determines if element content fits in allocated space and returns required actions
// HOW: Validates each element type (text, table, pie, bar, kpi, image) against container dimensions

import type { CellConfiguration, ElementFitValidation } from './layoutGrammar';

/**
 * Validates if an element fits in the allocated space
 * 
 * @param cellConfig - Cell configuration with element type and metadata
 * @param containerHeight - Available height in pixels
 * @param containerWidth - Available width in pixels
 * @returns Element fit validation result with required actions
 */
export function validateElementFit(
  cellConfig: CellConfiguration,
  containerHeight: number,
  containerWidth: number
): ElementFitValidation {
  const { bodyType } = cellConfig;

  switch (bodyType) {
    case 'text':
      return validateTextElementFit(cellConfig, containerHeight, containerWidth);
    case 'table':
      return validateTableElementFit(cellConfig, containerHeight, containerWidth);
    case 'pie':
      return validatePieElementFit(cellConfig, containerHeight, containerWidth);
    case 'bar':
      return validateBarElementFit(cellConfig, containerHeight, containerWidth);
    case 'kpi':
      return validateKPIElementFit(cellConfig, containerHeight, containerWidth);
    case 'image':
      return validateImageElementFit(cellConfig, containerHeight, containerWidth);
    default:
      // Unknown element type - assume it fits but log warning
      return {
        fits: true,
        violations: [`Unknown element type: ${bodyType}`],
        requiredActions: []
      };
  }
}

/**
 * Validates text element fit
 */
function validateTextElementFit(
  cellConfig: CellConfiguration,
  containerHeight: number,
  containerWidth: number
): ElementFitValidation {
  const contentMetadata = cellConfig.contentMetadata || {};
  // Text elements always fit (they scale to available space)
  // Content metadata may contain character/line counts for future enhancements
  return {
    fits: true,
    violations: [],
    requiredActions: []
  };
}

/**
 * Validates table element fit (max 17 visible rows)
 */
function validateTableElementFit(
  cellConfig: CellConfiguration,
  containerHeight: number,
  containerWidth: number
): ElementFitValidation {
  const contentMetadata = cellConfig.contentMetadata || {};
  const rowCount = (contentMetadata.rowCount as number) || 0;
  const maxVisibleRows = 17;
  
  if (rowCount <= maxVisibleRows) {
    return {
      fits: true,
      violations: [],
      requiredActions: []
    };
  }

  // Table exceeds max visible rows - requires aggregation
  return {
    fits: false,
    violations: [`Table has ${rowCount} rows, exceeds maximum of ${maxVisibleRows} visible rows`],
    requiredActions: ['aggregate']
  };
}

/**
 * Validates pie element fit (legend must fit)
 */
function validatePieElementFit(
  cellConfig: CellConfiguration,
  containerHeight: number,
  containerWidth: number
): ElementFitValidation {
  const contentMetadata = cellConfig.contentMetadata || {};
  const legendItemCount = (contentMetadata.legendItemCount as number) || 0;
  const minPieRadius = 50; // Minimum readable pie radius
  
  // WHAT: Calculate required height for PIE chart with legend
  // WHY: Layout Grammar requires accurate height calculation to prevent compression
  // HOW: Sum all components: title (30%) + pie (40%) + legend (30-50% based on item count)
  
  // Base components:
  // - Title: 30% of container height
  // - Pie chart: 40% of container height (minimum 100px for 50px radius)
  // - Legend: 30% preferred, can grow to 50% if many items
  
  // WHAT: Calculate minimum pie chart height requirement
  // WHY: Pie chart must be at least 50px radius (100px height) to be readable
  // HOW: Pie gets 40% of container, so container must be at least 100px / 0.4 = 250px
  const minPieHeight = minPieRadius * 2; // 100px
  const minContainerHeightForPie = minPieHeight / 0.4; // 250px (pie is 40% of container)
  
  // WHAT: Calculate required height for legend based on item count
  // WHY: Many legend items (>5) or long labels cause legend to grow to 50% max-height
  // HOW: If legend grows to 50%, total would be 30% + 40% + 50% = 120%, requiring height increase
  let legendHeightRatio = 0.3; // Preferred 30%
  if (legendItemCount > 5) {
    // WHAT: Many legend items (>5) cause legend to grow to max-height 50%
    // WHY: Legend container uses flex: 1 1 30% with max-height: 50%
    // HOW: Calculate required height to accommodate 50% legend
    legendHeightRatio = 0.5; // Max 50%
  }
  
  // WHAT: Calculate total required height
  // WHY: Need to ensure all components fit: title (30%) + pie (40%) + legend (30-50%)
  // HOW: If legend is 50%, total is 120%, so container must be larger
  const totalRatio = 0.3 + 0.4 + legendHeightRatio; // title + pie + legend
  const estimatedRequiredHeight = Math.max(
    minContainerHeightForPie, // Minimum for pie chart readability
    containerHeight * totalRatio // Height needed if legend grows
  );
  
  if (containerHeight >= estimatedRequiredHeight) {
    return {
      fits: true,
      violations: [],
      requiredActions: []
    };
  }
  
  // PIE chart doesn't fit - requires height increase
  return {
    fits: false,
    requiredHeight: estimatedRequiredHeight,
    violations: [
      `Pie chart requires minimum height of ${estimatedRequiredHeight}px for ${legendItemCount} legend items (legend may grow to ${(legendHeightRatio * 100).toFixed(0)}% of container)`
    ],
    requiredActions: ['increaseHeight']
  };
}

/**
 * Validates bar element fit
 * 
 * Layout Grammar Rule: Minimum bar height 20px per bar
 * Actual calculation accounts for:
 * - Chart body padding (top + bottom)
 * - Per row: label height (2-line max), bar track height (20px min), row spacing
 */
function validateBarElementFit(
  cellConfig: CellConfiguration,
  containerHeight: number,
  containerWidth: number
): ElementFitValidation {
  const contentMetadata = cellConfig.contentMetadata || {};
  const barCount = (contentMetadata.barCount as number) || 0;
  
  if (barCount === 0) {
    return {
      fits: true,
      violations: [],
      requiredActions: []
    };
  }
  
  // WHAT: Calculate actual required height for BAR chart
  // WHY: Layout Grammar requires accurate height calculation to prevent clipping
  // HOW: Sum all components: padding + (rows × rowHeight) + (spacing × gaps)
  
  // Base padding: chart body has var(--mm-space-2) top and bottom = 8px × 2 = 16px
  const chartBodyPadding = 16; // 2 × 8px (--mm-space-2)
  
  // Per-row components:
  // - Label: Can wrap to 2 lines max
  //   Font size: var(--block-base-font-size) - typically 1rem (16px) at base
  //   Line height: 1.2
  //   Max label height: 16px × 1.2 × 2 lines = 38.4px ≈ 40px (rounded up for safety)
  const maxLabelHeight = 40; // 2-line label with line-height 1.2
  
  // - Bar track: Layout Grammar minimum 20px per bar
  //   Actual CSS: clamp(1.2rem, 22cqh, 1.44rem) ≈ 19.2-23px, use 20px minimum
  const minBarTrackHeight = 20; // Layout Grammar requirement
  
  // - Row spacing: border-spacing: 0 var(--mm-space-2) = 8px between rows
  const rowSpacing = 8; // --mm-space-2
  
  // Per-row height: label + bar track (labels and bars are in same row)
  // Row height = max(labelHeight, barHeight) since they're in table cells that align
  // In practice, label can be taller (2 lines), so row height = label height
  const perRowHeight = Math.max(maxLabelHeight, minBarTrackHeight); // Use label height (40px)
  
  // Total required height = padding + (rows × rowHeight) + (gaps × spacing)
  // Gaps = barCount - 1 (no spacing after last row)
  const totalRequiredHeight = chartBodyPadding + (barCount * perRowHeight) + ((barCount - 1) * rowSpacing);
  
  if (containerHeight >= totalRequiredHeight) {
    return {
      fits: true,
      violations: [],
      requiredActions: []
    };
  }

  // Bars don't fit - requires reflow, aggregation, or height increase
  return {
    fits: false,
    requiredHeight: totalRequiredHeight,
    violations: [
      `Bar chart requires minimum height of ${totalRequiredHeight}px for ${barCount} bars ` +
      `(calculated: ${chartBodyPadding}px padding + ${barCount} rows × ${perRowHeight}px + ${barCount - 1} gaps × ${rowSpacing}px)`
    ],
    requiredActions: ['reflow', 'increaseHeight', 'aggregate']
  };
}

/**
 * Validates KPI element fit
 */
function validateKPIElementFit(
  cellConfig: CellConfiguration,
  containerHeight: number,
  containerWidth: number
): ElementFitValidation {
  // KPI elements are compact and always fit
  return {
    fits: true,
    violations: [],
    requiredActions: []
  };
}

/**
 * Validates image element fit
 */
function validateImageElementFit(
  cellConfig: CellConfiguration,
  containerHeight: number,
  containerWidth: number
): ElementFitValidation {
  // Image fit is handled by aspect ratio in height resolution
  // If imageMode is 'setIntrinsic', height is driven by aspect ratio (Priority 1)
  // If imageMode is 'cover', image scales to fill container
  return {
    fits: true,
    violations: [],
    requiredActions: []
  };
}

