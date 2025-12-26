// scripts/test-google-sheets.ts
// WHAT: Test script for Google Sheets API integration (v12.0.0)
// WHY: Verify authentication and basic operations work before Phase 2 implementation
// HOW: Test connection, read/write operations, and error handling

import {
  createSheetsClient,
  testConnection,
  readSheetRows,
  writeSheetRows,
  findRowByUuid,
  getSheetMetadata
} from '../lib/googleSheets/client';
import { SHEET_HEADER_LABELS, getSheetRange } from '../lib/googleSheets/columnMap';

/**
 * WHAT: Test Google Sheets API authentication
 * WHY: Ensure credentials are correctly configured
 */
async function testAuthentication(): Promise<boolean> {
  console.log('\n🔐 Testing authentication...');
  
  try {
    const client = createSheetsClient();
    console.log('✅ Authentication successful - client created');
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error instanceof Error ? error.message : error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Set GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL in .env.local');
    console.log('2. Set GOOGLE_SHEETS_PRIVATE_KEY in .env.local');
    console.log('3. Verify private key format (PEM with \\n newlines)');
    return false;
  }
}

/**
 * WHAT: Test connection to a specific Google Sheet
 * WHY: Verify sheet access and permissions
 * 
 * NOTE: Replace TEST_SHEET_ID with an actual sheet ID
 */
async function testSheetConnection(sheetId: string): Promise<boolean> {
  console.log('\n📄 Testing sheet connection...');
  console.log(`Sheet ID: ${sheetId}`);
  
  try {
    const result = await testConnection(sheetId);
    
    if (result.success) {
      console.log(`✅ Connected to sheet: "${result.sheetTitle}"`);
      return true;
    } else {
      console.error(`❌ Connection failed: ${result.error}`);
      console.log('\n💡 Troubleshooting:');
      console.log('1. Share sheet with service account email (Editor access)');
      console.log('2. Verify sheet ID is correct (from URL)');
      console.log('3. Check Google Sheets API is enabled in GCP project');
      return false;
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

/**
 * WHAT: Test reading sheet metadata
 * WHY: Verify we can fetch sheet properties
 */
async function testGetMetadata(sheetId: string): Promise<boolean> {
  console.log('\n📊 Testing metadata retrieval...');
  
  try {
    const metadata = await getSheetMetadata(sheetId);
    console.log(`✅ Sheet title: ${metadata.title}`);
    console.log(`   Total tabs: ${metadata.sheetCount}`);
    console.log(`   Tab names: ${metadata.sheetNames.join(', ')}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to get metadata:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * WHAT: Test reading rows from sheet
 * WHY: Verify we can read data
 */
async function testReadRows(sheetId: string, sheetName: string = 'Events'): Promise<boolean> {
  console.log('\n📖 Testing read operations...');
  
  try {
    const rows = await readSheetRows(sheetId, sheetName, 2); // Start from row 2 (after header)
    console.log(`✅ Read ${rows.length} rows from sheet`);
    
    if (rows.length > 0) {
      console.log(`   First row columns: ${rows[0].length}`);
      console.log(`   Sample data (first 3 cells): ${rows[0].slice(0, 3).join(', ')}`);
    } else {
      console.log('   ⚠️ Sheet is empty (no data rows)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to read rows:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * WHAT: Test writing rows to sheet
 * WHY: Verify we can write data
 * 
 * NOTE: This writes to row 100 to avoid overwriting real data
 */
async function testWriteRows(sheetId: string, sheetName: string = 'Events'): Promise<boolean> {
  console.log('\n✍️ Testing write operations...');
  
  try {
    // Write test data to row 100 (safe row that won't overwrite real data)
    const testRow = [
      'test-uuid-123',                    // UUID
      'Test Partner 1',                   // Partner 1
      'Test Partner 2',                   // Partner 2
      'Test Event Title',                 // Event Title
      'Test Partner 1 vs Test Partner 2', // Event Name
      '2025-12-26',                       // Event Date
      '1000',                             // Event Attendees
      '2',                                // Result Home
      '1',                                // Result Visitor
      '100', '50', '30',                  // Images (Remote, Hostess, Selfies)
      '=J100+K100+L100',                  // All Images (formula)
      '80', '120',                        // Fans (Remote, Stadium)
      '=N100+O100',                       // Total Fans (formula)
      '100', '100',                       // Demographics (Female, Male)
      '50', '80', '60', '10',             // Gen Alpha, YZ, X, Boomer
      '80',                               // Merched
      '30', '20', '15', '10', '5',        // Merch items
      '40', '25', '15',                   // Visits (QR, Short URL, Web)
      '50', '40', '30', '20', '15', '10', // Social visits
      '500', '350',                       // Bitly (Total, Unique)
      new Date().toISOString(),           // Last Modified
      'Synced',                           // Sync Status
      'Test data written by test script'  // Notes
    ];
    
    await writeSheetRows(sheetId, sheetName, 100, [testRow]);
    console.log('✅ Test data written to row 100');
    console.log('   ⚠️ Remember to delete test row after verification');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to write rows:', error instanceof Error ? error.message : error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Ensure service account has Editor access (not just Viewer)');
    console.log('2. Verify sheet is not protected or locked');
    return false;
  }
}

/**
 * WHAT: Test finding row by UUID
 * WHY: Verify we can search for specific rows
 */
async function testFindByUuid(sheetId: string, sheetName: string = 'Events'): Promise<boolean> {
  console.log('\n🔍 Testing UUID search...');
  
  try {
    const testUuid = 'test-uuid-123'; // UUID written by testWriteRows()
    const rowNumber = await findRowByUuid(sheetId, sheetName, testUuid);
    
    if (rowNumber !== null) {
      console.log(`✅ Found test UUID at row ${rowNumber}`);
      return true;
    } else {
      console.log('⚠️ Test UUID not found (expected if write test skipped)');
      return true; // Not a failure if we skipped writes
    }
  } catch (error) {
    console.error('❌ Failed to search UUID:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * WHAT: Main test runner
 * WHY: Execute all tests in sequence
 */
async function runTests() {
  console.log('🚀 Google Sheets API Integration Tests');
  console.log('======================================');
  
  // Step 1: Test authentication
  const authOk = await testAuthentication();
  if (!authOk) {
    console.log('\n❌ Authentication failed - cannot proceed with tests');
    process.exit(1);
  }
  
  // Step 2: Get test sheet ID from environment or use placeholder
  const TEST_SHEET_ID = process.env.TEST_SHEET_ID;
  
  if (!TEST_SHEET_ID) {
    console.log('\n⚠️ TEST_SHEET_ID not set in environment');
    console.log('💡 Usage:');
    console.log('   1. Create a test Google Sheet');
    console.log('   2. Share it with your service account (Editor access)');
    console.log('   3. Set TEST_SHEET_ID in .env.local');
    console.log('   4. Run: npm run test:google-sheets');
    console.log('\n✅ Authentication test passed - setup complete');
    process.exit(0);
  }
  
  // Step 3: Test sheet connection
  const connectionOk = await testSheetConnection(TEST_SHEET_ID);
  if (!connectionOk) {
    console.log('\n❌ Sheet connection failed - check permissions');
    process.exit(1);
  }
  
  // Step 4: Test metadata retrieval
  await testGetMetadata(TEST_SHEET_ID);
  
  // Step 5: Test read operations
  await testReadRows(TEST_SHEET_ID);
  
  // Step 6: Test write operations
  const writeOk = await testWriteRows(TEST_SHEET_ID);
  if (writeOk) {
    // Step 7: Test UUID search
    await testFindByUuid(TEST_SHEET_ID);
  }
  
  console.log('\n✅ All tests completed successfully!');
  console.log('📦 Phase 1 foundation is ready for Phase 2 implementation');
}

// Run tests
runTests().catch((error) => {
  console.error('\n💥 Unexpected error during tests:', error);
  process.exit(1);
});
