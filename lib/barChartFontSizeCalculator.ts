// lib/barChartFontSizeCalculator.ts
// WHAT: Calculate maximum font size for BAR charts considering 2-line label wrapping
// WHY: Layout Grammar requires content to fit - font size must account for label wrapping
// HOW: Calculate max font size where 2-line labels fit in available row height

/**
 * WHAT: Calculate maximum font size for BAR chart labels with smart wrapping strategy
 * WHY: Layout Grammar requires maximizing font size while ensuring content fits
 * HOW: 
 *   1. First, try to fit in 1 line by reducing font size (down to minimum)
 *   2. Only if minimum font size doesn't fit in 1 line, allow 2-line wrapping
 *   3. Find maximum font size where 2-line label fits
 * 
 * @param labelText - The label text that may wrap
 * @param labelWidthPx - Available width for label (40% of table width)
 * @param availableRowHeightPx - Available height per row (after padding, spacing, bar track)
 * @param minFontSize - Minimum acceptable font size (default: 10px)
 * @param maxFontSize - Maximum acceptable font size (default: 24px)
 * @returns Maximum font size in pixels (1-line if possible, 2-line if necessary)
 */
export function calculateMaxBarLabelFontSize(
  labelText: string,
  labelWidthPx: number,
  availableRowHeightPx: number,
  minFontSize: number = 10,
  maxFontSize: number = 24
): number {
  if (labelWidthPx <= 0 || availableRowHeightPx <= 0) {
    return minFontSize;
  }
  
  // WHAT: Improved character width estimation for BAR chart labels
  // WHY: Reduce mismatch between estimated and rendered width
  // HOW: Use variable character width based on font size, account for word boundaries and spacing
  // Edge case: Very small fonts (<12px) need tighter estimate, very large fonts (>20px) need looser estimate
  const estimateLines = (fontSize: number): number => {
    // WHAT: Variable character width multiplier based on font size
    // WHY: Character width varies with font size and character type
    // HOW: Smaller fonts have tighter spacing, larger fonts have looser spacing
    const charWidthMultiplier = fontSize < 12 ? 0.55 : fontSize > 20 ? 0.65 : 0.6;
    const charsPerLine = Math.max(1, Math.floor(labelWidthPx / (fontSize * charWidthMultiplier)));
    
    // WHAT: Account for very long words that cannot be broken
    // WHY: Layout Grammar: words cannot be broken
    // HOW: Check if longest word fits in one line
    const words = labelText.split(/\s+/);
    const longestWord = words.reduce((max, word) => word.length > max.length ? word : max, '');
    if (longestWord.length > charsPerLine && labelText.length > charsPerLine) {
      // Longest word doesn't fit in one line, will wrap
      // Estimate: first line gets charsPerLine chars, remainder goes to second line
      const remainder = labelText.length - charsPerLine;
      return Math.ceil(remainder / charsPerLine) + 1; // At least 2 lines
    }
    
    return Math.ceil(labelText.length / charsPerLine);
  };
  
  // WHAT: Check if label fits in 1 line at given font size
  // WHY: First priority is to keep label on 1 line by reducing font size
  // HOW: Check if estimated lines <= 1
  const fitsInOneLine = (fontSize: number): boolean => {
    return estimateLines(fontSize) <= 1;
  };
  
  // WHAT: Check if label fits in available height at given font size (1 or 2 lines)
  // WHY: Need to verify actual height requirement
  // HOW: lineCount × fontSize × lineHeight must fit in available height
  const fitsInHeight = (fontSize: number, allowTwoLines: boolean = true): boolean => {
    const lineCount = estimateLines(fontSize);
    if (lineCount > 2) return false; // More than 2 lines not allowed
    if (!allowTwoLines && lineCount > 1) return false; // Only 1 line allowed
    
    // WHAT: Calculate actual height needed for label
    // WHY: Need to account for line-height (1.2) and ensure it fits
    // HOW: Height = lineCount × fontSize × lineHeight
    const labelHeight = lineCount * fontSize * 1.2; // line-height: 1.2
    
    // WHAT: Also need to account for bar track height (20px minimum)
    // WHY: Row height is max(labelHeight, barTrackHeight)
    // HOW: Row height must fit in availableRowHeightPx
    const barTrackHeight = 20; // Layout Grammar minimum
    const requiredRowHeight = Math.max(labelHeight, barTrackHeight);
    
    return requiredRowHeight <= availableRowHeightPx;
  };
  
  // WHAT: Step 1: Try to fit in 1 line by reducing font size
  // WHY: First priority is to keep label on 1 line, maximize font size within that constraint
  // HOW: Binary search for maximum font size where label fits in 1 line
  let bestOneLine = minFontSize;
  let lo = minFontSize;
  let hi = maxFontSize;
  
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fitsInOneLine(mid) && fitsInHeight(mid, false)) {
      bestOneLine = mid;
      lo = mid + 1; // Try larger font size
    } else {
      hi = mid - 1; // Too large, try smaller
    }
  }
  
  // WHAT: Step 2: Check if minimum font size fits in 1 line
  // WHY: Only allow 2-line wrapping if minimum font size doesn't fit in 1 line
  // HOW: If bestOneLine >= minFontSize, we can fit in 1 line
  if (bestOneLine >= minFontSize && fitsInOneLine(bestOneLine)) {
    // WHAT: Can fit in 1 line - return maximum font size that fits in 1 line
    return bestOneLine;
  }
  
  // WHAT: Step 3: Minimum font size doesn't fit in 1 line - allow 2-line wrapping
  // WHY: Only break to 2 lines when 1 line is impossible at minimum font size
  // HOW: Binary search for maximum font size where 2-line label fits
  let bestTwoLine = minFontSize;
  lo = minFontSize;
  hi = maxFontSize;
  
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fitsInHeight(mid, true)) {
      bestTwoLine = mid;
      lo = mid + 1; // Try larger font size
    } else {
      hi = mid - 1; // Too large, try smaller
    }
  }
  
  // WHAT: Return maximum font size (will be 2-line if 1-line wasn't possible)
  return bestTwoLine;
}

/**
 * WHAT: Calculate optimal font size for a block containing BAR charts
 * WHY: Block-level typography must account for BAR chart label wrapping
 * HOW: Calculate max font size for each BAR chart, use minimum to ensure all fit
 * 
 * @param barCharts - Array of BAR chart configurations with labels
 * @param blockHeightPx - Total block height in pixels
 * @param blockWidthPx - Total block width in pixels
 * @param titleHeightPx - Height of title zone (default: 60px)
 * @param chartBodyPaddingPx - Padding in chart body (default: 16px = 2 × 8px)
 * @param rowSpacingPx - Spacing between rows (default: 8px)
 * @returns Optimal font size in pixels for the block
 */
export function calculateBlockFontSizeForBarCharts(
  barCharts: Array<{ chartId: string; labels: string[] }>,
  blockHeightPx: number,
  blockWidthPx: number,
  titleHeightPx: number = 60,
  chartBodyPaddingPx: number = 16,
  rowSpacingPx: number = 8
): number {
  if (barCharts.length === 0) {
    return 16; // Default font size if no BAR charts
  }
  
  // WHAT: Calculate available height for chart body
  // WHY: Need to know how much space is available for BAR chart rows
  // HOW: Block height minus title height
  const chartBodyHeight = blockHeightPx - titleHeightPx;
  
  // WHAT: For each BAR chart, calculate maximum font size
  // WHY: Need to find the minimum that works for all charts
  // HOW: Iterate through all BAR charts and their labels
  const fontSizes: number[] = [];
  
  for (const barChart of barCharts) {
    const barCount = barCharts.length > 0 ? barChart.labels.length : 0;
    if (barCount === 0) continue;
    
    // WHAT: Calculate available height per row
    // WHY: Each row needs space for label + bar track + spacing
    // HOW: (chartBodyHeight - padding) / barCount - spacing per gap
    const availableHeightPerRow = (chartBodyHeight - chartBodyPaddingPx) / barCount - rowSpacingPx;
    
    // WHAT: Calculate label width (40% of table width) with improved accuracy
    // WHY: Labels use 40% of table width (from CSS: .barLabel { width: 40%; })
    // HOW: Table width = block width minus padding, label width = 40% of table width
    // Edge case: Account for table cell padding (left: 1 space unit, right: 2 space units)
    // Assuming 1 space unit ≈ 8px, so label cell has ~24px total horizontal padding
    const tableWidth = blockWidthPx - (chartBodyPaddingPx * 2);
    const labelCellPadding = 24; // Approximate: 8px (left) + 16px (right) = 24px
    const labelWidth = (tableWidth * 0.4) - labelCellPadding; // 40% minus padding for actual text width
    
    // WHAT: Calculate max font size for each label in this chart
    // WHY: Need to ensure all labels fit
    // HOW: Calculate for each label, use minimum
    const labelFontSizes = barChart.labels.map(label =>
      calculateMaxBarLabelFontSize(label, labelWidth, availableHeightPerRow)
    );
    
    // WHAT: Use minimum font size for this chart
    // WHY: All labels in a chart must fit
    // HOW: Take minimum of all label font sizes
    const chartFontSize = Math.min(...labelFontSizes);
    fontSizes.push(chartFontSize);
  }
  
  // WHAT: Return minimum font size across all BAR charts
  // WHY: Block-level typography must work for all charts
  // HOW: Use minimum to ensure all charts fit
  return fontSizes.length > 0 ? Math.min(...fontSizes) : 16;
}
