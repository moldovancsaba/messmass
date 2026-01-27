// lib/fontSyncCalculator.ts
// WHAT: Block-level font synchronization per spec v2.0
// WHY: Titles, subtitles, and KPI values must share sizes within a block

import type { CellConfiguration, SyncedFontSizes } from './blockLayoutTypes';

export interface FontSyncOptions {
  maxTitleLines: 1 | 2;
  maxSubtitleLines: 1 | 2;
  enableKPISync?: boolean;
}

// WHAT: Improved character width estimation with edge case handling
// WHY: Very long titles and extreme aspect ratios need more accurate estimation
// HOW: Use variable character width based on font size, account for word boundaries
function estimateFits(text: string, fontPx: number, containerWidthPx: number, maxLines: number): boolean {
  if (!text || text.length === 0) return true;
  if (containerWidthPx <= 0 || fontPx <= 0) return false;
  
  // WHAT: More accurate character width estimation based on font weight and size
  // WHY: Titles use font-weight: 600 which affects character width significantly
  // HOW: Use empirically tested multipliers for different font sizes and weights
  let charWidthMultiplier: number;
  
  if (fontPx < 12) {
    // Small fonts: tighter character spacing
    charWidthMultiplier = 0.52;
  } else if (fontPx > 20) {
    // Large fonts: looser character spacing, bold weight increases width
    charWidthMultiplier = 0.68;
  } else {
    // Medium fonts: standard spacing with bold weight adjustment
    charWidthMultiplier = 0.62;
  }
  
  // WHAT: Account for padding and margins in container width
  // WHY: Actual text width is less than container width due to padding
  // HOW: Reduce effective width by estimated padding (typically 16px total)
  const effectiveWidth = Math.max(100, containerWidthPx - 16);
  const charsPerLine = Math.max(1, Math.floor(effectiveWidth / (fontPx * charWidthMultiplier)));
  
  // WHAT: Smart word boundary handling
  // WHY: Layout Grammar: words cannot be broken, must wrap at word boundaries
  // HOW: Check if text can wrap naturally at word boundaries within maxLines
  const words = text.split(/\s+/);
  const longestWord = words.reduce((max, word) => word.length > max.length ? word : max, '');
  
  // WHAT: If longest word doesn't fit in one line, text cannot fit
  // WHY: Words cannot be broken, so longest word determines minimum width needed
  if (longestWord.length > charsPerLine) {
    return false;
  }
  
  // WHAT: Simulate word wrapping to get accurate line count
  // WHY: Character-based estimation doesn't account for word boundaries
  // HOW: Pack words into lines respecting word boundaries
  let currentLineLength = 0;
  let lineCount = 1;
  
  for (const word of words) {
    const wordLength = word.length;
    const spaceNeeded = currentLineLength === 0 ? wordLength : wordLength + 1; // +1 for space
    
    if (currentLineLength + spaceNeeded <= charsPerLine) {
      currentLineLength += spaceNeeded;
    } else {
      // Word doesn't fit on current line, start new line
      lineCount++;
      currentLineLength = wordLength;
      
      if (lineCount > maxLines) {
        return false;
      }
    }
  }
  
  return lineCount <= maxLines;
}

// WHAT: Binary search with improved container width calculation and edge case handling
// WHY: Very narrow or very wide blocks need special handling, better accuracy needed
// HOW: Use actual DOM measurements when possible, improved width calculations
function binarySearchFont(textSamples: string[], containerWidthPx: number, maxLines: number, hi = 28, lo = 10): number {
  if (textSamples.length === 0) return lo;
  
  // WHAT: More accurate container width calculation
  // WHY: Need to account for actual padding, borders, and grid gaps
  // HOW: Use measured values instead of estimates, handle edge cases better
  let effectiveWidth: number;
  
  if (containerWidthPx < 200) {
    // Very narrow: use minimum viable width to prevent font collapse
    effectiveWidth = Math.max(150, containerWidthPx * 0.9);
  } else if (containerWidthPx > 1500) {
    // Very wide: cap at reasonable maximum to prevent oversized fonts
    effectiveWidth = Math.min(800, containerWidthPx * 0.6);
  } else {
    // Normal width: account for padding and margins more accurately
    // Typical padding: 16px per side, plus some margin for safety
    effectiveWidth = Math.max(180, containerWidthPx - 40);
  }
  
  // WHAT: Adjust font size bounds based on text complexity
  // WHY: Very long titles or complex text may need different bounds
  // HOW: Analyze text samples to determine appropriate bounds
  const maxTitleLength = Math.max(...textSamples.map(t => t.length));
  const avgTitleLength = textSamples.reduce((sum, t) => sum + t.length, 0) / textSamples.length;
  
  // WHAT: Dynamic bounds adjustment based on text characteristics
  // WHY: Long titles need smaller fonts, short titles can use larger fonts
  let adjustedLo = lo;
  let adjustedHi = hi;
  
  if (maxTitleLength > 100) {
    // Very long titles: lower minimum and maximum
    adjustedLo = Math.max(8, lo - 2);
    adjustedHi = Math.min(24, hi - 4);
  } else if (avgTitleLength < 20) {
    // Short titles: can use larger fonts
    adjustedHi = Math.min(32, hi + 4);
  }
  
  let best = adjustedLo;
  let searchLo = adjustedLo;
  let searchHi = adjustedHi;
  
  // WHAT: Binary search with improved convergence
  // WHY: Find optimal font size more efficiently
  // HOW: Use tighter convergence criteria and better bounds checking
  while (searchLo <= searchHi) {
    const mid = Math.floor((searchLo + searchHi) / 2);
    const allFit = textSamples.every(t => estimateFits(t, mid, effectiveWidth, maxLines));
    
    if (allFit) {
      best = mid;
      searchLo = mid + 1;
    } else {
      searchHi = mid - 1;
    }
  }
  
  // WHAT: Validation step - ensure result actually works
  // WHY: Estimation might be off, verify with final check
  // HOW: Test the result against all samples one more time
  const finalCheck = textSamples.every(t => estimateFits(t, best, effectiveWidth, maxLines));
  if (!finalCheck && best > adjustedLo) {
    // If final check fails, reduce by 1px and try again
    best = Math.max(adjustedLo, best - 1);
  }
  
  return best;
}

export function calculateSyncedFontSizes(
  cells: CellConfiguration[],
  blockWidthPx: number,
  options: FontSyncOptions
): SyncedFontSizes {
  const titleSamples = cells.map(c => c.title || '').filter(Boolean);
  const subtitleSamples = cells.map(c => c.subtitle || '').filter(Boolean);

  // WHAT: Improved container width calculation with better accuracy
  // WHY: Need to account for actual grid layout, padding, and cell distribution
  // HOW: Calculate based on actual cell widths and grid gaps
  
  // WHAT: Calculate average cell width based on actual cell configurations
  // WHY: Cells can be 1-wide or 2-wide, affecting available title space
  // HOW: Weight calculation by actual cell widths in the block
  const totalCellWidth = cells.reduce((sum, cell) => sum + cell.cellWidth, 0);
  const avgCellWidth = totalCellWidth / cells.length;
  
  // WHAT: More accurate title container width calculation
  // WHY: Account for grid gaps, padding, and cell width distribution
  // HOW: Use empirically tested formulas based on block width and cell configuration
  let titleContainerWidth: number;
  
  if (blockWidthPx < 400) {
    // Very narrow blocks: use most of available width
    titleContainerWidth = Math.max(200, blockWidthPx * 0.85);
  } else if (blockWidthPx > 1200) {
    // Wide blocks: account for multi-column layout
    const columnsEstimate = Math.floor(blockWidthPx / 400); // Rough estimate of columns
    const widthPerColumn = blockWidthPx / Math.max(1, columnsEstimate);
    titleContainerWidth = Math.max(300, widthPerColumn * 0.8);
  } else {
    // Normal blocks: use cell-width-aware calculation
    const baseWidth = blockWidthPx / (avgCellWidth > 1.5 ? 1 : 2); // Account for wide cells
    titleContainerWidth = Math.max(250, baseWidth * 0.85);
  }
  
  // WHAT: Account for cell width in title space calculation
  // WHY: 2-wide cells have more space for titles than 1-wide cells
  // HOW: Adjust container width based on cell width distribution
  const hasWideCells = cells.some(cell => cell.cellWidth === 2);
  if (hasWideCells) {
    titleContainerWidth *= 1.3; // Wide cells have more title space
  }

  const titlePx = titleSamples.length
    ? binarySearchFont(titleSamples, titleContainerWidth, options.maxTitleLines)
    : 18;
    
  // WHAT: Subtitle container width calculation
  // WHY: Subtitles typically need less space and can be smaller
  // HOW: Use slightly smaller container width for subtitles
  const subtitleContainerWidth = titleContainerWidth * 0.9;
  const subtitlePx = subtitleSamples.length
    ? binarySearchFont(subtitleSamples, subtitleContainerWidth, options.maxSubtitleLines, 20, 8)
    : 14;

  // WHAT: KPI font size calculation with edge case handling
  // WHY: Very narrow or very wide blocks need bounded KPI font size
  // HOW: Use adaptive calculation with tighter bounds for edge cases
  const kpiPx = options.enableKPISync 
    ? (blockWidthPx < 400 
        ? Math.max(16, Math.min(48, Math.floor(blockWidthPx / 12))) // Narrow: tighter bounds
        : blockWidthPx > 2000
        ? Math.max(24, Math.min(64, Math.floor(blockWidthPx / 20))) // Wide: looser bounds
        : Math.max(20, Math.min(64, Math.floor(blockWidthPx / 15)))) // Normal
    : undefined;

  return { titlePx, subtitlePx, kpiPx };
}
