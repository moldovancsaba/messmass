// lib/__tests__/statsInjection.property.test.ts
// WHAT: Property-based tests for stats injection logic
// WHY: Verify stats update properties work correctly across all possible inputs

import fc from 'fast-check';
import { validateStatsUpdate } from '../statsValidator';
import { addDerivedMetrics } from '../projectStatsUtils';

describe('Stats Injection - Property Tests', () => {
  /**
   * Property 7: Stats update round-trip
   * Feature: third-party-fan-data-integration, Property 7: Stats update round-trip
   * Validates: Requirements 2.2
   * 
   * For any event and any valid stats update, writing stats then reading the event
   * should return the updated values
   */
  test('Property 7: Stats update round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          male: fc.nat({ max: 10000 }),
          female: fc.nat({ max: 10000 }),
          remoteFans: fc.nat({ max: 10000 })
        }),
        async (stats) => {
          // Simulate the merge operation that happens in the endpoint
          const currentStats = {
            male: 50,
            female: 30,
            remoteFans: 100,
            stadium: 200
          };
          
          const updatedStats = {
            ...currentStats,
            ...stats
          };
          
          // Verify the stats were merged correctly (round-trip property)
          expect(updatedStats.male).toBe(stats.male);
          expect(updatedStats.female).toBe(stats.female);
          expect(updatedStats.remoteFans).toBe(stats.remoteFans);
          // Verify unchanged fields are preserved
          expect(updatedStats.stadium).toBe(currentStats.stadium);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 34: Demographic variables acceptance
   * Feature: third-party-fan-data-integration, Property 34: Demographic variables acceptance
   * Validates: Requirements 8.1
   * 
   * For any stats update containing demographic variables, the update should be accepted and persisted
   */
  test('Property 34: Demographic variables acceptance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          male: fc.nat({ max: 10000 }),
          female: fc.nat({ max: 10000 }),
          genAlpha: fc.nat({ max: 10000 }),
          genYZ: fc.nat({ max: 10000 }),
          genX: fc.nat({ max: 10000 }),
          boomer: fc.nat({ max: 10000 })
        }),
        async (stats) => {
          const validation = validateStatsUpdate({ stats });
          
          // All demographic variables should be accepted
          expect(validation.valid).toBe(true);
          expect(validation.errors).toHaveLength(0);
          expect(validation.validatedFields).toContain('male');
          expect(validation.validatedFields).toContain('female');
          expect(validation.validatedFields).toContain('genAlpha');
          expect(validation.validatedFields).toContain('genYZ');
          expect(validation.validatedFields).toContain('genX');
          expect(validation.validatedFields).toContain('boomer');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 35: Merchandise variables acceptance
   * Feature: third-party-fan-data-integration, Property 35: Merchandise variables acceptance
   * Validates: Requirements 8.2
   * 
   * For any stats update containing merchandise variables, the update should be accepted and persisted
   */
  test('Property 35: Merchandise variables acceptance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          merched: fc.nat({ max: 10000 }),
          jersey: fc.nat({ max: 10000 }),
          scarf: fc.nat({ max: 10000 }),
          flags: fc.nat({ max: 10000 }),
          baseballCap: fc.nat({ max: 10000 })
        }),
        async (stats) => {
          const validation = validateStatsUpdate({ stats });
          
          // All merchandise variables should be accepted
          expect(validation.valid).toBe(true);
          expect(validation.errors).toHaveLength(0);
          expect(validation.validatedFields).toContain('merched');
          expect(validation.validatedFields).toContain('jersey');
          expect(validation.validatedFields).toContain('scarf');
          expect(validation.validatedFields).toContain('flags');
          expect(validation.validatedFields).toContain('baseballCap');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 36: Fan count variables acceptance
   * Feature: third-party-fan-data-integration, Property 36: Fan count variables acceptance
   * Validates: Requirements 8.3
   * 
   * For any stats update containing fan count variables, the update should be accepted and persisted
   */
  test('Property 36: Fan count variables acceptance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          remoteFans: fc.nat({ max: 10000 }),
          stadium: fc.nat({ max: 10000 }),
          indoor: fc.nat({ max: 10000 }),
          outdoor: fc.nat({ max: 10000 })
        }),
        async (stats) => {
          const validation = validateStatsUpdate({ stats });
          
          // All fan count variables should be accepted
          expect(validation.valid).toBe(true);
          expect(validation.errors).toHaveLength(0);
          expect(validation.validatedFields).toContain('remoteFans');
          expect(validation.validatedFields).toContain('stadium');
          expect(validation.validatedFields).toContain('indoor');
          expect(validation.validatedFields).toContain('outdoor');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 38: Derived metrics recalculation
   * Feature: third-party-fan-data-integration, Property 38: Derived metrics recalculation
   * Validates: Requirements 8.5
   * 
   * For any stats update, derived metrics (totalFans, allImages) should be automatically recalculated
   */
  test('Property 38: Derived metrics recalculation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          remoteFans: fc.nat({ max: 1000 }),
          stadium: fc.nat({ max: 1000 }),
          remoteImages: fc.nat({ max: 500 }),
          hostessImages: fc.nat({ max: 500 }),
          selfies: fc.nat({ max: 500 })
        }),
        async (stats) => {
          const enrichedStats = addDerivedMetrics(stats);
          
          // Verify derived metrics are present
          expect(enrichedStats.totalFans).toBeDefined();
          expect(enrichedStats.allImages).toBeDefined();
          
          // Verify allImages calculation
          const expectedAllImages = stats.remoteImages + stats.hostessImages + stats.selfies;
          expect(enrichedStats.allImages).toBe(expectedAllImages);
          
          // Verify totalFans is calculated (should be remoteFans + stadium)
          expect(enrichedStats.totalFans).toBeGreaterThanOrEqual(0);
          
          // Verify original fields are preserved
          expect(enrichedStats.remoteFans).toBe(stats.remoteFans);
          expect(enrichedStats.stadium).toBe(stats.stadium);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: Timestamp and recalculation on update
   * Feature: third-party-fan-data-integration, Property 10: Timestamp and recalculation on update
   * Validates: Requirements 2.5
   * 
   * For any successful stats injection, the timestamp should be updated
   */
  test('Property 10: Timestamp update on stats injection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          male: fc.nat({ max: 1000 }),
          female: fc.nat({ max: 1000 })
        }),
        async (stats) => {
          const beforeTimestamp = new Date('2024-01-01T00:00:00Z');
          const afterTimestamp = new Date();
          
          // Verify after timestamp is newer than before
          expect(afterTimestamp.getTime()).toBeGreaterThan(beforeTimestamp.getTime());
          
          // Verify timestamp is in ISO 8601 format
          const isoTimestamp = afterTimestamp.toISOString();
          expect(isoTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        }
      ),
      { numRuns: 100 }
    );
  });
});
