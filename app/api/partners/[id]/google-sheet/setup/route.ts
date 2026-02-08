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
import { setupPartnerSheet } from '@/lib/googleSheets/partnerSheetOps';
import config from '@/lib/config';
import { error as logError, info as logInfo } from '@/lib/logger';

const SHEET_NAME = 'Events';

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
      logError('Partner not found', { context: 'google-sheet-setup', partnerId: id });
      return NextResponse.json({ 
        success: false, 
        error: `Partner not found with ID: ${id}. Please verify the partner exists in the database.` 
      }, { status: 404 });
    }
    const { sheetUrl, eventsWritten } = await setupPartnerSheet({ partnerId: id, sheetId, sheetName: SHEET_NAME });

    return NextResponse.json({
      success: true,
      eventsWritten,
      sheetUrl,
      message: `Setup complete: ${eventsWritten} events written`
    });

  } catch (error: any) {
    logError('Auto-setup failed', { context: 'google-sheet-setup' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
