/**
 * Google Sheets Auto-Setup API Endpoint
 * 
 * WHAT: Automatically configure a blank Google Sheet for MessMass event sync
 * WHY: User creates sheet → pastes URL → clicks Connect → everything else is automated
 * HOW: Rename Sheet1 → Events, add 100 columns, write headers, populate events, prefix UUID
 * 
 * POST /api/partners/[id]/google-sheet/setup
 * Body: { sheetId: string }
 * Returns: { success, eventsWritten, message }
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { createSheetsClient, createDriveClient } from '@/lib/googleSheets/client';
import { columnIndexToLetter } from '@/lib/googleSheets/columnMap';

const SHEET_NAME = 'Events';
const MIN_COLUMNS = 100;

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid partner ID' }, { status: 400 });
    }

    const body = await request.json();
    const { sheetId } = body;

    if (!sheetId) {
      return NextResponse.json({ success: false, error: 'Sheet ID required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const partners = db.collection('partners');

    const partner = await partners.findOne({ _id: new ObjectId(id) });
    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });
    }

    const sheets = createSheetsClient();
    const drive = createDriveClient();

    // Step 1: Get spreadsheet metadata
    const metadata = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheet1 = metadata.data.sheets?.find((s: any) => s.properties?.title === 'Sheet1');

    // Step 2: Rename Sheet1 to Events (if it exists)
    if (sheet1) {
      const sheet1Id = sheet1.properties.sheetId;
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
    }

    // Step 3: Ensure 100 columns
    const updatedMetadata = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const eventsTab = updatedMetadata.data.sheets?.find((s: any) => s.properties?.title === SHEET_NAME);

    if (!eventsTab) {
      return NextResponse.json({ success: false, error: 'Events tab not found after rename' }, { status: 500 });
    }

    const currentColumns = eventsTab.properties.gridProperties?.columnCount || 26;
    if (currentColumns < MIN_COLUMNS) {
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
    }

    // Step 4: Write headers
    const headerLastCol = columnIndexToLetter(Math.max(SHEET_HEADERS.length - 1, MIN_COLUMNS - 1));
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!A1:${headerLastCol}1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [SHEET_HEADERS]
      }
    });

    // Step 5: Get partner events
    const events = await db.collection('projects')
      .find({
        $or: [
          { partnerId: partner._id },
          { partnerId: String(partner._id) },
          { partnerName: partner.name },
          { 'partnerContext.partnerId': partner._id },
          { 'partnerContext.partnerName': partner.name },
          { partner1Id: partner._id }
        ]
      })
      .sort({ eventDate: 1 })
      .toArray();

    let eventsWritten = 0;
    if (events.length > 0) {
      // Step 6: Populate events
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
      eventsWritten = rows.length;
    }

    // Step 7: Prefix sheet title with Partner UUID
    const currentTitle = metadata.data.properties?.title || '';
    const uuid = String(partner._id);

    if (!currentTitle.startsWith(uuid)) {
      const newTitle = `${uuid} — ${currentTitle}`;
      await drive.files.update({
        fileId: sheetId,
        requestBody: { name: newTitle }
      });
    }

    // Step 8: Update partner document with URL
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;
    await partners.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          googleSheetsUrl: sheetUrl,
          updatedAt: new Date().toISOString()
        }
      }
    );

    return NextResponse.json({
      success: true,
      eventsWritten,
      message: `Setup complete: ${eventsWritten} events written`
    });

  } catch (error: any) {
    console.error('Auto-setup failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
