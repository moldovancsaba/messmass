// lib/googleSheetsClient.ts
// WHAT: Google Sheets API client for reading/writing event data to partner sheets
// WHY: Enable bidirectional sync between MessMass and Google Sheets
// USAGE: Import and use to append rows, read data, update cells

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// WHAT: Parse service account credentials from environment variables
// WHY: Authenticate with Google APIs using service account
const getAuthClient = (): JWT => {
  const email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

  if (!email || !privateKey) {
    throw new Error('Google Sheets credentials not configured in environment variables');
  }

  return new JWT({
    email,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
};

/**
 * WHAT: Append a row of event data to a Google Sheet
 * WHY: Automatically sync event creation to partner's sheet
 * @param sheetId - Google Sheet ID (from URL)
 * @param values - Array of values to append
 * @param range - Sheet range (default: "Events!A:Z")
 * @returns Appended row index or null on error
 */
export async function appendRowToSheet(
  sheetId: string,
  values: (string | number | null | undefined)[],
  range: string = 'Events!A:Z'
): Promise<number | null> {
  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // WHAT: Clean values - convert undefined/null to empty strings
    // WHY: Google Sheets API requires consistent data types
    const cleanedValues = values.map(v => v === null || v === undefined ? '' : v);

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [cleanedValues],
      },
    });

    // WHAT: Extract row number from response
    // WHY: Return row index for tracking and error handling
    const updatedRange = response.data.updates?.updatedRange;
    if (updatedRange) {
      const match = updatedRange.match(/!A(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    console.log(`✅ Appended row to sheet ${sheetId}: ${cleanedValues.join(', ')}`);
    return null;
  } catch (error) {
    console.error(`❌ Failed to append row to sheet ${sheetId}:`, error);
    return null;
  }
}

/**
 * WHAT: Read all data from a Google Sheet
 * WHY: Pull sheet data to sync back to MessMass
 * @param sheetId - Google Sheet ID
 * @param range - Sheet range (default: "Events!A:Z")
 * @returns Array of rows or empty array on error
 */
export async function readSheetData(
  sheetId: string,
  range: string = 'Events!A:Z'
): Promise<(string | number)[][]> {
  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const values = response.data.values || [];
    console.log(`✅ Read ${values.length} rows from sheet ${sheetId}`);
    return values;
  } catch (error) {
    console.error(`❌ Failed to read sheet ${sheetId}:`, error);
    return [];
  }
}

/**
 * WHAT: Update a specific cell in Google Sheet
 * WHY: Update sync status, timestamps, or other metadata
 * @param sheetId - Google Sheet ID
 * @param cell - Cell reference (e.g., "Events!AA2")
 * @param value - Value to set
 * @returns True if successful, false otherwise
 */
export async function updateCell(
  sheetId: string,
  cell: string,
  value: string | number
): Promise<boolean> {
  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: cell,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[value]],
      },
    });

    console.log(`✅ Updated cell ${cell} in sheet ${sheetId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update cell ${cell} in sheet ${sheetId}:`, error);
    return false;
  }
}

/**
 * WHAT: Get headers from Google Sheet
 * WHY: Map column positions to variable names for accurate data insertion
 * @param sheetId - Google Sheet ID
 * @param range - Sheet range with headers (default: "Events!1:1")
 * @returns Array of header names or empty array on error
 */
export async function getSheetHeaders(
  sheetId: string,
  range: string = 'Events!1:1'
): Promise<string[]> {
  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const headers = (response.data.values?.[0] || []) as string[];
    console.log(`✅ Retrieved ${headers.length} headers from sheet ${sheetId}`);
    return headers;
  } catch (error) {
    console.error(`❌ Failed to get headers from sheet ${sheetId}:`, error);
    return [];
  }
}

/**
 * WHAT: Extract sheet ID from Google Sheets URL
 * WHY: Convert user-friendly URL to API-compatible sheet ID
 * @param url - Google Sheets URL (e.g., https://docs.google.com/spreadsheets/d/...)
 * @returns Sheet ID or null if invalid URL
 */
export function extractSheetIdFromUrl(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}
