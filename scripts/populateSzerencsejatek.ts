// scripts/populateSzerencsejatek.ts
// WHAT: Populate the Szerencsejáték Zrt. Google Sheet with header and existing events
// WHY: Initialize sheet with all partner's event data
// USAGE: npm run ts-node scripts/populateSzerencsejatek.ts

import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import config from '@/lib/config';
import { writeSheetRows, getSheetHeaders } from '@/lib/googleSheets/client';

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
    const client = await clientPromise;
    const db = client.db(config.dbName);

    console.log(`🚀 Populating ${PARTNER_NAME} sheet\n`);

    // Find partner
    const partner = await db.collection('partners').findOne({ name: PARTNER_NAME });
    if (!partner) {
      console.error(`❌ Partner not found: ${PARTNER_NAME}`);
      process.exit(1);
    }
    console.log(`✓ Found partner: ${partner._id}`);

    // Add headers first
    console.log('\n📝 Adding headers...');
    await writeSheetRows(SHEET_ID, SHEET_NAME, 1, [SHEET_HEADERS]);
    console.log('✓ Headers added');

    // Get events
    // NOTE: Historical data may link partners in different ways (ObjectId, string, nested context, or by name).
    // We match across the common variants to ensure we capture all events for this partner.
    const events = await db.collection('projects')
      .find({
        $or: [
          { partnerId: partner._id }, // direct ObjectId reference
          { partnerId: String(partner._id) }, // direct string reference
          { partnerName: PARTNER_NAME }, // denormalized name field
          { 'partnerContext.partnerId': partner._id },
          { 'partnerContext.partnerId': String(partner._id) },
          { 'partnerContext.partnerName': PARTNER_NAME },
          { partner1Id: partner._id },
          { partner1Id: String(partner._id) },
          { 'partner1._id': partner._id },
          { 'partner1._id': String(partner._id) }
        ]
      })
      .sort({ createdAt: 1 })
      .toArray();

    console.log(`\n📊 Found ${events.length} events\n`);

    if (events.length === 0) {
      console.log('ℹ️  No events to add');
      console.log('\n✅ Sheet populated successfully!');
      process.exit(0);
    }

    // Convert events to rows
    const rows = events.map(eventToRow);

    // Write all events
    console.log(`📝 Adding ${rows.length} event rows...`);
    await writeSheetRows(SHEET_ID, SHEET_NAME, 2, rows);
    console.log(`✓ ${rows.length} rows added`);

    // Update partner with Google Sheets URL
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

    console.log('\n✅ Sheet populated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
