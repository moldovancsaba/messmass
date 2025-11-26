// lib/__tests__/statsValidator.property.test.ts
// WHAT: Property-based tests for stats validation
// WHY: Verify validation works correctly across all possible inputs

import fc from 'fast-check';
import {
  validateStatsUpdate,
  sanitizeStatsUpdate,
  getValidStatFields,
  type StatsUpdateRequest
} from '../statsValidator';

describe('statsValidator - Property Tests', () => {
  /**
   * Property 8: Invalid data rejection
   * Feature: third-party-fan-data-integration, Property 8: Invalid data rejection
   * Validates: Requirements 2.3
   * 
   * For any stats with negative numbers, validation should reject them
   */
  test('Property 8: Invalid data rejection - negative values', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          male: fc.integer({ max: -1 }),
          female: fc.option(fc.integer({ max: -1 }), { nil: undefined })
        }),
        (stats) => {
          const request: StatsUpdateRequest = { stats };
          const result = validateStatsUpdate(request);
          
          // Should be invalid
          expect(result.valid).toBe(false);
          // Should have error about negative values
          expect(result.errors.some(e => e.includes('non-negative'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 37: Non-negative integer validation
   * Feature: third-party-fan-data-integration, Property 37: Non-negative integer validation
   * Validates: Requirements 8.4
   * 
   * For any field with negative value, validation should reject it
   */
  test('Property 37: Non-negative integer validation', async () => {
    const validFields = getValidStatFields();
    
    await fc.assert(
      fc.property(
        fc.constantFrom(...validFields),
        fc.integer({ max: -1 }),
        (field, negativeValue) => {
          const request: StatsUpdateRequest = {
            stats: { [field]: negativeValue }
          };
          
          const result = validateStatsUpdate(request);
          
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => 
            e.includes(field) && e.includes('non-negative')
          )).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Valid non-negative integers are accepted
   * 
   * For any valid field with non-negative integer, validation should accept it
   */
  test('Property: Valid non-negative integers are accepted', async () => {
    const validFields = getValidStatFields();
    
    await fc.assert(
      fc.property(
        fc.constantFrom(...validFields),
        fc.nat({ max: 10000 }),
        (field, value) => {
          const request: StatsUpdateRequest = {
            stats: { [field]: value }
          };
          
          const result = validateStatsUpdate(request);
          
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
          expect(result.validatedFields).toContain(field);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Decimal values are rejected
   * 
   * For any field with decimal value, validation should reject it
   */
  test('Property: Decimal values are rejected', async () => {
    const validFields = getValidStatFields();
    
    await fc.assert(
      fc.property(
        fc.constantFrom(...validFields),
        fc.double({ min: 0.1, max: 1000, noNaN: true }).filter(n => !Number.isInteger(n)),
        (field, decimalValue) => {
          const request: StatsUpdateRequest = {
            stats: { [field]: decimalValue }
          };
          
          const result = validateStatsUpdate(request);
          
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => 
            e.includes(field) && e.includes('integer')
          )).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invalid field names are rejected
   * 
   * For any invalid field name, validation should reject it
   */
  test('Property: Invalid field names are rejected', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !getValidStatFields().includes(s)),
        fc.nat(),
        (invalidField, value) => {
          const request: StatsUpdateRequest = {
            stats: { [invalidField]: value }
          };
          
          const result = validateStatsUpdate(request);
          
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => 
            e.includes('Invalid field name') && e.includes(invalidField)
          )).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Null values are rejected
   * 
   * For any field with null value, validation should reject it
   */
  test('Property: Null values are rejected', async () => {
    const validFields = getValidStatFields();
    
    await fc.assert(
      fc.property(
        fc.constantFrom(...validFields),
        (field) => {
          const request: StatsUpdateRequest = {
            stats: { [field]: null as any }
          };
          
          const result = validateStatsUpdate(request);
          
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => 
            e.includes(field) && e.includes('null')
          )).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Undefined values are rejected
   * 
   * For any field with undefined value, validation should reject it
   */
  test('Property: Undefined values are rejected', async () => {
    const validFields = getValidStatFields();
    
    await fc.assert(
      fc.property(
        fc.constantFrom(...validFields),
        (field) => {
          const request: StatsUpdateRequest = {
            stats: { [field]: undefined as any }
          };
          
          const result = validateStatsUpdate(request);
          
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => 
            e.includes(field) && e.includes('null')
          )).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: String values are rejected
   * 
   * For any field with string value, validation should reject it
   */
  test('Property: String values are rejected', async () => {
    const validFields = getValidStatFields();
    
    await fc.assert(
      fc.property(
        fc.constantFrom(...validFields),
        fc.string(),
        (field, stringValue) => {
          const request: StatsUpdateRequest = {
            stats: { [field]: stringValue as any }
          };
          
          const result = validateStatsUpdate(request);
          
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => 
            e.includes(field) && e.includes('must be a number')
          )).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Large values generate warnings but are valid
   * 
   * For any field with very large value (>1M), validation should warn but accept
   */
  test('Property: Large values generate warnings', async () => {
    const validFields = getValidStatFields();
    
    await fc.assert(
      fc.property(
        fc.constantFrom(...validFields),
        fc.integer({ min: 1_000_001, max: 10_000_000 }),
        (field, largeValue) => {
          const request: StatsUpdateRequest = {
            stats: { [field]: largeValue }
          };
          
          const result = validateStatsUpdate(request);
          
          expect(result.valid).toBe(true);
          expect(result.warnings.some(w => 
            w.includes(field) && w.includes('unusually large')
          )).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: sanitizeStatsUpdate removes invalid fields
   * 
   * For any mix of valid and invalid fields, sanitize should keep only valid ones
   */
  test('Property: sanitizeStatsUpdate removes invalid fields', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          validField: fc.constantFrom(...getValidStatFields()),
          validValue: fc.nat({ max: 1000 }),
          invalidField: fc.string({ minLength: 1 }).filter(s => !getValidStatFields().includes(s)),
          invalidValue: fc.nat()
        }),
        ({ validField, validValue, invalidField, invalidValue }) => {
          const request: StatsUpdateRequest = {
            stats: {
              [validField]: validValue,
              [invalidField]: invalidValue
            }
          };
          
          const result = sanitizeStatsUpdate(request);
          
          expect(result[validField]).toBe(validValue);
          // Check that invalid field is not in the result's own properties
          expect(Object.prototype.hasOwnProperty.call(result, invalidField)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: sanitizeStatsUpdate removes negative values
   * 
   * For any field with negative value, sanitize should remove it
   */
  test('Property: sanitizeStatsUpdate removes negative values', async () => {
    const validFields = getValidStatFields();
    
    await fc.assert(
      fc.property(
        fc.constantFrom(...validFields),
        fc.integer({ max: -1 }),
        (field, negativeValue) => {
          const request: StatsUpdateRequest = {
            stats: { [field]: negativeValue }
          };
          
          const result = sanitizeStatsUpdate(request);
          
          expect(result[field]).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: sanitizeStatsUpdate removes decimal values
   * 
   * For any field with decimal value, sanitize should remove it
   */
  test('Property: sanitizeStatsUpdate removes decimal values', async () => {
    const validFields = getValidStatFields();
    
    await fc.assert(
      fc.property(
        fc.constantFrom(...validFields),
        fc.double({ min: 0.1, max: 1000, noNaN: true }).filter(n => !Number.isInteger(n)),
        (field, decimalValue) => {
          const request: StatsUpdateRequest = {
            stats: { [field]: decimalValue }
          };
          
          const result = sanitizeStatsUpdate(request);
          
          expect(result[field]).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty stats object is rejected
   * 
   * For any empty stats object, validation should reject it
   */
  test('Property: Empty stats object is rejected', async () => {
    await fc.assert(
      fc.property(
        fc.constant({}),
        (emptyStats) => {
          const request: StatsUpdateRequest = { stats: emptyStats };
          const result = validateStatsUpdate(request);
          
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => 
            e.includes('At least one stat field')
          )).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Multiple valid fields are all validated
   * 
   * For any set of valid fields with valid values, all should be validated
   */
  test('Property: Multiple valid fields are all validated', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.record({
            field: fc.constantFrom(...getValidStatFields()),
            value: fc.nat({ max: 1000 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (fieldValuePairs) => {
          const stats: Record<string, number> = {};
          fieldValuePairs.forEach(({ field, value }) => {
            stats[field] = value;
          });
          
          const request: StatsUpdateRequest = { stats };
          const result = validateStatsUpdate(request);
          
          expect(result.valid).toBe(true);
          expect(result.validatedFields.length).toBeGreaterThan(0);
          expect(result.validatedFields.length).toBeLessThanOrEqual(Object.keys(stats).length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
