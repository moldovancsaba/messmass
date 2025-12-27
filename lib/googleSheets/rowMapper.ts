// lib/googleSheets/rowMapper.ts
// WHAT: Bidirectional mapping between Google Sheet rows and MessMass events (v12.0.0)
// WHY: Convert sheet data to database format and vice versa
// HOW: Use column map to transform values with type-specific parsing

import { v4 as uuidv4 } from 'uuid';
import { SHEET_COLUMN_MAP, columnLetterToIndex } from './columnMap';
import { detectEventType, hasValidEventDate } from './eventTypeDetector';
import type { SheetColumnMap } from './types';

/**
 * WHAT: Convert sheet row to MessMass event object
 * WHY: Create or update events from sheet data
 * HOW: Map each column to corresponding event field using column map
 * 
 * @param row - Array of cell values from sheet row
 * @param columnMap - Column mapping configuration (default: SHEET_COLUMN_MAP)
 * @returns Partial event object ready for database insertion
 * @throws Error if row is invalid (missing required fields)
 */
export function rowToEvent(
  row: unknown[],
  columnMap: SheetColumnMap = SHEET_COLUMN_MAP
): Partial<any> {
  // WHAT: Validate row has required event date
  // WHY: Prevent creating events without dates
  if (!hasValidEventDate(row)) {
    throw new Error('Invalid row: Event Date (column F) is required and must be in YYYY-MM-DD format');
  }
  
  // WHAT: Detect event type and get event name
  // WHY: Determine event structure before mapping fields
  const detected = detectEventType(row);
  
  // WHAT: Initialize event object with stats sub-object
  // WHY: Match MessMass Project schema (all variables in stats)
  const event: any = {
    eventName: detected.eventName,
    stats: {},
    // Google Sheets sync metadata
    isSyncedFromSheet: true,
    googleSheetSource: 'sheet' as const,
    googleSheetModifiedAt: new Date().toISOString()
  };
  
  // WHAT: Map each column to event field
  // WHY: Transform sheet data to database format
  Object.entries(columnMap).forEach(([colLetter, colDef]) => {
    const colIndex = columnLetterToIndex(colLetter);
    const value = row[colIndex];
    
    // WHAT: Skip read-only computed columns (formulas)
    // WHY: These are calculated in MessMass, not imported
    if (colDef.computed) {
      return;
    }
    
    // WHAT: Skip empty values unless required
    // WHY: Don't overwrite existing data with nulls
    if (isEmptyValue(value) && !colDef.required) {
      return;
    }
    
    // WHAT: Parse value based on column type
    // WHY: Convert strings to appropriate types (numbers, dates, etc.)
    const parsed = parseValue(value, colDef.type);
    
    // WHAT: Assign to stats sub-object or top-level
    // WHY: Match MessMass schema (variables in stats, metadata at top level)
    if (colDef.field.startsWith('stats.')) {
      const statsKey = colDef.field.replace('stats.', '');
      event.stats[statsKey] = parsed;
    } else if (colDef.field === 'googleSheetUuid') {
      event.googleSheetUuid = parsed || undefined;
    } else if (colDef.field === 'eventDate') {
      event.eventDate = parsed;
    } else if (colDef.field === 'eventName') {
      // Already set from detectEventType
    } else if (colDef.field === 'lastModified') {
      // Store sheet's last modified time
      event.googleSheetModifiedAt = parsed || new Date().toISOString();
    } else if (colDef.field === 'notes') {
      // Optional notes field (not in core schema)
      if (parsed) {
        event.notes = parsed;
      }
    }
  });
  
  return event;
}

/**
 * WHAT: Convert MessMass event to sheet row array
 * WHY: Push event data back to sheet
 * HOW: Map event fields to row array positions using column map
 * 
 * @param event - MessMass event object
 * @param columnMap - Column mapping configuration (default: SHEET_COLUMN_MAP)
 * @returns Array of cell values (300 columns)
 */
export function eventToRow(
  event: any,
  columnMap: SheetColumnMap = SHEET_COLUMN_MAP
): unknown[] {
  // WHAT: Initialize row array with 300 empty values
  // WHY: Match sheet structure (columns A-ZZ to support comprehensive KYC variables)
  const row: unknown[] = new Array(300).fill('');
  
  // WHAT: Map each column from event fields
  // WHY: Transform database format to sheet format
  Object.entries(columnMap).forEach(([colLetter, colDef]) => {
    const colIndex = columnLetterToIndex(colLetter);
    let value: unknown;
    
    // WHAT: Handle special column mappings
    // WHY: Some columns have custom logic (UUID, formulas, etc.)
    if (colDef.field === 'googleSheetUuid') {
      // WHAT: Use existing UUID or generate new one
      // WHY: Track row identity for updates
      value = event.googleSheetUuid || uuidv4();
    } else if (colDef.field === 'eventName') {
      value = event.eventName;
    } else if (colDef.field === 'eventDate') {
      value = event.eventDate;
    } else if (colDef.field === 'lastModified') {
      value = event.updatedAt || new Date().toISOString();
    } else if (colDef.field === 'syncStatus') {
      value = 'Synced'; // Auto-updated status
    } else if (colDef.field === 'notes') {
      value = event.notes || '';
    } else if (colDef.field.startsWith('stats.')) {
      const statsKey = colDef.field.replace('stats.', '');
      value = event.stats?.[statsKey];
    } else if (colDef.field === 'partner1Name' || colDef.field === 'partner2Name' || colDef.field === 'eventTitle') {
      // WHAT: Skip partner/title columns on push
      // WHY: These are input columns, not output (event name is in column E)
      value = '';
    } else {
      value = undefined;
    }
    
    // WHAT: Handle computed columns (formulas)
    // WHY: Preserve spreadsheet formulas for All Images, Total Fans
    if (colDef.computed) {
      if (colLetter === 'M') {
        // All Images formula: =J2+K2+L2
        const rowNum = 2; // Will be replaced with actual row number by caller
        value = `=J${rowNum}+K${rowNum}+L${rowNum}`;
      } else if (colLetter === 'P') {
        // Total Fans formula: =N2+O2
        const rowNum = 2;
        value = `=N${rowNum}+O${rowNum}`;
      }
    }
    
    // WHAT: Format value for sheet
    // WHY: Convert types to sheet-compatible formats
    row[colIndex] = formatValue(value, colDef.type);
  });
  
  return row;
}

/**
 * WHAT: Parse value from sheet cell based on type
 * WHY: Convert strings to appropriate JavaScript types
 * HOW: Type-specific parsing with fallbacks
 */
function parseValue(value: unknown, type: string): any {
  if (isEmptyValue(value)) {
    return type === 'number' ? 0 : undefined;
  }
  
  switch (type) {
    case 'number':
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    
    case 'date':
      // Expect YYYY-MM-DD format
      return String(value).trim();
    
    case 'timestamp':
      // ISO 8601 format
      return String(value).trim();
    
    case 'uuid':
      return String(value).trim();
    
    case 'status':
      return String(value).trim();
    
    case 'text':
    case 'string':
    default:
      return String(value).trim();
  }
}

/**
 * WHAT: Format value for sheet cell based on type
 * WHY: Convert JavaScript types to sheet-compatible formats
 * HOW: Type-specific formatting
 */
function formatValue(value: unknown, type: string): unknown {
  if (value === null || value === undefined) {
    return '';
  }
  
  switch (type) {
    case 'number':
      return typeof value === 'number' ? value : 0;
    
    case 'date':
    case 'timestamp':
    case 'uuid':
    case 'status':
    case 'text':
    case 'string':
    default:
      return String(value);
  }
}

/**
 * WHAT: Check if value is empty (null, undefined, empty string)
 * WHY: Consistent empty value handling
 */
function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === '';
}

/**
 * WHAT: Update row array formulas with correct row number
 * WHY: Formulas reference specific row numbers (e.g., =J5+K5+L5 for row 5)
 * HOW: Replace placeholder row numbers in formulas
 * 
 * @param row - Row array with placeholder formulas
 * @param rowNumber - Actual row number in sheet (1-based)
 * @returns Row array with correct formula references
 */
export function updateRowFormulas(row: unknown[], rowNumber: number): unknown[] {
  return row.map(cell => {
    if (typeof cell === 'string' && cell.startsWith('=')) {
      // Replace =J2+K2+L2 with =J5+K5+L5 (for row 5)
      return cell.replace(/(\w)2/g, `$1${rowNumber}`);
    }
    return cell;
  });
}

/**
 * WHAT: Batch convert multiple rows to events
 * WHY: Efficient processing of entire sheet
 * HOW: Map each row, collect errors separately
 * 
 * @param rows - Array of sheet rows
 * @param columnMap - Column mapping configuration
 * @returns Object with successful events and errors
 */
export function rowsToEvents(
  rows: unknown[][],
  columnMap: SheetColumnMap = SHEET_COLUMN_MAP
): { events: any[]; errors: Array<{ row: number; error: string }> } {
  const events: any[] = [];
  const errors: Array<{ row: number; error: string }> = [];
  
  rows.forEach((row, index) => {
    try {
      const event = rowToEvent(row, columnMap);
      events.push(event);
    } catch (error) {
      errors.push({
        row: index + 2, // +2 because: +1 for 1-based, +1 for header row
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  return { events, errors };
}

/**
 * WHAT: Batch convert multiple events to rows
 * WHY: Efficient processing for push operations
 * HOW: Map each event to row array
 * 
 * @param events - Array of MessMass events
 * @param columnMap - Column mapping configuration
 * @returns Array of row arrays
 */
export function eventsToRows(
  events: any[],
  columnMap: SheetColumnMap = SHEET_COLUMN_MAP
): unknown[][] {
  return events.map(event => eventToRow(event, columnMap));
}
