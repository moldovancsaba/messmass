// lib/barChartFontSizeCalculator.ts
// WHAT: Calculate maximum font size for BAR charts considering 2-line label wrapping
// WHY: Layout Grammar requires content to fit - font size must account for label wrapping
// HOW: Calculate max font size where 2-line labels fit in available row height

/**
 * WHAT: Calculate maximum font size for BAR chart labels considering 2-line wrapping
 * WHY: Labels can wrap to 2 lines - font size must ensure they fit in available height
 * HOW: Binary search for maximum font size where 2-line labels fit in row height
 * 
 * @param labelText - The label text that may wrap
 * @param labelWidthPx - Available width for label (40% of table width)
 * @param availableRowHeightPx - Available height per row (after padding, spacing, bar track)
 * @param minFontSize - Minimum acceptable font size (default: 10px)
 * @param maxFontSize - Maximum acceptable font size (default: 24px)
 * @returns Maximum font size in pixels where 2-line label fits
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
  
  // WHAT: Estimate characters per line at a given font size
  // WHY: Need to know if text fits in 2 lines at a given font size
  // HOW: Rough estimate: ~0.6em per character (accounts for spacing)
  const estimateLines = (fontSize: number): number => {
    const charsPerLine = Math.max(1, Math.floor(labelWidthPx / (fontSize * 0.6)));
    return Math.ceil(labelText.length / charsPerLine);
  };
  
  // WHAT: Check if 2-line label fits in available height at given font size
  // WHY: Need to verify actual height requirement, not just line count
  // HOW: 2 lines × font-size × line-height (1.2) must fit in available height
  const fitsInHeight = (fontSize: number): boolean => {
    const lineCount = estimateLines(fontSize);
    if (lineCount > 2) return false; // More than 2 lines not allowed
    
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
  
  // WHAT: Binary search for maximum font size where 2-line label fits
  // WHY: Maximize font size while ensuring content fits (Layout Grammar: no clipping)
  // HOW: Binary search between minFontSize and maxFontSize
  let best = minFontSize;
  let lo = minFontSize;
  let hi = maxFontSize;
  
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fitsInHeight(mid)) {
      best = mid;
      lo = mid + 1; // Try larger font size
    } else {
      hi = mid - 1; // Too large, try smaller
    }
  }
  
  return best;
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
    
    // WHAT: Calculate label width (40% of table width)
    // WHY: Labels use 40% of table width
    // HOW: Table width ≈ block width (accounting for padding)
    const tableWidth = blockWidthPx - (chartBodyPaddingPx * 2);
    const labelWidth = tableWidth * 0.4; // 40% for labels
    
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
