/**
 * Google Sheets Push Events API Endpoint
 * 
 * WHAT: Pushes MessMass events to Google Sheet and updates rows
 * WHY: Synchronize MessMass database with Google Sheets
 * 
 * POST /api/partners/[id]/google-sheet/push
 * 
 * Query Parameters:
 * - dryRun: boolean (optional) - If true, only preview changes without committing
 * - eventId: string (optional) - Push single event instead of all events
 * 
 * Returns:
 * - success: boolean
 * - summary: PushSummary with counts and errors
 * - preview: array (if dryRun) - Preview of changes that would be made
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { pushEventsToSheet } from '@/lib/googleSheets/pushEvents';

interface PushRequest {
  dryRun?: boolean;
  eventId?: string;
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
    const body: PushRequest = await request.json();
    const { dryRun = false, eventId } = body;

    // Get database connection
    const client = await clientPromise;
    const db = client.db();
    const partnersCollection = db.collection('partners');
    const projectsCollection = db.collection('projects');

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

    // Check if Google Sheets is configured and enabled
    if (!googleSheetConfig || !googleSheetConfig.enabled) {
      return NextResponse.json(
        { success: false, error: 'Google Sheets is not configured for this partner' },
        { status: 400 }
      );
    }

    // Extract configuration details
    const { sheetId, sheetName } = googleSheetConfig;

    if (!sheetId || !sheetName) {
      return NextResponse.json(
        { success: false, error: 'Invalid Google Sheets configuration' },
        { status: 400 }
      );
    }

    // Create database access functions for the sync logic
    const dbAccess = {
      // Get events for this partner (or single event if specified)
      getEvents: async () => {
        const query: any = { partnerId: id };

        // If eventId is specified, filter by it
        if (eventId) {
          if (!ObjectId.isValid(eventId)) {
            throw new Error('Invalid event ID');
          }
          query._id = new ObjectId(eventId);
        }

        const projects = await projectsCollection.find(query).toArray();
        return projects.map(p => ({
          id: p._id.toString(),
          data: p
        }));
      },
      
      // Create new rows in sheet
      createSheetRows: async (events: any[]) => {
        if (dryRun) {
          // For dry run, return what would be created
          return events.map(e => ({
            rowNumber: 100 + Math.floor(Math.random() * 100), // Mock row number
            eventData: e
          }));
        }
        
        // This is handled by the pushEventsToSheet function
        return events.map(e => ({
          rowNumber: null, // Will be set by the push function
          eventData: e
        }));
      },
      
      // Update existing rows in sheet
      updateSheetRows: async (updates: Array<{ rowNumber: number; eventData: any; uuid?: string }>) => {
        if (dryRun) {
          // For dry run, return what would be updated
          return updates.map(u => ({
            rowNumber: u.rowNumber,
            eventData: u.eventData
          }));
        }
        
        // This is handled by the pushEventsToSheet function
        return updates;
      },
      
      // Update UUID in project after creating sheet row
      updateEventWithUuid: async (eventId: string, uuid: string, rowNumber: number) => {
        if (dryRun) {
          return { success: true, message: 'Dry run: Would update event with UUID' };
        }
        
        const result = await projectsCollection.updateOne(
          { _id: new ObjectId(eventId) },
          { 
            $set: {
              googleSheetUuid: uuid,
              googleSheetModifiedAt: new Date().toISOString(),
              googleSheetSource: { type: 'push', rowNumber },
              updatedAt: new Date().toISOString()
            }
          }
        );
        
        return { success: result.matchedCount > 0 };
      },
      
      // Update partner sync statistics and status
      updatePartnerSyncStats: async (syncStats: any) => {
        if (dryRun) {
          return { success: true, message: 'Dry run: Would update partner stats' };
        }
        
        const now = new Date().toISOString();
        await partnersCollection.updateOne(
          { _id: new ObjectId(id) },
          { 
            $set: {
              'googleSheetStats': syncStats,
              'googleSheetConfig.lastSyncAt': now,
              'googleSheetConfig.lastSyncStatus': 'success',
              'googleSheetConfig.lastSyncError': null,
              updatedAt: now
            }
          }
        );
        
        return { success: true };
      },
      
      // Update partner error status
      updatePartnerError: async (error: string) => {
        if (dryRun) {
          return { success: true, message: 'Dry run: Would update partner error' };
        }
        
        await partnersCollection.updateOne(
          { _id: new ObjectId(id) },
          { 
            $set: {
              'googleSheetConfig.lastSyncStatus': 'error',
              'googleSheetConfig.lastSyncError': error,
              updatedAt: new Date().toISOString()
            }
          }
        );
        
        return { success: true };
      }
    };

    // Execute the push operation
    const result = await pushEventsToSheet(sheetId, sheetName, dbAccess, {
      dryRun,
      partnerId: id,
      config: googleSheetConfig,
      eventId,
      // Additional context for the operations
      context: {
        timestamp: new Date().toISOString(),
        operation: 'push',
        userAgent: request.headers.get('user-agent') || 'Unknown'
      }
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to push events to Google Sheet',
          summary: result
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: dryRun 
        ? 'Dry run completed. No changes were made.'
        : `Successfully pushed ${result.rowsCreated + result.rowsUpdated} rows to Google Sheet`,
      summary: result,
      preview: result.preview || null
    });

  } catch (error) {
    console.error('Error pushing events to Google Sheet:', error);
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