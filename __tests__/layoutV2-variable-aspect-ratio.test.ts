// __tests__/layoutV2-variable-aspect-ratio.test.ts
// WHAT: Regression tests for R-LAYOUT-02.1 - Variable Block Aspect Ratio support
// WHY: Ensure aspect ratio override works correctly for TEXT-AREA/TABLE blocks
// HOW: Test default 4:1, extended ratios (4:6, 4:10), and invalid combinations

import {
  calculateLayoutV2BlockHeight,
  validateAspectRatioRange,
  validateAspectRatioOverride,
  calculateLayoutV2BlockDimensions
} from '@/lib/layoutV2BlockCalculator';

describe('R-LAYOUT-02.1: Variable Block Aspect Ratio Support', () => {
  describe('Default Behavior (4:1)', () => {
    test('defaults to 4:1 when blockAspectRatio not specified', () => {
      const blockWidth = 1200;
      const height = calculateLayoutV2BlockHeight(blockWidth);
      expect(height).toBe(300); // 1200 / 4 = 300
    });

    test('defaults to 4:1 when blockAspectRatio is undefined', () => {
      const blockWidth = 1200;
      const height = calculateLayoutV2BlockHeight(blockWidth, undefined);
      expect(height).toBe(300);
    });

    test('defaults to 4:1 when blockAspectRatio is empty string', () => {
      const blockWidth = 1200;
      const height = calculateLayoutV2BlockHeight(blockWidth, '');
      expect(height).toBe(300);
    });
  });

  describe('Extended Aspect Ratios (4:1 to 4:10)', () => {
    test('calculates height for 4:6 aspect ratio', () => {
      const blockWidth = 1200;
      const height = calculateLayoutV2BlockHeight(blockWidth, '4:6');
      expect(height).toBe(1800); // 1200 × (6/4) = 1800
    });

    test('calculates height for 4:10 aspect ratio (maximum)', () => {
      const blockWidth = 1200;
      const height = calculateLayoutV2BlockHeight(blockWidth, '4:10');
      expect(height).toBe(3000); // 1200 × (10/4) = 3000
    });

    test('calculates height for 4:2 aspect ratio', () => {
      const blockWidth = 1200;
      const height = calculateLayoutV2BlockHeight(blockWidth, '4:2');
      expect(height).toBe(600); // 1200 × (2/4) = 600
    });

    test('calculates height for 4:8 aspect ratio', () => {
      const blockWidth = 1200;
      const height = calculateLayoutV2BlockHeight(blockWidth, '4:8');
      expect(height).toBe(2400); // 1200 × (8/4) = 2400
    });
  });

  describe('Aspect Ratio Range Validation', () => {
    test('validates 4:1 to 4:10 range correctly', () => {
      expect(validateAspectRatioRange('4:1').valid).toBe(true);
      expect(validateAspectRatioRange('4:5').valid).toBe(true);
      expect(validateAspectRatioRange('4:10').valid).toBe(true);
    });

    test('rejects aspect ratios outside 4:1 to 4:10 range', () => {
      const result1 = validateAspectRatioRange('4:0');
      expect(result1.valid).toBe(false);
      expect(result1.error).toContain('between 1 and 10');

      const result2 = validateAspectRatioRange('4:11');
      expect(result2.valid).toBe(false);
      expect(result2.error).toContain('between 1 and 10');
    });

    test('rejects aspect ratios with width != 4', () => {
      const result1 = validateAspectRatioRange('3:6');
      expect(result1.valid).toBe(false);
      expect(result1.error).toContain('width must be 4');

      const result2 = validateAspectRatioRange('5:10');
      expect(result2.valid).toBe(false);
      expect(result2.error).toContain('width must be 4');
    });

    test('rejects invalid format', () => {
      const result1 = validateAspectRatioRange('invalid');
      expect(result1.valid).toBe(false);
      expect(result1.error).toContain('format');

      const result2 = validateAspectRatioRange('4-6');
      expect(result2.valid).toBe(false);
      expect(result2.error).toContain('format');
    });
  });

  describe('Aspect Ratio Override Validation (TEXT-AREA/TABLE Only)', () => {
    test('allows override for TEXT-only block', () => {
      const charts = [
        { width: 1, type: 'text' },
        { width: 1, type: 'text' }
      ];
      const result = validateAspectRatioOverride(charts);
      expect(result.valid).toBe(true);
    });

    test('allows override for TABLE-only block', () => {
      const charts = [
        { width: 2, type: 'table' }
      ];
      const result = validateAspectRatioOverride(charts);
      expect(result.valid).toBe(true);
    });

    test('allows override for mixed TEXT and TABLE block', () => {
      const charts = [
        { width: 1, type: 'text' },
        { width: 1, type: 'table' }
      ];
      const result = validateAspectRatioOverride(charts);
      expect(result.valid).toBe(true);
    });

    test('rejects override for KPI chart', () => {
      const charts = [
        { width: 1, type: 'kpi' }
      ];
      const result = validateAspectRatioOverride(charts);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('only allowed for TEXT-AREA/TABLE');
      expect(result.error).toContain('kpi');
    });

    test('rejects override for BAR chart', () => {
      const charts = [
        { width: 2, type: 'bar' }
      ];
      const result = validateAspectRatioOverride(charts);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('only allowed for TEXT-AREA/TABLE');
      expect(result.error).toContain('bar');
    });

    test('rejects override for PIE chart', () => {
      const charts = [
        { width: 1, type: 'pie' }
      ];
      const result = validateAspectRatioOverride(charts);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('only allowed for TEXT-AREA/TABLE');
      expect(result.error).toContain('pie');
    });

    test('rejects override for IMAGE chart', () => {
      const charts = [
        { width: 2, type: 'image' }
      ];
      const result = validateAspectRatioOverride(charts);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('only allowed for TEXT-AREA/TABLE');
      expect(result.error).toContain('image');
    });

    test('rejects override for mixed TEXT and KPI block', () => {
      const charts = [
        { width: 1, type: 'text' },
        { width: 1, type: 'kpi' }
      ];
      const result = validateAspectRatioOverride(charts);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('only allowed for TEXT-AREA/TABLE');
      expect(result.error).toContain('kpi');
    });

    test('rejects override for empty block', () => {
      const result = validateAspectRatioOverride([]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty block');
    });
  });

  describe('Block Dimensions with Aspect Ratio Override', () => {
    test('uses default 4:1 when blockAspectRatio not provided', () => {
      const charts = [
        { width: 1, type: 'text' }
      ];
      const dimensions = calculateLayoutV2BlockDimensions(charts, 1200);
      expect(dimensions.valid).toBe(true);
      expect(dimensions.blockHeight).toBe(300); // 1200 / 4 = 300
    });

    test('uses custom 4:6 aspect ratio for TEXT block', () => {
      const charts = [
        { width: 1, type: 'text' }
      ];
      const dimensions = calculateLayoutV2BlockDimensions(charts, 1200, '4:6');
      expect(dimensions.valid).toBe(true);
      expect(dimensions.blockHeight).toBe(1800); // 1200 × (6/4) = 1800
    });

    test('uses custom 4:10 aspect ratio for TABLE block', () => {
      const charts = [
        { width: 2, type: 'table' }
      ];
      const dimensions = calculateLayoutV2BlockDimensions(charts, 1200, '4:10');
      expect(dimensions.valid).toBe(true);
      expect(dimensions.blockHeight).toBe(3000); // 1200 × (10/4) = 3000
    });

    test('falls back to 4:1 when override invalid (out of range)', () => {
      const charts = [
        { width: 1, type: 'text' }
      ];
      const dimensions = calculateLayoutV2BlockDimensions(charts, 1200, '4:11');
      expect(dimensions.valid).toBe(true);
      expect(dimensions.blockHeight).toBe(300); // Falls back to 4:1
    });

    test('falls back to 4:1 when override invalid (wrong chart type)', () => {
      const charts = [
        { width: 1, type: 'kpi' }
      ];
      const dimensions = calculateLayoutV2BlockDimensions(charts, 1200, '4:6');
      expect(dimensions.valid).toBe(true);
      expect(dimensions.blockHeight).toBe(300); // Falls back to 4:1 (override rejected)
    });

    test('falls back to 4:1 when override invalid (mixed types)', () => {
      const charts = [
        { width: 1, type: 'text' },
        { width: 1, type: 'kpi' }
      ];
      const dimensions = calculateLayoutV2BlockDimensions(charts, 1200, '4:6');
      expect(dimensions.valid).toBe(true);
      expect(dimensions.blockHeight).toBe(300); // Falls back to 4:1 (override rejected)
    });

    test('maintains deterministic layout with aspect ratio override', () => {
      const charts = [
        { width: 1, type: 'text' },
        { width: 1, type: 'table' }
      ];
      const blockWidth = 1200;
      const aspectRatio = '4:6';
      
      const result1 = calculateLayoutV2BlockDimensions(charts, blockWidth, aspectRatio);
      const result2 = calculateLayoutV2BlockDimensions(charts, blockWidth, aspectRatio);
      
      // Same input should produce identical output
      expect(result1.blockHeight).toBe(result2.blockHeight);
      expect(result1.gridColumns).toBe(result2.gridColumns);
      expect(result1.itemWidths).toEqual(result2.itemWidths);
    });
  });

  describe('Responsive Width Scenarios with Aspect Ratio Override', () => {
    test('aspect ratio override scales correctly across viewport widths', () => {
      const charts = [
        { width: 1, type: 'text' }
      ];
      const aspectRatio = '4:6';
      const viewportWidths = [1920, 1200, 768, 375];
      
      viewportWidths.forEach(width => {
        const dimensions = calculateLayoutV2BlockDimensions(charts, width, aspectRatio);
        expect(dimensions.valid).toBe(true);
        expect(dimensions.blockHeight).toBe((width * 6) / 4); // 4:6 ratio
      });
    });
  });
});
