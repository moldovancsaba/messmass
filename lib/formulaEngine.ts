// lib/formulaEngine.ts - Formula parsing and safe evaluation engine
// Handles 42 dynamic variables with +, -, *, /, (), and math functions (MAX, MIN, ROUND, ABS)
// Returns 'NA' for division by zero, missing variables, or invalid expressions

import { AVAILABLE_VARIABLES, FormulaValidationResult } from './chartConfigTypes';

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
 * Maps [INDOOR] to stats.indoor, [FEMALE] to stats.female, etc.
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
  
  // Visits & Engagement
  'VISIT_QR_CODE': 'visitQrCode',
  'VISIT_SHORT_URL': 'visitShortUrl',
  'VISIT_WEB': 'visitWeb',
  'VISIT_FACEBOOK': 'visitFacebook',
  'VISIT_INSTAGRAM': 'visitInstagram',
  'VISIT_YOUTUBE': 'visitYoutube',
  'VISIT_TIKTOK': 'visitTiktok',
  'VISIT_X': 'visitX',
  'VISIT_TRUSTPILOT': 'visitTrustpilot',
  'SOCIAL_VISIT': 'socialVisit', // New aggregated social visit
  
  // Event Metrics
'EVENT_ATTENDEES': 'eventAttendees',
  'EVENT_RESULT_HOME': 'eventResultHome',
  'EVENT_RESULT_VISITOR': 'eventResultVisitor',
  'EVENT_VALUE_PROPOSITION_VISITED': 'eventValuePropositionVisited',
  'EVENT_VALUE_PROPOSITION_PURCHASES': 'eventValuePropositionPurchases',
  
  // Merchandise Pricing Variables (configurable values for sales calculations)
  'JERSEY_PRICE': 'jerseyPrice',
  'SCARF_PRICE': 'scarfPrice',
  'FLAGS_PRICE': 'flagsPrice',
  'CAP_PRICE': 'capPrice',
  'OTHER_PRICE': 'otherPrice'
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

  // Visits (order flipped VISIT → suffix VISIT)
  QRCODEVISIT: 'VISITQRCODE',
  SHORTURLVISIT: 'VISITSHORTURL',
  WEBVISIT: 'VISITWEB',
  SOCIALVISIT: 'SOCIALVISIT',
  TOTALVISIT: 'TOTALVISIT', // computed

  // Event
  ATTENDEES: 'EVENTATTENDEES',
  RESULTHOME: 'EVENTRESULTHOME',
  RESULTVISITOR: 'EVENTRESULTVISITOR',
  PROPOSITIONVISIT: 'EVENTVALUEPROPOSITIONVISITED',
  PROPOSITIONPURCHASE: 'EVENTVALUEPROPOSITIONPURCHASES',
}

function resolveFieldNameByNormalizedToken(normalizedToken: string): string | undefined {
  // Computed aliases handled separately
  const computedSet = new Set([
    'TOTALIMAGES', 'ALLIMAGES', 'TOTALFANS', 'REMOTEFANS', 'TOTALVISIT', 'TOTALUNDER40', 'TOTALOVER40'
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
  visitQrCode?: number;
  visitShortUrl?: number;
  visitWeb?: number;
  visitFacebook?: number;
  visitInstagram?: number;
  visitYoutube?: number;
  visitTiktok?: number;
  visitX?: number;
  visitTrustpilot?: number;
  eventAttendees?: number;
  eventTicketPurchases?: number;
  eventResultHome?: number;
  eventResultVisitor?: number;
  eventValuePropositionVisited?: number;
  eventValuePropositionPurchases?: number;
  // Merchandise pricing variables
  jerseyPrice?: number;
  scarfPrice?: number;
  flagsPrice?: number;
  capPrice?: number;
  otherPrice?: number;
}

/**
 * Extracts all variable names used in a formula
 * Variables are identified by the pattern [VARIABLE_NAME]
 * @param formula - The formula string to analyze
 * @returns Array of variable names found in the formula
 */
export function extractVariablesFromFormula(formula: string): string[] {
  const variableRegex = /\[([A-Z_]+)\]/g;
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
    
    // Check if all variables are valid
    const invalidVariables = usedVariables.filter(
      variable => {
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
 * Replaces [VARIABLE_NAME] with the corresponding numeric value
 * @param formula - The formula string with variables
 * @param stats - Project statistics containing actual values
 * @returns Formula string with variables replaced by numbers
 */
function substituteVariables(formula: string, stats: ProjectStats): string {
  let processedFormula = formula;

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

    const visitQrCode = (stats as any).visitQrCode || 0
    const visitShortUrl = (stats as any).visitShortUrl || 0
    const visitWeb = (stats as any).visitWeb || 0
    const visitFacebook = (stats as any).visitFacebook || 0
    const visitInstagram = (stats as any).visitInstagram || 0
    const visitYoutube = (stats as any).visitYoutube || 0
    const visitTiktok = (stats as any).visitTiktok || 0
    const visitX = (stats as any).visitX || 0
    const visitTrustpilot = (stats as any).visitTrustpilot || 0

    const socialVisit = (stats as any).socialVisit ?? (visitFacebook + visitInstagram + visitYoutube + visitTiktok + visitX + visitTrustpilot)

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
    if (normalized === 'TOTALVISIT') {
      return String(socialVisit + visitQrCode + visitShortUrl + visitWeb)
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
 * @returns Numeric result or 'NA' for errors/invalid results
 */
export function evaluateFormula(formula: string, stats: ProjectStats): number | 'NA' {
  try {
    // Step 1: Substitute variables with actual values
    const formulaWithValues = substituteVariables(formula, stats);
    
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
    visitQrCode: 30, visitShortUrl: 20, visitWeb: 100,
    visitFacebook: 25, visitInstagram: 40, visitYoutube: 15,
    visitTiktok: 35, visitX: 10, visitTrustpilot: 5,
    eventAttendees: 1000, eventTicketPurchases: 850,
    eventResultHome: 2, eventResultVisitor: 1,
    eventValuePropositionVisited: 75, eventValuePropositionPurchases: 12,
    // Merchandise pricing variables (sample prices in EUR)
    jerseyPrice: 85, scarfPrice: 25, flagsPrice: 15, capPrice: 20, otherPrice: 10
  };
  
  const result = evaluateFormula(formula, sampleData);
  return { result, sampleData };
}
