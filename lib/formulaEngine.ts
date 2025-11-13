// lib/formulaEngine.ts - Formula parsing and safe evaluation engine
// DYNAMIC VARIABLE SYSTEM: Fetches variables from KYC/variables_metadata collection (92 variables)
// Returns 'NA' for division by zero, missing variables, or invalid expressions

import { type AvailableVariable, FormulaValidationResult } from './chartConfigTypes';
import { 
  validateRequiredFields, 
  ensureDerivedMetrics, 
  type ProjectStats as ValidatedProjectStats,
  type ValidationResult as DataValidationResult
} from './dataValidator';
import { type ContentAsset } from './contentAssetTypes';

/**
 * DYNAMIC VARIABLE CACHE - KYC as Single Source of Truth
 * 
 * WHAT: In-memory cache for variables from MongoDB variables_metadata collection
 * WHY: Expensive to fetch all 92 variables from database on every formula validation
 * HOW: Cache for 5 minutes, automatically invalidated when variables API is updated
 * TTL: Matches variables-config API cache (5 minutes)
 */
let variablesCache: {
  data: AvailableVariable[];
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isCacheValid(): boolean {
  if (!variablesCache) return false;
  return Date.now() - variablesCache.timestamp < CACHE_TTL_MS;
}

/**
 * WHAT: Fetch all available variables from KYC system dynamically
 * WHY: Chart configurator needs access to ALL 92 variables, not hardcoded 37
 * HOW: Call /api/variables-config with 5-minute cache
 * 
 * @returns Promise resolving to array of all variables from KYC
 */
export async function fetchAvailableVariables(): Promise<AvailableVariable[]> {
  try {
    // Check cache first
    if (isCacheValid() && variablesCache) {
      console.log('✅ Variables cache hit (formulaEngine)');
      return variablesCache.data;
    }

    console.log('📊 Fetching variables from KYC API...');
    const response = await fetch('/api/variables-config', { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch variables: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success || !Array.isArray(data.variables)) {
      throw new Error('Invalid variables API response');
    }

    // Update cache
    variablesCache = {
      data: data.variables,
      timestamp: Date.now()
    };

    console.log(`✅ Loaded ${data.variables.length} variables from KYC`);
    return data.variables;
  } catch (error) {
    console.error('❌ Failed to fetch variables from KYC:', error);
    // Return empty array on error (graceful degradation)
    return [];
  }
}

/**
 * WHAT: Synchronous variable fetching for server-side use
 * WHY: Some contexts cannot use async/await (e.g., synchronous validation)
 * HOW: Returns cached data only
 * 
 * @returns Array of variables from cache or empty array
 */
export function fetchAvailableVariablesSync(): AvailableVariable[] {
  // Check cache first
  if (isCacheValid() && variablesCache) {
    return variablesCache.data;
  }

  console.warn('⚠️ Synchronous variable fetch called - returning cached data only');
  return variablesCache?.data || [];
}

/**
 * CONTENT ASSET CACHE - CMS as Complementary Source
 * 
 * WHAT: In-memory cache for content assets from MongoDB content_assets collection
 * WHY: Expensive to fetch all assets from database on every formula evaluation
 * HOW: Cache for 5 minutes, same TTL as variables cache
 * 
 * @example
 * Asset slug "logo-abc" with URL "https://i.ibb.co/abc123"
 * Formula [MEDIA:logo-abc] resolves to the URL value
 */
let assetsCache: {
  data: ContentAsset[];
  timestamp: number;
} | null = null;

const ASSETS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes (same as variables)

function isAssetsCacheValid(): boolean {
  if (!assetsCache) return false;
  return Date.now() - assetsCache.timestamp < ASSETS_CACHE_TTL_MS;
}

/**
 * WHAT: Fetch all content assets from CMS dynamically
 * WHY: Chart formulas may reference images/text via [MEDIA:slug] or [TEXT:slug] tokens
 * HOW: Call /api/content-assets with 5-minute cache
 * 
 * @returns Promise resolving to array of all content assets
 */
export async function fetchContentAssets(): Promise<ContentAsset[]> {
  try {
    // Check cache first
    if (isAssetsCacheValid() && assetsCache) {
      console.log('✅ Content assets cache hit (formulaEngine)');
      return assetsCache.data;
    }

    console.log('📚 Fetching content assets from CMS API...');
    const response = await fetch('/api/content-assets', { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content assets: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success || !Array.isArray(data.assets)) {
      throw new Error('Invalid content assets API response');
    }

    // Update cache
    assetsCache = {
      data: data.assets,
      timestamp: Date.now()
    };

    console.log(`✅ Loaded ${data.assets.length} content assets from CMS`);
    return data.assets;
  } catch (error) {
    console.error('❌ Failed to fetch content assets from CMS:', error);
    // Return empty array on error (graceful degradation)
    return [];
  }
}

/**
 * WHAT: Synchronous content asset fetching for server-side use
 * WHY: Some contexts cannot use async/await (e.g., synchronous validation)
 * HOW: Returns cached data only
 * 
 * @returns Array of content assets from cache or empty array
 */
export function fetchContentAssetsSync(): ContentAsset[] {
  // Check cache first
  if (isAssetsCacheValid() && assetsCache) {
    return assetsCache.data;
  }

  console.warn('⚠️ Synchronous content asset fetch called - returning cached data only');
  return assetsCache?.data || [];
}

/**
 * WHAT: Resolve content asset token to its content value
 * WHY: Formulas like [MEDIA:logo-abc] need to resolve to actual image URL or text content
 * HOW: Match token prefix (MEDIA/TEXT), find asset by slug, return content
 * 
 * @param token - Token string like "MEDIA:logo-abc" or "TEXT:summary"
 * @param assets - Array of content assets to search
 * @returns Content value (URL for images, text for text blocks) or 'NA' if not found
 * 
 * @example
 * resolveContentAssetToken('MEDIA:logo-abc', assets)
 * // returns "https://i.ibb.co/abc123" (image URL)
 * 
 * resolveContentAssetToken('TEXT:summary', assets)
 * // returns "This is the executive summary..." (text content)
 */
export function resolveContentAssetToken(
  token: string,
  assets: ContentAsset[]
): string | 'NA' {
  // WHAT: Parse token into prefix and slug
  // WHY: Token format is "MEDIA:slug" or "TEXT:slug"
  const parts = token.split(':');
  if (parts.length !== 2) {
    console.warn(`⚠️ Invalid asset token format: ${token}`);
    return 'NA';
  }
  
  const [prefix, slug] = parts;
  
  // WHAT: Validate token prefix
  // WHY: Only MEDIA and TEXT tokens are supported
  if (prefix !== 'MEDIA' && prefix !== 'TEXT') {
    console.warn(`⚠️ Unknown asset token prefix: ${prefix}`);
    return 'NA';
  }
  
  // WHAT: Find asset by slug
  // WHY: Slug is the unique identifier for content assets
  const asset = assets.find(a => a.slug === slug);
  if (!asset) {
    console.warn(`⚠️ Asset not found: ${token}`);
    return 'NA';
  }
  
  // WHAT: Validate type matches prefix
  // WHY: MEDIA tokens must reference images, TEXT tokens must reference text
  if (prefix === 'MEDIA' && asset.type !== 'image') {
    console.warn(`⚠️ Expected image, got text: ${token}`);
    return 'NA';
  }
  if (prefix === 'TEXT' && asset.type !== 'text') {
    console.warn(`⚠️ Expected text, got image: ${token}`);
    return 'NA';
  }
  
  // WHAT: Return content value
  // WHY: Images return URL, text returns text content
  if (asset.type === 'image') {
    return asset.content.url || 'NA';
  } else {
    return asset.content.text || 'NA';
  }
}

/**
 * SINGLE REFERENCE SYSTEM - NO MAPPINGS, NO TRANSLATIONS
 * 
 * WHAT: Use database field names directly in formulas
 * WHY: If database has "female", use [female] in charts. If database has "Woman", use [Woman] in charts.
 * HOW: Token [fieldName] resolves directly to stats.fieldName - zero translation layer
 * 
 * RULE: Database field name = Chart token = UI display = Everything
 */

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
 * Variables are identified by the pattern [variableName] or [PARAM:key] or [MANUAL:key] or [MEDIA:slug] or [TEXT:slug]
 * SINGLE REFERENCE SYSTEM: Lowercase field names match database exactly
 * @param formula - The formula string to analyze
 * @returns Array of variable names found in the formula
 */
export function extractVariablesFromFormula(formula: string): string[] {
  // WHAT: Match [stats.fieldName], [PARAM:key], [MANUAL:key], [MEDIA:slug], [TEXT:slug] with full database paths
  // WHY: Database paths include dots (e.g., stats.female, stats.remoteImages) AND content asset tokens use colons
  // REGEX: Allow letters, numbers, underscores, colons, dots, AND hyphens (for content asset slugs)
  // EXAMPLES: [stats.female], [PARAM:multiplier], [MANUAL:benchmark], [MEDIA:logo-abc], [TEXT:summary-text]
  const variableRegex = /\[([a-zA-Z0-9_:.\-]+)\]/g;
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
    
    // PARAM and MANUAL tokens are always valid (resolved externally)
    // All other tokens map directly to stats fields (single reference system)
    
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
    
    // Test evaluation with sample data (all fields set to 1)
    const testStats: ProjectStats = {
      remoteImages: 1, hostessImages: 1, selfies: 1,
      indoor: 1, outdoor: 1, stadium: 1,
      female: 1, male: 1,
      genAlpha: 1, genYZ: 1, genX: 1, boomer: 1,
      merched: 1, jersey: 1, scarf: 1, flags: 1, baseballCap: 1, other: 1,
      approvedImages: 1, rejectedImages: 1,
      eventAttendees: 1, eventTicketPurchases: 1,
      eventResultHome: 1, eventResultVisitor: 1
    };
    
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
 * ABSOLUTE DATABASE PATH SYSTEM - Full MongoDB Path Resolution
 * 
 * WHAT: Use FULL database paths in formulas: [stats.female] not [female]
 * WHY: Single source of truth = database structure. No aliases, no translation.
 * HOW: Token [stats.female] resolves to stats.female via JavaScript object access
 * 
 * RULE: Database path = Chart token = Code reference = Everything
 * 
 * @param formula - Formula with [stats.fieldName] tokens
 * @param stats - Project statistics object
 * @param parameters - Optional [PARAM:key] tokens
 * @param manualData - Optional [MANUAL:key] tokens
 * @param contentAssets - Optional content assets for [MEDIA:slug] and [TEXT:slug] tokens
 * @returns Formula with tokens replaced by values
 */
function substituteVariables(
  formula: string, 
  stats: ProjectStats, 
  parameters?: Record<string, number>,
  manualData?: Record<string, number>,
  contentAssets?: ContentAsset[]
): string {
  let processedFormula = formula;

  // WHAT: Support [MEDIA:slug] and [TEXT:slug] tokens for content assets
  // WHY: Charts can reference images and text blocks from CMS
  // HOW: Resolve slug to actual content (URL for images, text for text blocks)
  if (contentAssets && contentAssets.length > 0) {
    processedFormula = processedFormula.replace(/\[(MEDIA|TEXT):([a-z0-9-]+)\]/g, (_match, prefix, slug) => {
      const token = `${prefix}:${slug}`;
      const value = resolveContentAssetToken(token, contentAssets);
      // WHAT: Wrap string values in quotes for safe evaluation
      // WHY: Text content and URLs may contain spaces or special chars
      // NOTE: For image/text charts, the value is used directly (not evaluated)
      return value === 'NA' ? '"NA"' : `"${value.replace(/"/g, '\\"')}"`;
    });
  }

  // Support [PARAM:key] tokens for parameterized values
  if (parameters) {
    processedFormula = processedFormula.replace(/\[PARAM:([a-zA-Z0-9_]+)\]/g, (_match, paramKey) => {
      const value = parameters[paramKey];
      return value !== undefined ? String(value) : '0';
    });
  }

  // Support [MANUAL:key] tokens for aggregated analytics
  if (manualData) {
    processedFormula = processedFormula.replace(/\[MANUAL:([a-zA-Z0-9_]+)\]/g, (_match, manualKey) => {
      const value = manualData[manualKey];
      return value !== undefined ? String(value) : '0';
    });
  }

  // ABSOLUTE DATABASE PATH SYSTEM: [stats.fieldName] OR stats.fieldName → value from stats.fieldName
  // WHAT: Parse stats.fieldName path and access the nested value
  // WHY: Formula references must match database structure exactly
  // HOW: Handle BOTH [stats.field] (bracketed) AND stats.field (non-bracketed) formats
  
  // First, handle bracketed format: [stats.fieldName]
  processedFormula = processedFormula.replace(/\[([a-zA-Z0-9_.]+)\]/g, (_match, fullPath) => {
    // ABSOLUTE PATH: fullPath is like "stats.female" or "stats.remoteImages"
    // Parse the path and access nested values
    
    // Handle special derived/computed fields
    if (fullPath === 'stats.totalFans') {
      const remoteFans = (stats as any).remoteFans ?? 
                        ((stats as any).indoor || 0) + ((stats as any).outdoor || 0);
      const stadium = (stats as any).stadium || 0;
      return String(remoteFans + stadium);
    }
    
    if (fullPath === 'stats.remoteFans') {
      const remoteFans = (stats as any).remoteFans ?? 
                        ((stats as any).indoor || 0) + ((stats as any).outdoor || 0);
      return String(remoteFans);
    }
    
    if (fullPath === 'stats.allImages') {
      const remoteImages = (stats as any).remoteImages || 0;
      const hostessImages = (stats as any).hostessImages || 0;
      const selfies = (stats as any).selfies || 0;
      return String(remoteImages + hostessImages + selfies);
    }
    
    if (fullPath === 'stats.totalUnder40') {
      const genAlpha = (stats as any).genAlpha || 0;
      const genYZ = (stats as any).genYZ || 0;
      return String(genAlpha + genYZ);
    }
    
    if (fullPath === 'stats.totalOver40') {
      const genX = (stats as any).genX || 0;
      const boomer = (stats as any).boomer || 0;
      return String(genX + boomer);
    }
    
    // Parse the dot-notation path (e.g., "stats.female" → ["stats", "female"])
    const pathParts = fullPath.split('.');
    
    // Navigate through the object path
    let value: any = stats as any;
    for (const part of pathParts) {
      if (part === 'stats') continue; // Skip the "stats" prefix since we're already in stats object
      value = value?.[part];
    }
    
    if (value !== undefined && value !== null) {
      return String(value);
    }
    
    // Field doesn't exist → return 0
    return '0';
  });
  
  // Second, handle non-bracketed format: stats.fieldName (for backward compatibility)
  // WHAT: Support formulas stored as "stats.female" without brackets
  // WHY: Some charts in database have formulas without brackets
  // HOW: Match stats.fieldName pattern that is NOT already inside brackets
  // NOTE: Use negative lookbehind and lookahead to avoid double-substitution
  processedFormula = processedFormula.replace(/(?<!\[)\bstats\.([a-zA-Z0-9_]+)\b(?!\])/g, (_match, fieldName) => {
    // Reconstruct full path
    const fullPath = `stats.${fieldName}`;
    
    // Handle special derived/computed fields
    if (fullPath === 'stats.totalFans') {
      const remoteFans = (stats as any).remoteFans ?? 
                        ((stats as any).indoor || 0) + ((stats as any).outdoor || 0);
      const stadium = (stats as any).stadium || 0;
      return String(remoteFans + stadium);
    }
    
    if (fullPath === 'stats.remoteFans') {
      const remoteFans = (stats as any).remoteFans ?? 
                        ((stats as any).indoor || 0) + ((stats as any).outdoor || 0);
      return String(remoteFans);
    }
    
    if (fullPath === 'stats.allImages') {
      const remoteImages = (stats as any).remoteImages || 0;
      const hostessImages = (stats as any).hostessImages || 0;
      const selfies = (stats as any).selfies || 0;
      return String(remoteImages + hostessImages + selfies);
    }
    
    if (fullPath === 'stats.totalUnder40') {
      const genAlpha = (stats as any).genAlpha || 0;
      const genYZ = (stats as any).genYZ || 0;
      return String(genAlpha + genYZ);
    }
    
    if (fullPath === 'stats.totalOver40') {
      const genX = (stats as any).genX || 0;
      const boomer = (stats as any).boomer || 0;
      return String(genX + boomer);
    }
    
    // Access the field directly from stats object
    const value = (stats as any)[fieldName];
    
    if (value !== undefined && value !== null) {
      return String(value);
    }
    
    // Field doesn't exist → return 0
    return '0';
  });

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
 * @param contentAssets - Optional content assets for [MEDIA:slug] and [TEXT:slug] token resolution
 * @returns Numeric result or 'NA' for errors/invalid results
 */
export function evaluateFormula(
  formula: string, 
  stats: ProjectStats, 
  parameters?: Record<string, number>,
  manualData?: Record<string, number>,
  contentAssets?: ContentAsset[]
): number | 'NA' {
  try {
    // Step 1: Substitute variables with actual values (including parameters, manual data, and content assets)
    const formulaWithValues = substituteVariables(formula, stats, parameters, manualData, contentAssets);
    
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
 * DEPRECATED: Use fetchAvailableVariables() instead
 * 
 * Gets all available variables with their descriptions
 * Useful for building variable picker UIs
 * 
 * @deprecated Use async fetchAvailableVariables() for dynamic KYC data
 * @returns Array of available variables from cache or empty array
 */
export function getAvailableVariables(): AvailableVariable[] {
  console.warn('⚠️ getAvailableVariables() is deprecated. Use fetchAvailableVariables() instead.');
  return fetchAvailableVariablesSync();
}

/**
 * WHAT: Checks if a specific variable exists in KYC system or is a content asset token
 * WHY: Dynamic validation against 92 variables, not hardcoded 37 + content asset tokens
 * HOW: Look up variable name in cached KYC variables OR validate content asset token format
 * 
 * @param variableName - Full database path (e.g., "stats.female", "stats.bitlyTotalClicks") or content asset token (e.g., "MEDIA:logo-abc", "TEXT:summary")
 * @returns Boolean indicating if variable exists in KYC or is a valid content asset token
 */
export function isValidVariable(variableName: string): boolean {
  // WHAT: Strip PARAM:, MANUAL:, MEDIA:, TEXT: prefixes (always valid)
  // WHY: These are resolved at runtime, not database fields
  if (variableName.startsWith('PARAM:') || variableName.startsWith('MANUAL:')) {
    return true;
  }
  
  // WHAT: Content asset tokens are always valid (validated at runtime)
  // WHY: [MEDIA:slug] and [TEXT:slug] resolve from content_assets collection
  // HOW: Check prefix and slug format (lowercase alphanumeric with hyphens)
  if (variableName.startsWith('MEDIA:') || variableName.startsWith('TEXT:')) {
    const slug = variableName.split(':')[1];
    return /^[a-z0-9-]+$/.test(slug); // Valid slug format
  }

  // WHAT: Check if variable exists in cached KYC data
  // WHY: Single source of truth from variables_metadata collection
  const variables = fetchAvailableVariablesSync();
  
  if (variables.length === 0) {
    // WHAT: If cache is empty, return true (permissive mode)
    // WHY: Avoid blocking formula validation before first API call
    console.warn(`⚠️ Variables cache empty, cannot validate: ${variableName}`);
    return true;
  }

  // WHAT: Lookup variable by name (full database path)
  // WHY: Database path like "stats.female" must match exactly
  return variables.some(v => v.name === variableName);
}

/**
 * WHAT: Gets example usage for a specific variable from KYC
 * WHY: Provide contextual help in formula editor
 * HOW: Look up variable in cached data
 * 
 * @param variableName - Full database path (e.g., "stats.female")
 * @returns Example formula using the variable, or null if not found
 */
export function getVariableExample(variableName: string): string | null {
  const variables = fetchAvailableVariablesSync();
  const variable = variables.find(v => v.name === variableName);
  return variable?.exampleUsage || null;
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
  
  // WHAT: Filter out special tokens (PARAM, MANUAL, MEDIA, TEXT) - handled externally
  // WHY: These are not part of stats and resolved at runtime from other sources
  const statsVariables = usedVariables.filter(
    v => !v.startsWith('PARAM:') && !v.startsWith('MANUAL:') && !v.startsWith('MEDIA:') && !v.startsWith('TEXT:')
  );
  
  // WHAT: Map formula variables to stats field names
  // WHY: Formula uses [VARIABLE_NAME], stats uses camelCase
  const requiredFields: string[] = [];
  const availableFields: string[] = [];
  
  for (const variable of statsVariables) {
    // SINGLE REFERENCE SYSTEM: variable name = stats field name
    const fieldName = variable;
    
    // Handle computed/derived metrics
    const derivedFields = ['totalFans', 'allImages', 'totalImages', 'totalUnder40', 'totalOver40'];
    
    if (derivedFields.includes(fieldName)) {
      // Derived fields are always available (computed on-the-fly)
      availableFields.push(variable);
    } else {
      // Direct stats field - check if it exists
      const value = (stats as any)[fieldName];
      if (value !== undefined && value !== null) {
        availableFields.push(variable);
      } else {
        requiredFields.push(fieldName);
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
 * @param contentAssets - Optional content assets for [MEDIA:slug] and [TEXT:slug] tokens
 * @returns Evaluation result or 'NA' on error
 */
export function evaluateFormulaSafe(
  formula: string,
  stats: Partial<ProjectStats>,
  parameters?: Record<string, number>,
  manualData?: Record<string, number>,
  contentAssets?: ContentAsset[]
): number | 'NA' {
  try {
    // WHAT: Ensure derived metrics exist
    // WHY: Prevent 'NA' from missing totalFans, allImages, remoteFans
    const enriched = ensureDerivedMetrics(stats);
    
    // WHAT: Standard formula evaluation with enriched stats
    // WHY: Now guaranteed to have derived fields
    return evaluateFormula(formula, enriched, parameters, manualData, contentAssets);
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
