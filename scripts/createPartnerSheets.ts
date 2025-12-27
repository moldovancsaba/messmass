// scripts/createPartnerSheets.ts
// WHAT: Create Google Sheets for specified partners and populate with their events
// WHY: Bulk initialization of Google Sheets sync for multiple partners
// USAGE: npm run ts-node scripts/createPartnerSheets.ts

import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import config from '@/lib/config';

// Partner names to create sheets for
const PARTNER_NAMES = [
  'Szerencsejáték Zrt.',
  'Újpest FC',
  'MTK'
];

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

// Get auth client
const getAuthClient = (): JWT => {
  const email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

  if (!email || !privateKey) {
    throw new Error('Google Sheets credentials not configured');
  }

  // WHAT: Handle private key that may be quoted or have escaped newlines
  // WHY: Environment variables from .env files may have quotes or escaped characters
  // Remove surrounding quotes if present
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  
  // Replace escaped newlines with actual newlines
  privateKey = privateKey.replace(/\\n/g, '\n');

  console.log('📋 Auth config:');
  console.log(`  Email: ${email}`);
  console.log(`  Key starts with: ${privateKey.substring(0, 30)}...`);
  console.log(`  Key contains BEGIN: ${privateKey.includes('BEGIN PRIVATE KEY')}`);
  console.log(`  Key contains END: ${privateKey.includes('END PRIVATE KEY')}`);

  return new JWT({
    email,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });
};

// Create a new Google Sheet
async function createSheet(partnerName: string): Promise<string> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  try {
    // Create spreadsheet
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `${partnerName} Events`,
        },
      },
    });

    const sheetId = response.data.spreadsheetId;
    if (!sheetId) throw new Error('Failed to create sheet');

    // Add headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Sheet1!A1:AO1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [SHEET_HEADERS],
      },
    });

    // Rename sheet to "Events"
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              fields: 'title',
              properties: {
                sheetId: 0,
                title: 'Events',
              },
            },
          },
        ],
      },
    });

    console.log(`✅ Created sheet for "${partnerName}": ${sheetId}`);
    return sheetId;
  } catch (error) {
    console.error(`❌ Failed to create sheet for "${partnerName}":`, error);
    throw error;
  }
}

// Get all projects (events) for a partner
async function getPartnerEvents(partnerId: ObjectId) {
  const client = await clientPromise;
  const db = client.db(config.dbName);

  return await db.collection('projects')
    .find({ partnerId: partnerId })
    .sort({ createdAt: 1 })
    .toArray();
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

// Append events to sheet
async function appendEventsToSheet(sheetId: string, events: any[]): Promise<void> {
  if (events.length === 0) {
    console.log(`  ℹ️  No events to add`);
    return;
  }

  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const rows = events.map(eventToRow);

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Events!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows,
      },
    });

    console.log(`✅ Added ${rows.length} events to sheet`);
  } catch (error) {
    console.error(`❌ Failed to append events to sheet:`, error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    const client = await clientPromise;
    const db = client.db(config.dbName);

    console.log('🚀 Creating Google Sheets for partners...\n');

    for (const partnerName of PARTNER_NAMES) {
      console.log(`\n📋 Processing: ${partnerName}`);

      // Find partner
      const partner = await db.collection('partners').findOne({ name: partnerName });
      if (!partner) {
        console.error(`  ❌ Partner not found: ${partnerName}`);
        continue;
      }

      console.log(`  ✓ Found partner ID: ${partner._id}`);

      // Create sheet
      const sheetId = await createSheet(partnerName);

      // Get events
      const events = await getPartnerEvents(partner._id);
      console.log(`  ✓ Found ${events.length} events`);

      // Add events to sheet
      await appendEventsToSheet(sheetId, events);

      // Update partner document with googleSheetsUrl
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;
      await db.collection('partners').updateOne(
        { _id: partner._id },
        {
          $set: {
            googleSheetsUrl: sheetUrl,
            updatedAt: new Date().toISOString()
          }
        }
      );

      console.log(`  ✓ Updated partner with sheet URL`);
      console.log(`  📊 Sheet: ${sheetUrl}`);
    }

    console.log('\n✅ All sheets created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
