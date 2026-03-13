import { validateElementFit } from '../lib/elementFitValidator';
import type { CellConfiguration } from '../lib/layoutGrammar';

describe('Issue #40: Height Calculation Extreme Density Tests', () => {
  const containerWidth = 1000;
  const containerHeight = 300; // Relatively short container

  describe('BAR Chart Refinements', () => {
    it('should detect when long labels require more height due to wrapping', () => {
      const cell: CellConfiguration = {
        chartId: 'bar-dense',
        bodyType: 'bar',
        cellWidth: 1,
        contentMetadata: {
          barCount: 5,
          labels: [
            'Short Label',
            'Very Very Long Label That Definitely Requires Wrapping in the 30% Allocated Space',
            'Another Long Label That Wraps',
            'Label 4',
            'Label 5'
          ]
        }
      };

      // Use a very tight container height to force a failure
      const tightContainerHeight = 150;
      const result = validateElementFit(cell, tightContainerHeight, containerWidth);
      
      // With long labels and 150px height, 5 bars won't fit
      expect(result.fits).toBe(false);
      expect(result.requiredActions).toContain('increaseHeight');
      expect(result.requiredHeight).toBeGreaterThan(tightContainerHeight);
    });

    it('should respect the 2-line cap for BAR labels but still calculate accurately', () => {
      const cell: CellConfiguration = {
        chartId: 'bar-extremelong',
        bodyType: 'bar',
        cellWidth: 1,
        contentMetadata: {
          barCount: 3,
          labels: [
            'Extremely long label that would normally wrap to 4 or 5 lines but should be capped at 2 for measurement',
            'Another extremely long label that should be capped at 2 lines',
            'short'
          ]
        }
      };

      const result = validateElementFit(cell, containerHeight, containerWidth);
      
      // Even if labels are 1000 chars, it should cap at 2 lines per row
      // 300px should fit 3 bars even with wrapping (total height ~180px)
      expect(result.fits).toBe(true);
      expect(result.requiredHeight).toBeUndefined(); // Should be undefined if it fits
    });
  });

  describe('PIE Chart Refinements', () => {
    it('should calculate legend height based on string lengths', () => {
      const cell: CellConfiguration = {
        chartId: 'pie-long-legend',
        bodyType: 'pie',
        cellWidth: 1,
        contentMetadata: {
          legendItemCount: 10,
          legendLabels: [
            'Label 1',
            'Label 2 with significant length to trigger wrapping',
            'Label 3',
            'Label 4 that is also quite long and wraps',
            'Label 5',
            'Label 6',
            'Label 7',
            'Label 8',
            'Label 9',
            'Label 10'
          ]
        }
      };

      // 300px container. Pie (40%) = 120px. Legend (30%) = 90px. Title (30%) = 90px.
      // If legendLabels wrap and exceed 90px, it should detect it.
      const result = validateElementFit(cell, containerHeight, containerWidth);
      
      // At least 2 labels wrap. total lines might be 12.
      // font size estimated at 300/25 = 12px.
      // 12 lines * 12px * 1.2 = 172px.
      // 172px > 150px (50% of 300), so it should NOT fit.
      expect(result.fits).toBe(false);
      expect(result.requiredActions).toContain('increaseHeight');
      expect(result.violations[0]).toContain('legend may grow to 50%');
    });

    it('should use item count estimate if legendLabels are missing', () => {
      const cell: CellConfiguration = {
        chartId: 'pie-estimate',
        bodyType: 'pie',
        cellWidth: 1,
        contentMetadata: {
          legendItemCount: 20
        }
      };

      const result = validateElementFit(cell, containerHeight, containerWidth);
      expect(result.fits).toBe(false); // 20 items will definitely not fit in 300px
    });
  });
});
