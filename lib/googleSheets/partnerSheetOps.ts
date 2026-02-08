// lib/googleSheets/partnerSheetOps.ts
// WHAT: Shared partner<->sheet operations used by multiple API routes
// WHY: Keep setup/connect/provision behavior consistent and avoid route-level drift
// HOW: Encapsulate DB updates + Google API calls behind small, testable helpers

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { info as logInfo, error as logError } from '@/lib/logger';
import { createDriveClient, createSheetsClient, createSheetsClientWithDriveAccess } from './client';
import { columnIndexToLetter, columnLetterToIndex, SHEET_HEADER_LABELS } from './columnMap';
import { eventToRow } from './rowMapper';
import { countSheetDataRows } from './metrics';

const DEFAULT_SHEET_NAME = 'Events';
const MIN_COLUMNS = 300; // supports extended variables

function getSheetHeaders(): string[] {
  const headers: string[] = [];
  const cols = Object.keys(SHEET_HEADER_LABELS);
  let maxIndex = 0;
  cols.forEach((col) => {
    const idx = columnLetterToIndex(col);
    if (idx > maxIndex) maxIndex = idx;
  });
  for (let i = 0; i <= maxIndex; i++) {
    const letter = columnIndexToLetter(i);
    headers.push(SHEET_HEADER_LABELS[letter] || '');
  }
  return headers;
}

export async function setupPartnerSheet(params: { partnerId: string; sheetId: string; sheetName?: string }): Promise<{
  sheetUrl: string;
  eventsWritten: number;
}> {
  const { partnerId, sheetId, sheetName = DEFAULT_SHEET_NAME } = params;
  if (!ObjectId.isValid(partnerId)) throw new Error('Invalid partner ID');
  if (!sheetId) throw new Error('Sheet ID required');

  const client = await clientPromise;
  const db = client.db(config.dbName);
  const partners = db.collection('partners');
  const partner = await partners.findOne({ _id: new ObjectId(partnerId) });
  if (!partner) throw new Error(`Partner not found with ID: ${partnerId}`);

  const sheets = createSheetsClient();
  const drive = createDriveClient();

  // Step 1: Get spreadsheet metadata
  const metadata = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const existingEvents = metadata.data.sheets?.find((s: any) => s.properties?.title === sheetName);
  const sheet1 = metadata.data.sheets?.find((s: any) => s.properties?.title === 'Sheet1');

  // Step 2: Ensure Events tab exists (rename Sheet1 or create new)
  if (!existingEvents) {
    if (sheet1?.properties) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: { sheetId: sheet1.properties.sheetId, title: sheetName },
                fields: 'title',
              },
            },
          ],
        },
      });
    } else {
      logInfo('Creating Events sheet tab', { context: 'google-sheet-setup', partnerId, sheetId, sheetName });
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: { rowCount: 10000, columnCount: MIN_COLUMNS },
                },
              },
            },
          ],
        },
      });
    }
  }

  // Step 3: Ensure enough columns
  const updatedMetadata = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const eventsTab = updatedMetadata.data.sheets?.find((s: any) => s.properties?.title === sheetName);
  if (!eventsTab?.properties) throw new Error('Events tab not found after setup');

  const currentColumns = eventsTab.properties.gridProperties?.columnCount || 26;
  if (currentColumns < MIN_COLUMNS) {
    logInfo('Expanding columns', { context: 'google-sheet-setup', partnerId, sheetId, currentColumns, minColumns: MIN_COLUMNS });
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: { sheetId: eventsTab.properties.sheetId, gridProperties: { columnCount: MIN_COLUMNS } },
              fields: 'gridProperties.columnCount',
            },
          },
        ],
      },
    });
  }

  // Step 4: Write headers
  const headers = getSheetHeaders();
  const headerLastCol = columnIndexToLetter(Math.max(headers.length - 1, MIN_COLUMNS - 1));
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:${headerLastCol}1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [headers] },
  });

  // Step 5: Get partner events
  const events = await db
    .collection('projects')
    .find({
      $or: [
        { partnerId: partner._id },
        { partnerId: String(partner._id) },
        { partnerName: partner.name },
        { 'partnerContext.partnerId': partner._id },
        { 'partnerContext.partnerName': partner.name },
        { partner1Id: partner._id },
      ],
    })
    .sort({ eventDate: 1 })
    .toArray();

  let eventsWritten = 0;
  if (events.length > 0) {
    const rows = events.map((event: any) => {
      if (!event.partnerName && !event.partner1Name) {
        if (event.partner2Id) event.partner1Name = partner.name;
        else event.partnerName = partner.name;
      }
      return eventToRow(event);
    });

    const dataLastCol = columnIndexToLetter(Math.max(headers.length - 1, MIN_COLUMNS - 1));
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetName}!A2:${dataLastCol}${rows.length + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows },
    });
    eventsWritten = rows.length;

    // Write googleSheetUuid back to project documents so future pulls can match.
    logInfo('Writing googleSheetUuid back to project documents', { context: 'google-sheet-setup', partnerId, sheetId, eventCount: events.length });
    const projectsCollection = db.collection('projects');
    await Promise.all(
      events.map((event: any) =>
        projectsCollection.updateOne(
          { _id: event._id },
          {
            $set: {
              googleSheetUuid: String(event._id),
              googleSheetSource: 'messmass',
              googleSheetSyncedAt: new Date().toISOString(),
            },
          }
        )
      )
    );
  }

  // Step 6: Prefix sheet title with Partner UUID (partner._id)
  const currentTitle = metadata.data.properties?.title || '';
  const uuid = String(partner._id);
  if (!currentTitle.startsWith(uuid)) {
    const newTitle = `${uuid} — ${currentTitle}`;
    await drive.files.update({ fileId: sheetId, requestBody: { name: newTitle } });
  }

  // Step 7: Update partner document with URL
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;
  await partners.updateOne(
    { _id: new ObjectId(partnerId) },
    { $set: { googleSheetsUrl: sheetUrl, updatedAt: new Date().toISOString() } }
  );

  return { sheetUrl, eventsWritten };
}

export async function connectPartnerToSheet(params: {
  partnerId: string;
  sheetId: string;
  sheetName?: string;
  syncMode?: 'manual' | 'auto';
}): Promise<{
  config: any;
  stats: any;
}> {
  const { partnerId, sheetId, sheetName = DEFAULT_SHEET_NAME, syncMode = 'manual' } = params;
  if (!ObjectId.isValid(partnerId)) throw new Error('Invalid partner ID');

  const serviceAccountEmail = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  if (!serviceAccountEmail) throw new Error('Service account email not configured');

  const totalEvents = await countSheetDataRows({ sheetId, sheetName, startRow: 2 });

  const googleSheetConfig = {
    enabled: true,
    sheetId,
    sheetName,
    serviceAccountEmail,
    uuidColumn: 'A',
    headerRow: 1,
    dataStartRow: 2,
    lastSyncAt: null,
    lastSyncStatus: 'connected' as const,
    lastSyncError: null,
    syncMode,
    columnMap: null, // default dynamic mapping
  };

  const googleSheetStats = {
    totalEvents,
    lastPullAt: null,
    lastPushAt: null,
    pullCount: 0,
    pushCount: 0,
    eventsCreated: 0,
    eventsUpdated: 0,
  };

  const client = await clientPromise;
  const db = client.db(config.dbName);
  const partnersCollection = db.collection('partners');

  const result = await partnersCollection.updateOne(
    { _id: new ObjectId(partnerId) },
    { $set: { googleSheetConfig, googleSheetStats, updatedAt: new Date().toISOString() } }
  );

  if (result.matchedCount === 0) throw new Error('Partner not found');
  return { config: googleSheetConfig, stats: googleSheetStats };
}

export async function provisionPartnerSheet(params: {
  partnerId: string;
  syncMode?: 'manual' | 'auto';
}): Promise<{
  sheetId: string;
  sheetUrl: string;
  eventsWritten: number;
}> {
  const { partnerId, syncMode = 'manual' } = params;
  if (!ObjectId.isValid(partnerId)) throw new Error('Invalid partner ID');

  const client = await clientPromise;
  const db = client.db(config.dbName);
  const partners = db.collection('partners');
  const partner = await partners.findOne({ _id: new ObjectId(partnerId) });
  if (!partner) throw new Error('Partner not found');

  const sheets = createSheetsClientWithDriveAccess();

  let sheetId: string | undefined;
  try {
    const createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `${partner.name} Events`,
        },
      },
    });
    sheetId = createRes.data.spreadsheetId || undefined;
  } catch (e) {
    logError(
      'Failed to create spreadsheet',
      { context: 'google-sheet-provision', partnerId },
      e instanceof Error ? e : new Error(String(e))
    );
    throw new Error('Failed to create spreadsheet');
  }

  if (!sheetId) throw new Error('Failed to create spreadsheet (missing sheetId)');

  const { sheetUrl, eventsWritten } = await setupPartnerSheet({ partnerId, sheetId });
  await connectPartnerToSheet({ partnerId, sheetId, syncMode });

  logInfo('Provisioned partner sheet', { context: 'google-sheet-provision', partnerId, sheetId, eventsWritten });
  return { sheetId, sheetUrl, eventsWritten };
}

