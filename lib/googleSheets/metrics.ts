// lib/googleSheets/metrics.ts
// WHAT: Lightweight metrics helpers for Google Sheets integration
// WHY: Avoid misleading "rowCount" from gridProperties (capacity) when we need actual data rows
// HOW: Use values.get (via readSheetRows) which returns only populated rows within the requested range

import { readSheetRows } from './client';

export async function countSheetDataRows(params: {
  sheetId: string;
  sheetName?: string;
  startRow?: number;
}): Promise<number> {
  const { sheetId, sheetName = 'Events', startRow = 2 } = params;

  const rows = await readSheetRows(sheetId, sheetName, startRow);
  if (!Array.isArray(rows) || rows.length === 0) return 0;

  // Count rows that contain at least one non-empty cell.
  let count = 0;
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const hasAnyValue = row.some((cell) => String(cell ?? '').trim() !== '');
    if (hasAnyValue) count++;
  }
  return count;
}

