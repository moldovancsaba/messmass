/**
 * Analytics Aggregation Cron Job
 * 
 * WHAT: Daily background job to update all analytics aggregates
 * WHY: Keep pre-aggregated metrics current without manual triggers
 * 
 * SCHEDULE: Runs daily at 2:00 AM UTC (configured in cron service like Vercel Cron or similar)
 * 
 * USAGE:
 * - Vercel Cron: Configure in vercel.json
 * - Manual trigger: POST to this endpoint with Authorization header
 * - Local testing: Call endpoint directly
 * 
 * Version: 6.1.0
 * Created: 2025-01-21T17:00:00.000Z
 */

import { NextRequest, NextResponse } from 'next/server';
// WHAT: The per-event aggregation, not the time-bucketed one.
// WHY: `runFullAggregation` (lib/analytics-aggregator.ts) writes documents keyed by
//     `bucket`/`periodStart` with no `projectId`. Every reader that works queries
//     by `projectId`, `eventDate` or `partnerContext.partnerId`, and
//     executive/metrics sums whatever `find()` returns — a time-bucketed document
//     is already an aggregate over many events, so mixing the shapes double-counts
//     silently and upward (audit F-023). Scheduling this route as it was would have
//     corrupted the analytics rather than refreshed them.
import { runEventAggregation } from '@/lib/eventAggregation';
import clientPromise from '@/lib/mongodb';
import { Db, Collection } from 'mongodb';
import { AggregationJobMetadata } from '@/lib/analytics-aggregates.types';
import config from '@/lib/config';

/**
 * POST /api/cron/analytics-aggregation
 * 
 * Trigger full analytics aggregation
 * 
 * Headers:
 * - Authorization: Bearer <CRON_SECRET> (for scheduled jobs)
 * 
 * Query Parameters:
 * - force: 'true' to force re-aggregation of all data
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify authorization
    // In production, check for cron secret or admin session
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'development_secret';
    
    // Allow requests with valid cron secret OR from authenticated admin users
    const isAuthorized = authHeader === `Bearer ${cronSecret}`;
    
    if (!isAuthorized) {
      // Check for admin session as fallback
      const { getAdminUser } = await import('@/lib/auth');
      const user = await getAdminUser();
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid cron secret or admin session required' },
          { status: 401 }
        );
      }
    }
    
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('force') === 'true';
    
    console.log(`[Analytics Aggregation] Starting daily aggregation job (force: ${forceRefresh})`);
    
    // Create job metadata record
    const client = await clientPromise;
    const db: Db = client.db(config.dbName);
    const jobsCollection: Collection<AggregationJobMetadata> = db.collection('aggregation_jobs');
    
    const job: Omit<AggregationJobMetadata, '_id'> = {
      jobType: 'daily',
      status: 'running',
      startedAt: new Date().toISOString(),
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      errors: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const jobResult = await jobsCollection.insertOne(job as any);
    const jobId = jobResult.insertedId;
    
    try {
      // Run full aggregation
      const result = await runEventAggregation({ forceRefresh });
      
      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - startTime;
      
      // Update job metadata
      await jobsCollection.updateOne(
        { _id: jobId },
        {
          $set: {
            // A run that skips un-aggregatable projects has still completed.
            status: 'completed',
            completedAt,
            durationMs,
            recordsProcessed: result.projectsProcessed,
            recordsCreated: result.aggregatesWritten,
            recordsUpdated: result.aggregatesUnchanged,
            // The job record types `errors` as string[]. Skipped projects are not
            // errors, so this records a single explanatory line rather than
            // fabricating one entry per skipped project.
            errors: result.projectsSkipped > 0
              ? [`${result.projectsSkipped} project(s) skipped: missing eventAttendees or image counts`]
              : [],
            updatedAt: completedAt
          }
        }
      );
      
      console.log(`[Analytics Aggregation] Completed in ${durationMs}ms:`, {
        status: result.status,
        recordsProcessed: result.projectsProcessed,
        recordsCreated: result.aggregatesWritten,
        recordsUpdated: result.aggregatesUnchanged,
        errors: result.projectsSkipped
      });

      return NextResponse.json({
        success: result.status !== 'partial' || result.projectsProcessed > 0,
        jobId: jobId.toString(),
        durationMs,
        status: result.status,
        projectsFound: result.projectsFound,
        projectsProcessed: result.projectsProcessed,
        // Skipped, not failed: these projects lack the attendance and image counts
        // isProjectAggregatable requires. That is a data gap, not a job error, and
        // reporting it as failure is what made every run look broken.
        projectsSkipped: result.projectsSkipped,
        aggregatesWritten: result.aggregatesWritten,
        aggregatesUnchanged: result.aggregatesUnchanged
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - startTime;
      
      // Update job as failed
      await jobsCollection.updateOne(
        { _id: jobId },
        {
          $set: {
            status: 'failed',
            completedAt,
            durationMs,
            errors: [errorMessage],
            updatedAt: completedAt
          }
        }
      );
      
      console.error('[Analytics Aggregation] Job failed:', error);
      
      return NextResponse.json({
        success: false,
        jobId: jobId.toString(),
        durationMs,
        error: errorMessage
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[Analytics Aggregation] Fatal error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Fatal error in aggregation job', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/analytics-aggregation
 * 
 * Get status of recent aggregation jobs
 * 
 * Query Parameters:
 * - limit: Number of recent jobs to return (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    // WHAT: A GET carrying the cron secret runs the job; everything else keeps the
    //     existing admin status behaviour.
    // WHY: Vercel Cron issues GET requests, and the aggregation lived only in POST.
    //     Scheduling this path as it stood would have hit the status endpoint,
    //     returned 401 for want of an admin session, and silently never aggregated
    //     anything — a scheduled job that appears configured and does nothing is
    //     worse than one that is visibly absent.
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      const result = await runEventAggregation({});
      return NextResponse.json({ success: true, triggeredBy: 'cron', ...result });
    }

    // Check for admin session
    const { getAdminUser } = await import('@/lib/auth');
    const user = await getAdminUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin session required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    
    const client = await clientPromise;
    const db: Db = client.db(config.dbName);
    const jobsCollection: Collection<AggregationJobMetadata> = db.collection('aggregation_jobs');
    
    const jobs = await jobsCollection
      .find({})
      .sort({ startedAt: -1 })
      .limit(limit)
      .toArray();
    
    return NextResponse.json({
      jobs,
      count: jobs.length
    });
    
  } catch (error) {
    console.error('[Analytics Aggregation] Status fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
