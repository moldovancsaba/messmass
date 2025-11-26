// lib/statsValidator.ts
// WHAT: Validation utility for external stats updates (Fanmass integration)
// WHY: Ensure third-party data injections are safe, valid, and don't corrupt KYC data
// HOW: Validate field names, types, ranges, and enforce business rules

/**
 * WHAT: Valid KYC variable names that can be updated via API
 * WHY: Whitelist approach prevents injection of arbitrary fields
 * 
 * These are the fields that Fanmass can update based on Requirements 8.1, 8.2, 8.3
 */
const VALID_STAT_FIELDS = new Set([
  // Demographics (Requirement 8.1)
  'male',
  'female',
  'genAlpha',
  'genYZ',
  'genX',
  'boomer',
  
  // Merchandise (Requirement 8.2)
  'merched',
  'jersey',
  'scarf',
  'flags',
  'baseballCap',
  'other',
  
  // Fan Counts (Requirement 8.3)
  'remoteFans',
  'stadium',
  'indoor',
  'outdoor',
  
  // Image counts (may be updated by Fanmass)
  'remoteImages',
  'hostessImages',
  'selfies'
]);

/**
 * Validation result interface
 */
export interface StatsValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  validatedFields: string[];
}

/**
 * Stats update request interface
 */
export interface StatsUpdateRequest {
  stats: Record<string, any>;
  source?: string;
  metadata?: Record<string, any>;
}

/**
 * validateStatsUpdate
 * WHAT: Validate stats update request from external API
 * WHY: Prevent invalid data from corrupting KYC system
 * 
 * VALIDATION RULES:
 * - At least one stat field must be provided
 * - All field names must be in VALID_STAT_FIELDS whitelist
 * - All numeric values must be non-negative integers
 * - No null or undefined values allowed
 * 
 * @param request - Stats update request object
 * @returns Validation result with errors and warnings
 */
export function validateStatsUpdate(request: StatsUpdateRequest): StatsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validatedFields: string[] = [];
  
  // WHAT: Check if stats object exists
  if (!request.stats || typeof request.stats !== 'object') {
    errors.push('Missing or invalid stats object');
    return { valid: false, errors, warnings, validatedFields };
  }
  
  const statsFields = Object.keys(request.stats);
  
  // WHAT: Check if at least one field is provided
  // WHY: Empty updates are meaningless
  if (statsFields.length === 0) {
    errors.push('At least one stat field must be provided');
    return { valid: false, errors, warnings, validatedFields };
  }
  
  // WHAT: Validate each field
  for (const field of statsFields) {
    const value = request.stats[field];
    
    // WHAT: Check if field name is valid
    // WHY: Prevent injection of arbitrary fields
    if (!VALID_STAT_FIELDS.has(field)) {
      errors.push(`Invalid field name: "${field}". Must be one of: ${Array.from(VALID_STAT_FIELDS).join(', ')}`);
      continue;
    }
    
    // WHAT: Check if value is null or undefined
    // WHY: Null/undefined values can cause calculation errors
    if (value === null || value === undefined) {
      errors.push(`Field "${field}" cannot be null or undefined`);
      continue;
    }
    
    // WHAT: Check if value is a number
    // WHY: All KYC stats are numeric
    if (typeof value !== 'number') {
      errors.push(`Field "${field}" must be a number, got ${typeof value}`);
      continue;
    }
    
    // WHAT: Check if value is an integer
    // WHY: KYC stats represent counts, not decimals
    if (!Number.isInteger(value)) {
      errors.push(`Field "${field}" must be an integer, got ${value}`);
      continue;
    }
    
    // WHAT: Check if value is non-negative
    // WHY: Negative counts don't make sense
    if (value < 0) {
      errors.push(`Field "${field}" must be non-negative, got ${value}`);
      continue;
    }
    
    // WHAT: Check for unreasonably large values
    // WHY: Catch potential data errors or attacks
    const MAX_REASONABLE_VALUE = 1_000_000;
    if (value > MAX_REASONABLE_VALUE) {
      warnings.push(`Field "${field}" has unusually large value: ${value}`);
    }
    
    validatedFields.push(field);
  }
  
  // WHAT: Return validation result
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    validatedFields
  };
}

/**
 * sanitizeStatsUpdate
 * WHAT: Remove invalid fields and return only validated stats
 * WHY: Allow partial updates even if some fields are invalid
 * 
 * @param request - Stats update request object
 * @returns Sanitized stats object with only valid fields
 */
export function sanitizeStatsUpdate(request: StatsUpdateRequest): Record<string, number> {
  const result: Record<string, number> = {};
  
  if (!request.stats || typeof request.stats !== 'object') {
    return result;
  }
  
  for (const field of Object.keys(request.stats)) {
    const value = request.stats[field];
    
    // Only include valid fields with valid values
    if (
      VALID_STAT_FIELDS.has(field) &&
      typeof value === 'number' &&
      Number.isInteger(value) &&
      value >= 0
    ) {
      result[field] = value;
    }
  }
  
  return result;
}

/**
 * getValidStatFields
 * WHAT: Get list of all valid stat field names
 * WHY: Allow API consumers to discover valid fields
 * 
 * @returns Array of valid field names
 */
export function getValidStatFields(): string[] {
  return Array.from(VALID_STAT_FIELDS).sort();
}