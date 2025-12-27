/**
 * Google Sheets Status API Endpoint
 * 
 * WHAT: Retrieves Google Sheets connection and sync status for a partner
 * WHY: Show current connection status, sync statistics, and sheet health
 * 
 * GET /api/partners/[id]/google-sheet/status
 * 
 * Query Parameters:
 * - checkHealth: boolean (optional) - If true, verifies sheet accessibility
 * 
 * Returns:
 * - success: boolean
 * - connected: boolean
 * - config: GoogleSheetConfig (if connected)
 * - stats: GoogleSheetStats (if connected)
 * - healthCheck: object (if checkHealth=true)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { testConnection } from '@/lib/googleSheets/client';
import config from '@/lib/config';

export async function GET(
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

    // Parse query parameters
    const url = new URL(request.url);
    const checkHealth = url.searchParams.get('checkHealth') === 'true';

    // Get database connection
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const partnersCollection = db.collection('partners');

    // Fetch partner with Google Sheets configuration
    const partner = await partnersCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    const googleSheetConfig = partner.googleSheetConfig;

    // Create response with connection status
    const response: any = {
      success: true,
      connected: !!googleSheetConfig?.enabled,
      partnerId: id,
      partnerName: partner.name || 'Unknown'
    };

    // If connected, include configuration and statistics
    if (response.connected) {
      response.config = {
        sheetUrl: `https://docs.google.com/spreadsheets/d/${googleSheetConfig.sheetId}`,
        sheetId: googleSheetConfig.sheetId,
        sheetName: googleSheetConfig.sheetName,
        uuidColumn: googleSheetConfig.uuidColumn,
        headerRow: googleSheetConfig.headerRow,
        dataStartRow: googleSheetConfig.dataStartRow,
        syncMode: googleSheetConfig.syncMode,
        lastSyncAt: googleSheetConfig.lastSyncAt,
        lastSyncStatus: googleSheetConfig.lastSyncStatus,
        lastSyncError: googleSheetConfig.lastSyncError
      };

      response.stats = partner.googleSheetStats || {
        totalEvents: 0,
        lastPullAt: null,
        lastPushAt: null,
        pullCount: 0,
        pushCount: 0,
        eventsCreated: 0,
        eventsUpdated: 0
      };

      // Optional health check to verify sheet accessibility
      if (checkHealth && googleSheetConfig.sheetId) {
        try {
          const healthCheck = await testConnection(
            googleSheetConfig.sheetId
          );
          
          if (healthCheck.success) {
            response.healthCheck = {
              status: 'healthy',
              sheetAccessible: true,
              sheetExists: true,
              rowCount: healthCheck.rowCount,
              columnCount: healthCheck.columnCount,
              lastChecked: new Date().toISOString(),
              headerLabels: healthCheck.headerLabels || ['Unknown']
            };

            // If sheet has fewer rows than expected, flag it
            const rowCount = healthCheck.rowCount || 0;
            if (rowCount < response.stats.totalEvents) {
              response.healthCheck.status = 'warning';
              response.healthCheck.warning = 
                `Sheet has ${rowCount} rows but database expects ${response.stats.totalEvents} events`;
            }
          } else {
            response.healthCheck = {
              status: 'error',
              sheetAccessible: false,
              lastChecked: new Date().toISOString(),
              error: healthCheck.error
            };
          }
        } catch (error) {
          response.healthCheck = {
            status: 'error',
            sheetAccessible: false,
            lastChecked: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error during health check'
          };
        }
      }

      // Add helpful information for troubleshooting
      response.info = {
        connectedAt: googleSheetConfig.updatedAt || 'Unknown',
        sheetUrl: `https://docs.google.com/spreadsheets/d/${googleSheetConfig.sheetId}`,
        serviceName: 'MessMass Google Sheets Integration',
        serviceAccount: googleSheetConfig.serviceAccountEmail,
        uuidColumn: googleSheetConfig.uuidColumn || 'A',
        integrationVersion: 'v2.0'
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching Google Sheets status:', error);
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