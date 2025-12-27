// scripts/setupPartnerSheet.ts
// WHAT: Setup Google Sheet for ANY partner with Events tab and full event data
// WHY: Ensure error-free connection with proper sheet structure (Events tab, 100 columns)
// USAGE: npm run ts-node scripts/setupPartnerSheet.ts "Partner Name" "SHEET_ID"
// EXAMPLE: npm run ts-node scripts/setupPartnerSheet.ts "Szerencsejáték Zrt." "1W1GJX874wYmL5rJ6HviarC1q-GrZ6tYEUBQc1KuT96w"

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { columnIndexToLetter } from '@/lib/googleSheets/columnMap';

const SHEET_NAME = 'Events';
const MIN_COLUMNS = 100; // Secure at least 100 columns for future expansion

// Column headers matching MessMass event structure
const SHEET_HEADERS = [
  'MessMass UUID',
  'Partner 1 (Home)',
  'Partner 2 (Away)',
  'Event Title (Custom)',
  'Event Name (Auto)',
  'Event Date',
  'Event Attendees',
  'Event Result Home',
  'Event Result Visitor',
  'Remote Images',
  'Hostess Images',
  'Selfies',
  'All Images',
  'Remote Fans',
  'Stadium Fans',
  'Total Fans',
  'Female',
  'Male',
  'Gen Alpha',
  'Gen YZ',
  'Gen X',
  'Boomer',
  'Merched',
  'Jersey',
  'Scarf',
  'Flags',
  'Baseball Cap',
  'Other',
  'Visit QR Code',
  'Visit Short URL',
  'Visit Web',
  'Visit Facebook',
  'Visit Instagram',
  'Visit YouTube',
  'Visit TikTok',
  'Visit X',
  'Visit Trustpilot',
  'Total Visit',
  'Bitly Clicks',
  'Unique Bitly Clicks',
  'Report Image 1',
  'Report Image 2',
  'Report Image 3',
  'Report Text 1',
  'Report Text 2',
  'Report Text 3',
  'Last Modified',
  'Sync Status',
  'Notes'
];

// Initialize Sheets and Drive clients
function createClients() {
  const jsonPath = path.join(process.cwd(), '.google-service-account.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error('Missing .google-service-account.json');
  }

  const keyFile = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const auth = new google.auth.JWT({
    email: keyFile.client_email,
    key: keyFile.private_key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file'
    ]
  });

  return {
    sheets: google.sheets({ version: 'v4', auth }),
    drive: google.drive({ version: 'v3', auth })
  };
}

// Convert event data to sheet row
function eventToRow(event: any): (string | number | null)[] {
  return [
    event._id?.toString() || '',
    event.partnerId || '',
    event.opponentId || '',
    event.eventTitle || '',
    event.eventName || '',
    event.eventDate || '',
    event.stats?.eventAttendees || 0,
    event.stats?.eventResultHome || 0,
    event.stats?.eventResultVisitor || 0,
    event.stats?.remoteImages || 0,
    event.stats?.hostessImages || 0,
    event.stats?.selfies || 0,
    event.stats?.allImages || 0,
    event.stats?.remoteFans || 0,
    event.stats?.stadium || 0,
    event.stats?.totalFans || 0,
    event.stats?.female || 0,
    event.stats?.male || 0,
    event.stats?.genAlpha || 0,
    event.stats?.genYZ || 0,
    event.stats?.genX || 0,
    event.stats?.boomer || 0,
    event.stats?.merched || 0,
    event.stats?.jersey || 0,
    event.stats?.scarf || 0,
    event.stats?.flags || 0,
    event.stats?.baseballCap || 0,
    event.stats?.other || 0,
    event.stats?.visitQrCode || 0,
    event.stats?.visitShortUrl || 0,
    event.stats?.visitWeb || 0,
    event.stats?.visitFacebook || 0,
    event.stats?.visitInstagram || 0,
    event.stats?.visitYoutube || 0,
    event.stats?.visitTiktok || 0,
    event.stats?.visitX || 0,
    event.stats?.visitTrustpilot || 0,
    event.stats?.totalVisit || 0,
    event.stats?.totalBitlyClicks || 0,
    event.stats?.uniqueBitlyClicks || 0,
    event.stats?.reportImage1 || '',
    event.stats?.reportImage2 || '',
    event.stats?.reportImage3 || '',
    event.stats?.reportText1 || '',
    event.stats?.reportText2 || '',
    event.stats?.reportText3 || '',
    event.updatedAt || '',
    'Synced',
    ''
  ];
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('❌ Usage: npm run ts-node scripts/setupPartnerSheet.ts "Partner Name" "SHEET_ID"');
    console.error('   Example: npm run ts-node scripts/setupPartnerSheet.ts "Újpest FC" "1ABC...XYZ"');
    process.exit(1);
  }

  const partnerName = args[0];
  const sheetId = args[1];

  console.log('🚀 MessMass Google Sheet Setup\n');
  console.log('━'.repeat(60));
  console.log(`📋 Partner: ${partnerName}`);
  console.log(`🔗 Sheet ID: ${sheetId}`);
  console.log('━'.repeat(60));

  const clients = createClients();
  const { sheets, drive } = clients;

  try {
    // Step 1: Get spreadsheet metadata to find Sheet1 tab ID
    console.log('\n📋 Fetching spreadsheet metadata...');
    const metadata = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheet1 = metadata.data.sheets?.find((s: any) => s.properties?.title === 'Sheet1');
    
    if (!sheet1) {
      console.log('ℹ️  Sheet1 not found, checking for Events tab...');
      const eventsTab = metadata.data.sheets?.find((s: any) => s.properties?.title === SHEET_NAME);
      
      if (!eventsTab) {
        console.error('❌ Neither Sheet1 nor Events tab found. Please ensure the sheet exists.');
        process.exit(1);
      }
      
      console.log('✓ Events tab already exists');
    } else {
      // Rename Sheet1 to Events
      const sheet1Id = sheet1.properties.sheetId;
      console.log(`📝 Renaming "Sheet1" (ID: ${sheet1Id}) to "${SHEET_NAME}"...`);
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId: sheet1Id,
                  title: SHEET_NAME
                },
                fields: 'title'
              }
            }
          ]
        }
      });
      console.log('✓ Renamed to "Events"');
    }

    // Step 2: Ensure at least 100 columns
    console.log(`\n📊 Ensuring at least ${MIN_COLUMNS} columns...`);
    
    // Re-fetch metadata to get updated tab name
    const updatedMetadata = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const eventsTab = updatedMetadata.data.sheets?.find((s: any) => s.properties?.title === SHEET_NAME);
    
    if (!eventsTab) {
      console.error('❌ Events tab not found after rename');
      process.exit(1);
    }

    const currentColumns = eventsTab.properties.gridProperties?.columnCount || 26;
    if (currentColumns < MIN_COLUMNS) {
      console.log(`📈 Expanding from ${currentColumns} to ${MIN_COLUMNS} columns...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId: eventsTab.properties.sheetId,
                  gridProperties: {
                    columnCount: MIN_COLUMNS
                  }
                },
                fields: 'gridProperties.columnCount'
              }
            }
          ]
        }
      });
      console.log(`✓ Expanded to ${MIN_COLUMNS} columns`);
    } else {
      console.log(`✓ Already has ${currentColumns} columns`);
    }

    // Step 3: Add headers
    console.log('\n📝 Writing headers...');
    const headerLastCol = columnIndexToLetter(Math.max(SHEET_HEADERS.length - 1, MIN_COLUMNS - 1));
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!A1:${headerLastCol}1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [SHEET_HEADERS]
      }
    });
    console.log('✓ Headers written');

    // Step 4: Get partner from database
    console.log('\n🔍 Finding partner in database...');
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const partner = await db.collection('partners').findOne({ name: partnerName });
    
    if (!partner) {
      console.error(`❌ Partner "${partnerName}" not found in database`);
      console.log('\n💡 Tip: Make sure the partner name matches exactly (case-sensitive)');
      process.exit(1);
    }
    console.log(`✓ Partner found: ${partner._id}`);

    // Step 5: Get partner events
    console.log('\n📦 Fetching partner events...');
    const events = await db.collection('projects')
      .find({
        $or: [
          { partnerId: partner._id },
          { partnerId: String(partner._id) },
          { partnerName: partnerName },
          { 'partnerContext.partnerId': partner._id },
          { 'partnerContext.partnerName': partnerName },
          { partner1Id: partner._id }
        ]
      })
      .sort({ eventDate: 1 })
      .toArray();

    console.log(`✓ Found ${events.length} events`);

    if (events.length > 0) {
      // Step 6: Populate events
      console.log('\n📝 Writing events to sheet...');
      const rows = events.map(eventToRow);
      const dataLastCol = columnIndexToLetter(Math.max(SHEET_HEADERS.length - 1, MIN_COLUMNS - 1));
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${SHEET_NAME}!A2:${dataLastCol}${rows.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: rows
        }
      });
      console.log(`✓ Wrote ${rows.length} events`);
    } else {
      console.log('ℹ️  No events to write');
    }

    // Step 7: Prefix sheet title with Partner UUID
    console.log('\n🏷️  Adding UUID prefix to sheet title...');
    const currentTitle = metadata.data.properties?.title || '';
    const uuid = String(partner._id);
    
    if (!currentTitle.startsWith(uuid)) {
      const newTitle = `${uuid} — ${currentTitle}`;
      await drive.files.update({
        fileId: sheetId,
        requestBody: { name: newTitle }
      });
      console.log(`✓ Renamed to: "${newTitle}"`);
    } else {
      console.log('✓ Title already has UUID prefix');
    }

    // Step 8: Update partner document with googleSheetsUrl
    console.log('\n💾 Updating partner document...');
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;
    await db.collection('partners').updateOne(
      { _id: partner._id },
      {
        $set: {
          googleSheetsUrl: sheetUrl,
          'googleSheetConfig.sheetId': sheetId,
          'googleSheetConfig.sheetName': SHEET_NAME,
          'googleSheetConfig.enabled': true,
          'googleSheetConfig.syncMode': 'manual',
          'googleSheetConfig.uuidColumn': 'A',
          'googleSheetConfig.headerRow': 1,
          'googleSheetConfig.dataStartRow': 2,
          updatedAt: new Date().toISOString()
        }
      }
    );
    console.log('✓ Partner document updated');

    console.log('\n━'.repeat(60));
    console.log('✅ Setup complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Partner: ${partnerName}`);
    console.log(`   UUID: ${partner._id}`);
    console.log(`   Events: ${events.length}`);
    console.log(`   Sheet URL: ${sheetUrl}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Open the sheet and verify the data');
    console.log('   2. Use Pull/Push buttons in Partner Edit modal');
    console.log('   3. Test sync with /api/partners/[id]/google-sheet/pull');
    console.log('━'.repeat(60) + '\n');

  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message);
    if (error.code === 404) {
      console.log('💡 The sheet ID may be incorrect or the service account may not have access');
    }
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
