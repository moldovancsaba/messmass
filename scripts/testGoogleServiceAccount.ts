// scripts/testGoogleServiceAccount.ts
// WHAT: Test service account authentication and permissions
// WHY: Debug Google API access issues

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const getAuthClient = (): JWT => {
  const email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

  if (!email || !privateKey) {
    throw new Error('Google Sheets credentials not configured');
  }

  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  return new JWT({
    email,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/cloudplatform',
    ],
  });
};

async function test() {
  try {
    console.log('🔍 Testing Google Service Account...\n');

    const auth = getAuthClient();
    console.log('✓ Auth client created');
    console.log(`  Email: ${process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL}`);

    // Try to get auth token
    const token = await auth.getAccessToken();
    console.log('✓ Access token obtained');
    console.log(`  Token: ${token.token?.substring(0, 50)}...`);

    // Try to list existing sheets
    const sheets = google.sheets({ version: 'v4', auth });
    console.log('\n📊 Testing Sheets API...');

    // Try to access the test sheet
    const testSheetId = process.env.TEST_SHEET_ID;
    if (testSheetId) {
      try {
        const response = await sheets.spreadsheets.get({
          spreadsheetId: testSheetId,
        });
        console.log(`✓ Can read test sheet: ${response.data.properties?.title}`);
      } catch (err: any) {
        console.log(`❌ Cannot read test sheet: ${err.message}`);
      }
    } else {
      console.log('⚠️  TEST_SHEET_ID not configured');
    }

    // Try to create a new sheet
    console.log('\n🆕 Attempting to create test sheet...');
    try {
      const createResponse = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `Test Sheet ${Date.now()}`,
          },
        },
      });
      console.log(`✓ Successfully created sheet: ${createResponse.data.spreadsheetId}`);
      console.log(`  URL: https://docs.google.com/spreadsheets/d/${createResponse.data.spreadsheetId}`);
    } catch (err: any) {
      console.log(`❌ Cannot create sheet: ${err.message}`);
      console.log(`  Status: ${err.status}`);
      if (err.errors) {
        console.log(`  Error details:`, err.errors);
      }
    }

    // Try Drive API
    console.log('\n💾 Testing Drive API...');
    const drive = google.drive({ version: 'v3', auth });
    try {
      const driveResponse = await drive.files.list({
        maxResults: 1,
        spaces: 'drive',
      });
      console.log('✓ Can access Drive API');
      console.log(`  Can list files: ${(driveResponse.data.files?.length || 0) > 0}`);
    } catch (err: any) {
      console.log(`❌ Cannot access Drive API: ${err.message}`);
    }

    console.log('\n✅ Testing complete');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

test();
