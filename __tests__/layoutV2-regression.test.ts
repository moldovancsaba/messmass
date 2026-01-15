// __tests__/layoutV2-regression.test.ts
// WHAT: Regression tests for LayoutV2 end-to-end rendering alignment
// WHY: Ensure all chart types work correctly with LayoutV2, no overflow/clipping
// HOW: Test fixtures with real report data structures, multi-block and mixed chart-type layouts

import {
  calculateLayoutV2BlockHeight,
  validateLayoutV2BlockCapacity,
  calculateLayoutV2GridColumns,
  calculateLayoutV2BlockDimensions
} from '@/lib/layoutV2BlockCalculator';

/**
 * WHAT: Representative report block fixture
 * WHY: Test LayoutV2 with real-world block structures
 */
interface ReportBlockFixture {
  id: string;
  title: string;
  charts: Array<{
    chartId: string;
    width: number;
    order: number;
    type: 'text' | 'kpi' | 'bar' | 'pie' | 'table' | 'image';
  }>;
}

/**
 * WHAT: Multi-block report fixture
 * WHY: Test LayoutV2 with multiple blocks containing different chart types
 */
interface ReportFixture {
  blocks: ReportBlockFixture[];
  blockWidth: number;
}

describe('LayoutV2 End-to-End Rendering Alignment (R-LAYOUT-01.3)', () => {
  describe('Single Block - All Chart Types', () => {
    test('TEXT chart in 1-unit slot', () => {
      const block: ReportBlockFixture = {
        id: 'block-1',
        title: 'Text Block',
        charts: [
          { chartId: 'text-1', width: 1, order: 1, type: 'text' }
        ]
      };
      
      const dimensions = calculateLayoutV2BlockDimensions(block.charts, 1200);
      expect(dimensions.valid).toBe(true);
      expect(dimensions.blockHeight).toBe(300); // 1200 / 4
      expect(dimensions.totalUnits).toBe(1);
      expect(dimensions.gridColumns).toBe('1fr');
      expect(dimensions.itemWidths[0].width).toBe(1200); // (1/1) × 1200
    });

    test('KPI chart in 1-unit slot', () => {
      const block: ReportBlockFixture = {
        id: 'block-2',
        title: 'KPI Block',
        charts: [
          { chartId: 'kpi-1', width: 1, order: 1, type: 'kpi' }
        ]
      };
      
      const dimensions = calculateLayoutV2BlockDimensions(block.charts, 1200);
      expect(dimensions.valid).toBe(true);
      expect(dimensions.blockHeight).toBe(300);
      expect(dimensions.totalUnits).toBe(1);
    });

    test('BAR chart in 2-unit slot', () => {
      const block: ReportBlockFixture = {
        id: 'block-3',
        title: 'Bar Block',
        charts: [
          { chartId: 'bar-1', width: 2, order: 1, type: 'bar' }
        ]
      };
      
      const dimensions = calculateLayoutV2BlockDimensions(block.charts, 1200);
      expect(dimensions.valid).toBe(true);
      expect(dimensions.blockHeight).toBe(300);
      expect(dimensions.totalUnits).toBe(2);
      expect(dimensions.gridColumns).toBe('2fr');
      expect(dimensions.itemWidths[0].width).toBe(1200); // (2/2) × 1200
    });

    test('PIE chart in 1-unit slot', () => {
      const block: ReportBlockFixture = {
        id: 'block-4',
        title: 'Pie Block',
        charts: [
          { chartId: 'pie-1', width: 1, order: 1, type: 'pie' }
        ]
      };
      
      const dimensions = calculateLayoutV2BlockDimensions(block.charts, 1200);
      expect(dimensions.valid).toBe(true);
      expect(dimensions.blockHeight).toBe(300);
      expect(dimensions.totalUnits).toBe(1);
    });

    test('TABLE chart in 1-unit slot', () => {
      const block: ReportBlockFixture = {
        id: 'block-5',
        title: 'Table Block',
        charts: [
          { chartId: 'table-1', width: 1, order: 1, type: 'table' }
        ]
      };
      
      const dimensions = calculateLayoutV2BlockDimensions(block.charts, 1200);
      expect(dimensions.valid).toBe(true);
      expect(dimensions.blockHeight).toBe(300);
      expect(dimensions.totalUnits).toBe(1);
    });

    test('IMAGE chart in 2-unit slot (16:9)', () => {
      const block: ReportBlockFixture = {
        id: 'block-6',
        title: 'Image Block',
        charts: [
          { chartId: 'image-1', width: 2, order: 1, type: 'image' }
        ]
      };
      
      const dimensions = calculateLayoutV2BlockDimensions(block.charts, 1200);
      expect(dimensions.valid).toBe(true);
      expect(dimensions.blockHeight).toBe(300);
      expect(dimensions.totalUnits).toBe(2);
    });
  });

  describe('Multi-Item Blocks - Mixed Chart Types', () => {
    test('4-unit block: 2 KPI + 1 BAR + 1 PIE', () => {
      const block: ReportBlockFixture = {
        id: 'block-mixed-1',
        title: 'Mixed Charts Block',
        charts: [
          { chartId: 'kpi-1', width: 1, order: 1, type: 'kpi' },
          { chartId: 'kpi-2', width: 1, order: 2, type: 'kpi' },
          { chartId: 'bar-1', width: 1, order: 3, type: 'bar' },
          { chartId: 'pie-1', width: 1, order: 4, type: 'pie' }
        ]
      };
      
      const dimensions = calculateLayoutV2BlockDimensions(block.charts, 1200);
      expect(dimensions.valid).toBe(true);
      expect(dimensions.blockHeight).toBe(300);
      expect(dimensions.totalUnits).toBe(4);
      expect(dimensions.gridColumns).toBe('1fr 1fr 1fr 1fr');
      
      // All items should have equal width (1/4 each)
      dimensions.itemWidths.forEach(item => {
        expect(item.width).toBe(300); // (1/4) × 1200
      });
    });

    test('4-unit block: 1 IMAGE (16:9) + 1 TEXT', () => {
      const block: ReportBlockFixture = {
        id: 'block-mixed-2',
        title: 'Image + Text Block',
        charts: [
          { chartId: 'image-1', width: 2, order: 1, type: 'image' },
          { chartId: 'text-1', width: 2, order: 2, type: 'text' }
        ]
      };
      
      const dimensions = calculateLayoutV2BlockDimensions(block.charts, 1200);
      expect(dimensions.valid).toBe(true);
      expect(dimensions.blockHeight).toBe(300);
      expect(dimensions.totalUnits).toBe(4);
      expect(dimensions.gridColumns).toBe('2fr 2fr');
      
      // Both items should have equal width (2/4 each = 50%)
      dimensions.itemWidths.forEach(item => {
        expect(item.width).toBe(600); // (2/4) × 1200
      });
    });

    test('3-unit block: 1 BAR (2 units) + 1 KPI (1 unit)', () => {
      const block: ReportBlockFixture = {
        id: 'block-mixed-3',
        title: 'Bar + KPI Block',
        charts: [
          { chartId: 'bar-1', width: 2, order: 1, type: 'bar' },
          { chartId: 'kpi-1', width: 1, order: 2, type: 'kpi' }
        ]
      };
      
      const dimensions = calculateLayoutV2BlockDimensions(block.charts, 1200);
      expect(dimensions.valid).toBe(true);
      expect(dimensions.blockHeight).toBe(300);
      expect(dimensions.totalUnits).toBe(3);
      expect(dimensions.gridColumns).toBe('2fr 1fr');
      
      expect(dimensions.itemWidths[0].width).toBe(800); // (2/3) × 1200
      expect(dimensions.itemWidths[1].width).toBe(400); // (1/3) × 1200
    });

    test('2-unit block: 1 TABLE (1 unit) + 1 PIE (1 unit)', () => {
      const block: ReportBlockFixture = {
        id: 'block-mixed-4',
        title: 'Table + Pie Block',
        charts: [
          { chartId: 'table-1', width: 1, order: 1, type: 'table' },
          { chartId: 'pie-1', width: 1, order: 2, type: 'pie' }
        ]
      };
      
      const dimensions = calculateLayoutV2BlockDimensions(block.charts, 1200);
      expect(dimensions.valid).toBe(true);
      expect(dimensions.blockHeight).toBe(300);
      expect(dimensions.totalUnits).toBe(2);
      expect(dimensions.gridColumns).toBe('1fr 1fr');
      
      dimensions.itemWidths.forEach(item => {
        expect(item.width).toBe(600); // (1/2) × 1200
      });
    });
  });

  describe('Multi-Block Reports', () => {
    test('Report with 3 blocks: different chart types and unit combinations', () => {
      const report: ReportFixture = {
        blockWidth: 1200,
        blocks: [
          {
            id: 'block-1',
            title: 'Overview',
            charts: [
              { chartId: 'kpi-1', width: 1, order: 1, type: 'kpi' },
              { chartId: 'kpi-2', width: 1, order: 2, type: 'kpi' },
              { chartId: 'kpi-3', width: 1, order: 3, type: 'kpi' },
              { chartId: 'kpi-4', width: 1, order: 4, type: 'kpi' }
            ]
          },
          {
            id: 'block-2',
            title: 'Charts',
            charts: [
              { chartId: 'bar-1', width: 2, order: 1, type: 'bar' },
              { chartId: 'pie-1', width: 1, order: 2, type: 'pie' },
              { chartId: 'text-1', width: 1, order: 3, type: 'text' }
            ]
          },
          {
            id: 'block-3',
            title: 'Details',
            charts: [
              { chartId: 'image-1', width: 2, order: 1, type: 'image' },
              { chartId: 'table-1', width: 2, order: 2, type: 'table' }
            ]
          }
        ]
      };
      
      // Validate each block
      report.blocks.forEach((block, index) => {
        const dimensions = calculateLayoutV2BlockDimensions(block.charts, report.blockWidth);
        expect(dimensions.valid).toBe(true);
        expect(dimensions.blockHeight).toBe(300); // All blocks have same height (4:1 aspect ratio)
        
        // Verify total width equals block width
        const totalWidth = dimensions.itemWidths.reduce((sum, item) => sum + item.width, 0);
        expect(totalWidth).toBe(report.blockWidth);
        
        console.log(`Block ${index + 1} (${block.title}):`, {
          totalUnits: dimensions.totalUnits,
          gridColumns: dimensions.gridColumns,
          itemWidths: dimensions.itemWidths.map(i => i.width)
        });
      });
    });

    test('Report with maximum capacity blocks (4 units each)', () => {
      const report: ReportFixture = {
        blockWidth: 1200,
        blocks: [
          {
            id: 'block-max-1',
            title: 'Max Capacity 1',
            charts: [
              { chartId: 'chart-1', width: 1, order: 1, type: 'kpi' },
              { chartId: 'chart-2', width: 1, order: 2, type: 'kpi' },
              { chartId: 'chart-3', width: 1, order: 3, type: 'kpi' },
              { chartId: 'chart-4', width: 1, order: 4, type: 'kpi' }
            ]
          },
          {
            id: 'block-max-2',
            title: 'Max Capacity 2',
            charts: [
              { chartId: 'chart-5', width: 2, order: 1, type: 'bar' },
              { chartId: 'chart-6', width: 2, order: 2, type: 'bar' }
            ]
          },
          {
            id: 'block-max-3',
            title: 'Max Capacity 3',
            charts: [
              { chartId: 'chart-7', width: 1, order: 1, type: 'pie' },
              { chartId: 'chart-8', width: 1, order: 2, type: 'pie' },
              { chartId: 'chart-9', width: 2, order: 3, type: 'text' }
            ]
          }
        ]
      };
      
      report.blocks.forEach(block => {
        const dimensions = calculateLayoutV2BlockDimensions(block.charts, report.blockWidth);
        expect(dimensions.valid).toBe(true);
        expect(dimensions.totalUnits).toBe(4); // All at max capacity
        expect(dimensions.blockHeight).toBe(300);
      });
    });
  });

  describe('Responsive Width Scenarios', () => {
    test('Block height scales correctly across viewport widths', () => {
      const block: ReportBlockFixture = {
        id: 'block-responsive',
        title: 'Responsive Block',
        charts: [
          { chartId: 'kpi-1', width: 1, order: 1, type: 'kpi' },
          { chartId: 'kpi-2', width: 1, order: 2, type: 'kpi' },
          { chartId: 'kpi-3', width: 1, order: 3, type: 'kpi' },
          { chartId: 'kpi-4', width: 1, order: 4, type: 'kpi' }
        ]
      };
      
      const viewportWidths = [1920, 1200, 768, 375]; // Desktop, Tablet, Mobile
      
      viewportWidths.forEach(width => {
        const dimensions = calculateLayoutV2BlockDimensions(block.charts, width);
        expect(dimensions.valid).toBe(true);
        expect(dimensions.blockHeight).toBe(width / 4); // 4:1 aspect ratio
        expect(dimensions.totalUnits).toBe(4);
        
        // Item widths should sum to block width
        const totalWidth = dimensions.itemWidths.reduce((sum, item) => sum + item.width, 0);
        expect(Math.round(totalWidth)).toBe(width);
      });
    });
  });

  describe('Edge Cases and Validation', () => {
    test('Rejects block exceeding 4-unit capacity', () => {
      const block: ReportBlockFixture = {
        id: 'block-invalid',
        title: 'Invalid Block',
        charts: [
          { chartId: 'chart-1', width: 2, order: 1, type: 'bar' },
          { chartId: 'chart-2', width: 2, order: 2, type: 'bar' },
          { chartId: 'chart-3', width: 1, order: 3, type: 'kpi' }
        ] // Total: 5 units
      };
      
      const dimensions = calculateLayoutV2BlockDimensions(block.charts, 1200);
      expect(dimensions.valid).toBe(false);
      expect(dimensions.error).toContain('exceeds maximum (4 units)');
      expect(dimensions.totalUnits).toBe(5);
    });

    test('Handles empty block gracefully', () => {
      const block: ReportBlockFixture = {
        id: 'block-empty',
        title: 'Empty Block',
        charts: []
      };
      
      const dimensions = calculateLayoutV2BlockDimensions(block.charts, 1200);
      expect(dimensions.valid).toBe(true);
      expect(dimensions.totalUnits).toBe(0);
      expect(dimensions.blockHeight).toBe(300); // Still calculates height
      expect(dimensions.gridColumns).toBe('1fr'); // Fallback
    });

    test('Deterministic: same input produces same output across multiple calls', () => {
      const block: ReportBlockFixture = {
        id: 'block-deterministic',
        title: 'Deterministic Block',
        charts: [
          { chartId: 'bar-1', width: 2, order: 1, type: 'bar' },
          { chartId: 'pie-1', width: 1, order: 2, type: 'pie' },
          { chartId: 'text-1', width: 1, order: 3, type: 'text' }
        ]
      };
      
      const results = Array.from({ length: 5 }, () => 
        calculateLayoutV2BlockDimensions(block.charts, 1200)
      );
      
      // All results should be identical
      results.forEach(result => {
        expect(result.blockHeight).toBe(results[0].blockHeight);
        expect(result.gridColumns).toBe(results[0].gridColumns);
        expect(result.itemWidths).toEqual(results[0].itemWidths);
      });
    });
  });

  describe('Layout Grammar Compliance', () => {
    test('All chart types respect 4:1 aspect ratio (no overflow)', () => {
      const chartTypes: Array<'text' | 'kpi' | 'bar' | 'pie' | 'table' | 'image'> = 
        ['text', 'kpi', 'bar', 'pie', 'table', 'image'];
      
      chartTypes.forEach(type => {
        const block: ReportBlockFixture = {
          id: `block-${type}`,
          title: `${type} Chart Block`,
          charts: [
            { chartId: `${type}-1`, width: 1, order: 1, type }
          ]
        };
        
        const dimensions = calculateLayoutV2BlockDimensions(block.charts, 1200);
        expect(dimensions.valid).toBe(true);
        expect(dimensions.blockHeight).toBe(300); // 1200 / 4 = 300
        // Height is fixed by aspect ratio, content must fit (enforced by chart components)
      });
    });

    test('Multi-item blocks maintain uniform height (Layout Grammar requirement)', () => {
      const block: ReportBlockFixture = {
        id: 'block-uniform',
        title: 'Uniform Height Block',
        charts: [
          { chartId: 'kpi-1', width: 1, order: 1, type: 'kpi' },
          { chartId: 'bar-1', width: 1, order: 2, type: 'bar' },
          { chartId: 'pie-1', width: 1, order: 3, type: 'pie' },
          { chartId: 'text-1', width: 1, order: 4, type: 'text' }
        ]
      };
      
      const dimensions = calculateLayoutV2BlockDimensions(block.charts, 1200);
      expect(dimensions.valid).toBe(true);
      expect(dimensions.blockHeight).toBe(300);
      
      // All items share the same height (block height)
      // Individual item heights are enforced by chart components via CSS variables
      dimensions.itemWidths.forEach(item => {
        expect(item.width).toBe(300); // Equal width distribution
      });
    });
  });
});
