/**
 * Google Sheets Pull Events API Endpoint
 * 
 * WHAT: Pulls events from Google Sheet and creates/updates projects in MessMass
 * WHY: Synchronize sheet data with MessMass database
 * 
 * POST /api/partners/[id]/google-sheet/pull
 * 
 * Query Parameters:
 * - dryRun: boolean (optional) - If true, only preview changes without committing
 * 
 * Returns:
 * - success: boolean
 * - summary: PullSummary with counts and errors
 * - preview: array (if dryRun) - Preview of changes that would be made
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { pullEventsFromSheet } from '@/lib/googleSheets/pullEvents';
import config from '@/lib/config';
import { error as logError } from '@/lib/logger';

interface PullRequest {
  dryRun?: boolean;
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
    const body: PullRequest = await request.json();
    const { dryRun = false } = body;

    // Get database connection
    const client = await clientPromise;
    const db = client.db(config.dbName);
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
      // Get existing projects by UUID for comparison
      getEventsByUuids: async (uuids: string[]) => {
        const projects = await projectsCollection.find({
          googleSheetUuid: { $in: uuids }
        }).toArray();
        
        return projects.map(p => ({
          id: p._id.toString(),
          uuid: p.googleSheetUuid,
          data: p
        }));
      },
      
      // Create new projects from sheet data
      createEvents: async (events: any[]) => {
        if (dryRun) {
          // For dry run, return what would be created
          return events.map(e => ({ id: 'dryrun-' + Math.random(), data: e }));
        }
        
        const projects = events.map(event => ({
          ...event,
          _id: new ObjectId(),
          partnerId: new ObjectId(id),  // WHAT: Convert string ID to ObjectId. WHY: Ensures consistent DB field type.
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        const result = await projectsCollection.insertMany(projects);
        // Convert insertedIds object to array (MongoDB 6+ returns object, not array)
        return Object.values(result.insertedIds).map((id, index) => ({
          id: id.toString(),
          data: projects[index]
        }));
      },
      
      // Update existing projects from sheet data
      updateEvents: async (updates: Array<{ uuid: string; data: any }>) => {
        if (dryRun) {
          // For dry run, return what would be updated
          return updates.map(u => ({ id: 'dryrun-' + u.uuid, data: u.data }));
        }
        
        const results = [];
        for (const update of updates) {
          const result = await projectsCollection.updateOne(
            { googleSheetUuid: update.uuid },
            { 
              $set: {
                ...update.data,
                updatedAt: new Date().toISOString(),
                googleSheetSyncedAt: new Date().toISOString()
              }
            }
          );
          
          if (result.matchedCount > 0) {
            results.push({ id: update.uuid, data: update.data });
          }
        }
        return results;
      },
      
      // Update UUID in sheet (write-back)
      updateSheetWithUuid: async (rowNumber: number, uuid: string) => {
        if (dryRun) {
          return { success: true, message: 'Dry run: Would update row ' + rowNumber };
        }
        // This is handled by the pullEventsFromSheet function
        return { success: true, message: 'UUID will be written back' };
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

    // Execute the pull operation
    const result = await pullEventsFromSheet(sheetId, sheetName, dbAccess, {
      dryRun,
      partnerId: id,
      config: googleSheetConfig,
      // Additional context for the operations
      context: {
        timestamp: new Date().toISOString(),
        operation: 'pull',
        userAgent: request.headers.get('user-agent') || 'Unknown'
      }
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to pull events from Google Sheet',
          summary: result
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: dryRun 
        ? 'Dry run completed. No changes were made.'
        : `Successfully pulled ${result.eventsCreated + result.eventsUpdated} events from Google Sheet`,
      summary: result,
      preview: result.results || null
    });

  } catch (error) {
    logError('Error pulling events from Google Sheet', { context: 'google-sheet-pull', partnerId: id }, error instanceof Error ? error : new Error(String(error)));
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