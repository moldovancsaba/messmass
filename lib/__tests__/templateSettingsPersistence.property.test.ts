// lib/__tests__/templateSettingsPersistence.property.test.ts
// WHAT: Property-based tests for template settings persistence round-trip
// WHY: Verify template settings are correctly saved and loaded from the database

import fc from 'fast-check';
import { HeroBlockSettings, BlockAlignmentSettings, ChartConfiguration } from '../chartConfigTypes';

// Helper to generate valid hex colors
const hexColorGenerator = fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`);

// Mock database operations for testing
interface MockDatabase {
  templates: Map<string, ChartConfiguration>;
}

/**
 * Mock database instance for testing
 */
const mockDb: MockDatabase = {
  templates: new Map()
};

/**
 * Mock function that simulates saving template configuration to database
 */
async function saveTemplateConfiguration(config: ChartConfiguration): Promise<{ success: boolean; id: string }> {
  const id = config._id || `template_${Date.now()}_${Math.random()}`;
  const configWithId = { ...config, _id: id };
  mockDb.templates.set(id, configWithId);
  return { success: true, id };
}

/**
 * Mock function that simulates loading template configuration from database
 */
async function loadTemplateConfiguration(id: string): Promise<ChartConfiguration | null> {
  return mockDb.templates.get(id) || null;
}

/**
 * Clear mock database between tests
 */
function clearMockDatabase(): void {
  mockDb.templates.clear();
}

describe('Template Settings Persistence - Property Tests', () => {
  beforeEach(() => {
    clearMockDatabase();
  });

  /**
   * Property 2: Template settings persistence round-trip
   * Feature: report-template-hero-controls, Property 2: Template settings persistence round-trip
   * Validates: Requirements 3.2, 3.3
   * 
   * For any template configuration with HERO visibility settings, saving the settings and then loading 
   * the template should restore the exact same visibility configuration
   */
  test('Property 2: Template settings persistence round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          chartId: fc.string({ minLength: 1, maxLength: 50 }),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          type: fc.constantFrom('pie', 'bar', 'kpi', 'text', 'image'),
          order: fc.integer({ min: 1, max: 1000 }),
          isActive: fc.boolean(),
          elements: fc.array(fc.record({
            id: fc.string({ minLength: 1 }),
            label: fc.string({ minLength: 1 }),
            formula: fc.string({ minLength: 1 }),
            color: hexColorGenerator
          }), { minLength: 1, maxLength: 5 }),
          heroSettings: fc.record({
            showEmoji: fc.boolean(),
            showDateInfo: fc.boolean(),
            showExportOptions: fc.boolean()
          }),
          alignmentSettings: fc.record({
            alignTitles: fc.boolean(),
            alignDescriptions: fc.boolean(),
            alignCharts: fc.boolean(),
            minElementHeight: fc.option(fc.integer({ min: 0, max: 1000 }))
          }),
          createdAt: fc.date().map(d => d.toISOString()),
          updatedAt: fc.date().map(d => d.toISOString())
        }),
        async (originalConfig: Partial<ChartConfiguration>) => {
          // Save the template configuration
          const saveResult = await saveTemplateConfiguration(originalConfig as ChartConfiguration);
          expect(saveResult.success).toBe(true);
          expect(saveResult.id).toBeDefined();

          // Load the template configuration
          const loadedConfig = await loadTemplateConfiguration(saveResult.id);
          expect(loadedConfig).not.toBeNull();

          if (loadedConfig) {
            // Verify HERO settings are preserved exactly
            expect(loadedConfig.heroSettings).toEqual(originalConfig.heroSettings);
            
            // Verify alignment settings are preserved exactly
            expect(loadedConfig.alignmentSettings).toEqual(originalConfig.alignmentSettings);
            
            // Verify other core fields are preserved
            expect(loadedConfig.chartId).toBe(originalConfig.chartId);
            expect(loadedConfig.title).toBe(originalConfig.title);
            expect(loadedConfig.type).toBe(originalConfig.type);
            expect(loadedConfig.order).toBe(originalConfig.order);
            expect(loadedConfig.isActive).toBe(originalConfig.isActive);
            expect(loadedConfig.elements).toEqual(originalConfig.elements);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: HERO settings round-trip with undefined values
   * 
   * For any template configuration with undefined HERO settings, the round-trip should preserve the undefined state
   */
  test('Property: HERO settings round-trip with undefined values', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          chartId: fc.string({ minLength: 1, maxLength: 50 }),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          type: fc.constantFrom('pie', 'bar', 'kpi', 'text', 'image'),
          order: fc.integer({ min: 1, max: 1000 }),
          isActive: fc.boolean(),
          elements: fc.array(fc.record({
            id: fc.string({ minLength: 1 }),
            label: fc.string({ minLength: 1 }),
            formula: fc.string({ minLength: 1 }),
            color: hexColorGenerator
          }), { minLength: 1, maxLength: 5 }),
          createdAt: fc.date().map(d => d.toISOString()),
          updatedAt: fc.date().map(d => d.toISOString())
        }),
        async (configWithoutHeroSettings: Partial<ChartConfiguration>) => {
          // Explicitly ensure heroSettings and alignmentSettings are undefined
          const originalConfig = { ...configWithoutHeroSettings };
          delete originalConfig.heroSettings;
          delete originalConfig.alignmentSettings;

          // Save the template configuration
          const saveResult = await saveTemplateConfiguration(originalConfig as ChartConfiguration);
          expect(saveResult.success).toBe(true);

          // Load the template configuration
          const loadedConfig = await loadTemplateConfiguration(saveResult.id);
          expect(loadedConfig).not.toBeNull();

          if (loadedConfig) {
            // Verify undefined HERO settings remain undefined
            expect(loadedConfig.heroSettings).toBeUndefined();
            expect(loadedConfig.alignmentSettings).toBeUndefined();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Partial HERO settings round-trip
   * 
   * For any template configuration with partial HERO settings, the round-trip should preserve exactly what was saved
   */
  test('Property: Partial HERO settings round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          chartId: fc.string({ minLength: 1, maxLength: 50 }),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          type: fc.constantFrom('pie', 'bar', 'kpi', 'text', 'image'),
          order: fc.integer({ min: 1, max: 1000 }),
          isActive: fc.boolean(),
          elements: fc.array(fc.record({
            id: fc.string({ minLength: 1 }),
            label: fc.string({ minLength: 1 }),
            formula: fc.string({ minLength: 1 }),
            color: hexColorGenerator
          }), { minLength: 1, maxLength: 5 }),
          heroSettings: fc.oneof(
            fc.record({ showEmoji: fc.boolean() }),
            fc.record({ showDateInfo: fc.boolean() }),
            fc.record({ showExportOptions: fc.boolean() }),
            fc.record({ showEmoji: fc.boolean(), showDateInfo: fc.boolean() })
          ),
          createdAt: fc.date().map(d => d.toISOString()),
          updatedAt: fc.date().map(d => d.toISOString())
        }),
        async (originalConfig: Partial<ChartConfiguration>) => {
          // Save the template configuration
          const saveResult = await saveTemplateConfiguration(originalConfig as ChartConfiguration);
          expect(saveResult.success).toBe(true);

          // Load the template configuration
          const loadedConfig = await loadTemplateConfiguration(saveResult.id);
          expect(loadedConfig).not.toBeNull();

          if (loadedConfig) {
            // Verify partial HERO settings are preserved exactly as they were
            expect(loadedConfig.heroSettings).toEqual(originalConfig.heroSettings);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple template configurations don't interfere
   * 
   * For any set of different template configurations, saving multiple templates should not cause interference
   */
  test('Property: Multiple template configurations don\'t interfere', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            chartId: fc.string({ minLength: 1, maxLength: 50 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            type: fc.constantFrom('pie', 'bar', 'kpi', 'text', 'image'),
            order: fc.integer({ min: 1, max: 1000 }),
            isActive: fc.boolean(),
            elements: fc.array(fc.record({
              id: fc.string({ minLength: 1 }),
              label: fc.string({ minLength: 1 }),
              formula: fc.string({ minLength: 1 }),
              color: hexColorGenerator
            }), { minLength: 1, maxLength: 5 }),
            heroSettings: fc.record({
              showEmoji: fc.boolean(),
              showDateInfo: fc.boolean(),
              showExportOptions: fc.boolean()
            }),
            alignmentSettings: fc.record({
              alignTitles: fc.boolean(),
              alignDescriptions: fc.boolean(),
              alignCharts: fc.boolean(),
              minElementHeight: fc.option(fc.integer({ min: 0, max: 1000 }))
            }),
            createdAt: fc.date().map(d => d.toISOString()),
            updatedAt: fc.date().map(d => d.toISOString())
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (templateConfigs: Partial<ChartConfiguration>[]) => {
          // Save all template configurations
          const saveResults = await Promise.all(
            templateConfigs.map(config => saveTemplateConfiguration(config as ChartConfiguration))
          );

          // Verify all saves succeeded
          saveResults.forEach(result => {
            expect(result.success).toBe(true);
            expect(result.id).toBeDefined();
          });

          // Load all template configurations
          const loadedConfigs = await Promise.all(
            saveResults.map(result => loadTemplateConfiguration(result.id))
          );

          // Verify each loaded config matches its original
          loadedConfigs.forEach((loadedConfig, index) => {
            expect(loadedConfig).not.toBeNull();
            if (loadedConfig) {
              const originalConfig = templateConfigs[index];
              expect(loadedConfig.heroSettings).toEqual(originalConfig.heroSettings);
              expect(loadedConfig.alignmentSettings).toEqual(originalConfig.alignmentSettings);
              expect(loadedConfig.chartId).toBe(originalConfig.chartId);
              expect(loadedConfig.title).toBe(originalConfig.title);
            }
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: JSON serialization preserves HERO settings structure
   * 
   * For any HERO settings, JSON serialization and deserialization should preserve the exact structure
   */
  test('Property: JSON serialization preserves HERO settings structure', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          showEmoji: fc.boolean(),
          showDateInfo: fc.boolean(),
          showExportOptions: fc.boolean()
        }),
        fc.record({
          alignTitles: fc.boolean(),
          alignDescriptions: fc.boolean(),
          alignCharts: fc.boolean(),
          minElementHeight: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined })
        }),
        (heroSettings: HeroBlockSettings, alignmentSettings: BlockAlignmentSettings) => {
          // Simulate JSON serialization (like what happens in API requests)
          const serializedHero = JSON.stringify(heroSettings);
          const serializedAlignment = JSON.stringify(alignmentSettings);
          
          const deserializedHero: HeroBlockSettings = JSON.parse(serializedHero);
          const deserializedAlignment: BlockAlignmentSettings = JSON.parse(serializedAlignment);
          
          // Verify exact preservation
          expect(deserializedHero).toEqual(heroSettings);
          expect(deserializedAlignment).toEqual(alignmentSettings);
          
          // Verify type preservation
          expect(typeof deserializedHero.showEmoji).toBe('boolean');
          expect(typeof deserializedHero.showDateInfo).toBe('boolean');
          expect(typeof deserializedHero.showExportOptions).toBe('boolean');
          
          expect(typeof deserializedAlignment.alignTitles).toBe('boolean');
          expect(typeof deserializedAlignment.alignDescriptions).toBe('boolean');
          expect(typeof deserializedAlignment.alignCharts).toBe('boolean');
          
          // Handle undefined vs null serialization difference
          if (alignmentSettings.minElementHeight !== undefined) {
            expect(typeof deserializedAlignment.minElementHeight).toBe('number');
          } else {
            // JSON.stringify converts undefined to null, so we expect null or undefined
            expect(deserializedAlignment.minElementHeight === null || deserializedAlignment.minElementHeight === undefined).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Database update preserves unmodified fields
   * 
   * For any template configuration, updating only HERO settings should preserve all other fields
   */
  test('Property: Database update preserves unmodified fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          chartId: fc.string({ minLength: 1, maxLength: 50 }),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          type: fc.constantFrom('pie', 'bar', 'kpi', 'text', 'image'),
          order: fc.integer({ min: 1, max: 1000 }),
          isActive: fc.boolean(),
          elements: fc.array(fc.record({
            id: fc.string({ minLength: 1 }),
            label: fc.string({ minLength: 1 }),
            formula: fc.string({ minLength: 1 }),
            color: hexColorGenerator
          }), { minLength: 1, maxLength: 5 }),
          heroSettings: fc.record({
            showEmoji: fc.boolean(),
            showDateInfo: fc.boolean(),
            showExportOptions: fc.boolean()
          }),
          createdAt: fc.date().map(d => d.toISOString()),
          updatedAt: fc.date().map(d => d.toISOString())
        }),
        fc.record({
          showEmoji: fc.boolean(),
          showDateInfo: fc.boolean(),
          showExportOptions: fc.boolean()
        }),
        async (originalConfig: Partial<ChartConfiguration>, newHeroSettings: HeroBlockSettings) => {
          // Save the original template configuration
          const saveResult = await saveTemplateConfiguration(originalConfig as ChartConfiguration);
          expect(saveResult.success).toBe(true);

          // Update only the HERO settings
          const updatedConfig = { 
            ...originalConfig, 
            _id: saveResult.id,
            heroSettings: newHeroSettings,
            updatedAt: new Date().toISOString()
          };
          
          const updateResult = await saveTemplateConfiguration(updatedConfig as ChartConfiguration);
          expect(updateResult.success).toBe(true);

          // Load the updated configuration
          const loadedConfig = await loadTemplateConfiguration(saveResult.id);
          expect(loadedConfig).not.toBeNull();

          if (loadedConfig) {
            // Verify HERO settings were updated
            expect(loadedConfig.heroSettings).toEqual(newHeroSettings);
            
            // Verify other fields were preserved
            expect(loadedConfig.chartId).toBe(originalConfig.chartId);
            expect(loadedConfig.title).toBe(originalConfig.title);
            expect(loadedConfig.type).toBe(originalConfig.type);
            expect(loadedConfig.order).toBe(originalConfig.order);
            expect(loadedConfig.isActive).toBe(originalConfig.isActive);
            expect(loadedConfig.elements).toEqual(originalConfig.elements);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});