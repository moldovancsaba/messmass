/**
 * Google Sheets Connect API Endpoint
 * 
 * WHAT: Connects a Google Sheet to a partner for event sync
 * WHY: Enable bidirectional sync between Google Sheets and {messmass}
 * 
 * POST /api/partners/[id]/google-sheet/connect
 * 
 * Request Body:
 * - sheetId: string (required) - Google Sheet ID from URL
 * - sheetName: string (optional, default: "Events") - Tab name
 * - syncMode: 'manual' | 'auto' (optional, default: 'manual')
 * 
 * Returns:
 * - success: boolean
 * - message: string
 * - config: GoogleSheetConfig (updated configuration)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { testConnection } from '@/lib/googleSheets/client';
import { connectPartnerToSheet } from '@/lib/googleSheets/partnerSheetOps';
import { error as logError, debug as logDebug } from '@/lib/logger';

interface ConnectRequest {
  sheetId: string;
  sheetName?: string;
  syncMode?: 'manual' | 'auto';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;
  try {
    const paramsResolved = await params;
    id = paramsResolved.id;

    // Validate partner ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid partner ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body: ConnectRequest = await request.json();
    const { sheetId, sheetName = 'Events', syncMode = 'manual' } = body;

    // Validate required fields
    if (!sheetId || typeof sheetId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Sheet ID is required' },
        { status: 400 }
      );
    }
    
    // DEBUG: Log sheet ID details
    logDebug('Received sheetId for connection', { context: 'google-sheet-connect', partnerId: id, sheetId, sheetIdLength: sheetId.length, sheetIdType: typeof sheetId, isValidFormat: /^[a-zA-Z0-9_-]+$/.test(sheetId) });
    
    // Validate sheet ID format (should be alphanumeric with hyphens/underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(sheetId)) {
      return NextResponse.json(
        { success: false, error: `Invalid Sheet ID format. Received: "${sheetId}"` },
        { status: 400 }
      );
    }

    // Test connection to verify sheet exists and is accessible
    const connectionTest = await testConnection(sheetId);
    if (!connectionTest.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to connect to Google Sheet: ${connectionTest.error}`,
          details: connectionTest.error
        },
        { status: 400 }
      );
    }

    // Persist config + initialize stats (uses actual data-row count; avoids gridProperties rowCount confusion).
    const { config: googleSheetConfig, stats: googleSheetStats } = await connectPartnerToSheet({
      partnerId: id,
      sheetId,
      sheetName,
      syncMode
    });

    return NextResponse.json({
      success: true,
      message: `Successfully connected to Google Sheet "${sheetName}"`,
      config: googleSheetConfig,
      stats: googleSheetStats
    });

  } catch (error) {
    logError('Error connecting Google Sheet', { context: 'google-sheet-connect', partnerId: id || 'unknown' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
