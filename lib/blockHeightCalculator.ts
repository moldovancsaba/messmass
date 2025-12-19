// lib/blockHeightCalculator.ts
// WHAT: Deterministic block height solver per spec v2.0
// WHY: All cells in a block share the same height H while respecting image aspect ratios

import type { BlockLayoutInput, BlockLayoutResult, CellConfiguration } from './blockLayoutTypes';
import { getAspectRatioValue } from './aspectRatioResolver';

/**
 * WHAT: Solve block height (H) using deterministic formula from spec
 * WHY: All cells in block must share same height while respecting image aspect ratios
 * HOW: H = (blockWidth - sum(non_image_widths)) / sum(image_aspect_ratios)
 * 
 * Formula derivation:
 * blockWidth = sum(all cell widths)
 * blockWidth = sum(image widths) + sum(non-image widths)
 * blockWidth = sum(aspectRatio_i × H) + sum(cellWidth_i × widthPerUnit)
 * blockWidth = H × sum(aspectRatios) + sum(non-image widths)
 * H = (blockWidth - sum(non-image widths)) / sum(aspectRatios)
 * 
 * @param cells - Array of cell configurations with width units and types
 * @param blockWidthPx - Total block width (e.g., 1200px)
 * @returns Calculated block height in pixels
 */
export function solveBlockHeightWithImages(cells: CellConfiguration[], blockWidthPx: number): number {
  if (cells.length === 0) {
    console.warn('[BlockHeightCalculator] No cells in block');
    return 360;
  }
  
  // WHAT: Calculate total "effective units" for proportional distribution
  // WHY: All cells participate in width distribution, but with different weights
  // HOW: 
  //   - Non-IMAGE cells: contribute their cellWidth (1 or 2 units)
  //   - IMAGE cells: contribute their aspectRatio as "effective units"
  //
  // This is because:
  //   - Non-IMAGE width = cellWidth × H
  //   - IMAGE width = aspectRatio × H
  //
  // So IMAGE cells with aspectRatio act like "aspectRatio units" in the distribution
  
  let totalEffectiveUnits = 0;
  const cellDetails: Array<{ chartId: string; type: string; effectiveUnits: number }> = [];
  
  for (const c of cells) {
    if (c.bodyType === 'image') {
      // IMAGE cell: effective units = aspect ratio
      const aspectRatio = getAspectRatioValue(c.aspectRatio || '16:9');
      totalEffectiveUnits += aspectRatio;
      cellDetails.push({ chartId: c.chartId, type: 'image', effectiveUnits: aspectRatio });
    } else {
      // Non-IMAGE cell: effective units = cellWidth
      totalEffectiveUnits += c.cellWidth;
      cellDetails.push({ chartId: c.chartId, type: c.bodyType, effectiveUnits: c.cellWidth });
    }
  }
  
  if (totalEffectiveUnits <= 0) {
    console.warn('[BlockHeightCalculator] Total effective units is 0');
    return 360;
  }
  
  // WHAT: Calculate block height using proportional distribution
  // WHY: All cells share height H, and together they must fill blockWidth
  // HOW: H = blockWidth / totalEffectiveUnits
  //
  // Proof:
  //   blockWidth = sum(all cell widths)
  //   blockWidth = sum(cellWidth_i × H) + sum(aspectRatio_i × H)  
  //   blockWidth = H × (sum(cellWidths) + sum(aspectRatios))
  //   blockWidth = H × totalEffectiveUnits
  //   Therefore: H = blockWidth / totalEffectiveUnits
  const H = blockWidthPx / totalEffectiveUnits;
  
  // WHAT: Apply reasonable bounds
  // WHY: Prevent extreme values from edge cases
  const minHeight = 150;
  const maxHeight = 800;
  const clampedHeight = Math.max(minHeight, Math.min(maxHeight, H));
  
  console.log('[BlockHeightCalculator] Calculated height:', {
    blockWidthPx,
    totalEffectiveUnits: totalEffectiveUnits.toFixed(4),
    cellBreakdown: cellDetails,
    rawH: H.toFixed(2),
    clampedH: clampedHeight.toFixed(2),
    wasClamp: H !== clampedHeight
  });
  
  return Math.round(clampedHeight);
}

export function calculateBlockLayout(input: BlockLayoutInput): BlockLayoutResult {
  const { blockId, blockWidthPx, cells } = input;
  const H = solveBlockHeightWithImages(cells, blockWidthPx);

  const cellSizes = cells.map((c) => {
    let widthPx = 0;
    if (c.bodyType === 'image') {
      widthPx = getAspectRatioValue(c.aspectRatio || '16:9') * H;
    } else if (c.bodyType === 'text') {
      widthPx = 300; // default TEXT allocation per spec; upstream may override
    } else {
      // Non-image types: width is driven by grid (1/2 units). We leave px width to CSS grid.
      // Here we set 0 to indicate CSS-driven; consumers should use grid column spans.
      widthPx = 0;
    }
    return { chartId: c.chartId, widthPx, heightPx: H };
  });

  return {
    blockId,
    blockHeightPx: H,
    syncedFonts: { titlePx: 18, subtitlePx: 14 }, // actual sync computed elsewhere
    cells: cellSizes,
  };
}
