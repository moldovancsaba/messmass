// lib/googleSheets/dynamicMapping.ts
// WHAT: Dynamic column mapping based on actual sheet headers
// WHY: Handle sheets with different column orders or offsets automatically
// HOW: Read first row, match header names to field definitions, generate mapping at runtime

import type { SheetColumnDefinition } from './types';

// WHAT: Index-based column map (columnIndex -> fieldDef)
// WHY: Eliminate hardcoded column letters, use actual positions instead
export type IndexBasedColumnMap = Record<number, SheetColumnDefinition>;

/**
 * WHAT: Standard field definitions with header name variations
 * WHY: Allow multiple header names to map to same field (case-insensitive matching)
 * HOW: Exact list of all supported fields in MessMass
 * EXPORTED: Used by columnMap.ts and other modules
 */
export const FIELD_DEFINITIONS: Record<string, SheetColumnDefinition> = {
  'googleSheetUuid': { field: 'googleSheetUuid', type: 'uuid', readOnly: true },
  'partner1Name': { field: 'partner1Name', type: 'string', required: false },
  'partner2Name': { field: 'partner2Name', type: 'string', required: false },
  'eventTitle': { field: 'eventTitle', type: 'string', required: false },
  'eventName': { field: 'eventName', type: 'string', readOnly: true },
  'eventDate': { field: 'eventDate', type: 'date', required: true },
  'totalGames': { field: 'stats.totalGames', type: 'number' },
  'gamesWithoutAds': { field: 'stats.gamesWithoutAds', type: 'number' },
  'gamesWithAds': { field: 'stats.gamesWithAds', type: 'number' },
  'gamesWithoutSlideshow': { field: 'stats.gamesWithoutSlideshow', type: 'number' },
  'gamesWithSlideshow': { field: 'stats.gamesWithSlideshow', type: 'number' },
  'gamesWithoutTech': { field: 'stats.gamesWithoutTech', type: 'number' },
  'gamesWithSelfie': { field: 'stats.gamesWithSelfie', type: 'number' },
  'gamesWithoutSelfie': { field: 'stats.gamesWithoutSelfie', type: 'number' },
  'eventAttendees': { field: 'stats.eventAttendees', type: 'number' },
  'uniqueUsers': { field: 'stats.uniqueUsers', type: 'number' },
  'newUsersAdded': { field: 'stats.newUsersAdded', type: 'number' },
  'userRegistration': { field: 'stats.userRegistration', type: 'number' },
  'userRegistrationHostess': { field: 'stats.userRegistrationHostess', type: 'number' },
  'totalFans': { field: 'stats.totalFans', type: 'number', computed: true },
  'marketingOptin': { field: 'stats.marketingOptin', type: 'number' },
  'allImages': { field: 'stats.allImages', type: 'number', computed: true },
  'female': { field: 'stats.female', type: 'number' },
  'male': { field: 'stats.male', type: 'number' },
  'selfies': { field: 'stats.selfies', type: 'number' },
  'remoteImages': { field: 'stats.remoteImages', type: 'number' },
  'hostessImages': { field: 'stats.hostessImages', type: 'number' },
  'remoteFans': { field: 'stats.remoteFans', type: 'number' },
  'stadium': { field: 'stats.stadium', type: 'number' },
  'visitQrCode': { field: 'stats.visitQrCode', type: 'number' },
  'ventQr': { field: 'stats.ventQr', type: 'number' },
  'bitlyClicksFromQRCode': { field: 'stats.bitlyClicksFromQRCode', type: 'number' },
  'qrscanIphone': { field: 'stats.qrscanIphone', type: 'number' },
  'qrscanAndroid': { field: 'stats.qrscanAndroid', type: 'number' },
  'visitShortUrl': { field: 'stats.visitShortUrl', type: 'number' },
  'ventUrl': { field: 'stats.ventUrl', type: 'string' },
  'directUrl': { field: 'stats.directUrl', type: 'number' },
  'ventCtaEmail': { field: 'stats.ventCtaEmail', type: 'number' },
  'ventFacebook': { field: 'stats.ventFacebook', type: 'number' },
  'ventGoogle': { field: 'stats.ventGoogle', type: 'number' },
  'ventInstagram': { field: 'stats.ventInstagram', type: 'number' },
  'bitlyClicksFromFacebook': { field: 'stats.bitlyClicksFromFacebook', type: 'number' },
  'bitlyClicksFromInstagram': { field: 'stats.bitlyClicksFromInstagram', type: 'number' },
  'bitlyClicksFromTwitter': { field: 'stats.bitlyClicksFromTwitter', type: 'number' },
  'bitlyClicksFromLinkedIn': { field: 'stats.bitlyClicksFromLinkedIn', type: 'number' },
  'bitlyClicksFromGoogle': { field: 'stats.bitlyClicksFromGoogle', type: 'number' },
  'socialVisit': { field: 'stats.socialVisit', type: 'number' },
  'visitCta1': { field: 'stats.visitCta1', type: 'number' },
  'visitCta2': { field: 'stats.visitCta2', type: 'number' },
  'visitCta3': { field: 'stats.visitCta3', type: 'number' },
  'outdoor': { field: 'stats.outdoor', type: 'number' },
  'eventResultHome': { field: 'stats.eventResultHome', type: 'number' },
  'eventResultVisitor': { field: 'stats.eventResultVisitor', type: 'number' },
  'eventTicketPurchases': { field: 'stats.eventTicketPurchases', type: 'number' },
  'approvedImages': { field: 'stats.approvedImages', type: 'number' },
  'rejectedImages': { field: 'stats.rejectedImages', type: 'number' },
  'genAlpha': { field: 'stats.genAlpha', type: 'number' },
  'genYZ': { field: 'stats.genYZ', type: 'number' },
  'genX': { field: 'stats.genX', type: 'number' },
  'boomer': { field: 'stats.boomer', type: 'number' },
  'merched': { field: 'stats.merched', type: 'number' },
  'jersey': { field: 'stats.jersey', type: 'number' },
  'scarf': { field: 'stats.scarf', type: 'number' },
  'flags': { field: 'stats.flags', type: 'number' },
  'baseballCap': { field: 'stats.baseballCap', type: 'number' },
  'Caps': { field: 'stats.Caps', type: 'number' },
  'specialMerch': { field: 'stats.specialMerch', type: 'number' },
  'other': { field: 'stats.other', type: 'number' },
  'visitWeb': { field: 'stats.visitWeb', type: 'number' },
  'visitFacebook': { field: 'stats.visitFacebook', type: 'number' },
  'visitInstagram': { field: 'stats.visitInstagram', type: 'number' },
  'visitYoutube': { field: 'stats.visitYoutube', type: 'number' },
  'visitTiktok': { field: 'stats.visitTiktok', type: 'number' },
  'visitX': { field: 'stats.visitX', type: 'number' },
  'visitTrustpilot': { field: 'stats.visitTrustpilot', type: 'number' },
  'ventAndroid': { field: 'stats.ventAndroid', type: 'number' },
  'ventIos': { field: 'stats.ventIos', type: 'number' },
  'ventCtaPopup': { field: 'stats.ventCtaPopup', type: 'number' },
  'countriesReached': { field: 'stats.countriesReached', type: 'number' },
  'walletPasses': { field: 'stats.walletPasses', type: 'number' },
  'topCountryone': { field: 'stats.topCountryone', type: 'string' },
  'topCountrytwo': { field: 'stats.topCountrytwo', type: 'string' },
  'topCountrythree': { field: 'stats.topCountrythree', type: 'string' },
  'topCountryfour': { field: 'stats.topCountryfour', type: 'string' },
  'topCountryfive': { field: 'stats.topCountryfive', type: 'string' },
  'totalBitlyClicks': { field: 'stats.totalBitlyClicks', type: 'number' },
  'uniqueBitlyClicks': { field: 'stats.uniqueBitlyClicks', type: 'number' },
  'bitlyMobileClicks': { field: 'stats.bitlyMobileClicks', type: 'number' },
  'bitlyDesktopClicks': { field: 'stats.bitlyDesktopClicks', type: 'number' },
  'bitlyTabletClicks': { field: 'stats.bitlyTabletClicks', type: 'number' },
  'bitlyTopCountry': { field: 'stats.bitlyTopCountry', type: 'string' },
  'bitlyClicksFromInstagramApp': { field: 'stats.bitlyClicksFromInstagramApp', type: 'number' },
  'bitlyClicksFromFacebookMobile': { field: 'stats.bitlyClicksFromFacebookMobile', type: 'number' },
  'bitlyClicksFromDirect': { field: 'stats.bitlyClicksFromDirect', type: 'number' },
  'reportImage1': { field: 'stats.reportImage1', type: 'string' },
  'reportImage2': { field: 'stats.reportImage2', type: 'string' },
  'reportImage3': { field: 'stats.reportImage3', type: 'string' },
  'reportImage4': { field: 'stats.reportImage4', type: 'string' },
  'reportImage5': { field: 'stats.reportImage5', type: 'string' },
  'reportImage6': { field: 'stats.reportImage6', type: 'string' },
  'reportImage7': { field: 'stats.reportImage7', type: 'string' },
  'reportImage8': { field: 'stats.reportImage8', type: 'string' },
  'reportImage9': { field: 'stats.reportImage9', type: 'string' },
  'reportImage10': { field: 'stats.reportImage10', type: 'string' },
  'reportImage11': { field: 'stats.reportImage11', type: 'string' },
  'reportImage12': { field: 'stats.reportImage12', type: 'string' },
  'reportImage13': { field: 'stats.reportImage13', type: 'string' },
  'reportImage14': { field: 'stats.reportImage14', type: 'string' },
  'reportImage15': { field: 'stats.reportImage15', type: 'string' },
  'reportImage16': { field: 'stats.reportImage16', type: 'string' },
  'reportImage17': { field: 'stats.reportImage17', type: 'string' },
  'reportImage18': { field: 'stats.reportImage18', type: 'string' },
  'reportImage19': { field: 'stats.reportImage19', type: 'string' },
  'reportImage20': { field: 'stats.reportImage20', type: 'string' },
  'reportText1': { field: 'stats.reportText1', type: 'string' },
  'reportText2': { field: 'stats.reportText2', type: 'string' },
  'reportText3': { field: 'stats.reportText3', type: 'string' },
  'reportText4': { field: 'stats.reportText4', type: 'string' },
  'reportText5': { field: 'stats.reportText5', type: 'string' },
  'reportText6': { field: 'stats.reportText6', type: 'string' },
  'reportText7': { field: 'stats.reportText7', type: 'string' },
  'reportText8': { field: 'stats.reportText8', type: 'string' },
  'reportText9': { field: 'stats.reportText9', type: 'string' },
  'reportText10': { field: 'reportText10', type: 'string' },
  'reportText11': { field: 'stats.reportText11', type: 'string' },
  'reportText12': { field: 'stats.reportText12', type: 'string' },
  'reportText13': { field: 'stats.reportText13', type: 'string' },
  'reportText14': { field: 'stats.reportText14', type: 'string' },
  'reportText15': { field: 'stats.reportText15', type: 'string' },
  'reportText16': { field: 'stats.reportText16', type: 'string' },
  'reportText17': { field: 'stats.reportText17', type: 'string' },
  'reportText18': { field: 'stats.reportText18', type: 'string' },
  'reportText19': { field: 'stats.reportText19', type: 'string' },
  'reportText20': { field: 'stats.reportText20', type: 'string' },
  'lastModified': { field: 'lastModified', type: 'timestamp', readOnly: false },
  'syncStatus': { field: 'syncStatus', type: 'status', readOnly: true },
  'notes': { field: 'notes', type: 'text', required: false },
};

/**
 * WHAT: Generate index-based column mapping from actual sheet headers
 * WHY: Handle sheets with any column order automatically without hardcoding letters
 * HOW: Match header names to field definitions, return { 0: fieldDef, 1: fieldDef, ... }
 * 
 * @param headerRow - First row of sheet containing column headers
 * @returns IndexBasedColumnMap with column indices instead of letters
 */
export function generateDynamicColumnMap(headerRow: string[]): IndexBasedColumnMap {
  const dynamicMap: IndexBasedColumnMap = {};
  
  headerRow.forEach((headerName, columnIndex) => {
    if (!headerName || headerName.trim() === '') {
      return; // Skip empty headers
    }
    
    // WHAT: Convert header to camelCase for matching
    // WHY: Header could be "Remote Images" or bare field name "remoteImages"
    const normalizedHeader = headerToFieldName(headerName);
    const fieldDef = FIELD_DEFINITIONS[normalizedHeader];
    
    if (fieldDef) {
      // WHAT: Map by column INDEX not letter
      // WHY: No more hardcoded letters, just actual positions
      // Example: column 0 → googleSheetUuid, column 5 → eventDate, column 25 → remoteImages
      dynamicMap[columnIndex] = fieldDef;
      
      console.log(`✓ Mapped "${headerName}" → column ${columnIndex} → ${fieldDef.field}`);
    } else {
      console.warn(`⚠️ Unknown header: "${headerName}" (column ${columnIndex})`);
    }
  });
  
  return dynamicMap;
}

/**
 * WHAT: Convert header name to camelCase field name
 * WHY: Normalize header text for matching - handle both formatted and bare field names
 * HOW: If already camelCase, use as-is; if formatted text, convert to camelCase
 */
function headerToFieldName(header: string): string {
  // WHAT: Return as-is if it looks like a bare field name (no spaces, already camelCase)
  // WHY: Sheet headers are already the exact field names (googleSheetUuid, remoteImages, etc.)
  // HOW: Check if header contains spaces - if not, it's probably a bare field name
  if (!header.includes(' ') && !header.includes('(') && !header.includes('-')) {
    return header; // Already in correct format: googleSheetUuid, remoteImages, etc.
  }
  
  // Handle formatted text headers (if any exist)
  // "Remote Images" → "remoteImages"
  // "Partner 1 (Home)" → "partner1Name"
  if (header === 'MessMass UUID') return 'googleSheetUuid';
  if (header === 'Partner 1 (Home)') return 'partner1Name';
  if (header === 'Partner 2 (Away)') return 'partner2Name';
  if (header === 'Event Title (Custom)') return 'eventTitle';
  if (header === 'Event Name (Auto)') return 'eventName';
  if (header === 'Event Date') return 'eventDate';
  
  // General conversion: "Remote Images" → "remoteImages"
  return header
    .split(/[\s\-_()]+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

/**
 * WHAT: Convert 0-based column index to Excel column letter
 * WHY: Match column positions to column names (0 → A, 25 → Z, 26 → AA)
 */
export function indexToColumnLetter(index: number): string {
  let letter = '';
  let num = index;
  while (num >= 0) {
    letter = String.fromCharCode(65 + (num % 26)) + letter;
    num = Math.floor(num / 26) - 1;
  }
  return letter;
}

// Removed: columnLetterToIndex function
// WHY: Using index-based mapping now, no need to convert letters
