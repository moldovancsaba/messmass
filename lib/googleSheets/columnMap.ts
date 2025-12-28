// lib/googleSheets/columnMap.ts
// WHAT: Backward compatibility exports for column mapping
// WHY: All mapping is now dynamic and index-based (see dynamicMapping.ts)
// HOW: Re-export from dynamicMapping, provide utility functions

// Re-export FIELD_DEFINITIONS from dynamicMapping
import { FIELD_DEFINITIONS as DEFS } from './dynamicMapping';
export const FIELD_DEFINITIONS = DEFS;
export type { IndexBasedColumnMap } from './dynamicMapping';

/**
 * WHAT: Convert 0-based column index to Excel column letter
 * WHY: Utility for backwards compatibility and sheet operations
 * HOW: Base-26 conversion
 * Examples: 0 -> A, 25 -> Z, 26 -> AA
 */
export function columnIndexToLetter(index: number): string {
  let letter = '';
  let num = index;
  while (num >= 0) {
    letter = String.fromCharCode(65 + (num % 26)) + letter;
    num = Math.floor(num / 26) - 1;
  }
  return letter;
}

/**
 * WHAT: Convert Excel column letter to 0-based index
 * WHY: Utility for backwards compatibility
 * HOW: Reverse base-26 conversion
 * Examples: A -> 0, Z -> 25, AA -> 26
 */
export function columnLetterToIndex(letter: string): number {
  let index = 0;
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * DEPRECATED: SHEET_COLUMN_MAP is no longer used
 * WHY: All mapping is now dynamic based on row 1 headers
 */
export const SHEET_COLUMN_MAP = {};

/**
 * WHAT: Generate sheet header labels from field definitions
 * WHY: Headers must exactly match MongoDB field names
 * HOW: Strip 'stats.' prefix since MongoDB stores as { stats: { remoteImages: 123 } }
 */
export function generateSheetHeaderLabels(): Record<string, string> {
  const headers: Record<string, string> = {};
  Object.entries(DEFS).forEach(([key, def]) => {
    // Remove 'stats.' prefix from header name
    const headerName = def.field.startsWith('stats.') 
      ? def.field.replace('stats.', '')
      : def.field;
    // Use field name as key (for legacy compatibility)
    headers[key] = headerName;
  });
  return headers;
}

/**
 * DEPRECATED: SHEET_HEADER_LABELS is computed at runtime now
 * WHY: Headers are based on FIELD_DEFINITIONS
 */
export const SHEET_HEADER_LABELS: Record<string, string> = generateSheetHeaderLabels();

/**
 * WHAT: Get sheet range string for API calls
 * WHY: Utility function for building sheet A1 notation ranges
 * HOW: Return simple range that Google Sheets API understands
 * 
 * Examples:
 *   - getSheetRange('Events', 1) -> 'Events!A1:EK' (all rows starting from 1)
 *   - getSheetRange('Events', 2) -> 'Events!A2:EK' (all rows starting from 2)
 *   - getSheetRange('Events', 1, 5) -> 'Events!A1:EK5' (rows 1-5)
 */
export function getSheetRange(
  sheetName: string,
  startRow: number,
  endRow?: number
): string {
  if (endRow !== undefined) {
    // Specific row range: A1:EK5
    return `${sheetName}!A${startRow}:EK${endRow}`;
  } else {
    // Open-ended range: A1:EK (all rows from startRow onwards)
    // Google Sheets API handles this correctly
    return `${sheetName}!A${startRow}:EK`;
  }
}
