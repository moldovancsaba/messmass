// lib/googleSheets/client.ts
// WHAT: Google Sheets API client wrapper (v12.0.0)
// WHY: Centralized authentication and sheet operations
// HOW: Uses googleapis with service account authentication

import { google } from 'googleapis';
import type { sheets_v4 } from 'googleapis';
import { getSheetRange } from './columnMap';

/**
 * WHAT: Initialize Google Sheets API client
 * WHY: Authenticate using service account credentials
 * HOW: Parse private key from environment variable
 * 
 * REQUIREMENTS:
 * - GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL
 * - GOOGLE_SHEETS_PRIVATE_KEY (base64 encoded or raw)
 * - GOOGLE_SHEETS_CLIENT_EMAIL (usually same as service account email)
 */
export function createSheetsClient(): sheets_v4.Sheets {
  const email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

  if (!email || !privateKey) {
    throw new Error(
      'Missing Google Sheets credentials. Set GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY in environment variables.'
    );
  }

  // Parse private key (handle base64 encoding if used)
  let decodedKey = privateKey;
  try {
    // If key is base64 encoded, decode it
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      decodedKey = Buffer.from(privateKey, 'base64').toString('utf-8');
    }
  } catch (error) {
    console.error('Failed to decode private key:', error);
  }

  // Create JWT auth client
  const auth = new google.auth.JWT({
    email,
    key: decodedKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  // Return authenticated Sheets API client
  return google.sheets({ version: 'v4', auth });
}

/**
 * WHAT: Test Google Sheets API connection
 * WHY: Verify credentials before syncing
 * HOW: Attempt to fetch sheet metadata
 */
export async function testConnection(sheetId: string): Promise<{
  success: boolean;
  error?: string;
  sheetTitle?: string;
  rowCount?: number;
  columnCount?: number;
  headerLabels?: string[];
}> {
  try {
    const sheets = createSheetsClient();
    const response = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    
    // Get first sheet properties
    const sheetProps = response.data.sheets?.[0]?.properties;
    const gridProps = sheetProps?.gridProperties;

    // Fetch header row to verify access and get labels
    let headerLabels: string[] = [];
    try {
      const headerRow = await readSheetRows(sheetId, sheetProps?.title || 'Events', 1);
      if (headerRow.length > 0 && Array.isArray(headerRow[0])) {
        headerLabels = headerRow[0] as string[];
      }
    } catch (e) {
      // Ignore header fetch error, basic connection is success
    }

    return {
      success: true,
      sheetTitle: response.data.properties?.title || undefined,
      rowCount: gridProps?.rowCount || 0,
      columnCount: gridProps?.columnCount || 0,
      headerLabels
    };
  } catch (error: unknown) {
    console.error('Google Sheets connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * WHAT: Read all rows from sheet
 * WHY: Fetch event data for sync
 * HOW: Uses A1 notation range (e.g., "Events!A2:AP100")
 * 
 * @param sheetId - Google Sheet ID (from URL)
 * @param sheetName - Sheet tab name (default: "Events")
 * @param startRow - First data row (default: 2, assuming row 1 is header)
 * @returns Array of row arrays (each row is array of cell values)
 */
export async function readSheetRows(
  sheetId: string,
  sheetName: string = 'Events',
  startRow: number = 2
): Promise<unknown[][]> {
  try {
    const sheets = createSheetsClient();
    const range = getSheetRange(sheetName, startRow);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range
    });

    return (response.data.values as unknown[][]) || [];
  } catch (error: unknown) {
    console.error('Failed to read sheet rows:', error);
    throw new Error(
      `Failed to read sheet: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * WHAT: Read single row by row number
 * WHY: Fetch specific event for individual sync
 * HOW: Uses exact row range (e.g., "Events!A5:AP5")
 */
export async function readSheetRow(
  sheetId: string,
  sheetName: string,
  rowNumber: number
): Promise<unknown[] | null> {
  try {
    const sheets = createSheetsClient();
    const range = getSheetRange(sheetName, rowNumber, rowNumber);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range
    });

    const rows = (response.data.values as unknown[][]) || [];
    return rows.length > 0 ? rows[0] : null;
  } catch (error: unknown) {
    console.error(`Failed to read sheet row ${rowNumber}:`, error);
    throw new Error(
      `Failed to read row: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * WHAT: Write multiple rows to sheet
 * WHY: Push events from MessMass to sheet
 * HOW: Uses batchUpdate for efficient multi-row writes
 * 
 * @param sheetId - Google Sheet ID
 * @param sheetName - Sheet tab name
 * @param startRow - First row to write (e.g., 2 for first data row)
 * @param rows - Array of row arrays to write
 */
export async function writeSheetRows(
  sheetId: string,
  sheetName: string,
  startRow: number,
  rows: unknown[][]
): Promise<void> {
  try {
    const sheets = createSheetsClient();
    const range = getSheetRange(sheetName, startRow);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED', // Parse formulas, dates, numbers
      requestBody: {
        values: rows
      }
    });
  } catch (error: unknown) {
    console.error('Failed to write sheet rows:', error);
    throw new Error(
      `Failed to write rows: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * WHAT: Update single row by row number
 * WHY: Push individual event changes to sheet
 * HOW: Writes to specific row range
 */
export async function updateSheetRow(
  sheetId: string,
  sheetName: string,
  rowNumber: number,
  rowData: unknown[]
): Promise<void> {
  try {
    const sheets = createSheetsClient();
    const range = getSheetRange(sheetName, rowNumber, rowNumber);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData]
      }
    });
  } catch (error: unknown) {
    console.error(`Failed to update sheet row ${rowNumber}:`, error);
    throw new Error(
      `Failed to update row: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * WHAT: Append new rows to end of sheet
 * WHY: Add new events without overwriting existing
 * HOW: Uses append API (finds first empty row)
 */
export async function appendSheetRows(
  sheetId: string,
  sheetName: string,
  rows: unknown[][]
): Promise<void> {
  try {
    const sheets = createSheetsClient();
    const range = `${sheetName}!A:AP`; // Append to columns A-AP
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows
      }
    });
  } catch (error: unknown) {
    console.error('Failed to append sheet rows:', error);
    throw new Error(
      `Failed to append rows: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * WHAT: Find row number by UUID in column A
 * WHY: Locate event row for updates
 * HOW: Search column A for matching UUID
 * 
 * @returns Row number (1-based) or null if not found
 */
export async function findRowByUuid(
  sheetId: string,
  sheetName: string,
  uuid: string
): Promise<number | null> {
  try {
    const sheets = createSheetsClient();
    const range = `${sheetName}!A:A`; // Search entire UUID column
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range
    });

    const values = (response.data.values as string[][]) || [];
    
    // Search for UUID (case-insensitive)
    const rowIndex = values.findIndex(
      row => row[0]?.toLowerCase() === uuid.toLowerCase()
    );
    
    // Convert 0-based index to 1-based row number
    return rowIndex >= 0 ? rowIndex + 1 : null;
  } catch (error: unknown) {
    console.error('Failed to find row by UUID:', error);
    throw new Error(
      `Failed to find row: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * WHAT: Get sheet metadata (title, ID, tab color)
 * WHY: Display sheet info in UI
 * HOW: Fetch spreadsheet properties
 */
export async function getSheetMetadata(sheetId: string): Promise<{
  title: string;
  sheetCount: number;
  sheetNames: string[];
}> {
  try {
    const sheets = createSheetsClient();
    const response = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    
    const sheetNames = response.data.sheets?.map(
      sheet => sheet.properties?.title || 'Untitled'
    ) || [];
    
    return {
      title: response.data.properties?.title || 'Untitled',
      sheetCount: response.data.sheets?.length || 0,
      sheetNames
    };
  } catch (error: unknown) {
    console.error('Failed to get sheet metadata:', error);
    throw new Error(
      `Failed to get metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * WHAT: Clear range (delete values but keep formatting)
 * WHY: Reset sheet section without deleting rows
 * HOW: Uses clear API
 */
export async function clearSheetRange(
  sheetId: string,
  sheetName: string,
  startRow: number,
  endRow?: number
): Promise<void> {
  try {
    const sheets = createSheetsClient();
    const range = getSheetRange(sheetName, startRow, endRow);
    
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range
    });
  } catch (error: unknown) {
    console.error('Failed to clear sheet range:', error);
    throw new Error(
      `Failed to clear range: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
