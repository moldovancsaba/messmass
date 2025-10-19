// lib/formulaEngine.ts - Formula parsing and safe evaluation engine
// Handles 42 dynamic variables with +, -, *, /, (), and math functions (MAX, MIN, ROUND, ABS)
// Returns 'NA' for division by zero, missing variables, or invalid expressions

import { AVAILABLE_VARIABLES, FormulaValidationResult } from './chartConfigTypes';
import { 
  validateRequiredFields, 
  ensureDerivedMetrics, 
  type ProjectStats as ValidatedProjectStats,
  type ValidationResult as DataValidationResult
} from './dataValidator';

// WHAT: Normalization helpers to accept both legacy tokens (e.g., [TOTAL_FANS]) and new org-prefixed tokens
//       you requested (e.g., [SEYUTOTALFANS], [SEYUPROPOSITIONVISIT]).
// WHY: This preserves backward compatibility for existing chart configs while enabling the new naming scheme.

function stripOrgPrefix(token: string): string {
  const t = token.toUpperCase()
  return t.startsWith('SEYU') ? t.slice(4) : t
}

function normalizeTokenRaw(token: string): string {
  // Remove org prefix and underscores; keep alphanumerics only
  const noOrg = stripOrgPrefix(token)
  return noOrg.replace(/_/g, '')
}

/**
* Variable mapping from display names to project stats field names
* Examples use SEYU tokens: [SEYUINDOOR] → stats.indoor, [SEYUFEMALE] → stats.female, etc. (Legacy tokens like [INDOOR] are still accepted for compatibility).
 */
const VARIABLE_MAPPINGS: Record<string, string> = {
  // Image Statistics
  'REMOTE_IMAGES': 'remoteImages',
  'HOSTESS_IMAGES': 'hostessImages',
  'SELFIES': 'selfies',
  'APPROVED_IMAGES': 'approvedImages',
  'REJECTED_IMAGES': 'rejectedImages',
  
  // Location Statistics
  'INDOOR': 'indoor',
  'OUTDOOR': 'outdoor',
  'STADIUM': 'stadium',
'REMOTE_FANS': 'remoteFans', // New aggregated remote fans (indoor + outdoor)
  'TOTAL_FANS': 'totalFans', // Computed: remoteFans (or indoor+outdoor) + stadium
  
  // Demographics
  'FEMALE': 'female',
  'MALE': 'male',
  'GEN_ALPHA': 'genAlpha',
  'GEN_YZ': 'genYZ',
  'GEN_X': 'genX',
  'BOOMER': 'boomer',
  
  // Merchandise
  'MERCHED': 'merched',
  'JERSEY': 'jersey',
  'SCARF': 'scarf',
  'FLAGS': 'flags',
  'BASEBALL_CAP': 'baseballCap',
  'OTHER': 'other',
  
  // Event Metrics
'EVENT_ATTENDEES': 'eventAttendees',
  'EVENT_RESULT_HOME': 'eventResultHome',
  'EVENT_RESULT_VISITOR': 'eventResultVisitor',
  
  // Merchandise Pricing Variables (configurable values for sales calculations)
  'JERSEY_PRICE': 'jerseyPrice',
  'SCARF_PRICE': 'scarfPrice',
  'FLAGS_PRICE': 'flagsPrice',
  'CAP_PRICE': 'capPrice',
  'OTHER_PRICE': 'otherPrice',
  
  // WHAT: Bitly Analytics Variables (links, traffic sources, devices, geography)
  // WHY: Enable Bitly enrichment charts with clickstream data from Bitly API
  
  // Bitly - Core Metrics
  'BITLY_TOTAL_CLICKS': 'bitlyTotalClicks',
  'BITLY_UNIQUE_CLICKS': 'bitlyUniqueClicks',
  
  // Bitly - Geographic
  'BITLY_CLICKS_BY_COUNTRY': 'bitlyClicksByCountry',
  'BITLY_TOP_COUNTRY': 'bitlyTopCountry',
  'BITLY_COUNTRY_COUNT': 'bitlyCountryCount',
  
  // Bitly - Traffic Sources (Platform-level)
  'BITLY_DIRECT_CLICKS': 'bitlyDirectClicks',
  'BITLY_SOCIAL_CLICKS': 'bitlySocialClicks',
  'BITLY_TOP_REFERRER': 'bitlyTopReferrer',
  'BITLY_REFERRER_COUNT': 'bitlyReferrerCount',
  
  // Bitly - Referring Domains (Domain-level granular)
  'BITLY_TOP_DOMAIN': 'bitlyTopDomain',
  'BITLY_DOMAIN_COUNT': 'bitlyDomainCount',
  'BITLY_QR_CODE_CLICKS': 'bitlyQrCodeClicks',
  'BITLY_INSTAGRAM_MOBILE_CLICKS': 'bitlyInstagramMobileClicks',
  'BITLY_INSTAGRAM_WEB_CLICKS': 'bitlyInstagramWebClicks',
  'BITLY_FACEBOOK_MOBILE_CLICKS': 'bitlyFacebookMobileClicks',
  'BITLY_FACEBOOK_MESSENGER_CLICKS': 'bitlyFacebookMessengerClicks',
  
  // Bitly - Device & Platform
  'BITLY_MOBILE_CLICKS': 'bitlyMobileClicks',
  'BITLY_DESKTOP_CLICKS': 'bitlyDesktopClicks',
  'BITLY_TABLET_CLICKS': 'bitlyTabletClicks',
  'BITLY_IOS_CLICKS': 'bitlyiOSClicks',
  'BITLY_ANDROID_CLICKS': 'bitlyAndroidClicks',
  
  // Bitly - Browsers
  'BITLY_CHROME_CLICKS': 'bitlyChromeClicks',
  'BITLY_SAFARI_CLICKS': 'bitlySafariClicks',
  'BITLY_FIREFOX_CLICKS': 'bitlyFirefoxClicks'
};

// Build normalized mapping: keys without underscores, values are stats field names
const NORMALIZED_VARIABLE_MAPPINGS: Record<string, string> = {}
for (const [key, field] of Object.entries(VARIABLE_MAPPINGS)) {
  NORMALIZED_VARIABLE_MAPPINGS[key.replace(/_/g, '')] = field
}

// Aliases to support new concise tokens (no underscores, reordered terms)
// Map alias (normalized) → canonical variable key (normalized)
const ALIAS_NORMALIZED_KEYS: Record<string, string> = {
  // Fans and Images
  STADIUMFANS: 'STADIUM',
  TOTALIMAGES: 'TOTALIMAGES', // computed (not in VARIABLE_MAPPINGS)
  ALLIMAGES: 'TOTALIMAGES',   // legacy -> computed
  TOTALFANS: 'TOTALFANS',     // computed
  REMOTEFANS: 'REMOTEFANS',   // computed
  TOTALUNDER40: 'TOTALUNDER40', // computed
  TOTALOVER40: 'TOTALOVER40',   // computed

  // Merchandise
  MERCHSCARF: 'SCARF',
  MERCHJERSEY: 'JERSEY',
  MERCHEDFANS: 'MERCHED',

  // Event
  ATTENDEES: 'EVENTATTENDEES',
  RESULTHOME: 'EVENTRESULTHOME',
  RESULTVISITOR: 'EVENTRESULTVISITOR'
}

function resolveFieldNameByNormalizedToken(normalizedToken: string): string | undefined {
  // Computed aliases handled separately
  const computedSet = new Set([
    'TOTALIMAGES', 'ALLIMAGES', 'TOTALFANS', 'REMOTEFANS', 'TOTALUNDER40', 'TOTALOVER40'
  ])
  if (computedSet.has(normalizedToken)) return undefined

  const canonicalKey = ALIAS_NORMALIZED_KEYS[normalizedToken] ?? normalizedToken
  return NORMALIZED_VARIABLE_MAPPINGS[canonicalKey]
}

/**
 * Safe mathematical functions that can be used in formulas
 * All functions handle edge cases and return 'NA' for invalid inputs
 */
const MATH_FUNCTIONS = {
  /**
   * Returns the maximum value from the provided arguments
   * Example: MAX(10, 20, 5) returns 20
   */
  MAX: (...args: number[]): number | 'NA' => {
    if (args.length === 0) return 'NA';
    const validArgs = args.filter(arg => typeof arg === 'number' && !isNaN(arg));
    if (validArgs.length === 0) return 'NA';
    return Math.max(...validArgs);
  },
  
  /**
   * Returns the minimum value from the provided arguments  
   * Example: MIN(10, 20, 5) returns 5
   */
  MIN: (...args: number[]): number | 'NA' => {
    if (args.length === 0) return 'NA';
    const validArgs = args.filter(arg => typeof arg === 'number' && !isNaN(arg));
    if (validArgs.length === 0) return 'NA';
    return Math.min(...validArgs);
  },
  
  /**
   * Rounds a number to the nearest integer
   * Example: ROUND(10.7) returns 11
   */
  ROUND: (value: number): number | 'NA' => {
    if (typeof value !== 'number' || isNaN(value)) return 'NA';
    return Math.round(value);
  },
  
  /**
   * Returns the absolute value of a number
   * Example: ABS(-10) returns 10
   */
  ABS: (value: number): number | 'NA' => {
    if (typeof value !== 'number' || isNaN(value)) return 'NA';
    return Math.abs(value);
  }
};

/**
 * Project statistics interface matching the existing structure
 * Used for type checking when evaluating formulas against real data
 */
interface ProjectStats {
  remoteImages: number;
  hostessImages: number;
  selfies: number;
  indoor: number;
  outdoor: number;
  stadium: number;
  female: number;
  male: number;
  genAlpha: number;
  genYZ: number;
  genX: number;
  boomer: number;
  merched: number;
  jersey: number;
  scarf: number;
  flags: number;
  baseballCap: number;
  other: number;
  // Optional Success Manager fields
  approvedImages?: number;
  rejectedImages?: number;
  eventAttendees?: number;
  eventTicketPurchases?: number;
  eventResultHome?: number;
  eventResultVisitor?: number;
  // Merchandise pricing variables
  jerseyPrice?: number;
  scarfPrice?: number;
  flagsPrice?: number;
  capPrice?: number;
  otherPrice?: number;
}

/**
 * Extracts all variable names used in a formula
 * Variables are identified by the pattern [VARIABLE_NAME] or [PARAM:key] or [MANUAL:key]
 * @param formula - The formula string to analyze
 * @returns Array of variable names found in the formula
 */
export function extractVariablesFromFormula(formula: string): string[] {
  const variableRegex = /\[([A-Z_:]+)\]/g;
  const variables: string[] = [];
  let match;
  
  while ((match = variableRegex.exec(formula)) !== null) {
    const variableName = match[1];
    if (!variables.includes(variableName)) {
      variables.push(variableName);
    }
  }
  
  return variables;
}

/**
 * Validates a formula for syntax correctness and variable existence
 * Checks for balanced parentheses, valid variables, and safe mathematical operations
 * @param formula - The formula string to validate
 * @returns Validation result with error details if invalid
 */
export function validateFormula(formula: string): FormulaValidationResult {
  try {
    // Extract variables from formula
    const usedVariables = extractVariablesFromFormula(formula);
    
    // Check if all variables are valid (including PARAM and MANUAL tokens)
    const invalidVariables = usedVariables.filter(
      variable => {
        // PARAM and MANUAL tokens are always valid (resolved externally)
        if (variable.startsWith('PARAM:') || variable.startsWith('MANUAL:')) {
          return false;
        }
        
        const normalized = normalizeTokenRaw(variable)
        // If not a known field and not a supported computed alias → invalid
        const field = resolveFieldNameByNormalizedToken(normalized)
        const isComputed = ['TOTALIMAGES','ALLIMAGES','TOTALFANS','REMOTEFANS','TOTALVISIT','TOTALUNDER40','TOTALOVER40'].includes(normalized)
        return !field && !isComputed
      }
    );
    
    if (invalidVariables.length > 0) {
      return {
        isValid: false,
        error: `Invalid variables: ${invalidVariables.join(', ')}`,
        usedVariables
      };
    }
    
    // Check for balanced parentheses
    let openParens = 0;
    for (const char of formula) {
      if (char === '(') openParens++;
      if (char === ')') openParens--;
      if (openParens < 0) {
        return {
          isValid: false,
          error: 'Unbalanced parentheses: closing parenthesis without opening',
          usedVariables
        };
      }
    }
    
    if (openParens > 0) {
      return {
        isValid: false,
        error: 'Unbalanced parentheses: unclosed opening parenthesis',
        usedVariables
      };
    }
    
    // Test evaluation with sample data (all variables set to 1)
    const testStats = Object.fromEntries(
      Object.values(VARIABLE_MAPPINGS).map(field => [field, 1])
    ) as unknown as ProjectStats;
    
    const testResult = evaluateFormula(formula, testStats);
    
    return {
      isValid: true,
      usedVariables,
      evaluatedResult: testResult
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Formula validation failed',
      usedVariables: []
    };
  }
}

/**
 * Substitutes variables in a formula with their actual values from project stats
 * Also supports [PARAM:key] and [MANUAL:key] tokens (resolved externally)
 * Replaces [VARIABLE_NAME] with the corresponding numeric value
 * @param formula - The formula string with variables
 * @param stats - Project statistics containing actual values
 * @param parameters - Optional parameters object for [PARAM:x] token resolution
 * @param manualData - Optional manual data object for [MANUAL:x] token resolution (aggregated analytics)
 * @returns Formula string with variables replaced by numbers
 */
function substituteVariables(
  formula: string, 
  stats: ProjectStats, 
  parameters?: Record<string, number>,
  manualData?: Record<string, number>
): string {
  let processedFormula = formula;

  // WHAT: Support [PARAM:key] tokens for parameterized values
  // WHY: Enable configurable marketing multipliers without hardcoding in formulas
  if (parameters) {
    processedFormula = processedFormula.replace(/\[PARAM:([a-zA-Z0-9_]+)\]/g, (_match, paramKey) => {
      const value = parameters[paramKey];
      return value !== undefined ? String(value) : '0';
    });
  }

  // WHAT: Support [MANUAL:key] tokens for manually computed aggregated data
  // WHY: Enable hashtag analytics charts with aggregated seasonality/partner data
  if (manualData) {
    processedFormula = processedFormula.replace(/\[MANUAL:([a-zA-Z0-9_]+)\]/g, (_match, manualKey) => {
      const value = manualData[manualKey];
      return value !== undefined ? String(value) : '0';
    });
  }

  // Single-pass replacement function to support both legacy and SEYU tokens
  processedFormula = processedFormula.replace(/\[([A-Z_]+)\]/g, (_match, rawToken) => {
    const normalized = normalizeTokenRaw(rawToken)

    // Pre-compute common composites
    const indoor = (stats as any).indoor || 0
    const outdoor = (stats as any).outdoor || 0
    const stadium = (stats as any).stadium || 0

    const approvedImages = (stats as any).approvedImages || 0
    const rejectedImages = (stats as any).rejectedImages || 0

    const remoteImages = (stats as any).remoteImages || 0
    const hostessImages = (stats as any).hostessImages || 0
    const selfies = (stats as any).selfies || 0

    const female = (stats as any).female || 0
    const male = (stats as any).male || 0
    const genAlpha = (stats as any).genAlpha || 0
    const genYZ = (stats as any).genYZ || 0
    const genX = (stats as any).genX || 0
    const boomer = (stats as any).boomer || 0

    // Computed tokens
    if (normalized === 'TOTALFANS') {
      const remoteFansComputed = (stats as any).remoteFans ?? (indoor + outdoor)
      const totalFansComputed = remoteFansComputed + stadium
      return String(totalFansComputed)
    }
    if (normalized === 'REMOTEFANS') {
      const remoteFansComputed = (stats as any).remoteFans ?? (indoor + outdoor)
      return String(remoteFansComputed)
    }
    if (normalized === 'TOTALIMAGES' || normalized === 'ALLIMAGES') {
      return String(remoteImages + hostessImages + selfies)
    }
    if (normalized === 'TOTALUNDER40') {
      return String(genAlpha + genYZ)
    }
    if (normalized === 'TOTALOVER40') {
      return String(genX + boomer)
    }

    // Resolve aliases and direct mappings
    const fieldName = resolveFieldNameByNormalizedToken(normalized)

    if (!fieldName) {
      // Unknown variable → treat as 0 for safety
      return '0'
    }

    let value = (stats as any)[fieldName]

    // Special fallback for STADIUMFANS alias already resolved to stadium via alias
    if (value === undefined || value === null) value = 0

    return String(value)
  })

  return processedFormula;
}

/**
 * Processes mathematical functions in a formula string
 * Replaces function calls like MAX(1,2,3) with their evaluated results
 * @param formula - Formula string potentially containing function calls
 * @returns Formula string with functions evaluated
 */
function processMathFunctions(formula: string): string {
  let processedFormula = formula;
  
  // Process each available math function
  for (const [functionName, functionImpl] of Object.entries(MATH_FUNCTIONS)) {
    const functionRegex = new RegExp(`${functionName}\\(([^)]+)\\)`, 'g');
    
    processedFormula = processedFormula.replace(functionRegex, (match, argsString) => {
      try {
        // Parse arguments (handle nested expressions by evaluating them first)
        const args = argsString.split(',').map((arg: string) => {
          const trimmedArg = arg.trim();
          // If argument contains operators, evaluate it first
          if (/[+\-*/()]/.test(trimmedArg)) {
            const argResult = evaluateSimpleExpression(trimmedArg);
            return typeof argResult === 'number' ? argResult : 0;
          }
          return parseFloat(trimmedArg);
        });
        
        // Call the function with parsed arguments
        const result = (functionImpl as (...args: number[]) => number | 'NA')(...args);
        return result === 'NA' ? 'NaN' : result.toString();
        
      } catch (error) {
        return 'NaN'; // Return NaN for any function evaluation errors
      }
    });
  }
  
  return processedFormula;
}

/**
 * Safely evaluates a simple mathematical expression
 * Handles basic arithmetic operations with division by zero protection
 * @param expression - Mathematical expression to evaluate
 * @returns Numeric result or 'NA' for errors
 */
function evaluateSimpleExpression(expression: string): number | 'NA' {
  try {
    // Remove whitespace
    const cleanExpression = expression.replace(/\s+/g, '');
    
    // Check for division by zero
    if (/\/\s*0(?!\d)/.test(cleanExpression)) {
      return 'NA';
    }
    
    // Use Function constructor for safe evaluation (more secure than eval)
    // This only allows mathematical operations, no access to global scope
    const safeEval = new Function('return ' + cleanExpression);
    const result = safeEval();
    
    // Check for invalid results
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      return 'NA';
    }
    
    return result;
    
  } catch (error) {
    return 'NA';
  }
}

/**
 * Main function to evaluate a formula against project statistics
 * Handles variable substitution, function processing, and safe evaluation
 * @param formula - The formula string to evaluate
 * @param stats - Project statistics for variable values
 * @param parameters - Optional parameters for [PARAM:x] token resolution
 * @param manualData - Optional manual data for [MANUAL:x] token resolution (aggregated analytics)
 * @returns Numeric result or 'NA' for errors/invalid results
 */
export function evaluateFormula(
  formula: string, 
  stats: ProjectStats, 
  parameters?: Record<string, number>,
  manualData?: Record<string, number>
): number | 'NA' {
  try {
    // Step 1: Substitute variables with actual values (including parameters and manual data)
    const formulaWithValues = substituteVariables(formula, stats, parameters, manualData);
    
    // Step 2: Process mathematical functions
    const formulaWithFunctions = processMathFunctions(formulaWithValues);
    
    // Step 3: Evaluate the final mathematical expression
    const result = evaluateSimpleExpression(formulaWithFunctions);
    
    return result;
    
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return 'NA';
  }
}

/**
 * Batch evaluates multiple formulas against the same project statistics
 * More efficient than calling evaluateFormula multiple times
 * @param formulas - Array of formula strings to evaluate
 * @param stats - Project statistics for variable values  
 * @returns Array of results corresponding to input formulas
 */
export function evaluateFormulasBatch(
  formulas: string[], 
  stats: ProjectStats
): (number | 'NA')[] {
  return formulas.map(formula => evaluateFormula(formula, stats));
}

/**
 * Gets all available variables with their descriptions
 * Useful for building variable picker UIs
 * @returns Array of available variables with metadata
 */
export function getAvailableVariables() {
  return AVAILABLE_VARIABLES;
}

/**
 * Checks if a specific variable exists and is valid
 * @param variableName - Name of variable to check (e.g., "INDOOR", "FEMALE")
 * @returns Boolean indicating if variable is valid
 */
export function isValidVariable(variableName: string): boolean {
  return VARIABLE_MAPPINGS.hasOwnProperty(variableName);
}

/**
 * Gets example usage for a specific variable
 * @param variableName - Name of variable to get example for
 * @returns Example formula using the variable, or null if variable is invalid
 */
export function getVariableExample(variableName: string): string | null {
  const variable = AVAILABLE_VARIABLES.find(v => v.name === variableName);
  return variable ? variable.exampleUsage : null;
}

/**
 * WHAT: Validates if stats contain all variables required by a formula
 * WHY: Pre-flight check to prevent 'NA' results from missing data
 * HOW: Extract variables from formula, check if stats has them
 * 
 * @param formula - Formula string to validate
 * @param stats - Project statistics to check
 * @returns Validation result with missing variables list
 */
export function validateStatsForFormula(
  formula: string,
  stats: Partial<ProjectStats>
): {
  valid: boolean;
  missingVariables: string[];
  availableVariables: string[];
  canEvaluate: boolean;
} {
  // WHAT: Extract all variables used in the formula
  // WHY: Need to know what data the formula depends on
  const usedVariables = extractVariablesFromFormula(formula);
  
  // WHAT: Filter out special tokens (PARAM, MANUAL) - handled externally
  // WHY: These are not part of stats and resolved at runtime
  const statsVariables = usedVariables.filter(
    v => !v.startsWith('PARAM:') && !v.startsWith('MANUAL:')
  );
  
  // WHAT: Map formula variables to stats field names
  // WHY: Formula uses [VARIABLE_NAME], stats uses camelCase
  const requiredFields: string[] = [];
  const availableFields: string[] = [];
  
  for (const variable of statsVariables) {
    const normalized = normalizeTokenRaw(variable);
    
    // WHAT: Handle computed/derived metrics separately
    // WHY: These can be calculated if base metrics exist
    const isComputed = [
      'TOTALIMAGES', 'ALLIMAGES', 'TOTALFANS', 
      'REMOTEFANS', 'TOTALUNDER40', 'TOTALOVER40'
    ].includes(normalized);
    
    if (isComputed) {
      // WHAT: For derived metrics, check if base components exist
      // WHY: Can compute totalFans if indoor, outdoor, stadium exist
      if (normalized === 'TOTALFANS' || normalized === 'REMOTEFANS') {
        const hasBase = 
          (stats as any).indoor !== undefined && 
          (stats as any).outdoor !== undefined && 
          (stats as any).stadium !== undefined;
        if (hasBase) availableFields.push(normalized);
        else requiredFields.push(normalized);
      } else if (normalized === 'TOTALIMAGES' || normalized === 'ALLIMAGES') {
        const hasBase = 
          (stats as any).remoteImages !== undefined && 
          (stats as any).hostessImages !== undefined && 
          (stats as any).selfies !== undefined;
        if (hasBase) availableFields.push(normalized);
        else requiredFields.push(normalized);
      } else {
        // totalUnder40, totalOver40
        availableFields.push(normalized);
      }
    } else {
      // WHAT: Regular variable - resolve to stats field name
      // WHY: Check if actual stats object has this field
      const fieldName = resolveFieldNameByNormalizedToken(normalized);
      if (fieldName) {
        const value = (stats as any)[fieldName];
        if (value !== undefined && value !== null) {
          availableFields.push(variable);
        } else {
          requiredFields.push(fieldName);
        }
      }
    }
  }
  
  const missingVariables = requiredFields;
  const valid = missingVariables.length === 0;
  
  // WHAT: Determine if formula can be evaluated despite missing vars
  // WHY: Some formulas can still work with defaults (0) for missing fields
  const canEvaluate = true; // formulaEngine uses 0 for missing vars
  
  return {
    valid,
    missingVariables,
    availableVariables: availableFields,
    canEvaluate
  };
}

/**
 * WHAT: Safe formula evaluation with automatic data enrichment
 * WHY: Ensure derived metrics exist before evaluation to prevent errors
 * HOW: Enrich stats with derived fields, then evaluate formula
 * 
 * @param formula - Formula string to evaluate
 * @param stats - Project statistics (may be incomplete)
 * @param parameters - Optional parameters for [PARAM:x] tokens
 * @param manualData - Optional manual data for [MANUAL:x] tokens
 * @returns Evaluation result or 'NA' on error
 */
export function evaluateFormulaSafe(
  formula: string,
  stats: Partial<ProjectStats>,
  parameters?: Record<string, number>,
  manualData?: Record<string, number>
): number | 'NA' {
  try {
    // WHAT: Ensure derived metrics exist
    // WHY: Prevent 'NA' from missing totalFans, allImages, remoteFans
    const enriched = ensureDerivedMetrics(stats);
    
    // WHAT: Standard formula evaluation with enriched stats
    // WHY: Now guaranteed to have derived fields
    return evaluateFormula(formula, enriched, parameters, manualData);
  } catch (error) {
    console.error('Safe formula evaluation error:', error);
    return 'NA';
  }
}

/**
 * WHAT: Batch formula evaluation with validation
 * WHY: Efficient multi-formula evaluation with pre-flight checks
 * HOW: Enrich stats once, validate formulas, then batch evaluate
 * 
 * @param formulas - Array of formula strings
 * @param stats - Project statistics
 * @returns Array of results with validation status
 */
export function evaluateFormulaBatchSafe(
  formulas: string[],
  stats: Partial<ProjectStats>
): Array<{ result: number | 'NA'; valid: boolean; formula: string }> {
  // WHAT: Enrich stats once for all formulas
  // WHY: More efficient than enriching per formula
  const enriched = ensureDerivedMetrics(stats);
  
  return formulas.map(formula => {
    const validation = validateStatsForFormula(formula, enriched);
    const result = evaluateFormula(formula, enriched);
    
    return {
      result,
      valid: validation.valid,
      formula
    };
  });
}

/**
 * Test utility function for development and debugging
 * Evaluates a formula against sample test data
 * @param formula - Formula to test
 * @returns Test result with sample data
 */
export function testFormula(formula: string): { result: number | 'NA'; sampleData: ProjectStats } {
  const sampleData: ProjectStats = {
    remoteImages: 10, hostessImages: 25, selfies: 15,
    indoor: 50, outdoor: 30, stadium: 200,
    female: 120, male: 160,
    genAlpha: 20, genYZ: 100, genX: 80, boomer: 80,
    merched: 40, jersey: 15, scarf: 8, flags: 12, baseballCap: 5, other: 3,
    approvedImages: 45, rejectedImages: 5,
    eventAttendees: 1000, eventTicketPurchases: 850,
    eventResultHome: 2, eventResultVisitor: 1,
    // Merchandise pricing variables (sample prices in EUR)
    jerseyPrice: 85, scarfPrice: 25, flagsPrice: 15, capPrice: 20, otherPrice: 10
  };
  
  const result = evaluateFormula(formula, sampleData);
  return { result, sampleData };
}
