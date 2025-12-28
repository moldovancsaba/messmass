// lib/googleSheets/columnMappingVisualizer.ts
// WHAT: Visualize the exact mapping between sheet columns and database fields
// WHY: Debug partial syncs by seeing which columns are mapping to what
// HOW: Create a visual table showing the mapping

import { SHEET_COLUMN_MAP, SHEET_HEADER_LABELS } from './columnMap';
import type { SheetColumnMap } from './types';

/**
 * WHAT: Print a visual table of the column mapping
 * WHY: See exactly which sheet columns map to which database fields
 * HOW: Create formatted table with column letter, header, field name, type
 */
export function visualizeColumnMapping(columnMap: SheetColumnMap = SHEET_COLUMN_MAP): string {
  const lines: string[] = [];
  
  lines.push('═══════════════════════════════════════════════════════════════════════════════');
  lines.push('📊 GOOGLE SHEETS → MONGODB FIELD MAPPING');
  lines.push('═══════════════════════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push('Col │ Header Name                     │ Database Field               │ Type');
  lines.push('────┼─────────────────────────────────┼──────────────────────────────┼──────────');
  
  // Sort by column letter to show in order
  const sortedEntries = Object.entries(columnMap).sort(([colA], [colB]) => {
    // Convert column letters to numbers for sorting (A=0, Z=25, AA=26, etc.)
    const indexA = columnLetterToIndex(colA);
    const indexB = columnLetterToIndex(colB);
    return indexA - indexB;
  });
  
  sortedEntries.forEach(([colLetter, colDef]) => {
    const header = SHEET_HEADER_LABELS[colLetter] || '';
    const field = colDef.field || '';
    const type = colDef.type || '';
    const computed = colDef.computed ? ' [computed]' : '';
    const required = colDef.required ? ' [required]' : '';
    const readOnly = colDef.readOnly ? ' [read-only]' : '';
    
    const headerDisplay = header.padEnd(31);
    const fieldDisplay = field.padEnd(28);
    const typeDisplay = (type + computed + required + readOnly).padEnd(30);
    
    lines.push(`${colLetter.padEnd(3)} │ ${headerDisplay} │ ${fieldDisplay} │ ${typeDisplay}`);
  });
  
  lines.push('────┴─────────────────────────────────┴──────────────────────────────┴──────────');
  lines.push('');
  lines.push('📈 Summary:');
  lines.push(`   Total columns mapped: ${Object.keys(columnMap).length}`);
  
  const statsFields = Object.entries(columnMap).filter(([_, def]) => def.field.startsWith('stats.'));
  lines.push(`   Stats fields: ${statsFields.length}`);
  lines.push(`   Other fields: ${Object.keys(columnMap).length - statsFields.length}`);
  
  return lines.join('\n');
}

/**
 * WHAT: Convert column letter to numeric index
 * WHY: Sort columns in correct order (A, B, C...Z, AA, AB, etc)
 * HOW: Treat as base-26 number
 */
function columnLetterToIndex(letter: string): number {
  let index = 0;
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * WHAT: Show mapping for a specific row of data
 * WHY: See which values from the sheet map to which database fields
 * HOW: Read row, display each column's value and its mapped destination
 */
export function visualizeRowMapping(
  row: unknown[],
  columnMap: SheetColumnMap = SHEET_COLUMN_MAP
): string {
  const lines: string[] = [];
  
  lines.push('\n═══════════════════════════════════════════════════════════════════════════════');
  lines.push('📋 SAMPLE ROW MAPPING (First Data Row)');
  lines.push('═══════════════════════════════════════════════════════════════════════════════');
  lines.push('');
  
  const sortedEntries = Object.entries(columnMap).sort(([colA], [colB]) => {
    const indexA = columnLetterToIndex(colA);
    const indexB = columnLetterToIndex(colB);
    return indexA - indexB;
  });
  
  sortedEntries.forEach(([colLetter, colDef]) => {
    const index = columnLetterToIndex(colLetter);
    const value = row[index];
    const header = SHEET_HEADER_LABELS[colLetter] || '';
    const field = colDef.field;
    
    // Format the value for display
    let displayValue = '';
    if (value === null || value === undefined) {
      displayValue = '[empty]';
    } else if (typeof value === 'string' && value.length > 30) {
      displayValue = value.substring(0, 27) + '...';
    } else {
      displayValue = String(value);
    }
    
    const headerDisplay = header.padEnd(30);
    const fieldDisplay = field.padEnd(30);
    const valueDisplay = displayValue.padEnd(20);
    
    lines.push(`${colLetter.padEnd(3)} │ ${headerDisplay} │ ${fieldDisplay} │ ${valueDisplay}`);
  });
  
  lines.push('');
  
  return lines.join('\n');
}

/**
 * WHAT: Create a mapping for stats fields showing which ones are populated
 * WHY: See which stats variables are actually being set from the sheet
 * HOW: Analyze row data and show populated vs empty stats fields
 */
export function analyzeStatsMapping(
  row: unknown[],
  columnMap: SheetColumnMap = SHEET_COLUMN_MAP
): { populated: Array<{col: string; field: string; value: unknown}>; empty: Array<{col: string; field: string}> } {
  const populated: Array<{col: string; field: string; value: unknown}> = [];
  const empty: Array<{col: string; field: string}> = [];
  
  Object.entries(columnMap).forEach(([colLetter, colDef]) => {
    if (!colDef.field.startsWith('stats.')) {
      return;
    }
    
    const index = columnLetterToIndex(colLetter);
    const value = row[index];
    const isEmpty = value === null || value === undefined || String(value).trim() === '';
    
    if (isEmpty) {
      empty.push({
        col: colLetter,
        field: colDef.field
      });
    } else {
      populated.push({
        col: colLetter,
        field: colDef.field,
        value
      });
    }
  });
  
  return { populated, empty };
}
