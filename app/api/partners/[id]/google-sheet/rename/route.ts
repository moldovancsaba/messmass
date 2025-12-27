/**
 * Google Sheets Rename API Endpoint
 * 
 * WHAT: Prefix spreadsheet title with Partner UUID
 * WHY: Make the sheet uniquely searchable/traceable by system UUID
 * 
 * POST /api/partners/[id]/google-sheet/rename
 * Body: { prefixUuid?: string } // optional override; defaults to partner._id
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { createDriveClient } from '@/lib/googleSheets/client';
import { google } from 'googleapis';
import config from '@/lib/config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid partner ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const prefixUuid: string | undefined = body?.prefixUuid;

    const client = await clientPromise;
    const db = client.db(config.dbName);
    const partners = db.collection('partners');

    const partner = await partners.findOne({ _id: new ObjectId(id) });
    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });
    }

    const cfg = partner.googleSheetConfig;
    if (!cfg?.sheetId) {
      return NextResponse.json({ success: false, error: 'Partner has no connected Google Sheet' }, { status: 400 });
    }

    const drive = createDriveClient();

    // Fetch existing title via Drive API (fields: name)
    const fileMeta = await drive.files.get({ fileId: cfg.sheetId, fields: 'id, name' });
    const currentName = fileMeta.data.name || 'Untitled';
    const uuid = prefixUuid || String(partner._id);

    // If it already starts with UUID, skip
    if (currentName.startsWith(uuid)) {
      return NextResponse.json({ success: true, message: 'Already prefixed', name: currentName });
    }

    const newName = `${uuid} — ${currentName}`;

    await drive.files.update({ fileId: cfg.sheetId, requestBody: { name: newName } });

    // Optionally store last rename in partner metadata
    await partners.updateOne(
      { _id: new ObjectId(id) },
      { $set: { 'googleSheetConfig.lastRenamedAt': new Date().toISOString() } }
    );

    return NextResponse.json({ success: true, name: newName });
  } catch (error) {
    console.error('Rename sheet failed:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}