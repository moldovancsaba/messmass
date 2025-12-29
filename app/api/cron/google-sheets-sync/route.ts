/**
 * Google Sheets Cron Sync API Endpoint
 * 
 * WHAT: Automated background sync for all partners with Google Sheets enabled
 * WHY: Keep MessMass and Google Sheets in sync without manual intervention
 * HOW: Iterate through partners with syncMode='auto', pull events, log results
 * 
 * GET /api/cron/google-sheets-sync
 * 
 * Auth: Requires CRON_SECRET in Authorization header (for Vercel Cron or external scheduler)
 * 
 * Returns:
 * - success: boolean
 * - summary: { partnersProcessed, partnersFailed, totalEventsCreated, totalEventsUpdated }
 * - results: Array<{ partnerId, partnerName, status, summary?, error? }>
 */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { pullEventsFromSheet } from '@/lib/googleSheets/pullEvents';
import { ObjectId } from 'mongodb';
import { error as logError, warn as logWarn } from '@/lib/logger';

// Use Node.js runtime (not edge) because googleapis requires Node.js modules
export const maxDuration = 300; // 5 minutes max execution (adjust based on your plan)

export async function GET(request: NextRequest) {
  try {
    // Auth check: require CRON_SECRET in Authorization header
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret) {
      logWarn('CRON_SECRET not configured - cron endpoint is unprotected', { context: 'cron-google-sheets-sync' });
    } else if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const partnersCollection = db.collection('partners');
    const projectsCollection = db.collection('projects');

    // Find all partners with auto sync enabled
    const partners = await partnersCollection.find({
      'googleSheetConfig.enabled': true,
      'googleSheetConfig.syncMode': 'auto'
    }).toArray();

    if (partners.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No partners configured for auto sync',
        summary: {
          partnersProcessed: 0,
          partnersFailed: 0,
          totalEventsCreated: 0,
          totalEventsUpdated: 0
        },
        results: []
      });
    }

    const summary = {
      partnersProcessed: 0,
      partnersFailed: 0,
      totalEventsCreated: 0,
      totalEventsUpdated: 0
    };
    const results: Array<{
      partnerId: string;
      partnerName: string;
      status: 'success' | 'error';
      summary?: any;
      error?: string;
    }> = [];

    // Process each partner sequentially (avoid rate limits)
    for (const partner of partners) {
      const partnerId = partner._id.toString();
      const partnerName = partner.name || 'Unknown';
      const cfg = partner.googleSheetConfig;

      try {
        // Create database access functions (same as pull endpoint)
        const dbAccess = {
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
          createEvents: async (events: any[]) => {
            const projects = events.map(event => ({
              ...event,
              _id: new ObjectId(),
              partnerId: partner._id,  // WHAT: Use actual partner ObjectId from DB. WHY: Ensures proper partner association.
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }));
            const result = await projectsCollection.insertMany(projects);
            return Object.values(result.insertedIds).map((id, index) => ({
              id: id.toString(),
              data: projects[index]
            }));
          },
          updateEvents: async (updates: Array<{ uuid: string; data: any }>) => {
            const updateResults = [];
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
                updateResults.push({ id: update.uuid, data: update.data });
              }
            }
            return updateResults;
          },
          updateSheetWithUuid: async () => ({ success: true }),
          updatePartnerSyncStats: async (syncStats: any) => {
            const now = new Date().toISOString();
            await partnersCollection.updateOne(
              { _id: partner._id },
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
          updatePartnerError: async (error: string) => {
            await partnersCollection.updateOne(
              { _id: partner._id },
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

        // Execute pull
        const pullResult = await pullEventsFromSheet(
          cfg.sheetId,
          cfg.sheetName,
          dbAccess,
          {
            dryRun: false,
            partnerId: partnerId,
            config: cfg,
            context: {
              timestamp: new Date().toISOString(),
              operation: 'cron-pull',
              userAgent: 'MessMass-Cron'
            }
          }
        );

        if (pullResult.success) {
          summary.partnersProcessed++;
          summary.totalEventsCreated += pullResult.eventsCreated || 0;
          summary.totalEventsUpdated += pullResult.eventsUpdated || 0;
          results.push({
            partnerId,
            partnerName,
            status: 'success',
            summary: {
              eventsCreated: pullResult.eventsCreated,
              eventsUpdated: pullResult.eventsUpdated,
              eventsFailed: pullResult.errors?.length || 0
            }
          });
        } else {
          summary.partnersFailed++;
          results.push({
            partnerId,
            partnerName,
            status: 'error',
            error: pullResult.error || 'Unknown error'
          });
          await dbAccess.updatePartnerError(pullResult.error || 'Unknown error');
        }
      } catch (error) {
        summary.partnersFailed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          partnerId,
          partnerName,
          status: 'error',
          error: errorMessage
        });
        // Update partner error status
        await partnersCollection.updateOne(
          { _id: partner._id },
          {
            $set: {
              'googleSheetConfig.lastSyncStatus': 'error',
              'googleSheetConfig.lastSyncError': errorMessage,
              updatedAt: new Date().toISOString()
            }
          }
        );
      }

      // Rate limit: sleep 500ms between partners to avoid Google API rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${summary.partnersProcessed} partners (${summary.partnersFailed} failed)`,
      summary,
      results
    });

  } catch (error) {
    logError('Cron sync failed', { context: 'cron-google-sheets-sync' }, error instanceof Error ? error : new Error(String(error)));
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
