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

  // --- FANS & QR (AB-AH) ---
  AB: { field: 'stats.remoteFans', type: 'number' },
  AC: { field: 'stats.stadium', type: 'number' },
  AD: { field: 'stats.visitQrCode', type: 'number' },
  AE: { field: 'stats.ventQr', type: 'number' },
  AF: { field: 'stats.bitlyClicksFromQRCode', type: 'number' },
  AG: { field: 'stats.qrscanIphone', type: 'number' },
  AH: { field: 'stats.qrscanAndroid', type: 'number' },

  // --- URLS & SOCIAL (AI-AU) ---
  AI: { field: 'stats.visitShortUrl', type: 'number' },
  AJ: { field: 'stats.ventUrl', type: 'string' },
  AK: { field: 'stats.directUrl', type: 'number' },
  AL: { field: 'stats.ventCtaEmail', type: 'number' },
  AM: { field: 'stats.ventFacebook', type: 'number' },
  AN: { field: 'stats.ventGoogle', type: 'number' },
  AO: { field: 'stats.ventInstagram', type: 'number' },
  AP: { field: 'stats.bitlyClicksFromFacebook', type: 'number' },
  AQ: { field: 'stats.bitlyClicksFromInstagram', type: 'number' },
  AR: { field: 'stats.bitlyClicksFromTwitter', type: 'number' },
  AS: { field: 'stats.bitlyClicksFromLinkedIn', type: 'number' },
  AT: { field: 'stats.bitlyClicksFromGoogle', type: 'number' },
  AU: { field: 'stats.socialVisit', type: 'number' },

  // --- VISITS CTA & OTHER (AV-AY) ---
  AV: { field: 'stats.visitCta1', type: 'number' }, // NEW
  AW: { field: 'stats.visitCta2', type: 'number' }, // NEW
  AX: { field: 'stats.visitCta3', type: 'number' }, // NEW
  AY: { field: 'stats.outdoor', type: 'number' },

  // --- SCORES & TICKET (AZ-BB) ---
  AZ: { field: 'stats.eventResultHome', type: 'number' },
  BA: { field: 'stats.eventResultVisitor', type: 'number' },
  BB: { field: 'stats.eventTicketPurchases', type: 'number' },

  // --- APPROVALS & GEN (BC-BH) ---
  BC: { field: 'stats.approvedImages', type: 'number' },
  BD: { field: 'stats.rejectedImages', type: 'number' },
  BE: { field: 'stats.genAlpha', type: 'number' },
  BF: { field: 'stats.genYZ', type: 'number' },
  BG: { field: 'stats.genX', type: 'number' },
  BH: { field: 'stats.boomer', type: 'number' },

  // --- MERCHANDISE (BI-BP) ---
  BI: { field: 'stats.merched', type: 'number' },
  BJ: { field: 'stats.jersey', type: 'number' },
  BK: { field: 'stats.scarf', type: 'number' },
  BL: { field: 'stats.flags', type: 'number' },
  BM: { field: 'stats.baseballCap', type: 'number' },
  BN: { field: 'stats.Caps', type: 'number' },
  BO: { field: 'stats.specialMerch', type: 'number' },
  BP: { field: 'stats.other', type: 'number' },

  // --- VISITS (BQ-BW) ---
  BQ: { field: 'stats.visitWeb', type: 'number' },
  BR: { field: 'stats.visitFacebook', type: 'number' },
  BS: { field: 'stats.visitInstagram', type: 'number' },
  BT: { field: 'stats.visitYoutube', type: 'number' },
  BU: { field: 'stats.visitTiktok', type: 'number' },
  BV: { field: 'stats.visitX', type: 'number' },
  BW: { field: 'stats.visitTrustpilot', type: 'number' },

  // --- VENT / COUNTRIES (BX-CG) ---
  BX: { field: 'stats.ventAndroid', type: 'number' },
  BY: { field: 'stats.ventIos', type: 'number' },
  BZ: { field: 'stats.ventCtaPopup', type: 'number' },
  CA: { field: 'stats.countriesReached', type: 'number' },
  CB: { field: 'stats.walletPasses', type: 'number' },
  CC: { field: 'stats.topCountryone', type: 'string' },
  CD: { field: 'stats.topCountrytwo', type: 'string' },
  CE: { field: 'stats.topCountrythree', type: 'string' },
  CF: { field: 'stats.topCountryfour', type: 'string' },
  CG: { field: 'stats.topCountryfive', type: 'string' },

  // --- BITLY (CH-CP) ---
  CH: { field: 'stats.totalBitlyClicks', type: 'number' },
  CI: { field: 'stats.uniqueBitlyClicks', type: 'number' },
  CJ: { field: 'stats.bitlyMobileClicks', type: 'number' },
  CK: { field: 'stats.bitlyDesktopClicks', type: 'number' },
  CL: { field: 'stats.bitlyTabletClicks', type: 'number' },
  CM: { field: 'stats.bitlyTopCountry', type: 'string' },
  CN: { field: 'stats.bitlyClicksFromInstagramApp', type: 'number' },
  CO: { field: 'stats.bitlyClicksFromFacebookMobile', type: 'number' },
  CP: { field: 'stats.bitlyClicksFromDirect', type: 'number' },

  // --- REPORT IMAGES (CQ-DJ) ---
  CQ: { field: 'stats.reportImage1', type: 'string' },
  CR: { field: 'stats.reportImage2', type: 'string' },
  CS: { field: 'stats.reportImage3', type: 'string' },
  CT: { field: 'stats.reportImage4', type: 'string' },
  CU: { field: 'stats.reportImage5', type: 'string' },
  CV: { field: 'stats.reportImage6', type: 'string' },
  CW: { field: 'stats.reportImage7', type: 'string' },
  CX: { field: 'stats.reportImage8', type: 'string' },
  CY: { field: 'stats.reportImage9', type: 'string' },
  CZ: { field: 'stats.reportImage10', type: 'string' },
  DA: { field: 'stats.reportImage11', type: 'string' },
  DB: { field: 'stats.reportImage12', type: 'string' },
  DC: { field: 'stats.reportImage13', type: 'string' },
  DD: { field: 'stats.reportImage14', type: 'string' },
  DE: { field: 'stats.reportImage15', type: 'string' },
  DF: { field: 'stats.reportImage16', type: 'string' },
  DG: { field: 'stats.reportImage17', type: 'string' },
  DH: { field: 'stats.reportImage18', type: 'string' },
  DI: { field: 'stats.reportImage19', type: 'string' },
  DJ: { field: 'stats.reportImage20', type: 'string' },

  // --- REPORT TEXTS (DK-ED) ---
  DK: { field: 'stats.reportText1', type: 'string' },
  DL: { field: 'stats.reportText2', type: 'string' },
  DM: { field: 'stats.reportText3', type: 'string' },
  DN: { field: 'stats.reportText4', type: 'string' },
  DO: { field: 'stats.reportText5', type: 'string' },
  DP: { field: 'stats.reportText6', type: 'string' },
  DQ: { field: 'stats.reportText7', type: 'string' },
  DR: { field: 'stats.reportText8', type: 'string' },
  DS: { field: 'stats.reportText9', type: 'string' },
  DT: { field: 'stats.reportText10', type: 'string' },
  DU: { field: 'stats.reportText11', type: 'string' },
  DV: { field: 'stats.reportText12', type: 'string' },
  DW: { field: 'stats.reportText13', type: 'string' },
  DX: { field: 'stats.reportText14', type: 'string' },
  DY: { field: 'stats.reportText15', type: 'string' },
  DZ: { field: 'stats.reportText16', type: 'string' },
  EA: { field: 'stats.reportText17', type: 'string' },
  EB: { field: 'stats.reportText18', type: 'string' },
  EC: { field: 'stats.reportText19', type: 'string' },
  ED: { field: 'stats.reportText20', type: 'string' },

  // --- METADATA (EE-EG) ---
  EE: { field: 'lastModified', type: 'timestamp', readOnly: false },
  EF: { field: 'syncStatus', type: 'status', readOnly: true },
  EG: { field: 'notes', type: 'text', required: false }
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
  DK: 'Report Txt 1', DL: 'Report Txt 2', DM: 'Report Txt 3', DN: 'Report Txt 4', DO: 'Report Txt 5',
  DP: 'Report Txt 6', DQ: 'Report Txt 7', DR: 'Report Txt 8', DS: 'Report Txt 9', DT: 'Report Txt 10',
  DU: 'Report Txt 11', DV: 'Report Txt 12', DW: 'Report Txt 13', DX: 'Report Txt 14', DY: 'Report Txt 15',
  DZ: 'Report Txt 16', EA: 'Report Txt 17', EB: 'Report Txt 18', EC: 'Report Txt 19', ED: 'Report Txt 20',
  // Meta
  EE: 'Last Modified', EF: 'Sync Status', EG: 'Notes'
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
