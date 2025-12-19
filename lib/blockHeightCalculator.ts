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
  // WHAT: Calculate total units in the block
  // WHY: Need to know width per unit
  const totalUnits = cells.reduce((sum, c) => sum + c.cellWidth, 0);
  
  if (totalUnits === 0) {
    console.warn('[BlockHeightCalculator] No cells in block, using default height');
    return 360;
  }
  
  // WHAT: Calculate width per unit
  // WHY: Each cell width unit represents this many pixels
  const widthPerUnit = blockWidthPx / totalUnits;
  
  // WHAT: Sum aspect ratios of IMAGE cells
  // WHY: Image width = aspectRatio × H, so total image width = H × sum(aspectRatios)
  let sumAspectRatios = 0;
  
  // WHAT: Calculate total width of non-IMAGE cells
  // WHY: These cells have fixed width based on their units
  let nonImageWidth = 0;
  
  for (const c of cells) {
    if (c.bodyType === 'image') {
      // IMAGE cell: width = aspectRatio × H
      const aspectRatio = getAspectRatioValue(c.aspectRatio || '16:9');
      sumAspectRatios += aspectRatio;
    } else {
      // Non-IMAGE cell (KPI, PIE, BAR, TEXT): width = cellWidth × widthPerUnit
      nonImageWidth += c.cellWidth * widthPerUnit;
    }
  }
  
  // WHAT: If no images, return default height
  // WHY: Without aspect ratios, height must be set arbitrarily
  if (sumAspectRatios <= 0) {
    console.warn('[BlockHeightCalculator] No images in block, using default height');
    return 360;
  }
  
  // WHAT: Apply deterministic formula
  // WHY: Ensures all cells fit in blockWidth while images maintain aspect ratio
  const H = (blockWidthPx - nonImageWidth) / sumAspectRatios;
  
  // WHAT: Apply reasonable bounds
  // WHY: Prevent extreme values from edge cases
  const minHeight = 150;
  const maxHeight = 800;
  const clampedHeight = Math.max(minHeight, Math.min(maxHeight, H));
  
  console.log('[BlockHeightCalculator]', {
    blockWidthPx,
    totalUnits,
    widthPerUnit: widthPerUnit.toFixed(2),
    sumAspectRatios: sumAspectRatios.toFixed(4),
    nonImageWidth: nonImageWidth.toFixed(2),
    calculatedH: H.toFixed(2),
    clampedH: clampedHeight.toFixed(2)
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
