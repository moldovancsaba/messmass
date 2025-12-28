/**
 * Google Sheets Auto-Setup API Endpoint
 * 
 * WHAT: Automatically configure a blank Google Sheet for MessMass event sync
 * WHY: User creates sheet → pastes URL → clicks Connect → everything else is automated
 * HOW: Rename Sheet1 → Events, add 300 columns, write headers, populate events, prefix UUID
 * 
 * POST /api/partners/[id]/google-sheet/setup
 * Body: { sheetId: string }
 * Returns: { success, eventsWritten, message }
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { createSheetsClient, createDriveClient } from '@/lib/googleSheets/client';
import { columnIndexToLetter, columnLetterToIndex, SHEET_HEADER_LABELS } from '@/lib/googleSheets/columnMap';
import { eventToRow } from '@/lib/googleSheets/rowMapper';
import config from '@/lib/config';

const SHEET_NAME = 'Events';
const MIN_COLUMNS = 300; // Increased to support extended KYC variables

// Dynamically construct headers from shared configuration
// WHAT: Ensure headers match the column map exactly
// WHY: Prevent drift between setup headers and sync logic
function getSheetHeaders(): string[] {
  const headers: string[] = [];
  // Find the last defined column in SHEET_HEADER_LABELS
  const cols = Object.keys(SHEET_HEADER_LABELS);
  let maxIndex = 0;
  
  cols.forEach(col => {
    const idx = columnLetterToIndex(col);
    if (idx > maxIndex) maxIndex = idx;
  });
  
  // Fill array up to maxIndex
  for (let i = 0; i <= maxIndex; i++) {
    const letter = columnIndexToLetter(i);
    headers.push(SHEET_HEADER_LABELS[letter] || '');
  }
  
  return headers;
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
    const db = client.db(config.dbName);
    const partners = db.collection('partners');

    const partner = await partners.findOne({ _id: new ObjectId(id) });
    if (!partner) {
      console.error(`Partner not found: ${id}`);
      return NextResponse.json({ 
        success: false, 
        error: `Partner not found with ID: ${id}. Please verify the partner exists in the database.` 
      }, { status: 404 });
    }

    const sheets = createSheetsClient();
    const drive = createDriveClient();

    // Step 1: Get spreadsheet metadata
    const metadata = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const existingEvents = metadata.data.sheets?.find((s: any) => s.properties?.title === SHEET_NAME);
    const sheet1 = metadata.data.sheets?.find((s: any) => s.properties?.title === 'Sheet1');

    // Step 2: Ensure Events tab exists (rename Sheet1 or create new)
    if (!existingEvents) {
      if (sheet1 && sheet1.properties) {
        // Rename Sheet1 to Events
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
      } else {
        // Create Events tab if Sheet1 doesn't exist
        console.log('📝 Creating "Events" sheet tab...');
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: SHEET_NAME,
                    gridProperties: {
                      rowCount: 10000,
                      columnCount: MIN_COLUMNS
                    }
                  }
                }
              }
            ]
          }
        });
      }
    }

    // Step 3: Ensure 300 columns (if not already set during creation)
    const updatedMetadata = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const eventsTab = updatedMetadata.data.sheets?.find((s: any) => s.properties?.title === SHEET_NAME);

    if (!eventsTab || !eventsTab.properties) {
      // This should never happen now, but fail gracefully if it does
      return NextResponse.json({ success: false, error: 'Events tab not found after setup' }, { status: 500 });
    }

    const currentColumns = eventsTab.properties.gridProperties?.columnCount || 26;
    if (currentColumns < MIN_COLUMNS) {
      console.log(`📐 Expanding columns from ${currentColumns} to ${MIN_COLUMNS}...`);
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
    } else {
      console.log(`✓ Sheet already has ${currentColumns} columns (need ${MIN_COLUMNS})`);
    }

    // Step 4: Write headers
    const headers = getSheetHeaders();
    const headerLastCol = columnIndexToLetter(Math.max(headers.length - 1, MIN_COLUMNS - 1));
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!A1:${headerLastCol}1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers]
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
      // Step 6: Populate events using shared rowMapper
      const rows = events.map(event => {
        // WHAT: Ensure partner name is populated
        // WHY: Project documents might not store partnerName redundantly
        // Since we are in the context of this partner, we can safely assign it
        if (!event.partnerName && !event.partner1Name) {
          // If it's a match (has partner2Id), set partner1Name
          if (event.partner2Id) {
            event.partner1Name = partner.name;
          } else {
            // Otherwise set generic partnerName
            event.partnerName = partner.name;
          }
        }
        return eventToRow(event);
      });
      const dataLastCol = columnIndexToLetter(Math.max(headers.length - 1, MIN_COLUMNS - 1));

      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${SHEET_NAME}!A2:${dataLastCol}${rows.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: rows
        }
      });
      eventsWritten = rows.length;

      // Step 6b: Write googleSheetUuid back to project documents
      // WHY: Enable Pull to update existing events by UUID
      console.log('📝 Writing googleSheetUuid back to project documents...');
      const projectsCollection = db.collection('projects');
      const updatePromises = events.map((event: any) => 
        projectsCollection.updateOne(
          { _id: event._id },
          {
            $set: {
              googleSheetUuid: String(event._id),
              googleSheetSource: 'messmass',
              googleSheetSyncedAt: new Date().toISOString()
            }
          }
        )
      );
      await Promise.all(updatePromises);
      console.log(`✅ Updated ${events.length} projects with googleSheetUuid`);
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
