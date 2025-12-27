// lib/googleSheets/columnMap.ts
// WHAT: Hardcoded column mapping for Google Sheets integration (v12.2.0)
// WHY: Define how sheet columns map to MessMass fields - COMPREHENSIVE KYC UPDATE
// HOW: Maps column letters (A...EU) to field paths

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

  // --- EVENT METADATA (F-J) ---
  F: { field: 'eventDate', type: 'date', required: true },
  G: { field: 'stats.eventAttendees', type: 'number' },
  H: { field: 'stats.eventResultHome', type: 'number' },
  I: { field: 'stats.eventResultVisitor', type: 'number' },
  J: { field: 'stats.eventTicketPurchases', type: 'number' },

  // --- IMAGES (K-P) ---
  K: { field: 'stats.remoteImages', type: 'number' },
  L: { field: 'stats.hostessImages', type: 'number' },
  M: { field: 'stats.selfies', type: 'number' },
  N: { field: 'stats.approvedImages', type: 'number' },
  O: { field: 'stats.rejectedImages', type: 'number' },
  P: { field: 'stats.allImages', type: 'number', computed: true },

  // --- FANS (Q-U) ---
  Q: { field: 'stats.remoteFans', type: 'number' },
  R: { field: 'stats.stadium', type: 'number' },
  S: { field: 'stats.indoor', type: 'number' },
  T: { field: 'stats.outdoor', type: 'number' },
  U: { field: 'stats.totalFans', type: 'number', computed: true },

  // --- DEMOGRAPHICS (V-AA) ---
  V: { field: 'stats.female', type: 'number' },
  W: { field: 'stats.male', type: 'number' },
  X: { field: 'stats.genAlpha', type: 'number' },
  Y: { field: 'stats.genYZ', type: 'number' },
  Z: { field: 'stats.genX', type: 'number' },
  AA: { field: 'stats.boomer', type: 'number' },

  // --- MERCHANDISE (AB-AI) ---
  AB: { field: 'stats.merched', type: 'number' },
  AC: { field: 'stats.jersey', type: 'number' },
  AD: { field: 'stats.scarf', type: 'number' },
  AE: { field: 'stats.flags', type: 'number' },
  AF: { field: 'stats.baseballCap', type: 'number' },
  AG: { field: 'stats.Caps', type: 'number' },
  AH: { field: 'stats.specialMerch', type: 'number' },
  AI: { field: 'stats.other', type: 'number' },

  // --- VISITS (AJ-AS) ---
  AJ: { field: 'stats.visitQrCode', type: 'number' },
  AK: { field: 'stats.visitShortUrl', type: 'number' },
  AL: { field: 'stats.visitWeb', type: 'number' },
  AM: { field: 'stats.visitFacebook', type: 'number' },
  AN: { field: 'stats.visitInstagram', type: 'number' },
  AO: { field: 'stats.visitYoutube', type: 'number' },
  AP: { field: 'stats.visitTiktok', type: 'number' },
  AQ: { field: 'stats.visitX', type: 'number' },
  AR: { field: 'stats.visitTrustpilot', type: 'number' },
  AS: { field: 'stats.socialVisit', type: 'number' },

  // --- VENT / OTHER (AT-BE) ---
  AT: { field: 'stats.ventCtaEmail', type: 'number' },
  AU: { field: 'stats.marketingOptin', type: 'number' },
  AV: { field: 'stats.newUsersAdded', type: 'number' },
  AW: { field: 'stats.uniqueUsers', type: 'number' },
  AX: { field: 'stats.ventAndroid', type: 'number' },
  AY: { field: 'stats.ventIos', type: 'number' },
  AZ: { field: 'stats.ventCtaPopup', type: 'number' },
  BA: { field: 'stats.ventFacebook', type: 'number' },
  BB: { field: 'stats.ventGoogle', type: 'number' },
  BC: { field: 'stats.ventInstagram', type: 'number' },
  BD: { field: 'stats.ventQr', type: 'number' },
  BE: { field: 'stats.ventUrl', type: 'string' },

  // --- QR & COUNTRIES (BF-BO) ---
  BF: { field: 'stats.directUrl', type: 'number' },
  BG: { field: 'stats.countriesReached', type: 'number' },
  BH: { field: 'stats.qrscanIphone', type: 'number' },
  BI: { field: 'stats.qrscanAndroid', type: 'number' },
  BJ: { field: 'stats.walletPasses', type: 'number' },
  BK: { field: 'stats.topCountryone', type: 'string' },
  BL: { field: 'stats.topCountrytwo', type: 'string' },
  BM: { field: 'stats.topCountrythree', type: 'string' },
  BN: { field: 'stats.topCountryfour', type: 'string' },
  BO: { field: 'stats.topCountryfive', type: 'string' },

  // --- BITLY CORE (BP-BU) ---
  BP: { field: 'stats.totalBitlyClicks', type: 'number' },
  BQ: { field: 'stats.uniqueBitlyClicks', type: 'number' },
  BR: { field: 'stats.bitlyMobileClicks', type: 'number' },
  BS: { field: 'stats.bitlyDesktopClicks', type: 'number' },
  BT: { field: 'stats.bitlyTabletClicks', type: 'number' },
  BU: { field: 'stats.bitlyTopCountry', type: 'string' },

  // --- BITLY SOURCES (BV-CD) ---
  BV: { field: 'stats.bitlyClicksFromFacebook', type: 'number' },
  BW: { field: 'stats.bitlyClicksFromInstagram', type: 'number' },
  BX: { field: 'stats.bitlyClicksFromTwitter', type: 'number' },
  BY: { field: 'stats.bitlyClicksFromLinkedIn', type: 'number' },
  BZ: { field: 'stats.bitlyClicksFromDirect', type: 'number' },
  CA: { field: 'stats.bitlyClicksFromQRCode', type: 'number' },
  CB: { field: 'stats.bitlyClicksFromGoogle', type: 'number' },
  CC: { field: 'stats.bitlyClicksFromInstagramApp', type: 'number' },
  CD: { field: 'stats.bitlyClicksFromFacebookMobile', type: 'number' },

  // --- BITLY COUNTRIES (CE-DD) ---
  CE: { field: 'stats.bitlyClicksByCountryMK', type: 'number' },
  CF: { field: 'stats.bitlyClicksByCountryIE', type: 'number' },
  CG: { field: 'stats.bitlyClicksByCountryHU', type: 'number' },
  CH: { field: 'stats.bitlyClicksByCountryCH', type: 'number' },
  CI: { field: 'stats.bitlyClicksByCountryHR', type: 'number' },
  CJ: { field: 'stats.bitlyClicksByCountryCA', type: 'number' },
  CK: { field: 'stats.bitlyClicksByCountryGR', type: 'number' },
  CL: { field: 'stats.bitlyClicksByCountryDE', type: 'number' },
  CM: { field: 'stats.bitlyClicksByCountryAT', type: 'number' },
  CN: { field: 'stats.bitlyClicksByCountryGB', type: 'number' },
  CO: { field: 'stats.bitlyClicksByCountryFR', type: 'number' },
  CP: { field: 'stats.bitlyClicksByCountryES', type: 'number' },
  CQ: { field: 'stats.bitlyClicksByCountryEG', type: 'number' },
  CR: { field: 'stats.bitlyClicksByCountryDK', type: 'number' },
  CS: { field: 'stats.bitlyClicksByCountryUS', type: 'number' },
  CT: { field: 'stats.bitlyClicksByCountrySK', type: 'number' },
  CU: { field: 'stats.bitlyClicksByCountrySI', type: 'number' },
  CV: { field: 'stats.bitlyClicksByCountrySE', type: 'number' },
  CW: { field: 'stats.bitlyClicksByCountryRU', type: 'number' },
  CX: { field: 'stats.bitlyClicksByCountryRS', type: 'number' },
  CY: { field: 'stats.bitlyClicksByCountryRO', type: 'number' },
  CZ: { field: 'stats.bitlyClicksByCountryPT', type: 'number' },
  DA: { field: 'stats.bitlyClicksByCountryPL', type: 'number' },
  DB: { field: 'stats.bitlyClicksByCountryNO', type: 'number' },
  DC: { field: 'stats.bitlyClicksByCountryNL', type: 'number' },
  DD: { field: 'stats.bitlyClicksByCountryIT', type: 'number' },

  // --- REPORT IMAGES (DE-DX) ---
  DE: { field: 'stats.reportImage1', type: 'string' },
  DF: { field: 'stats.reportImage2', type: 'string' },
  DG: { field: 'stats.reportImage3', type: 'string' },
  DH: { field: 'stats.reportImage4', type: 'string' },
  DI: { field: 'stats.reportImage5', type: 'string' },
  DJ: { field: 'stats.reportImage6', type: 'string' },
  DK: { field: 'stats.reportImage7', type: 'string' },
  DL: { field: 'stats.reportImage8', type: 'string' },
  DM: { field: 'stats.reportImage9', type: 'string' },
  DN: { field: 'stats.reportImage10', type: 'string' },
  DO: { field: 'stats.reportImage11', type: 'string' },
  DP: { field: 'stats.reportImage12', type: 'string' },
  DQ: { field: 'stats.reportImage13', type: 'string' },
  DR: { field: 'stats.reportImage14', type: 'string' },
  DS: { field: 'stats.reportImage15', type: 'string' },
  DT: { field: 'stats.reportImage16', type: 'string' },
  DU: { field: 'stats.reportImage17', type: 'string' },
  DV: { field: 'stats.reportImage18', type: 'string' },
  DW: { field: 'stats.reportImage19', type: 'string' },
  DX: { field: 'stats.reportImage20', type: 'string' },

  // --- REPORT TEXTS (DY-ER) ---
  DY: { field: 'stats.reportText1', type: 'string' },
  DZ: { field: 'stats.reportText2', type: 'string' },
  EA: { field: 'stats.reportText3', type: 'string' },
  EB: { field: 'stats.reportText4', type: 'string' },
  EC: { field: 'stats.reportText5', type: 'string' },
  ED: { field: 'stats.reportText6', type: 'string' },
  EE: { field: 'stats.reportText7', type: 'string' },
  EF: { field: 'stats.reportText8', type: 'string' },
  EG: { field: 'stats.reportText9', type: 'string' },
  EH: { field: 'stats.reportText10', type: 'string' },
  EI: { field: 'stats.reportText11', type: 'string' },
  EJ: { field: 'stats.reportText12', type: 'string' },
  EK: { field: 'stats.reportText13', type: 'string' },
  EL: { field: 'stats.reportText14', type: 'string' },
  EM: { field: 'stats.reportText15', type: 'string' },
  EN: { field: 'stats.reportText16', type: 'string' },
  EO: { field: 'stats.reportText17', type: 'string' },
  EP: { field: 'stats.reportText18', type: 'string' },
  EQ: { field: 'stats.reportText19', type: 'string' },
  ER: { field: 'stats.reportText20', type: 'string' },

  // --- METADATA (ES-EU) ---
  ES: { field: 'lastModified', type: 'timestamp', readOnly: false },
  ET: { field: 'syncStatus', type: 'status', readOnly: true },
  EU: { field: 'notes', type: 'text', required: false },

  // --- GAMES (EV-FC) ---
  EV: { field: 'stats.totalGames', type: 'number' },
  EW: { field: 'stats.gamesWithoutAds', type: 'number' },
  EX: { field: 'stats.gamesWithAds', type: 'number' },
  EY: { field: 'stats.gamesWithoutSlideshow', type: 'number' },
  EZ: { field: 'stats.gamesWithSlideshow', type: 'number' },
  FA: { field: 'stats.gamesWithoutTech', type: 'number' },
  FB: { field: 'stats.gamesWithSelfie', type: 'number' },
  FC: { field: 'stats.gamesWithoutSelfie', type: 'number' },

  // --- REGISTRATION (FD) ---
  FD: { field: 'stats.userRegistration', type: 'number' }
};

export const SHEET_HEADER_LABELS: Record<string, string> = {
  // A-E
  A: 'MessMass UUID', B: 'Partner 1 (Home)', C: 'Partner 2 (Away)', D: 'Event Title (Custom)', E: 'Event Name (Auto)',
  // F-J
  F: 'Event Date', G: 'Event Attendees', H: 'Home Score', I: 'Visitor Score', J: 'Ticket Purchases',
  // K-P
  K: 'Remote Images', L: 'Hostess Images', M: 'Selfies', N: 'Approved Images', O: 'Rejected Images', P: 'All Images',
  // Q-U
  Q: 'Remote Fans', R: 'Stadium Fans', S: 'Indoor Fans', T: 'Outdoor Fans', U: 'Total Fans',
  // V-AA
  V: 'Female', W: 'Male', X: 'Gen Alpha', Y: 'Gen YZ', Z: 'Gen X', AA: 'Boomer',
  // AB-AI
  AB: 'Merched', AC: 'Jersey', AD: 'Scarf', AE: 'Flags', AF: 'Baseball Cap', AG: 'Caps', AH: 'Special Merch', AI: 'Other',
  // AJ-AS
  AJ: 'Visit QR', AK: 'Visit Short URL', AL: 'Visit Web', AM: 'Visit Facebook', AN: 'Visit Instagram', AO: 'Visit Youtube', AP: 'Visit Tiktok', AQ: 'Visit X', AR: 'Visit Trustpilot', AS: 'Social Visits',
  // AT-BE
  AT: 'Vent Email', AU: 'Marketing Optin', AV: 'New Users', AW: 'Unique Users', AX: 'Vent Android', AY: 'Vent iOS', AZ: 'Vent Popup',
  BA: 'Vent Facebook', BB: 'Vent Google', BC: 'Vent Instagram', BD: 'Vent QR', BE: 'Vent URL',
  // BF-BO
  BF: 'Direct URL', BG: 'Countries Reached', BH: 'QR iPhone', BI: 'QR Android', BJ: 'Wallet Passes',
  BK: 'Top Country 1', BL: 'Top Country 2', BM: 'Top Country 3', BN: 'Top Country 4', BO: 'Top Country 5',
  // BP-BU
  BP: 'Bitly Clicks', BQ: 'Bitly Unique', BR: 'Bitly Mobile', BS: 'Bitly Desktop', BT: 'Bitly Tablet', BU: 'Bitly Top Country',
  // BV-CD
  BV: 'From Facebook', BW: 'From Instagram', BX: 'From Twitter', BY: 'From LinkedIn', BZ: 'Direct Click', CA: 'From QR', CB: 'From Google', CC: 'From Insta App', CD: 'From FB Mobile',
  // CE-DD
  CE: 'Clicks MK', CF: 'Clicks IE', CG: 'Clicks HU', CH: 'Clicks CH', CI: 'Clicks HR', CJ: 'Clicks CA', CK: 'Clicks GR', CL: 'Clicks DE', CM: 'Clicks AT', CN: 'Clicks GB', CO: 'Clicks FR', CP: 'Clicks ES', CQ: 'Clicks EG', CR: 'Clicks DK', CS: 'Clicks US', CT: 'Clicks SK', CU: 'Clicks SI', CV: 'Clicks SE', CW: 'Clicks RU', CX: 'Clicks RS', CY: 'Clicks RO', CZ: 'Clicks PT', DA: 'Clicks PL', DB: 'Clicks NO', DC: 'Clicks NL', DD: 'Clicks IT',
  // DE-DX
  DE: 'Report Img 1', DF: 'Report Img 2', DG: 'Report Img 3', DH: 'Report Img 4', DI: 'Report Img 5', DJ: 'Report Img 6', DK: 'Report Img 7', DL: 'Report Img 8', DM: 'Report Img 9', DN: 'Report Img 10', DO: 'Report Img 11', DP: 'Report Img 12', DQ: 'Report Img 13', DR: 'Report Img 14', DS: 'Report Img 15', DT: 'Report Img 16', DU: 'Report Img 17', DV: 'Report Img 18', DW: 'Report Img 19', DX: 'Report Img 20',
  // DY-ER
  DY: 'Report Txt 1', DZ: 'Report Txt 2', EA: 'Report Txt 3', EB: 'Report Txt 4', EC: 'Report Txt 5', ED: 'Report Txt 6', EE: 'Report Txt 7', EF: 'Report Txt 8', EG: 'Report Txt 9', EH: 'Report Txt 10', EI: 'Report Txt 11', EJ: 'Report Txt 12', EK: 'Report Txt 13', EL: 'Report Txt 14', EM: 'Report Txt 15', EN: 'Report Txt 16', EO: 'Report Txt 17', EP: 'Report Txt 18', EQ: 'Report Txt 19', ER: 'Report Txt 20',
  // ES-EU
  ES: 'Last Modified', ET: 'Sync Status', EU: 'Notes',
  // EV-FD
  EV: 'Total Games', EW: 'Games No Ads', EX: 'Games With Ads', EY: 'Games No Slide', EZ: 'Games With Slide', FA: 'Games No Tech', FB: 'Games With Selfie', FC: 'Games No Selfie', FD: 'User Registration'
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
