// lib/googleSheets/rowMapper.ts
// WHAT: Bidirectional mapping between Google Sheet rows and MessMass events (v12.0.0)
// WHY: Convert sheet data to database format and vice versa
// HOW: Use column map to transform values with type-specific parsing

import { v4 as uuidv4 } from 'uuid';
import { FIELD_DEFINITIONS } from './dynamicMapping';
import type { IndexBasedColumnMap } from './dynamicMapping';
import { detectEventType, hasValidEventDate } from './eventTypeDetector';
import type { SheetColumnMap } from './types';

// WHAT: Default empty map for backward compatibility
// WHY: Old code might pass undefined
// TODO: Remove this after full migration to index-based mapping
const DEFAULT_COLUMN_MAP: IndexBasedColumnMap = {};

/**
 * WHAT: Convert 0-based column index to Excel column letter
 * WHY: Google Sheets API and formulas use letters (A, B, Z, AA, AB, etc.)
 * HOW: Base-26 conversion
 * Examples: 0 -> A, 25 -> Z, 26 -> AA, 701 -> ZZ
 */
function indexToColumnLetter(index: number): string {
  let letter = '';
  let num = index;
  while (num >= 0) {
    letter = String.fromCharCode(65 + (num % 26)) + letter;
    num = Math.floor(num / 26) - 1;
  }
  return letter;
}

/**
 * WHAT: Convert sheet row to MessMass event object
 * WHY: Create or update events from sheet data
 * HOW: Map each column (by index) to corresponding event field
 * 
 * @param row - Array of cell values from sheet row
 * @param columnMap - Index-based column mapping (columnIndex -> fieldDef)
 * @returns Partial event object ready for database insertion
 * @throws Error if row is invalid (missing required fields)
 */
export function rowToEvent(
  row: unknown[],
  columnMap: IndexBasedColumnMap = DEFAULT_COLUMN_MAP
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
  
  // WHAT: Map each column (by index) to event field
  // WHY: Transform sheet data to database format
  // HOW: Iterate over actual column positions in the map
  Object.entries(columnMap).forEach(([colIndexStr, colDef]) => {
    const colIndex = parseInt(colIndexStr, 10);
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
    } else if (colDef.field === 'ventUrl') {
      // Vent URL is string type, handle separately
      event.stats['ventUrl'] = parsed;
    }
  });
  
  return event;
}

/**
 * WHAT: Convert MessMass event to sheet row array
 * WHY: Push event data back to sheet
 * HOW: Map event fields to row array positions using index-based map
 * 
 * @param event - MessMass event object
 * @param columnMap - Index-based column mapping (columnIndex -> fieldDef)
 * @returns Array of cell values (size = max column index + 1)
 */
export function eventToRow(
  event: any,
  columnMap: IndexBasedColumnMap = DEFAULT_COLUMN_MAP
): unknown[] {
  // WHAT: Calculate row array size dynamically
  // WHY: No more hardcoded 300 - use actual max column index
  // HOW: Find the maximum column index in the map and add 1
  const maxColIndex = Math.max(...Object.keys(columnMap).map(k => parseInt(k, 10)), 0);
  const row: unknown[] = new Array(maxColIndex + 1).fill('');
  
  // WHAT: Map each column from event fields
  // WHY: Transform database format to sheet format
  // HOW: Iterate by index, not by letter
  Object.entries(columnMap).forEach(([colIndexStr, colDef]) => {
    const colIndex = parseInt(colIndexStr, 10);
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
    } else if (colDef.field === 'partner1Name') {
      // WHAT: Populate Partner 1 for context
      // WHY: Allow identifying the partner in the sheet
      value = event.partner1Name || event.partnerName;
    } else if (colDef.field === 'partner2Name') {
      value = event.partner2Name;
    } else if (colDef.field === 'eventTitle') {
      // WHAT: Populate Event Title
      // WHY: This acts as the custom name input
      value = event.eventTitle || event.eventName;
    } else {
      value = undefined;
    }
    
    // WHAT: Handle computed columns (formulas)
    // WHY: Preserve spreadsheet formulas (dynamically generated from field definitions)
    // HOW: Find component fields in column map and reference their indices
    if (colDef.computed) {
      // WHAT: Generate formula based on field type
      // WHY: Each computed field has specific calculation logic
      // Example: allImages = remoteImages + hostessImages + selfies
      const rowNum = 2; // Will be replaced with actual row number by caller
      
      if (colDef.field === 'stats.allImages') {
        // Formula: remoteImages + hostessImages + selfies
        // Find indices of these fields in columnMap
        const remoteImagesIdx = Object.entries(columnMap).find(
          ([_, def]) => def.field === 'stats.remoteImages'
        )?.[0];
        const hostessImagesIdx = Object.entries(columnMap).find(
          ([_, def]) => def.field === 'stats.hostessImages'
        )?.[0];
        const selfiesIdx = Object.entries(columnMap).find(
          ([_, def]) => def.field === 'stats.selfies'
        )?.[0];
        
        if (remoteImagesIdx && hostessImagesIdx && selfiesIdx) {
          const r = indexToColumnLetter(parseInt(remoteImagesIdx, 10));
          const h = indexToColumnLetter(parseInt(hostessImagesIdx, 10));
          const s = indexToColumnLetter(parseInt(selfiesIdx, 10));
          value = `=${r}${rowNum}+${h}${rowNum}+${s}${rowNum}`;
        }
      } else if (colDef.field === 'stats.totalFans') {
        // Formula: remoteFans + stadium
        const remoteFansIdx = Object.entries(columnMap).find(
          ([_, def]) => def.field === 'stats.remoteFans'
        )?.[0];
        const stadiumIdx = Object.entries(columnMap).find(
          ([_, def]) => def.field === 'stats.stadium'
        )?.[0];
        
        if (remoteFansIdx && stadiumIdx) {
          const r = indexToColumnLetter(parseInt(remoteFansIdx, 10));
          const s = indexToColumnLetter(parseInt(stadiumIdx, 10));
          value = `=${r}${rowNum}+${s}${rowNum}`;
        }
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
 * @param columnMap - Index-based column mapping (columnIndex -> fieldDef)
 * @returns Object with successful events and errors
 */
export function rowsToEvents(
  rows: unknown[][],
  columnMap: IndexBasedColumnMap = DEFAULT_COLUMN_MAP
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
 * @param columnMap - Index-based column mapping (columnIndex -> fieldDef)
 * @returns Array of row arrays
 */
export function eventsToRows(
  events: any[],
  columnMap: IndexBasedColumnMap = DEFAULT_COLUMN_MAP
): unknown[][] {
  return events.map(event => eventToRow(event, columnMap));
}
