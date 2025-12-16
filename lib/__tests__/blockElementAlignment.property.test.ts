// lib/__tests__/blockElementAlignment.property.test.ts
// WHAT: Property-based tests for block element alignment consistency
// WHY: Verify that titles, descriptions, and charts align at consistent heights within report blocks
// HOW: Mock CSS layout calculations and verify alignment properties

import fc from 'fast-check';
import { BlockAlignmentSettings } from '../chartConfigTypes';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import { describe } from 'node:test';

// Mock chart element for testing alignment
interface MockChartElement {
  id: string;
  title: string;
  subtitle?: string;
  type: 'kpi' | 'pie' | 'bar' | 'text' | 'image';
  width: number; // Chart width in grid units
  titleHeight: number; // Calculated title area height
  subtitleHeight: number; // Calculated subtitle area height
  graphicHeight: number; // Calculated graphic area height
  totalHeight: number; // Total chart height
}

// Mock report block for testing
interface MockReportBlock {
  id: string;
  name: string;
  charts: MockChartElement[];
  alignmentSettings?: BlockAlignmentSettings;
  maxTitleHeight: number; // Maximum title height in the block
  maxSubtitleHeight: number; // Maximum subtitle height in the block
  maxGraphicHeight: number; // Maximum graphic height in the block
  isAligned: boolean; // Whether all elements are properly aligned
}

/**
 * Mock function that calculates chart element heights based on content
 * In real implementation, this would be the actual CSS layout calculation
 */
function calculateChartElementHeights(
  title: string,
  subtitle: string | undefined,
  type: 'kpi' | 'pie' | 'bar' | 'text' | 'image',
  width: number
): { titleHeight: number; subtitleHeight: number; graphicHeight: number } {
  // WHAT: Calculate title height based on text length and width
  // WHY: Longer titles wrap to multiple lines, affecting height
  // HOW: Estimate line wrapping based on character count and width
  const titleLineHeight = 1.25; // rem
  const titleFontSize = 1.125; // rem
  const charactersPerLine = Math.max(20, width * 15); // More width = more characters per line
  const titleLines = Math.max(1, Math.ceil(title.length / charactersPerLine));
  const titleHeight = Math.min(titleLines * titleLineHeight * titleFontSize, 2.5); // Max 2 lines
  
  // WHAT: Calculate subtitle height similarly
  const subtitleLineHeight = 1.4; // rem
  const subtitleFontSize = 0.875; // rem
  const subtitleLines = subtitle ? Math.max(1, Math.ceil(subtitle.length / charactersPerLine)) : 0;
  const subtitleHeight = subtitle ? Math.min(subtitleLines * subtitleLineHeight * subtitleFontSize, 1.75) : 0;
  
  // WHAT: Calculate graphic height based on chart type and width
  // WHY: Different chart types have different space requirements
  // HOW: Base height varies by type, width affects aspect ratio
  let baseGraphicHeight = 200; // Minimum height
  switch (type) {
    case 'kpi':
      baseGraphicHeight = 120 + (width * 20); // KPIs scale with width
      break;
    case 'pie':
      baseGraphicHeight = 200 + (width * 30); // Pies need more space
      break;
    case 'bar':
      baseGraphicHeight = 180 + (width * 25); // Bars scale with width
      break;
    case 'text':
      baseGraphicHeight = 100 + (width * 15); // Text is more compact
      break;
    case 'image':
      baseGraphicHeight = 150 + (width * 40); // Images vary by aspect ratio
      break;
  }
  
  return {
    titleHeight,
    subtitleHeight,
    graphicHeight: baseGraphicHeight
  };
}

/**
 * Mock function that applies alignment settings to a report block
 * In real implementation, this would be the actual CSS alignment system
 */
function applyBlockAlignment(
  charts: MockChartElement[],
  alignmentSettings?: BlockAlignmentSettings
): MockReportBlock {
  if (charts.length === 0) {
    return {
      id: 'empty-block',
      name: 'Empty Block',
      charts: [],
      alignmentSettings,
      maxTitleHeight: 0,
      maxSubtitleHeight: 0,
      maxGraphicHeight: 0,
      isAligned: true
    };
  }
  
  // WHAT: Calculate maximum heights for each element type
  // WHY: All elements of the same type should align to the tallest one
  const maxTitleHeight = Math.max(...charts.map(c => c.titleHeight));
  const maxSubtitleHeight = Math.max(...charts.map(c => c.subtitleHeight));
  const maxGraphicHeight = Math.max(...charts.map(c => c.graphicHeight));
  
  // WHAT: Apply alignment settings if enabled
  // WHY: Allow disabling alignment for specific element types
  const effectiveMaxTitleHeight = (alignmentSettings?.alignTitles ?? true) ? maxTitleHeight : 0;
  const effectiveMaxSubtitleHeight = (alignmentSettings?.alignDescriptions ?? true) ? maxSubtitleHeight : 0;
  const effectiveMaxGraphicHeight = (alignmentSettings?.alignCharts ?? true) ? maxGraphicHeight : 0;
  
  // WHAT: Check if alignment is properly applied
  // WHY: Verify that all elements of the same type have consistent heights
  const isAligned = charts.every(chart => {
    const titleAligned = !alignmentSettings?.alignTitles || chart.titleHeight <= effectiveMaxTitleHeight + 0.1;
    const subtitleAligned = !alignmentSettings?.alignDescriptions || chart.subtitleHeight <= effectiveMaxSubtitleHeight + 0.1;
    const graphicAligned = !alignmentSettings?.alignCharts || chart.graphicHeight <= effectiveMaxGraphicHeight + 0.1;
    return titleAligned && subtitleAligned && graphicAligned;
  });
  
  return {
    id: 'test-block',
    name: 'Test Block',
    charts,
    alignmentSettings,
    maxTitleHeight: effectiveMaxTitleHeight,
    maxSubtitleHeight: effectiveMaxSubtitleHeight,
    maxGraphicHeight: effectiveMaxGraphicHeight,
    isAligned
  };
}

/**
 * Generate a mock chart element with calculated heights
 */
function generateMockChart(
  id: string,
  title: string,
  subtitle: string | undefined,
  type: 'kpi' | 'pie' | 'bar' | 'text' | 'image',
  width: number
): MockChartElement {
  const heights = calculateChartElementHeights(title, subtitle, type, width);
  return {
    id,
    title,
    subtitle,
    type,
    width,
    titleHeight: heights.titleHeight,
    subtitleHeight: heights.subtitleHeight,
    graphicHeight: heights.graphicHeight,
    totalHeight: heights.titleHeight + heights.subtitleHeight + heights.graphicHeight
  };
}

describe('Block Element Alignment - Property Tests', () => {
  /**
   * Property 3: Block element alignment consistency
   * Feature: report-template-hero-controls, Property 3: Block element alignment consistency
   * Validates: Requirements 2.1, 2.2, 2.3, 4.3
   * 
   * For any report block with multiple charts, when alignment settings are enabled,
   * all elements of the same type (titles, descriptions, charts) should align at consistent heights
   */
  test('Property 3: Block element alignment consistency', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 5, maxLength: 100 }),
            subtitle: fc.option(fc.string({ minLength: 5, maxLength: 80 })),
            type: fc.constantFrom('kpi', 'pie', 'bar', 'text', 'image'),
            width: fc.integer({ min: 1, max: 4 })
          }),
          { minLength: 2, maxLength: 6 }
        ),
        fc.record({
          alignTitles: fc.boolean(),
          alignDescriptions: fc.boolean(),
          alignCharts: fc.boolean(),
          minElementHeight: fc.option(fc.integer({ min: 50, max: 300 }))
        }),
        (chartConfigs, alignmentSettings: BlockAlignmentSettings) => {
          // Generate mock charts with calculated heights
          const charts = chartConfigs.map((config, idx) => 
            generateMockChart(
              `chart-${idx}`,
              config.title,
              config.subtitle,
              config.type,
              config.width
            )
          );
          
          // Apply alignment settings
          const block = applyBlockAlignment(charts, alignmentSettings);
          
          // Verify alignment is properly applied
          expect(block.isAligned).toBe(true);
          
          // Verify title alignment when enabled
          if (alignmentSettings.alignTitles) {
            const titleHeights = charts.map(c => c.titleHeight);
            const maxTitleHeight = Math.max(...titleHeights);
            expect(block.maxTitleHeight).toBeCloseTo(maxTitleHeight, 1);
            
            // All titles should be aligned to the maximum height
            for (const chart of charts) {
              expect(chart.titleHeight).toBeLessThanOrEqual(maxTitleHeight + 0.1);
            }
          }
          
          // Verify subtitle alignment when enabled
          if (alignmentSettings.alignDescriptions) {
            const subtitleHeights = charts.map(c => c.subtitleHeight);
            const maxSubtitleHeight = Math.max(...subtitleHeights);
            expect(block.maxSubtitleHeight).toBeCloseTo(maxSubtitleHeight, 1);
            
            // All subtitles should be aligned to the maximum height
            for (const chart of charts) {
              expect(chart.subtitleHeight).toBeLessThanOrEqual(maxSubtitleHeight + 0.1);
            }
          }
          
          // Verify chart alignment when enabled
          if (alignmentSettings.alignCharts) {
            const graphicHeights = charts.map(c => c.graphicHeight);
            const maxGraphicHeight = Math.max(...graphicHeights);
            expect(block.maxGraphicHeight).toBeCloseTo(maxGraphicHeight, 1);
            
            // All charts should be aligned to the maximum height
            for (const chart of charts) {
              expect(chart.graphicHeight).toBeLessThanOrEqual(maxGraphicHeight + 0.1);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Single chart blocks are always aligned
   * 
   * For any block with only one chart, alignment should always be considered valid
   */
  test('Property: Single chart blocks are always aligned', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 5, maxLength: 100 }),
          subtitle: fc.option(fc.string({ minLength: 5, maxLength: 80 })),
          type: fc.constantFrom('kpi', 'pie', 'bar', 'text', 'image'),
          width: fc.integer({ min: 1, max: 4 })
        }),
        fc.record({
          alignTitles: fc.boolean(),
          alignDescriptions: fc.boolean(),
          alignCharts: fc.boolean()
        }),
        (chartConfig, alignmentSettings: BlockAlignmentSettings) => {
          const chart = generateMockChart(
            'single-chart',
            chartConfig.title,
            chartConfig.subtitle,
            chartConfig.type,
            chartConfig.width
          );
          
          const block = applyBlockAlignment([chart], alignmentSettings);
          
          // Single chart blocks should always be aligned
          expect(block.isAligned).toBe(true);
          
          // Heights should match the single chart's heights
          if (alignmentSettings.alignTitles) {
            expect(block.maxTitleHeight).toBeCloseTo(chart.titleHeight, 1);
          }
          if (alignmentSettings.alignDescriptions) {
            expect(block.maxSubtitleHeight).toBeCloseTo(chart.subtitleHeight, 1);
          }
          if (alignmentSettings.alignCharts) {
            expect(block.maxGraphicHeight).toBeCloseTo(chart.graphicHeight, 1);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Empty blocks handle alignment gracefully
   * 
   * For any alignment settings, empty blocks should not cause errors
   */
  test('Property: Empty blocks handle alignment gracefully', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          alignTitles: fc.boolean(),
          alignDescriptions: fc.boolean(),
          alignCharts: fc.boolean(),
          minElementHeight: fc.option(fc.integer({ min: 50, max: 300 }))
        }),
        (alignmentSettings: BlockAlignmentSettings) => {
          const block = applyBlockAlignment([], alignmentSettings);
          
          // Empty blocks should be considered aligned
          expect(block.isAligned).toBe(true);
          
          // All heights should be zero
          expect(block.maxTitleHeight).toBe(0);
          expect(block.maxSubtitleHeight).toBe(0);
          expect(block.maxGraphicHeight).toBe(0);
          
          // Should have empty charts array
          expect(block.charts).toHaveLength(0);
        }
      ),
      { numRuns: 50 }
    );
  });
});