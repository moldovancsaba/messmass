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
  
  // WHAT: Improved character width estimation
  // WHY: Character width varies with font size and character type
  // HOW: Use more accurate estimate: ~0.6em for average character, account for word spacing
  // Edge case: Very small fonts (<12px) need tighter estimate, very large fonts (>20px) need looser estimate
  const charWidthMultiplier = fontPx < 12 ? 0.5 : fontPx > 20 ? 0.65 : 0.6;
  const charsPerLine = Math.max(1, Math.floor(containerWidthPx / (fontPx * charWidthMultiplier)));
  
  // WHAT: Account for very long words that cannot be broken
  // WHY: Layout Grammar: words cannot be broken
  // HOW: Check if longest word fits in one line
  const words = text.split(/\s+/);
  const longestWord = words.reduce((max, word) => word.length > max.length ? word : max, '');
  if (longestWord.length > charsPerLine && maxLines === 1) {
    return false; // Single word too long for one line
  }
  
  const neededLines = Math.ceil((text || '').length / charsPerLine);
  return neededLines <= maxLines;
}

// WHAT: Binary search with edge case handling for extreme aspect ratios
// WHY: Very narrow or very wide blocks need special handling
// HOW: Adjust search bounds and container width calculation for edge cases
function binarySearchFont(textSamples: string[], containerWidthPx: number, maxLines: number, hi = 28, lo = 10): number {
  if (textSamples.length === 0) return lo;
  
  // WHAT: Handle very narrow blocks (edge case)
  // WHY: Blocks < 300px wide need minimum container width to prevent font size collapse
  // HOW: Enforce minimum container width of 200px for font calculation
  const effectiveWidth = Math.max(200, containerWidthPx);
  
  // WHAT: Handle very long titles (edge case)
  // WHY: Very long titles (>200 chars) may need lower minimum font size
  // HOW: Adjust minimum font size if longest title is extremely long
  const maxTitleLength = Math.max(...textSamples.map(t => t.length));
  const adjustedLo = maxTitleLength > 200 ? Math.max(8, lo - 2) : lo; // Allow smaller font for very long titles
  
  let best = adjustedLo;
  let searchLo = adjustedLo;
  let searchHi = hi;
  
  while (searchLo <= searchHi) {
    const mid = Math.floor((searchLo + searchHi) / 2);
    const ok = textSamples.every(t => estimateFits(t, mid, effectiveWidth, maxLines));
    if (ok) {
      best = mid;
      searchLo = mid + 1;
    } else {
      searchHi = mid - 1;
    }
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

  // WHAT: Improved container width calculation for edge cases
  // WHY: Extreme aspect ratios (very narrow or very wide blocks) need special handling
  // HOW: Use adaptive container width calculation with bounds checking
  // Edge case: Very narrow blocks (< 400px) use full width, very wide blocks (> 2000px) cap at 1000px
  let titleContainerWidth: number;
  if (blockWidthPx < 400) {
    // Very narrow: use full width minus padding (assume 40px total padding)
    titleContainerWidth = Math.max(200, blockWidthPx - 40);
  } else if (blockWidthPx > 2000) {
    // Very wide: cap at reasonable maximum (1000px per cell)
    titleContainerWidth = 1000;
  } else {
    // Normal: use half block width with minimum
    titleContainerWidth = Math.max(280, blockWidthPx / 2);
  }

  const titlePx = titleSamples.length
    ? binarySearchFont(titleSamples, titleContainerWidth, options.maxTitleLines)
    : 18;
  const subtitlePx = subtitleSamples.length
    ? binarySearchFont(subtitleSamples, titleContainerWidth, options.maxSubtitleLines, 22, 10)
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
