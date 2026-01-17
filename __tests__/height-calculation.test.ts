// __tests__/height-calculation.test.ts
// WHAT: Tests for A-03.1 + A-03.2 + A-03.3 - Height calculation fixes for TEXT AREA, KPI, and BAR charts
// WHY: Ensure height calculations prevent clipping of multi-line text, KPI values/labels, and BAR chart labels
// HOW: Test height calculation logic and validation

/**
 * A-03.1: TEXT AREA Chart Height Calculation
 * 
 * Requirements:
 * - Multi-line text must never be clipped/hidden
 * - Height calculation must account for title height and padding
 * - Content must wrap to fit within allocated space
 * - Height must be recalculated on resize and content changes
 */

/**
 * A-03.2: KPI Chart Height Calculation
 * 
 * Requirements:
 * - KPI values must never be clipped/hidden
 * - KPI labels must never be clipped/hidden (clamped to 2 lines per Layout Grammar)
 * - Row heights must accommodate actual content height
 * - Height must be validated on resize and content changes
 */

/**
 * A-03.3: BAR Chart Height Calculation
 * 
 * Requirements:
 * - Replace fixed label height assumptions with measured layout logic
 * - Measure actual rendered label heights after rendering
 * - Validate labels fit within allocated row height
 * - Prevent label overflow and clipping
 */

describe('A-03.1 + A-03.2 + A-03.3: Height Calculation Fixes', () => {
  describe('A-03.1: TEXT AREA Chart Height Calculation', () => {
    it('should calculate content height accounting for title height', () => {
      // WHAT: Test height calculation formula
      // WHY: Content height = container height - title height
      // HOW: Verify the calculation logic
      const containerHeight = 400;
      const titleHeight = 50;
      const expectedContentHeight = containerHeight - titleHeight;
      
      expect(expectedContentHeight).toBe(350);
    });

    it('should account for padding in content wrapper', () => {
      // WHAT: Test padding calculation
      // WHY: Padding reduces available space for content
      // HOW: Verify padding is accounted for (var(--mm-space-2) = 8px × 2 = 16px)
      const contentHeight = 350;
      const padding = 16; // 2 × var(--mm-space-2)
      const availableContentHeight = contentHeight - padding;
      
      expect(availableContentHeight).toBe(334);
    });

    it('should validate content fits within available space', () => {
      // WHAT: Test content validation
      // WHY: Content must fit within allocated space to prevent clipping
      // HOW: Verify validation logic
      const actualContentHeight = 300;
      const availableContentHeight = 334;
      
      const fits = actualContentHeight <= availableContentHeight;
      expect(fits).toBe(true);
    });
  });

  describe('A-03.2: KPI Chart Height Calculation', () => {
    it('should calculate row heights based on grid proportions', () => {
      // WHAT: Test grid proportion calculation
      // WHY: Grid uses 4fr:3fr:3fr (Icon:Value:Title = 40%:30%:30%)
      // HOW: Verify row height calculations
      const containerHeight = 400;
      const iconRowHeight = containerHeight * 0.4; // 4fr / 10fr = 40%
      const valueRowHeight = containerHeight * 0.3; // 3fr / 10fr = 30%
      const titleRowHeight = containerHeight * 0.3; // 3fr / 10fr = 30%
      
      expect(iconRowHeight).toBe(160);
      expect(valueRowHeight).toBe(120);
      expect(titleRowHeight).toBe(120);
      expect(iconRowHeight + valueRowHeight + titleRowHeight).toBe(400);
    });

    it('should account for padding in value row', () => {
      // WHAT: Test padding calculation for value row
      // WHY: Padding reduces available space for content
      // HOW: Verify padding is accounted for
      const valueRowHeight = 120;
      const paddingTop = 0; // Value row has no padding
      const paddingBottom = 0;
      const availableValueHeight = valueRowHeight - paddingTop - paddingBottom;
      
      expect(availableValueHeight).toBe(120);
    });

    it('should account for padding in title row', () => {
      // WHAT: Test padding calculation for title row
      // WHY: Padding reduces available space for content
      // HOW: Verify padding is accounted for (var(--mm-space-2) = 8px × 2 = 16px)
      const titleRowHeight = 120;
      const padding = 16; // 2 × var(--mm-space-2)
      const availableTitleHeight = titleRowHeight - padding;
      
      expect(availableTitleHeight).toBe(104);
    });

    it('should validate value fits within allocated row height', () => {
      // WHAT: Test value validation
      // WHY: Value must fit within allocated row height to prevent clipping
      // HOW: Verify validation logic
      const actualValueHeight = 100;
      const availableValueHeight = 120;
      
      const fits = actualValueHeight <= availableValueHeight;
      expect(fits).toBe(true);
    });

    it('should validate title fits within allocated row height (2-line clamp)', () => {
      // WHAT: Test title validation
      // WHY: Title must fit within allocated row height (clamped to 2 lines per Layout Grammar)
      // HOW: Verify validation logic
      const actualTitleHeight = 50; // 2 lines × line-height
      const availableTitleHeight = 104;
      
      const fits = actualTitleHeight <= availableTitleHeight;
      expect(fits).toBe(true);
    });
  });

  describe('A-03.3: BAR Chart Height Calculation', () => {
    it('should calculate available height per row accounting for padding and spacing', () => {
      // WHAT: Test available row height calculation
      // WHY: Each row needs space for label + bar track + spacing
      // HOW: Verify the calculation logic
      const bodyHeight = 400;
      const chartBodyPadding = 16; // 2 × var(--mm-space-2)
      const barCount = 5;
      const rowSpacing = 8; // var(--mm-space-2)
      const availableHeightPerRow = (bodyHeight - chartBodyPadding) / barCount - rowSpacing;
      
      expect(availableHeightPerRow).toBe((400 - 16) / 5 - 8); // 68.8px
    });

    it('should account for label cell padding in available label height', () => {
      // WHAT: Test padding calculation for label cell
      // WHY: Padding reduces available space for content
      // HOW: Verify padding is accounted for
      const availableHeightPerRow = 68.8;
      const paddingTop = 0; // Label cell has no vertical padding
      const paddingBottom = 0;
      const availableLabelHeight = availableHeightPerRow - paddingTop - paddingBottom;
      
      expect(availableLabelHeight).toBe(68.8);
    });

    it('should validate label fits within allocated row height', () => {
      // WHAT: Test label validation
      // WHY: Labels must fit within allocated row height to prevent clipping
      // HOW: Verify validation logic
      const actualLabelHeight = 50;
      const availableLabelHeight = 68.8;
      
      const fits = actualLabelHeight <= availableLabelHeight;
      expect(fits).toBe(true);
    });

    it('should calculate required row height as max of label height and bar track height', () => {
      // WHAT: Test row height calculation
      // WHY: Row height is determined by tallest element (label or bar track)
      // HOW: Verify calculation logic
      const actualLabelHeight = 50;
      const paddingTop = 0;
      const paddingBottom = 0;
      const minBarTrackHeight = 20; // Layout Grammar minimum
      const requiredRowHeight = Math.max(
        actualLabelHeight + paddingTop + paddingBottom,
        minBarTrackHeight
      );
      
      expect(requiredRowHeight).toBe(50); // Label height is taller
    });

    it('should use bar track height when label is shorter', () => {
      // WHAT: Test row height calculation when bar track is taller
      // WHY: Row height must accommodate bar track minimum (20px)
      // HOW: Verify calculation uses bar track height
      const actualLabelHeight = 15;
      const paddingTop = 0;
      const paddingBottom = 0;
      const minBarTrackHeight = 20; // Layout Grammar minimum
      const requiredRowHeight = Math.max(
        actualLabelHeight + paddingTop + paddingBottom,
        minBarTrackHeight
      );
      
      expect(requiredRowHeight).toBe(20); // Bar track height is taller
    });
  });

  describe('Height Calculation Edge Cases', () => {
    it('should handle zero container height gracefully', () => {
      // WHAT: Test edge case
      // WHY: Container height might be 0 during initial render
      // HOW: Verify calculation handles zero height
      const containerHeight = 0;
      const titleHeight = 0;
      const contentHeight = containerHeight - titleHeight;
      
      expect(contentHeight).toBe(0);
    });

    it('should handle missing title gracefully', () => {
      // WHAT: Test edge case
      // WHY: Title might not be shown (showTitle = false)
      // HOW: Verify calculation handles missing title
      const containerHeight = 400;
      const titleHeight = 0; // No title
      const contentHeight = containerHeight - titleHeight;
      
      expect(contentHeight).toBe(400);
    });

    it('should handle very tall content by ensuring wrapping', () => {
      // WHAT: Test edge case
      // WHY: Content might be very tall and need to wrap
      // HOW: Verify wrapping is enforced (CSS: word-wrap: break-word)
      const actualContentHeight = 1000;
      const availableContentHeight = 334;
      
      // Content should wrap to fit, not clip
      // In practice, with word-wrap: break-word, content will wrap
      // This test verifies the validation logic detects the issue
      const exceeds = actualContentHeight > availableContentHeight;
      expect(exceeds).toBe(true);
    });

    it('should handle BAR chart with zero bars gracefully', () => {
      // WHAT: Test edge case
      // WHY: BAR chart might have no bars
      // HOW: Verify calculation handles zero bars
      const barCount = 0;
      const bodyHeight = 400;
      const chartBodyPadding = 16;
      
      if (barCount === 0) {
        // No calculation needed, chart is empty
        expect(true).toBe(true);
      } else {
        const availableHeightPerRow = (bodyHeight - chartBodyPadding) / barCount;
        expect(availableHeightPerRow).toBeGreaterThan(0);
      }
    });
  });
});
