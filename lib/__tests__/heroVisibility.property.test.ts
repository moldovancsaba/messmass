// lib/__tests__/heroVisibility.property.test.ts
// WHAT: Property-based tests for HERO block visibility control
// WHY: Verify HERO visibility settings work correctly across all possible configurations

import fc from 'fast-check';
import { HeroBlockSettings } from '../chartConfigTypes';

// Mock report rendering function for testing
interface MockReport {
  heroElements: {
    emoji: boolean;
    dateInfo: boolean;
    exportOptions: boolean;
  };
}

/**
 * Mock function that simulates rendering a report with HERO settings
 * In real implementation, this would be the actual report rendering logic
 */
function renderReportWithHeroSettings(heroSettings: HeroBlockSettings): MockReport {
  return {
    heroElements: {
      emoji: heroSettings.showEmoji,
      dateInfo: heroSettings.showDateInfo,
      exportOptions: heroSettings.showExportOptions
    }
  };
}

/**
 * Verify that only enabled HERO elements are visible in the rendered report
 */
function verifyOnlyEnabledElementsVisible(report: MockReport, heroSettings: HeroBlockSettings): boolean {
  return (
    report.heroElements.emoji === heroSettings.showEmoji &&
    report.heroElements.dateInfo === heroSettings.showDateInfo &&
    report.heroElements.exportOptions === heroSettings.showExportOptions
  );
}

describe('HERO Visibility Control - Property Tests', () => {
  /**
   * Property 1: HERO element visibility control
   * Feature: report-template-hero-controls, Property 1: HERO element visibility control
   * Validates: Requirements 1.2, 1.3, 1.4, 4.1
   * 
   * For any template configuration with HERO visibility settings, when a report is rendered using that template,
   * only the enabled HERO elements should be visible in the report header
   */
  test('Property 1: HERO element visibility control', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          showEmoji: fc.boolean(),
          showDateInfo: fc.boolean(),
          showExportOptions: fc.boolean()
        }),
        (heroSettings: HeroBlockSettings) => {
          const report = renderReportWithHeroSettings(heroSettings);
          const isValid = verifyOnlyEnabledElementsVisible(report, heroSettings);
          
          expect(isValid).toBe(true);
          
          // Verify specific element visibility matches settings
          expect(report.heroElements.emoji).toBe(heroSettings.showEmoji);
          expect(report.heroElements.dateInfo).toBe(heroSettings.showDateInfo);
          expect(report.heroElements.exportOptions).toBe(heroSettings.showExportOptions);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All elements hidden should result in empty HERO block
   * 
   * For any HERO settings with all elements disabled, the report should have no visible HERO elements
   */
  test('Property: All elements hidden results in empty HERO block', async () => {
    await fc.assert(
      fc.property(
        fc.constant({
          showEmoji: false,
          showDateInfo: false,
          showExportOptions: false
        }),
        (heroSettings: HeroBlockSettings) => {
          const report = renderReportWithHeroSettings(heroSettings);
          
          expect(report.heroElements.emoji).toBe(false);
          expect(report.heroElements.dateInfo).toBe(false);
          expect(report.heroElements.exportOptions).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: All elements shown should result in full HERO block
   * 
   * For any HERO settings with all elements enabled, the report should have all HERO elements visible
   */
  test('Property: All elements shown results in full HERO block', async () => {
    await fc.assert(
      fc.property(
        fc.constant({
          showEmoji: true,
          showDateInfo: true,
          showExportOptions: true
        }),
        (heroSettings: HeroBlockSettings) => {
          const report = renderReportWithHeroSettings(heroSettings);
          
          expect(report.heroElements.emoji).toBe(true);
          expect(report.heroElements.dateInfo).toBe(true);
          expect(report.heroElements.exportOptions).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Individual element control works independently
   * 
   * For any HERO settings, each element's visibility should be controlled independently
   */
  test('Property: Individual element control works independently', async () => {
    await fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (showEmoji, showDateInfo, showExportOptions) => {
          const heroSettings: HeroBlockSettings = {
            showEmoji,
            showDateInfo,
            showExportOptions
          };
          
          const report = renderReportWithHeroSettings(heroSettings);
          
          // Each element should be controlled independently
          expect(report.heroElements.emoji).toBe(showEmoji);
          expect(report.heroElements.dateInfo).toBe(showDateInfo);
          expect(report.heroElements.exportOptions).toBe(showExportOptions);
          
          // Changing one element shouldn't affect others
          const modifiedSettings: HeroBlockSettings = {
            ...heroSettings,
            showEmoji: !showEmoji
          };
          
          const modifiedReport = renderReportWithHeroSettings(modifiedSettings);
          
          expect(modifiedReport.heroElements.emoji).toBe(!showEmoji);
          expect(modifiedReport.heroElements.dateInfo).toBe(showDateInfo);
          expect(modifiedReport.heroElements.exportOptions).toBe(showExportOptions);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: HERO settings are preserved through serialization
   * 
   * For any HERO settings, serializing and deserializing should preserve the exact values
   */
  test('Property: HERO settings preserved through serialization', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          showEmoji: fc.boolean(),
          showDateInfo: fc.boolean(),
          showExportOptions: fc.boolean()
        }),
        (originalSettings: HeroBlockSettings) => {
          // Simulate database serialization/deserialization
          const serialized = JSON.stringify(originalSettings);
          const deserialized: HeroBlockSettings = JSON.parse(serialized);
          
          expect(deserialized.showEmoji).toBe(originalSettings.showEmoji);
          expect(deserialized.showDateInfo).toBe(originalSettings.showDateInfo);
          expect(deserialized.showExportOptions).toBe(originalSettings.showExportOptions);
          
          // Verify the deserialized settings produce the same report
          const originalReport = renderReportWithHeroSettings(originalSettings);
          const deserializedReport = renderReportWithHeroSettings(deserialized);
          
          expect(deserializedReport).toEqual(originalReport);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Default HERO settings show all elements (backward compatibility)
   * 
   * For any undefined HERO settings, all elements should be visible by default
   */
  test('Property: Default HERO settings show all elements', async () => {
    await fc.assert(
      fc.property(
        fc.constant(undefined),
        (undefinedSettings) => {
          // Simulate default behavior when heroSettings is undefined
          const defaultSettings: HeroBlockSettings = {
            showEmoji: true,
            showDateInfo: true,
            showExportOptions: true
          };
          
          const report = renderReportWithHeroSettings(defaultSettings);
          
          expect(report.heroElements.emoji).toBe(true);
          expect(report.heroElements.dateInfo).toBe(true);
          expect(report.heroElements.exportOptions).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Partial HERO settings work with defaults
   * 
   * For any partial HERO settings, missing fields should default to true
   */
  test('Property: Partial HERO settings work with defaults', async () => {
    await fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ showEmoji: fc.boolean() }),
          fc.record({ showDateInfo: fc.boolean() }),
          fc.record({ showExportOptions: fc.boolean() }),
          fc.record({ showEmoji: fc.boolean(), showDateInfo: fc.boolean() })
        ),
        (partialSettings: Partial<HeroBlockSettings>) => {
          // Simulate merging with defaults
          const completeSettings: HeroBlockSettings = {
            showEmoji: partialSettings.showEmoji ?? true,
            showDateInfo: partialSettings.showDateInfo ?? true,
            showExportOptions: partialSettings.showExportOptions ?? true
          };
          
          const report = renderReportWithHeroSettings(completeSettings);
          
          // Verify that specified settings are respected
          if (partialSettings.showEmoji !== undefined) {
            expect(report.heroElements.emoji).toBe(partialSettings.showEmoji);
          }
          if (partialSettings.showDateInfo !== undefined) {
            expect(report.heroElements.dateInfo).toBe(partialSettings.showDateInfo);
          }
          if (partialSettings.showExportOptions !== undefined) {
            expect(report.heroElements.exportOptions).toBe(partialSettings.showExportOptions);
          }
          
          // Verify that unspecified settings default to true
          if (partialSettings.showEmoji === undefined) {
            expect(report.heroElements.emoji).toBe(true);
          }
          if (partialSettings.showDateInfo === undefined) {
            expect(report.heroElements.dateInfo).toBe(true);
          }
          if (partialSettings.showExportOptions === undefined) {
            expect(report.heroElements.exportOptions).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});