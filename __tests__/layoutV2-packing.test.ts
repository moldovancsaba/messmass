// __tests__/layoutV2-packing.test.ts
// WHAT: Tests for LayoutV2 deterministic block + unit packing
// WHY: Ensure same input => same layout, 4:1 aspect ratio, 4-unit capacity
// HOW: Test fixtures for various unit combinations

import {
  calculateLayoutV2BlockHeight,
  validateLayoutV2BlockCapacity,
  calculateLayoutV2ItemWidth,
  calculateLayoutV2GridColumns,
  calculateLayoutV2BlockDimensions
} from '@/lib/layoutV2BlockCalculator';

describe('LayoutV2 Block Height Calculation', () => {
  test('calculates height from 4:1 aspect ratio', () => {
    expect(calculateLayoutV2BlockHeight(1200)).toBe(300);
    expect(calculateLayoutV2BlockHeight(800)).toBe(200);
    expect(calculateLayoutV2BlockHeight(400)).toBe(100);
  });

  test('handles edge cases', () => {
    expect(calculateLayoutV2BlockHeight(0)).toBe(300); // Fallback
    expect(calculateLayoutV2BlockHeight(-100)).toBe(300); // Fallback
  });
});

describe('LayoutV2 Block Capacity Validation', () => {
  test('validates 4-unit capacity correctly', () => {
    const valid = [
      { width: 1 },
      { width: 2 },
      { width: 1 }
    ]; // Total: 4 units
    const result = validateLayoutV2BlockCapacity(valid);
    expect(result.valid).toBe(true);
    expect(result.totalUnits).toBe(4);
  });

  test('rejects blocks exceeding 4 units', () => {
    const invalid = [
      { width: 2 },
      { width: 2 },
      { width: 1 }
    ]; // Total: 5 units
    const result = validateLayoutV2BlockCapacity(invalid);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum (4 units)');
    expect(result.totalUnits).toBe(5);
  });

  test('handles empty blocks', () => {
    const result = validateLayoutV2BlockCapacity([]);
    expect(result.valid).toBe(true);
    expect(result.totalUnits).toBe(0);
  });
});

describe('LayoutV2 Item Width Calculation', () => {
  test('calculates item width proportionally', () => {
    // Block width: 1200px, items: [2 units, 1 unit, 1 unit] = 4 units total
    expect(calculateLayoutV2ItemWidth(2, 4, 1200)).toBe(600); // (2/4) × 1200 = 600
    expect(calculateLayoutV2ItemWidth(1, 4, 1200)).toBe(300); // (1/4) × 1200 = 300
    expect(calculateLayoutV2ItemWidth(1, 4, 1200)).toBe(300); // (1/4) × 1200 = 300
  });

  test('ensures total width equals block width', () => {
    const blockWidth = 1200;
    const charts = [
      { width: 2 },
      { width: 1 },
      { width: 1 }
    ];
    const totalUnits = charts.reduce((sum, c) => sum + c.width, 0);
    const itemWidths = charts.map(c => calculateLayoutV2ItemWidth(c.width, totalUnits, blockWidth));
    const totalWidth = itemWidths.reduce((sum, w) => sum + w, 0);
    expect(totalWidth).toBe(blockWidth);
  });
});

describe('LayoutV2 Grid Columns Calculation', () => {
  test('converts chart widths to fr units', () => {
    const charts = [
      { width: 2 },
      { width: 1 },
      { width: 1 }
    ];
    const gridColumns = calculateLayoutV2GridColumns(charts);
    expect(gridColumns).toBe('2fr 1fr 1fr');
  });

  test('handles single chart', () => {
    const charts = [{ width: 2 }];
    const gridColumns = calculateLayoutV2GridColumns(charts);
    expect(gridColumns).toBe('2fr');
  });

  test('handles empty charts', () => {
    const gridColumns = calculateLayoutV2GridColumns([]);
    expect(gridColumns).toBe('1fr');
  });
});

describe('LayoutV2 Block Dimensions (Integration)', () => {
  test('calculates valid block dimensions', () => {
    const charts = [
      { width: 2 },
      { width: 1 },
      { width: 1 }
    ];
    const blockWidth = 1200;
    const result = calculateLayoutV2BlockDimensions(charts, blockWidth);
    
    expect(result.valid).toBe(true);
    expect(result.blockHeight).toBe(300); // 1200 / 4 = 300
    expect(result.totalUnits).toBe(4);
    expect(result.gridColumns).toBe('2fr 1fr 1fr');
    expect(result.itemWidths).toHaveLength(3);
    expect(result.itemWidths[0].width).toBe(600); // (2/4) × 1200
    expect(result.itemWidths[1].width).toBe(300); // (1/4) × 1200
    expect(result.itemWidths[2].width).toBe(300); // (1/4) × 1200
  });

  test('rejects invalid block (exceeds capacity)', () => {
    const charts = [
      { width: 2 },
      { width: 2 },
      { width: 1 }
    ]; // Total: 5 units
    const blockWidth = 1200;
    const result = calculateLayoutV2BlockDimensions(charts, blockWidth);
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum (4 units)');
    expect(result.totalUnits).toBe(5);
    // Still calculates height for fallback
    expect(result.blockHeight).toBe(300);
  });

  test('deterministic packing: same input => same output', () => {
    const charts = [
      { width: 1 },
      { width: 2 },
      { width: 1 }
    ];
    const blockWidth = 1200;
    
    const result1 = calculateLayoutV2BlockDimensions(charts, blockWidth);
    const result2 = calculateLayoutV2BlockDimensions(charts, blockWidth);
    
    // Same input should produce identical output
    expect(result1.blockHeight).toBe(result2.blockHeight);
    expect(result1.gridColumns).toBe(result2.gridColumns);
    expect(result1.itemWidths).toEqual(result2.itemWidths);
  });
});
