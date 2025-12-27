// lib/googleSheets/columnMap.ts
// WHAT: Hardcoded column mapping for Google Sheets integration (v12.0.0)
// WHY: Define how sheet columns map to MessMass fields
// HOW: Maps column letters (A, B, C) to field paths (eventName, stats.remoteImages)

import type { SheetColumnMap } from './types';

/**
 * WHAT: Complete column mapping configuration
 * WHY: Single source of truth for sheet structure
 * HOW: Each key is column letter, value defines field mapping
 * 
 * Phase 1: Hardcoded mapping (40+ columns)
 * Phase 7: Add UI editor for custom mappings
 */
export const SHEET_COLUMN_MAP: SheetColumnMap = {
  // System columns (MessMass internal)
  A: { field: 'googleSheetUuid', type: 'uuid', readOnly: true },
  
  // Partner Context (determines event type)
  B: { field: 'partner1Name', type: 'string', required: false },
  C: { field: 'partner2Name', type: 'string', required: false },
  D: { field: 'eventTitle', type: 'string', required: false },
  E: { field: 'eventName', type: 'string', readOnly: true },
  
  // Event Metadata
  F: { field: 'eventDate', type: 'date', required: true },
  G: { field: 'stats.eventAttendees', type: 'number' },
  H: { field: 'stats.eventResultHome', type: 'number' },
  I: { field: 'stats.eventResultVisitor', type: 'number' },
  
  // Stats - Images
  J: { field: 'stats.remoteImages', type: 'number' },
  K: { field: 'stats.hostessImages', type: 'number' },
  L: { field: 'stats.selfies', type: 'number' },
  M: { field: 'stats.allImages', type: 'number', computed: true },
  
  // Stats - Fans
  N: { field: 'stats.remoteFans', type: 'number' },
  O: { field: 'stats.stadium', type: 'number' },
  P: { field: 'stats.totalFans', type: 'number', computed: true },
  
  // Stats - Demographics
  Q: { field: 'stats.female', type: 'number' },
  R: { field: 'stats.male', type: 'number' },
  S: { field: 'stats.genAlpha', type: 'number' },
  T: { field: 'stats.genYZ', type: 'number' },
  U: { field: 'stats.genX', type: 'number' },
  V: { field: 'stats.boomer', type: 'number' },
  
  // Stats - Merchandise
  W: { field: 'stats.merched', type: 'number' },
  X: { field: 'stats.jersey', type: 'number' },
  Y: { field: 'stats.scarf', type: 'number' },
  Z: { field: 'stats.flags', type: 'number' },
  AA: { field: 'stats.baseballCap', type: 'number' },
  AB: { field: 'stats.other', type: 'number' },
  
  // Stats - Visits
  AC: { field: 'stats.visitQrCode', type: 'number' },
  AD: { field: 'stats.visitShortUrl', type: 'number' },
  AE: { field: 'stats.visitWeb', type: 'number' },
  AF: { field: 'stats.visitFacebook', type: 'number' },
  AG: { field: 'stats.visitInstagram', type: 'number' },
  AH: { field: 'stats.visitYoutube', type: 'number' },
  AI: { field: 'stats.visitTiktok', type: 'number' },
  AJ: { field: 'stats.visitX', type: 'number' },
  AK: { field: 'stats.visitTrustpilot', type: 'number' },
  
  // Stats - Bitly
  AL: { field: 'stats.totalBitlyClicks', type: 'number' },
  AM: { field: 'stats.uniqueBitlyClicks', type: 'number' },
  
  // Stats - Extended KYC (Added v12.1.0)
  AQ: { field: 'stats.approvedImages', type: 'number' },
  AR: { field: 'stats.rejectedImages', type: 'number' },
  AS: { field: 'stats.socialVisit', type: 'number' },
  AT: { field: 'stats.eventValuePropositionVisited', type: 'number' },
  AU: { field: 'stats.eventValuePropositionPurchases', type: 'number' },
  AV: { field: 'stats.bitlyMobileClicks', type: 'number' },
  AW: { field: 'stats.bitlyDesktopClicks', type: 'number' },
  AX: { field: 'stats.bitlyTabletClicks', type: 'number' },
  
  // Sync metadata
  AN: { field: 'lastModified', type: 'timestamp', readOnly: false },
  AO: { field: 'syncStatus', type: 'status', readOnly: true },
  AP: { field: 'notes', type: 'text', required: false }
};

/**
 * WHAT: Header row labels for template generation
 * WHY: User-friendly column names in sample sheet
 */
export const SHEET_HEADER_LABELS: Record<string, string> = {
  A: 'MessMass UUID',
  B: 'Partner 1 (Home)',
  C: 'Partner 2 (Away)',
  D: 'Event Title (Custom)',
  E: 'Event Name (Auto)',
  F: 'Event Date',
  G: 'Event Attendees',
  H: 'Event Result Home',
  I: 'Event Result Visitor',
  J: 'Remote Images',
  K: 'Hostess Images',
  L: 'Selfies',
  M: 'All Images',
  N: 'Remote Fans',
  O: 'Stadium Fans',
  P: 'Total Fans',
  Q: 'Female',
  R: 'Male',
  S: 'Gen Alpha',
  T: 'Gen YZ',
  U: 'Gen X',
  V: 'Boomer',
  W: 'Merched',
  X: 'Jersey',
  Y: 'Scarf',
  Z: 'Flags',
  AA: 'Baseball Cap',
  AB: 'Other Merch',
  AC: 'Visit QR Code',
  AD: 'Visit Short URL',
  AE: 'Visit Web',
  AF: 'Visit Facebook',
  AG: 'Visit Instagram',
  AH: 'Visit YouTube',
  AI: 'Visit TikTok',
  AJ: 'Visit X',
  AK: 'Visit Trustpilot',
  AL: 'Total Bitly Clicks',
  AM: 'Unique Bitly Clicks',
  AN: 'Last Modified',
  AO: 'Sync Status',
  AP: 'Notes',
  AQ: 'Approved Images',
  AR: 'Rejected Images',
  AS: 'Social Visits',
  AT: 'Prop. Visited',
  AU: 'Prop. Purchases',
  AV: 'Bitly Mobile',
  AW: 'Bitly Desktop',
  AX: 'Bitly Tablet'
};

/**
 * WHAT: Convert column letter to index (A=0, Z=25, AA=26)
 * WHY: Google Sheets API uses zero-based indices
 */
export function columnLetterToIndex(letter: string): number {
  let index = 0;
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * WHAT: Convert index to column letter (0=A, 25=Z, 26=AA)
 * WHY: Convert numeric indices back to letters
 */
export function columnIndexToLetter(index: number): string {
  let letter = '';
  let num = index + 1;
  while (num > 0) {
    const remainder = (num - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    num = Math.floor((num - 1) / 26);
  }
  return letter;
}

/**
 * WHAT: Get column range for entire sheet
 * WHY: Efficient batch read/write operations
 */
export function getSheetRange(sheetName: string, startRow: number, endRow?: number): string {
  const firstCol = 'A';
  const lastCol = 'CV'; // Support up to 100 columns (A..CV) to future-proof headers/data
  if (endRow) {
    return `${sheetName}!${firstCol}${startRow}:${lastCol}${endRow}`;
  }
  // If no endRow specified, use a large number (Google Sheets will handle empty rows)
  // Format: SheetName!A1:AP1000000
  return `${sheetName}!${firstCol}${startRow}:${lastCol}${startRow + 100000}`;
}

/**
 * WHAT: Default Google Sheet configuration
 * WHY: Consistent defaults for new connections
 */
export const DEFAULT_SHEET_CONFIG = {
  sheetName: 'Events',
  uuidColumn: 'A',
  headerRow: 1,
  dataStartRow: 2,
  syncMode: 'manual' as const,
  columnMap: SHEET_COLUMN_MAP
};
