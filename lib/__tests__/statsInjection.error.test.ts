// lib/__tests__/statsInjection.error.test.ts
// WHAT: Unit tests for stats injection error cases
// WHY: Ensure proper error handling for invalid inputs

import { validateStatsUpdate } from '../statsValidator';
import { ObjectId } from 'mongodb';

describe('Stats Injection - Error Cases', () => {
  describe('Invalid event ID', () => {
    it('should reject invalid ObjectId format', () => {
      const invalidIds = [
        'invalid',
        '123',
        'not-an-objectid',
        '',
        'zzzzzzzzzzzzzzzzzzzzzzz'
      ];
      
      invalidIds.forEach(id => {
        expect(ObjectId.isValid(id)).toBe(false);
      });
    });

    it('should accept valid ObjectId format', () => {
      const validIds = [
        '507f1f77bcf86cd799439011',
        '507f191e810c19729de860ea',
        new ObjectId().toString()
      ];
      
      validIds.forEach(id => {
        expect(ObjectId.isValid(id)).toBe(true);
      });
    });
  });

  describe('Invalid stats data', () => {
    it('should reject negative numbers', () => {
      const invalidStats = {
        stats: {
          male: -10,
          female: 50
        }
      };
      
      const validation = validateStatsUpdate(invalidStats);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Field "male" must be non-negative, got -10');
    });

    it('should reject non-integer values', () => {
      const invalidStats = {
        stats: {
          male: 10.5,
          female: 50
        }
      };
      
      const validation = validateStatsUpdate(invalidStats);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Field "male" must be an integer, got 10.5');
    });

    it('should reject non-numeric values', () => {
      const invalidStats = {
        stats: {
          male: 'not a number' as any,
          female: 50
        }
      };
      
      const validation = validateStatsUpdate(invalidStats);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Field "male" must be a number, got string');
    });

    it('should reject null values', () => {
      const invalidStats = {
        stats: {
          male: null as any,
          female: 50
        }
      };
      
      const validation = validateStatsUpdate(invalidStats);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Field "male" cannot be null or undefined');
    });

    it('should reject undefined values', () => {
      const invalidStats = {
        stats: {
          male: undefined as any,
          female: 50
        }
      };
      
      const validation = validateStatsUpdate(invalidStats);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Field "male" cannot be null or undefined');
    });

    it('should reject invalid field names', () => {
      const invalidStats = {
        stats: {
          invalidField: 100,
          male: 50
        }
      };
      
      const validation = validateStatsUpdate(invalidStats);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Invalid field name: "invalidField"'))).toBe(true);
    });

    it('should reject empty stats object', () => {
      const invalidStats = {
        stats: {}
      };
      
      const validation = validateStatsUpdate(invalidStats);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('At least one stat field must be provided');
    });

    it('should reject missing stats object', () => {
      const invalidStats = {} as any;
      
      const validation = validateStatsUpdate(invalidStats);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing or invalid stats object');
    });

    it('should reject non-object stats', () => {
      const invalidStats = {
        stats: 'not an object' as any
      };
      
      const validation = validateStatsUpdate(invalidStats);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing or invalid stats object');
    });
  });

  describe('Multiple validation errors', () => {
    it('should return all validation errors', () => {
      const invalidStats = {
        stats: {
          male: -10,
          female: 'not a number' as any,
          invalidField: 100,
          remoteFans: 10.5
        }
      };
      
      const validation = validateStatsUpdate(invalidStats);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(1);
      expect(validation.errors.some(e => e.includes('male'))).toBe(true);
      expect(validation.errors.some(e => e.includes('female'))).toBe(true);
      expect(validation.errors.some(e => e.includes('invalidField'))).toBe(true);
      expect(validation.errors.some(e => e.includes('remoteFans'))).toBe(true);
    });
  });

  describe('Warnings for unusual values', () => {
    it('should warn about unreasonably large values', () => {
      const statsWithLargeValue = {
        stats: {
          male: 2_000_000 // Larger than MAX_REASONABLE_VALUE (1,000,000)
        }
      };
      
      const validation = validateStatsUpdate(statsWithLargeValue);
      
      // Should still be valid but with warnings
      expect(validation.valid).toBe(true);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.includes('unusually large value'))).toBe(true);
    });
  });

  describe('Valid edge cases', () => {
    it('should accept zero values', () => {
      const validStats = {
        stats: {
          male: 0,
          female: 0,
          remoteFans: 0
        }
      };
      
      const validation = validateStatsUpdate(validStats);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should accept single field update', () => {
      const validStats = {
        stats: {
          male: 100
        }
      };
      
      const validation = validateStatsUpdate(validStats);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.validatedFields).toEqual(['male']);
    });

    it('should accept all valid fields', () => {
      const validStats = {
        stats: {
          male: 100,
          female: 80,
          genAlpha: 20,
          genYZ: 50,
          genX: 40,
          boomer: 30,
          merched: 60,
          jersey: 30,
          scarf: 20,
          flags: 10,
          baseballCap: 15,
          remoteFans: 200,
          stadium: 300,
          indoor: 150,
          outdoor: 150
        }
      };
      
      const validation = validateStatsUpdate(validStats);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.validatedFields.length).toBe(15);
    });
  });
});
