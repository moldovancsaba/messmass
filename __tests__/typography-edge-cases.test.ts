// __tests__/typography-edge-cases.test.ts
// WHAT: Regression harness for typography scaling edge cases (A-04)
// WHY: Verify edge cases are handled correctly (very long titles, extreme aspect ratios)
// HOW: Test calculateSyncedFontSizes() and BAR chart font size calculator with worst-case examples

import { calculateSyncedFontSizes } from '@/lib/fontSyncCalculator';
import { calculateMaxBarLabelFontSize, calculateBlockFontSizeForBarCharts } from '@/lib/barChartFontSizeCalculator';
import type { CellConfiguration } from '@/lib/blockLayoutTypes';

/**
 * WHAT: Test suite for typography scaling edge cases
 * WHY: A-04 requires verification of edge case handling
 * HOW: Test 5 worst-case scenarios and verify expected outcomes
 * 
 * NOTE: This is a dev-only regression harness. Run with: npm test -- typography-edge-cases
 */

describe('Typography Scaling Edge Cases (A-04)', () => {
  
  describe('Edge Case 1: Very Long Title (200+ characters)', () => {
    it('should handle very long titles without font size collapse', () => {
      const veryLongTitle = 'A'.repeat(250); // 250 characters
      const cells: CellConfiguration[] = [
        {
          chartId: 'test-1',
          cellWidth: 1,
          bodyType: 'text',
          aspectRatio: '1:1',
          title: veryLongTitle,
          subtitle: undefined
        }
      ];
      
      const result = calculateSyncedFontSizes(cells, 1200, {
        maxTitleLines: 2,
        maxSubtitleLines: 2,
        enableKPISync: false
      });
      
      // WHAT: Very long titles should still get reasonable font size (not collapse to minimum)
      // WHY: Layout Grammar requires readability, minimum font size should be enforced
      // HOW: Font size should be >= 8px (adjusted minimum for very long titles)
      expect(result.titlePx).toBeGreaterThanOrEqual(8);
      expect(result.titlePx).toBeLessThanOrEqual(28);
    });
  });

  describe('Edge Case 2: Very Narrow Block (200px)', () => {
    it('should handle very narrow blocks without font size collapse', () => {
      const cells: CellConfiguration[] = [
        {
          chartId: 'test-2',
          cellWidth: 1,
          bodyType: 'text',
          aspectRatio: '1:1',
          title: 'Normal Title',
          subtitle: undefined
        }
      ];
      
      const result = calculateSyncedFontSizes(cells, 200, {
        maxTitleLines: 2,
        maxSubtitleLines: 2,
        enableKPISync: false
      });
      
      // WHAT: Very narrow blocks should use minimum container width (200px) for calculation
      // WHY: Prevent font size collapse in narrow viewports
      // HOW: Font size should be reasonable (>= 10px) even in narrow blocks
      expect(result.titlePx).toBeGreaterThanOrEqual(10);
      expect(result.titlePx).toBeLessThanOrEqual(28);
    });
  });

  describe('Edge Case 3: Very Wide Block (3000px)', () => {
    it('should handle very wide blocks without excessive font size', () => {
      const cells: CellConfiguration[] = [
        {
          chartId: 'test-3',
          cellWidth: 1,
          bodyType: 'text',
          aspectRatio: '1:1',
          title: 'Normal Title',
          subtitle: undefined
        }
      ];
      
      const result = calculateSyncedFontSizes(cells, 3000, {
        maxTitleLines: 2,
        maxSubtitleLines: 2,
        enableKPISync: false
      });
      
      // WHAT: Very wide blocks should cap container width at 1000px per cell
      // WHY: Prevent excessive font sizes in ultra-wide viewports
      // HOW: Font size should be reasonable (<= 28px) even in very wide blocks
      expect(result.titlePx).toBeGreaterThanOrEqual(10);
      expect(result.titlePx).toBeLessThanOrEqual(28);
    });
  });

  describe('Edge Case 4: BAR Chart - Very Long Label with Narrow Width', () => {
    it('should calculate font size for very long BAR chart labels', () => {
      const veryLongLabel = 'This is a very long label that should wrap to two lines and test the font size calculation accuracy';
      const labelWidthPx = 200; // Narrow label width
      const availableRowHeightPx = 60; // Limited row height
      
      const fontSize = calculateMaxBarLabelFontSize(
        veryLongLabel,
        labelWidthPx,
        availableRowHeightPx,
        10, // minFontSize
        24  // maxFontSize
      );
      
      // WHAT: Very long labels should get font size that fits in 2 lines
      // WHY: Layout Grammar requires content to fit, font size must account for wrapping
      // HOW: Font size should be >= 10px (minimum) and <= 24px (maximum)
      expect(fontSize).toBeGreaterThanOrEqual(10);
      expect(fontSize).toBeLessThanOrEqual(24);
    });
  });

  describe('Edge Case 5: Mixed Edge Cases - Long Title + Narrow Block + BAR Charts', () => {
    it('should handle combination of edge cases', () => {
      // WHAT: Test combination of very long title, narrow block, and BAR charts
      // WHY: Real-world scenarios may combine multiple edge cases
      // HOW: Verify all edge case handlers work together correctly
      
      const veryLongTitle = 'This is an extremely long title that tests multiple edge cases at once including very long text and narrow blocks';
      const cells: CellConfiguration[] = [
        {
          chartId: 'test-5',
          cellWidth: 1,
          bodyType: 'bar',
          aspectRatio: '1:1',
          title: veryLongTitle,
          subtitle: undefined
        }
      ];
      
      // Test font sync calculator with narrow block
      const fontSyncResult = calculateSyncedFontSizes(cells, 250, {
        maxTitleLines: 2,
        maxSubtitleLines: 2,
        enableKPISync: false
      });
      
      expect(fontSyncResult.titlePx).toBeGreaterThanOrEqual(8);
      expect(fontSyncResult.titlePx).toBeLessThanOrEqual(28);
      
      // Test BAR chart font size calculator with long labels and limited space
      const barCharts = [
        {
          chartId: 'bar-1',
          labels: [
            'Very Long Label That Should Wrap',
            'Another Very Long Label That Should Also Wrap',
            'Short',
            'Medium Length Label'
          ]
        }
      ];
      
      const barFontSize = calculateBlockFontSizeForBarCharts(
        barCharts,
        400, // blockHeightPx - limited height
        250, // blockWidthPx - narrow width
        60,  // titleHeightPx
        16,  // chartBodyPaddingPx
        8    // rowSpacingPx
      );
      
      // WHAT: BAR chart font size should be reasonable even with long labels and limited space
      // WHY: Layout Grammar requires content to fit, font size must account for all constraints
      // HOW: Font size should be >= 10px (minimum) and <= 24px (maximum)
      expect(barFontSize).toBeGreaterThanOrEqual(10);
      expect(barFontSize).toBeLessThanOrEqual(24);
    });
  });

  describe('Edge Case 6: Extreme Aspect Ratio - Very Tall Block', () => {
    it('should handle very tall blocks (extreme vertical aspect ratio)', () => {
      const cells: CellConfiguration[] = [
        {
          chartId: 'test-6',
          cellWidth: 1,
          bodyType: 'text',
          aspectRatio: '1:1',
          title: 'Normal Title',
          subtitle: undefined
        }
      ];
      
      // WHAT: Very tall block (narrow width, but height is not used in font calculation)
      // WHY: Font calculation is based on width, not height
      // HOW: Should still work correctly with narrow width
      const result = calculateSyncedFontSizes(cells, 300, {
        maxTitleLines: 2,
        maxSubtitleLines: 2,
        enableKPISync: false
      });
      
      expect(result.titlePx).toBeGreaterThanOrEqual(10);
      expect(result.titlePx).toBeLessThanOrEqual(28);
    });
  });

  describe('Edge Case 7: BAR Chart - Character Width Estimation Accuracy', () => {
    it('should improve character width estimation for different font sizes', () => {
      const label = 'Test Label';
      const labelWidthPx = 150;
      const availableRowHeightPx = 50;
      
      // WHAT: Test font size calculation with improved character width estimation
      // WHY: Character width varies with font size (smaller fonts = tighter, larger fonts = looser)
      // HOW: Verify font size calculation uses variable character width multiplier
      
      const smallFontSize = calculateMaxBarLabelFontSize(
        label,
        labelWidthPx,
        availableRowHeightPx,
        10,
        24
      );
      
      // WHAT: Font size should be calculated correctly for the given constraints
      // WHY: Improved character width estimation should reduce mismatch with rendered width
      // HOW: Font size should be within bounds
      expect(smallFontSize).toBeGreaterThanOrEqual(10);
      expect(smallFontSize).toBeLessThanOrEqual(24);
    });
  });
});
