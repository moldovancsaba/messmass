// lib/variableRefs.ts
// SINGLE REFERENCE SYSTEM - NO MAPPINGS, NO TRANSLATIONS
// 
// WHAT: Generate reference tokens that are IDENTICAL to database field names
// WHY: If DB has "female", token is [female]. If DB has "Woman", token is [Woman].
// HOW: Token = field name. Zero transformation. Zero translation.
//
// RULE: Database field name = Token = Everything

export interface ReferenceSourceLike {
  name: string
  label?: string
  category?: string
  derived?: boolean
  type?: 'count' | 'percentage' | 'currency' | 'numeric' | 'text' | 'boolean' | 'date'
}

/**
 * ELIMINATED ALL MAPPINGS
 * Old system had:
 * - EXPLICIT_SUFFIX_MAP: 100+ lines of translations
 * - ALIAS_NORMALIZED_KEYS: More aliases
 * - normalizeSuffixGuess(): Complex transformation logic
 * 
 * New system:
 * - Token = Database field name (1 line)
 */

/**
 * SINGLE REFERENCE SYSTEM - buildReferenceToken
 * 
 * WHAT: Generate token that is IDENTICAL to database field name
 * WHY: Zero translation layer = zero confusion
 * HOW: Token = [fieldName]
 * 
 * EXAMPLES:
 * - Database field: "female" → Token: [female]
 * - Database field: "remoteFans" → Token: [remoteFans]
 * - Database field: "eventAttendees" → Token: [eventAttendees]
 * 
 * If database has "Woman" instead of "female", token would be [Woman]
 * 
 * @param source - Variable metadata with name field
 * @returns Token string: [fieldName]
 */
export function buildReferenceToken(source: ReferenceSourceLike): string {
  // SINGLE REFERENCE SYSTEM: Token = database field name
  return `[${source.name}]`;
}
