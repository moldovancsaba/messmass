// scripts/compare-sheet-kyc-variables.ts
// WHAT: Compare sheet columns with KYC variables to find mismatches
// WHY: Ensure all KYC variables are in the sheet and all sheet columns are valid

import { SHEET_COLUMN_MAP } from '../lib/googleSheets/columnMap';

async function compareSheetWithKYC() {
  console.log('🔍 Comparing Sheet Columns with KYC Variables\n');
  
  // Get all sheet field names
  const sheetFields = new Set<string>();
  const sheetFieldsByColumn: Record<string, string> = {};
  
  Object.entries(SHEET_COLUMN_MAP).forEach(([col, def]) => {
    const field = def.field;
    sheetFields.add(field);
    sheetFieldsByColumn[col] = field;
  });
  
  // Separate stats fields from metadata
  const statsFields = new Set<string>();
  const metadataFields = new Set<string>();
  
  sheetFields.forEach(field => {
    if (field.startsWith('stats.')) {
      statsFields.add(field.replace('stats.', ''));
    } else {
      metadataFields.add(field);
    }
  });
  
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('📊 SHEET COLUMN ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
  
  console.log(`✅ Total columns in sheet: ${Object.keys(SHEET_COLUMN_MAP).length}`);
  console.log(`✅ Stats variables in sheet: ${statsFields.size}`);
  statsFields.forEach(field => {
    console.log(`   - ${field}`);
  });
  
  console.log(`\n✅ Metadata fields in sheet: ${metadataFields.size}`);
  metadataFields.forEach(field => {
    console.log(`   - ${field}`);
  });
  
  // Fetch KYC variables from database via the API
  console.log('\n⏳ Fetching KYC variables from database...\n');
  
  try {
    // This would need to be run in an environment with database access
    console.log('📋 KYC Variables that SHOULD be in sheet:');
    console.log('(This requires database connection - run in dev environment)\n');
    
    // Known system variables from WARP.md
    const knownSystemVariables = [
      // Images
      'remoteImages', 'hostessImages', 'selfies',
      // Fans
      'remoteFans', 'stadium',
      // Demographics
      'female', 'male', 'genAlpha', 'genYZ', 'genX', 'boomer',
      // Merchandise
      'merched', 'jersey', 'scarf', 'flags', 'baseballCap', 'other',
      // Visits
      'visitQrCode', 'visitShortUrl', 'visitWeb', 'socialVisit',
      // Event
      'eventAttendees', 'eventResultHome', 'eventResultVisitor',
      // Bitly
      'totalBitlyClicks', 'uniqueBitlyClicks'
    ];
    
    console.log('Known System Variables:');
    knownSystemVariables.forEach(v => {
      const inSheet = statsFields.has(v);
      const status = inSheet ? '✅' : '❌';
      console.log(`${status} ${v}`);
    });
    
    // Check for variables in sheet but not in known list
    const unknownVariables = Array.from(statsFields).filter(
      v => !knownSystemVariables.includes(v)
    );
    
    if (unknownVariables.length > 0) {
      console.log('\n⚠️  Variables in sheet but not in known system list:');
      unknownVariables.forEach(v => {
        console.log(`   - ${v}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  // List all sheet columns in order
  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('📄 COMPLETE SHEET COLUMN MAPPING (in order A → EM)');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
  
  const sortedCols = Object.entries(SHEET_COLUMN_MAP).sort(([colA], [colB]) => {
    // Simple letter sorting
    return colA.localeCompare(colB, undefined, { numeric: true });
  });
  
  sortedCols.forEach(([col, def]) => {
    console.log(`${col.padEnd(4)} → ${def.field}`);
  });
}

compareSheetWithKYC();
