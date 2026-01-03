// lib/textFontSizeCalculator.ts
// WHAT: Calculate unified font-size for all text charts in a block
// WHY: Ensure all text charts in a block use the same font-size, fitting the largest content
// HOW: Measure each text chart, find optimal size, use minimum across all charts

import { parseMarkdown } from './markdownUtils';

/**
 * WHAT: Calculate optimal font-size for a text chart to fill available space
 * WHY: Find the largest font-size that fills container height without overflow
 * HOW: Binary search for font-size that maximizes vertical fill (content height ≈ container height)
 * 
 * @param rawContent - The raw markdown content to measure
 * @param containerWidth - Available width in pixels
 * @param containerHeight - Available height in pixels
 * @param minFontSize - Minimum font-size in rem (default: 0.75rem = 12px)
 * @param maxFontSize - Maximum font-size in rem (default: 4rem = 64px)
 * @returns Optimal font-size in rem that fills space
 */
export function calculateOptimalFontSize(
  rawContent: string,
  containerWidth: number,
  containerHeight: number,
  minFontSize: number = 0.75,
  maxFontSize: number = 4.0
): number {
  if (!rawContent || containerWidth <= 0 || containerHeight <= 0) {
    return minFontSize;
  }

  // WHAT: Parse markdown to HTML for accurate measurement
  // WHY: Need to measure actual rendered content, not raw markdown
  // HOW: Use parseMarkdown to convert to HTML
  const htmlContent = parseMarkdown(rawContent);
  if (!htmlContent) {
    return minFontSize;
  }

  // WHAT: Binary search for optimal font-size that fills space
  // WHY: Find largest size that maximizes vertical fill (content height ≈ container height)
  // HOW: Test sizes between min and max, optimize for fill ratio ≈ 1.0
  let low = minFontSize;
  let high = maxFontSize;
  let optimal = minFontSize;
  let bestFillRatio = 0;
  const tolerance = 0.05; // 0.05rem tolerance

  // WHAT: Create a temporary element to measure content
  // WHY: Need to measure actual rendered size with all markdown elements
  // HOW: Create off-screen element, test different font-sizes, match exact CSS styles
  // CRITICAL: Match the exact styles from .textContent and .textMarkdown (including new markdown elements)
  const measureElement = document.createElement('div');
  measureElement.style.position = 'absolute';
  measureElement.style.visibility = 'hidden';
  measureElement.style.top = '-9999px';
  measureElement.style.left = '-9999px';
  measureElement.style.width = `${containerWidth}px`;
  measureElement.style.maxWidth = `${containerWidth}px`;
  measureElement.style.height = 'auto';
  measureElement.style.overflow = 'hidden';
  measureElement.style.fontSize = '1rem';
  measureElement.style.lineHeight = '1.3';
  measureElement.style.fontWeight = '600';
  measureElement.style.textAlign = 'center';
  measureElement.style.padding = '0.5rem';
  measureElement.style.boxSizing = 'border-box';
  measureElement.style.whiteSpace = 'normal'; // CRITICAL: Match CSS (not pre-wrap)
  // WHAT: Match markdown element styles for accurate measurement
  measureElement.className = 'textMarkdown'; // Apply markdown styles if available
  measureElement.innerHTML = htmlContent;
  document.body.appendChild(measureElement);
  
  // WHAT: Force layout calculation
  // WHY: Ensure measurements are accurate
  void measureElement.offsetHeight;

  try {
    // WHAT: Binary search with fill optimization
    // WHY: Find font-size that fills container height (minimize empty space)
    // HOW: Prefer sizes that fill height, allow slight overflow (0-5%) then clamp
    while (high - low > tolerance) {
      const mid = (low + high) / 2;
      measureElement.style.fontSize = `${mid}rem`;
      
      // WHAT: Force reflow to get accurate measurements
      void measureElement.offsetHeight;
      
      const contentWidth = measureElement.scrollWidth;
      const contentHeight = measureElement.scrollHeight;
      
      // WHAT: Check if content fits within container
      // WHY: Need to verify both width and height constraints
      const fitsWidth = contentWidth <= containerWidth;
      const fitsHeight = contentHeight <= containerHeight;
      
      // WHAT: Calculate fill ratio (how much of container height is used)
      // WHY: Optimize for fill ratio ≈ 1.0 (perfect fill)
      const fillRatio = fitsHeight ? contentHeight / containerHeight : 0;
      
      if (fitsWidth && fitsHeight) {
        // WHAT: Content fits - prefer larger sizes that fill more space
        if (fillRatio > bestFillRatio) {
          bestFillRatio = fillRatio;
          optimal = mid;
        }
        low = mid;
      } else {
        // WHAT: Content doesn't fit - try smaller size
        high = mid;
      }
    }
    
    // WHAT: If optimal size leaves too much empty space, try slightly larger (with overflow clamp)
    // WHY: Maximize fill - prefer slightly larger font that causes minimal overflow
    // HOW: Test sizes slightly above optimal, clamp if overflow exceeds 5%
    if (bestFillRatio < 0.8 && optimal < maxFontSize) {
      let testSize = Math.min(optimal * 1.1, maxFontSize);
      measureElement.style.fontSize = `${testSize}rem`;
      void measureElement.offsetHeight;
      
      const testWidth = measureElement.scrollWidth;
      const testHeight = measureElement.scrollHeight;
      const overflowRatio = testHeight / containerHeight;
      
      // WHAT: Allow up to 5% overflow, then clamp to fit
      if (testWidth <= containerWidth && overflowRatio <= 1.05) {
        optimal = testSize;
      }
    }
  } finally {
    document.body.removeChild(measureElement);
  }

  return Math.max(minFontSize, Math.min(maxFontSize, optimal));
}

/**
 * WHAT: Calculate unified font-size for multiple text charts
 * WHY: All charts in a block should use the same font-size
 * HOW: Calculate optimal size for each, use the minimum
 * 
 * @param textContents - Array of text content strings
 * @param containerDimensions - Array of {width, height} for each chart
 * @returns Unified font-size in rem (minimum of all optimal sizes)
 */
export function calculateUnifiedFontSize(
  textContents: string[],
  containerDimensions: Array<{ width: number; height: number }>
): number {
  if (textContents.length === 0 || textContents.length !== containerDimensions.length) {
    return 0.75; // Default minimum
  }

  const optimalSizes = textContents.map((content, index) => {
    const { width, height } = containerDimensions[index];
    return calculateOptimalFontSize(content, width, height);
  });

  // WHAT: Return minimum of all optimal sizes
  // WHY: Ensures all charts fit, largest content determines the size
  return Math.min(...optimalSizes);
}

