// scripts/setupSzerencsejatek.ts
// WHAT: Create Events sheet tab and populate with Szerencsejáték Zrt. data
// WHY: Set up the complete sheet structure from scratch
// USAGE: npm run ts-node scripts/setupSzerencsejatek.ts

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { columnIndexToLetter } from '@/lib/googleSheets/columnMap';

const PARTNER_NAME = 'Szerencsejáték Zrt.';
const SHEET_ID = '1W1GJX874wYmL5rJ6HviarC1q-GrZ6tYEUBQc1KuT96w';
const SHEET_NAME = 'Events';

// Column headers matching your test sheet structure
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

// Initialize Sheets client
function createSheetsClient() {
  const jsonPath = path.join(process.cwd(), '.google-service-account.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const keyFile = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      const auth = new google.auth.JWT({
        email: keyFile.client_email,
        key: keyFile.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      return google.sheets({ version: 'v4', auth });
    } catch (error) {
      console.error('Failed to load credentials from JSON file:', error);
      throw error;
    }
  }
  throw new Error('Missing .google-service-account.json');
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
  try {
    const sheets = createSheetsClient();
    const client = await clientPromise;
    const db = client.db(config.dbName);

    console.log(`🚀 Setting up ${PARTNER_NAME} sheet\n`);

    // Step 1: Create the Events sheet
    console.log(`📝 Creating "${SHEET_NAME}" sheet tab...`);
    try {
      const columnCount = Math.max(100, SHEET_HEADERS.length); // secure at least 100 columns
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: SHEET_NAME,
                  gridProperties: {
                    rowCount: 5000,
                    columnCount: columnCount
                  }
                }
              }
            }
          ]
        }
      });
      console.log(`✓ "${SHEET_NAME}" sheet created`);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log(`ℹ️  "${SHEET_NAME}" sheet already exists`);
      } else {
        throw error;
      }
    }

    // Step 2: Add header row
    console.log('\n📝 Adding headers...');
    const headerLastCol = columnIndexToLetter(SHEET_HEADERS.length - 1); // e.g., 49 -> AW
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1:${headerLastCol}1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [SHEET_HEADERS]
      }
    });
    console.log('✓ Headers added');

    // Step 3: Get partner
    const partner = await db.collection('partners').findOne({ name: PARTNER_NAME });
    if (!partner) {
      console.error(`❌ Partner not found: ${PARTNER_NAME}`);
      process.exit(1);
    }
    console.log(`\n✓ Found partner: ${partner._id}`);

    // Step 4: Get events
    const events = await db.collection('projects')
      .find({ partnerId: partner._id })
      .sort({ createdAt: 1 })
      .toArray();

    console.log(`\n📊 Found ${events.length} events\n`);

    if (events.length === 0) {
      console.log('ℹ️  No events to add');
      console.log('\n✅ Sheet setup complete!');
      process.exit(0);
    }

    // Step 5: Convert events to rows
    const rows = events.map(eventToRow);

    // Step 6: Write all events
    console.log(`📝 Adding ${rows.length} event rows...`);
    const dataLastCol = headerLastCol; // Use same columns as headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:${dataLastCol}${rows.length + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows
      }
    });
    console.log(`✓ ${rows.length} rows added`);

    // Step 7: Update partner with Google Sheets URL
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}`;
    await db.collection('partners').updateOne(
      { _id: partner._id },
      {
        $set: {
          googleSheetsUrl: sheetUrl,
          updatedAt: new Date().toISOString()
        }
      }
    );
    console.log(`\n✓ Updated partner with sheet URL`);
    console.log(`📊 Sheet: ${sheetUrl}`);

    console.log('\n✅ Sheet setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
