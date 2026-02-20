/**
 * Google Sheets Provision API Endpoint (Phase 2.5)
 *
 * WHAT: Create + setup + connect a new Google Sheet for a partner in one step.
 * WHY: Auto-provisioning is required for new partners (no manual sheet creation).
 * HOW: Create spreadsheet via Sheets API (Drive scope), then run setupPartnerSheet + connectPartnerToSheet.
 *
 * POST /api/partners/[id]/google-sheet/provision
 * Body: { syncMode?: 'manual' | 'auto' }
 * Returns: { success, sheetId, sheetUrl, eventsWritten }
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { provisionPartnerSheet } from '@/lib/googleSheets/partnerSheetOps';
import { error as logError } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;
  try {
    const paramsResolved = await params;
    id = paramsResolved.id;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid partner ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const syncMode = body?.syncMode === 'auto' ? 'auto' : 'manual';

    const { sheetId, sheetUrl, eventsWritten } = await provisionPartnerSheet({ partnerId: id, syncMode });

    return NextResponse.json({
      success: true,
      sheetId,
      sheetUrl,
      eventsWritten,
      message: 'Provisioned Google Sheet and connected partner',
    });
  } catch (error) {
    logError(
      'Error provisioning Google Sheet',
      { context: 'google-sheet-provision', partnerId: id || 'unknown' },
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

