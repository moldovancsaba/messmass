// lib/__tests__/statsValidator.test.ts
// WHAT: Unit tests for stats validation utility
// WHY: Ensure external data injection is properly validated

import {
  validateStatsUpdate,
  sanitizeStatsUpdate,
  getValidStatFields,
  type StatsUpdateRequest
} from '../statsValidator';

describe('statsValidator', () => {
  describe('validateStatsUpdate', () => {
    it('should accept valid stats update with single field', () => {
      const request: StatsUpdateRequest = {
        stats: { male: 100 }
      };
      
      const result = validateStatsUpdate(request);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedFields).toContain('male');
    });

    it('should accept valid stats update with multiple fields', () => {
      const request: StatsUpdateRequest = {
        stats: {
          male: 100,
          female: 150,
          merched: 75,
          stadium: 250
        }
      };
      
      const result = validateStatsUpdate(request);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedFields).toHaveLength(4);
    });

    it('should accept zero values', () => {
      const request: StatsUpdateRequest = {
        stats: { male: 0, female: 0 }
      };
      
      const result = validateStatsUpdate(request);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing stats object', () => {
      const request = {} as StatsUpdateRequest;
      
      const result = validateStatsUpdate(request);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid stats object');
    });

    it('should reject empty stats object', () => {
      const request: StatsUpdateRequest = {
        stats: {}
      };
      
      const result = validateStatsUpdate(request);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one stat field must be provided');
    });

    it('should reject invalid field names', () => {
      const request: StatsUpdateRequest = {
        stats: { invalidField: 100 }
      };
      
      const result = validateStatsUpdate(request);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid field name'))).toBe(true);
    });

    it('should reject null values', () => {
      const request: StatsUpdateRequest = {
        stats: { male: null as any }
      };
      
      const result = validateStatsUpdate(request);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('cannot be null'))).toBe(true);
    });

    it('should reject undefined values', () => {
      const request: StatsUpdateRequest = {
        stats: { male: undefined as any }
      };
      
      const result = validateStatsUpdate(request);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('cannot be null'))).toBe(true);
    });

    it('should reject non-numeric values', () => {
      const request: StatsUpdateRequest = {
        stats: { male: '100' as any }
      };
      
      const result = validateStatsUpdate(request);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('must be a number'))).toBe(true);
    });

    it('should reject decimal values', () => {
      const request: StatsUpdateRequest = {
        stats: { male: 100.5 }
      };
      
      const result = validateStatsUpdate(request);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('must be an integer'))).toBe(true);
    });

    it('should reject negative values', () => {
      const request: StatsUpdateRequest = {
        stats: { male: -10 }
      };
      
      const result = validateStatsUpdate(request);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('must be non-negative'))).toBe(true);
    });

    it('should warn about unreasonably large values', () => {
      const request: StatsUpdateRequest = {
        stats: { male: 2_000_000 }
      };
      
      const result = validateStatsUpdate(request);
      
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('unusually large'))).toBe(true);
    });

    it('should validate mixed valid and invalid fields separately', () => {
      const request: StatsUpdateRequest = {
        stats: {
          male: 100,        // valid
          invalidField: 50, // invalid field name
          female: -10       // invalid value
        }
      };
      
      const result = validateStatsUpdate(request);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.validatedFields).toContain('male');
      expect(result.validatedFields).not.toContain('invalidField');
      expect(result.validatedFields).not.toContain('female');
    });
  });

  describe('sanitizeStatsUpdate', () => {
    it('should return only valid fields', () => {
      const request: StatsUpdateRequest = {
        stats: {
          male: 100,
          invalidField: 50,
          female: 150
        }
      };
      
      const result = sanitizeStatsUpdate(request);
      
      expect(result).toEqual({ male: 100, female: 150 });
      expect(result.invalidField).toBeUndefined();
    });

    it('should filter out invalid values', () => {
      const request: StatsUpdateRequest = {
        stats: {
          male: 100,
          female: -10,
          genAlpha: 50.5,
          genYZ: null as any
        }
      };
      
      const result = sanitizeStatsUpdate(request);
      
      expect(result).toEqual({ male: 100 });
    });

    it('should return empty object for missing stats', () => {
      const request = {} as StatsUpdateRequest;
      
      const result = sanitizeStatsUpdate(request);
      
      expect(result).toEqual({});
    });

    it('should preserve all valid fields', () => {
      const request: StatsUpdateRequest = {
        stats: {
          male: 100,
          female: 150,
          merched: 75,
          stadium: 250,
          remoteFans: 500
        }
      };
      
      const result = sanitizeStatsUpdate(request);
      
      expect(Object.keys(result)).toHaveLength(5);
      expect(result.male).toBe(100);
      expect(result.female).toBe(150);
      expect(result.merched).toBe(75);
      expect(result.stadium).toBe(250);
      expect(result.remoteFans).toBe(500);
    });
  });

  describe('getValidStatFields', () => {
    it('should return array of valid field names', () => {
      const fields = getValidStatFields();
      
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);
    });

    it('should include expected demographic fields', () => {
      const fields = getValidStatFields();
      
      expect(fields).toContain('male');
      expect(fields).toContain('female');
      expect(fields).toContain('genAlpha');
      expect(fields).toContain('genYZ');
    });

    it('should include expected merchandise fields', () => {
      const fields = getValidStatFields();
      
      expect(fields).toContain('merched');
      expect(fields).toContain('jersey');
      expect(fields).toContain('scarf');
    });

    it('should include expected fan count fields', () => {
      const fields = getValidStatFields();
      
      expect(fields).toContain('remoteFans');
      expect(fields).toContain('stadium');
      expect(fields).toContain('indoor');
      expect(fields).toContain('outdoor');
    });

    it('should return sorted array', () => {
      const fields = getValidStatFields();
      const sorted = [...fields].sort();
      
      expect(fields).toEqual(sorted);
    });
  });
});
