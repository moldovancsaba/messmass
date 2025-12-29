// lib/textFontSizeCalculator.ts
// WHAT: Calculate unified font-size for all text charts in a block
// WHY: Ensure all text charts in a block use the same font-size, fitting the largest content
// HOW: Measure each text chart, find optimal size, use minimum across all charts

import { parseMarkdown } from './markdownUtils';

/**
 * WHAT: Calculate optimal font-size for a text chart to fit its content
 * WHY: Find the largest font-size that fits without overflow
 * HOW: Binary search between min and max font-size, measure rendered HTML
 * 
 * @param rawContent - The raw markdown content to measure
 * @param containerWidth - Available width in pixels
 * @param containerHeight - Available height in pixels
 * @param minFontSize - Minimum font-size in rem (default: 0.75rem = 12px)
 * @param maxFontSize - Maximum font-size in rem (default: 1.5rem = 24px)
 * @returns Optimal font-size in rem
 */
export function calculateOptimalFontSize(
  rawContent: string,
  containerWidth: number,
  containerHeight: number,
  minFontSize: number = 0.75,
  maxFontSize: number = 1.5
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

  // WHAT: Binary search for optimal font-size
  // WHY: Efficiently find the largest size that fits
  // HOW: Test sizes between min and max, check if content fits
  let low = minFontSize;
  let high = maxFontSize;
  let optimal = minFontSize;
  const tolerance = 0.05; // 0.05rem tolerance

  // WHAT: Create a temporary element to measure content
  // WHY: Need to measure actual rendered size
  // HOW: Create off-screen element, test different font-sizes
  // CRITICAL: Match the exact styles from .textContent and .textMarkdown
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
  measureElement.style.whiteSpace = 'pre-wrap'; // CRITICAL: Match CSS
  measureElement.innerHTML = htmlContent;
  document.body.appendChild(measureElement);
  
  // WHAT: Force layout calculation
  // WHY: Ensure measurements are accurate
  void measureElement.offsetHeight;

  try {
    while (high - low > tolerance) {
      const mid = (low + high) / 2;
      measureElement.style.fontSize = `${mid}rem`;
      
      // WHAT: Check if content fits within container
      // WHY: Need to verify both width and height constraints
      const fitsWidth = measureElement.scrollWidth <= containerWidth;
      const fitsHeight = measureElement.scrollHeight <= containerHeight;
      
      if (fitsWidth && fitsHeight) {
        optimal = mid;
        low = mid;
      } else {
        high = mid;
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

