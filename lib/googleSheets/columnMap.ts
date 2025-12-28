// lib/googleSheets/columnMap.ts
// WHAT: Hardcoded column mapping for Google Sheets integration (v12.3.0)
// WHY: Define how sheet columns map to MessMass fields - USER DEFINED ORDER
// HOW: Maps column letters (A...EG) to field paths

import type { SheetColumnMap } from './types';

/**
 * WHAT: Complete column mapping configuration
 * WHY: Single source of truth for sheet structure
 */
export const SHEET_COLUMN_MAP: SheetColumnMap = {
  // --- CORE SYSTEM (A-E) ---
  A: { field: 'googleSheetUuid', type: 'uuid', readOnly: true },
  B: { field: 'partner1Name', type: 'string', required: false },
  C: { field: 'partner2Name', type: 'string', required: false },
  D: { field: 'eventTitle', type: 'string', required: false },
  E: { field: 'eventName', type: 'string', readOnly: true },

  // --- EVENT & GAMES (F-N) ---
  F: { field: 'eventDate', type: 'date', required: true },
  G: { field: 'stats.totalGames', type: 'number' },
  H: { field: 'stats.gamesWithoutAds', type: 'number' },
  I: { field: 'stats.gamesWithAds', type: 'number' },
  J: { field: 'stats.gamesWithoutSlideshow', type: 'number' },
  K: { field: 'stats.gamesWithSlideshow', type: 'number' },
  L: { field: 'stats.gamesWithoutTech', type: 'number' },
  M: { field: 'stats.gamesWithSelfie', type: 'number' },
  N: { field: 'stats.gamesWithoutSelfie', type: 'number' },

  // --- USERS & FANS (O-U) ---
  O: { field: 'stats.eventAttendees', type: 'number' },
  P: { field: 'stats.uniqueUsers', type: 'number' },
  Q: { field: 'stats.newUsersAdded', type: 'number' },
  R: { field: 'stats.userRegistration', type: 'number' },
  S: { field: 'stats.userRegistrationHostess', type: 'number' }, // NEW
  T: { field: 'stats.totalFans', type: 'number', computed: true },
  U: { field: 'stats.marketingOptin', type: 'number' },

  // --- IMAGES (V-AA) ---
  V: { field: 'stats.allImages', type: 'number', computed: true },
  W: { field: 'stats.female', type: 'number' },
  X: { field: 'stats.male', type: 'number' },
  Y: { field: 'stats.selfies', type: 'number' },
  Z: { field: 'stats.remoteImages', type: 'number' },
  AA: { field: 'stats.hostessImages', type: 'number' },

  // --- FANS & QR (AB-AH) --- NOTE: ACTUAL COLUMNS BA-BG DUE TO SHEET OFFSET
  // WHAT: Shift mapping to actual sheet layout (columns are BA, BB, BC, BD, BE, BF, BG)
  // WHY: Szerencsejáték Zrt sheet has offset starting from column AA - actual data is 1 column right
  BA: { field: 'stats.remoteFans', type: 'number' },
  BB: { field: 'stats.stadium', type: 'number' },
  BC: { field: 'stats.visitQrCode', type: 'number' },
  BD: { field: 'stats.ventQr', type: 'number' },
  BE: { field: 'stats.bitlyClicksFromQRCode', type: 'number' },
  BF: { field: 'stats.qrscanIphone', type: 'number' },
  BG: { field: 'stats.qrscanAndroid', type: 'number' },

  // --- URLS & SOCIAL (AI-AU) --- ACTUAL COLUMNS BI-BU DUE TO SHEET OFFSET
  BI: { field: 'stats.visitShortUrl', type: 'number' },
  BJ: { field: 'stats.ventUrl', type: 'string' },
  BK: { field: 'stats.directUrl', type: 'number' },
  BL: { field: 'stats.ventCtaEmail', type: 'number' },
  BM: { field: 'stats.ventFacebook', type: 'number' },
  BN: { field: 'stats.ventGoogle', type: 'number' },
  BO: { field: 'stats.ventInstagram', type: 'number' },
  BP: { field: 'stats.bitlyClicksFromFacebook', type: 'number' },
  BQ: { field: 'stats.bitlyClicksFromInstagram', type: 'number' },
  BR: { field: 'stats.bitlyClicksFromTwitter', type: 'number' },
  BS: { field: 'stats.bitlyClicksFromLinkedIn', type: 'number' },
  BT: { field: 'stats.bitlyClicksFromGoogle', type: 'number' },
  BU: { field: 'stats.socialVisit', type: 'number' },

  // --- VISITS CTA & OTHER (AV-AY) --- ACTUAL COLUMNS BV-BY DUE TO SHEET OFFSET
  BV: { field: 'stats.visitCta1', type: 'number' }, // NEW
  BW: { field: 'stats.visitCta2', type: 'number' }, // NEW
  BX: { field: 'stats.visitCta3', type: 'number' }, // NEW
  BY: { field: 'stats.outdoor', type: 'number' },

  // --- SCORES & TICKET (AZ-BB) --- ACTUAL COLUMNS BZ-CB DUE TO SHEET OFFSET
  BZ: { field: 'stats.eventResultHome', type: 'number' },
  CA: { field: 'stats.eventResultVisitor', type: 'number' },
  CB: { field: 'stats.eventTicketPurchases', type: 'number' },

  // --- APPROVALS & GEN (BC-BH) --- ACTUAL COLUMNS CC-CH DUE TO SHEET OFFSET
  CC: { field: 'stats.approvedImages', type: 'number' },
  CD: { field: 'stats.rejectedImages', type: 'number' },
  CE: { field: 'stats.genAlpha', type: 'number' },
  CF: { field: 'stats.genYZ', type: 'number' },
  CG: { field: 'stats.genX', type: 'number' },
  CH: { field: 'stats.boomer', type: 'number' },

  // --- MERCHANDISE (BI-BP) --- ACTUAL COLUMNS CI-CP DUE TO SHEET OFFSET
  CI: { field: 'stats.merched', type: 'number' },
  CJ: { field: 'stats.jersey', type: 'number' },
  CK: { field: 'stats.scarf', type: 'number' },
  CL: { field: 'stats.flags', type: 'number' },
  CM: { field: 'stats.baseballCap', type: 'number' },
  CN: { field: 'stats.Caps', type: 'number' },
  CO: { field: 'stats.specialMerch', type: 'number' },
  CP: { field: 'stats.other', type: 'number' },

  // --- VISITS (BQ-BW) --- ACTUAL COLUMNS CQ-CW DUE TO SHEET OFFSET
  CQ: { field: 'stats.visitWeb', type: 'number' },
  CR: { field: 'stats.visitFacebook', type: 'number' },
  CS: { field: 'stats.visitInstagram', type: 'number' },
  CT: { field: 'stats.visitYoutube', type: 'number' },
  CU: { field: 'stats.visitTiktok', type: 'number' },
  CV: { field: 'stats.visitX', type: 'number' },
  CW: { field: 'stats.visitTrustpilot', type: 'number' },

  // --- VENT / COUNTRIES (BX-CG) --- ACTUAL COLUMNS CX-DG DUE TO SHEET OFFSET
  CX: { field: 'stats.ventAndroid', type: 'number' },
  CY: { field: 'stats.ventIos', type: 'number' },
  CZ: { field: 'stats.ventCtaPopup', type: 'number' },
  DA: { field: 'stats.countriesReached', type: 'number' },
  DB: { field: 'stats.walletPasses', type: 'number' },
  DC: { field: 'stats.topCountryone', type: 'string' },
  DD: { field: 'stats.topCountrytwo', type: 'string' },
  DE: { field: 'stats.topCountrythree', type: 'string' },
  DF: { field: 'stats.topCountryfour', type: 'string' },
  DG: { field: 'stats.topCountryfive', type: 'string' },

  // --- BITLY (CH-CP) --- ACTUAL COLUMNS DH-DP DUE TO SHEET OFFSET
  DH: { field: 'stats.totalBitlyClicks', type: 'number' },
  DI: { field: 'stats.uniqueBitlyClicks', type: 'number' },
  DJ: { field: 'stats.bitlyMobileClicks', type: 'number' },
  DK: { field: 'stats.bitlyDesktopClicks', type: 'number' },
  DL: { field: 'stats.bitlyTabletClicks', type: 'number' },
  DM: { field: 'stats.bitlyTopCountry', type: 'string' },
  DN: { field: 'stats.bitlyClicksFromInstagramApp', type: 'number' },
  DO: { field: 'stats.bitlyClicksFromFacebookMobile', type: 'number' },
  DP: { field: 'stats.bitlyClicksFromDirect', type: 'number' },

  // --- REPORT IMAGES (CQ-DJ) ---
  // NOTE: These columns have complex naming conflicts, using the actual sheet layout from sheet headers
  '1P': { field: 'stats.reportImage7', type: 'string' },
  '1Q': { field: 'stats.reportImage8', type: 'string' },
  '1R': { field: 'stats.reportImage9', type: 'string' },
  '1S': { field: 'stats.reportImage10', type: 'string' },
  '1T': { field: 'stats.reportImage11', type: 'string' },
  '1U': { field: 'stats.reportImage12', type: 'string' },
  '1V': { field: 'stats.reportImage13', type: 'string' },
  '1W': { field: 'stats.reportImage14', type: 'string' },
  '1X': { field: 'stats.reportImage15', type: 'string' },
  '1Y': { field: 'stats.reportImage16', type: 'string' },
  '1Z': { field: 'stats.reportImage17', type: 'string' },
  '20': { field: 'stats.reportImage18', type: 'string' },  // Column 20 in 1-indexed (19th in 0-indexed)
  '21': { field: 'stats.reportImage19', type: 'string' },
  '22': { field: 'stats.reportImage20', type: 'string' },

  // --- REPORT TEXTS (DQ-ED) ---
  DQ: { field: 'stats.reportText1', type: 'string' },
  DR: { field: 'stats.reportText2', type: 'string' },
  DS: { field: 'stats.reportText3', type: 'string' },
  DT: { field: 'stats.reportText4', type: 'string' },
  DU: { field: 'stats.reportText5', type: 'string' },
  DV: { field: 'stats.reportText6', type: 'string' },
  DW: { field: 'stats.reportText7', type: 'string' },
  DX: { field: 'stats.reportText8', type: 'string' },
  DY: { field: 'stats.reportText9', type: 'string' },
  DZ: { field: 'stats.reportText10', type: 'string' },
  EA: { field: 'stats.reportText11', type: 'string' },
  EB: { field: 'stats.reportText12', type: 'string' },
  EC: { field: 'stats.reportText13', type: 'string' },
  ED: { field: 'stats.reportText14', type: 'string' },
  EE: { field: 'stats.reportText15', type: 'string' },
  EF: { field: 'stats.reportText16', type: 'string' },
  EG: { field: 'stats.reportText17', type: 'string' },
  EH: { field: 'stats.reportText18', type: 'string' },
  EI: { field: 'stats.reportText19', type: 'string' },
  EJ: { field: 'stats.reportText20', type: 'string' },

  // --- METADATA (EK-EM) ---
  EK: { field: 'lastModified', type: 'timestamp', readOnly: false },
  EL: { field: 'syncStatus', type: 'status', readOnly: true },
  EM: { field: 'notes', type: 'text', required: false }
};

export const SHEET_HEADER_LABELS: Record<string, string> = {
  A: 'MessMass UUID', B: 'Partner 1 (Home)', C: 'Partner 2 (Away)', D: 'Event Title (Custom)', E: 'Event Name (Auto)',
  F: 'Event Date', G: 'Total Games', H: 'Games No Ads', I: 'Games With Ads', J: 'Games No Slide',
  K: 'Games With Slide', L: 'Games No Tech', M: 'Games With Selfie', N: 'Games No Selfie', O: 'Event Attendees',
  P: 'Unique Users', Q: 'New Users', R: 'User Registration', S: 'User Registration by Hostess', T: 'Total Fans',
  U: 'Marketing Optin', V: 'All Images', W: 'Female', X: 'Male', Y: 'Selfies',
  Z: 'Remote Images', AA: 'Hostess Images', AB: 'Remote Fans', AC: 'Stadium Fans', AD: 'Visit QR',
  AE: 'Vent QR', AF: 'From QR', AG: 'QR iPhone', AH: 'QR Android', AI: 'Visit Short URL',
  AJ: 'Vent URL', AK: 'Direct URL', AL: 'Vent Email', AM: 'Vent Facebook', AN: 'Vent Google',
  AO: 'Vent Instagram', AP: 'From Facebook', AQ: 'From Instagram', AR: 'From Twitter', AS: 'From LinkedIn',
  AT: 'From Google', AU: 'Social Visits', AV: 'Visit CTA1', AW: 'Visit CTA2', AX: 'Visit CTA3',
  AY: 'Outdoor Fans', AZ: 'Home Score', BA: 'Visitor Score', BB: 'Ticket Purchases', BC: 'Approved Images',
  BD: 'Rejected Images', BE: 'Gen Alpha', BF: 'Gen YZ', BG: 'Gen X', BH: 'Boomer',
  BI: 'Merched', BJ: 'Jersey', BK: 'Scarf', BL: 'Flags', BM: 'Baseball Cap',
  BN: 'Caps', BO: 'Special Merch', BP: 'Other', BQ: 'Visit Web', BR: 'Visit Facebook',
  BS: 'Visit Instagram', BT: 'Visit Youtube', BU: 'Visit Tiktok', BV: 'Visit X', BW: 'Visit Trustpilot',
  BX: 'Vent Android', BY: 'Vent iOS', BZ: 'Vent Popup', CA: 'Countries Reached', CB: 'Wallet Passes',
  CC: 'Top Country 1', CD: 'Top Country 2', CE: 'Top Country 3', CF: 'Top Country 4', CG: 'Top Country 5',
  CH: 'Bitly Clicks', CI: 'Bitly Unique', CJ: 'Bitly Mobile', CK: 'Bitly Desktop', CL: 'Bitly Tablet',
  CM: 'Bitly Top Country', CN: 'From Insta App', CO: 'From FB Mobile', CP: 'Direct Click',
  // Report Img
  CQ: 'Report Img 1', CR: 'Report Img 2', CS: 'Report Img 3', CT: 'Report Img 4', CU: 'Report Img 5',
  CV: 'Report Img 6', CW: 'Report Img 7', CX: 'Report Img 8', CY: 'Report Img 9', CZ: 'Report Img 10',
  DA: 'Report Img 11', DB: 'Report Img 12', DC: 'Report Img 13', DD: 'Report Img 14', DE: 'Report Img 15',
  DF: 'Report Img 16', DG: 'Report Img 17', DH: 'Report Img 18', DI: 'Report Img 19', DJ: 'Report Img 20',
  // Report Txt
  DQ: 'Report Txt 1', DR: 'Report Txt 2', DS: 'Report Txt 3', DT: 'Report Txt 4', DU: 'Report Txt 5',
  DV: 'Report Txt 6', DW: 'Report Txt 7', DX: 'Report Txt 8', DY: 'Report Txt 9', DZ: 'Report Txt 10',
  EA: 'Report Txt 11', EB: 'Report Txt 12', EC: 'Report Txt 13', ED: 'Report Txt 14', EE: 'Report Txt 15',
  EF: 'Report Txt 16', EG: 'Report Txt 17', EH: 'Report Txt 18', EI: 'Report Txt 19', EJ: 'Report Txt 20',
  // Meta
  EK: 'Last Modified', EL: 'Sync Status', EM: 'Notes'
};

export function columnLetterToIndex(letter: string): number {
  let index = 0;
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 64);
  }
  return index - 1;
}

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

export function getSheetRange(sheetName: string, startRow: number, endRow?: number): string {
  const firstCol = 'A';
  const lastCol = 'ZZ'; // Increased range to support extended columns
  if (endRow) {
    return `${sheetName}!${firstCol}${startRow}:${lastCol}${endRow}`;
  }
  return `${sheetName}!${firstCol}${startRow}:${lastCol}${startRow + 100000}`;
}

export const DEFAULT_SHEET_CONFIG = {
  sheetName: 'Events',
  uuidColumn: 'A',
  headerRow: 1,
  dataStartRow: 2,
  syncMode: 'manual' as const,
  columnMap: SHEET_COLUMN_MAP
};
