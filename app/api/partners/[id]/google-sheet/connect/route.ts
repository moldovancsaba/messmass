/**
 * Google Sheets Connect API Endpoint
 * 
 * WHAT: Connects a Google Sheet to a partner for event sync
 * WHY: Enable bidirectional sync between Google Sheets and MessMass
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
import clientPromise from '@/lib/mongodb';
import { testConnection } from '@/lib/googleSheets/client';

interface ConnectRequest {
  sheetId: string;
  sheetName?: string;
  syncMode?: 'manual' | 'auto';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Test connection to verify sheet exists and is accessible
    const connectionTest = await testConnection(sheetId, sheetName);
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

    // Get service account email from environment
    const serviceAccountEmail = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
    if (!serviceAccountEmail) {
      return NextResponse.json(
        { success: false, error: 'Service account email not configured' },
        { status: 500 }
      );
    }

    // Prepare Google Sheets configuration
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
      columnMap: null // Use default column map
    };

    // Initialize Google Sheets statistics
    const googleSheetStats = {
      totalEvents: connectionTest.rowCount || 0,
      lastPullAt: null,
      lastPushAt: null,
      pullCount: 0,
      pushCount: 0,
      eventsCreated: 0,
      eventsUpdated: 0
    };

    // Update partner in database
    const client = await clientPromise;
    const db = client.db();
    const partnersCollection = db.collection('partners');
    
    const result = await partnersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          googleSheetConfig,
          googleSheetStats,
          updatedAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully connected to Google Sheet "${sheetName}"`,
      config: googleSheetConfig,
      stats: googleSheetStats
    });

  } catch (error) {
    console.error('Error connecting Google Sheet:', error);
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
