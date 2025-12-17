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
import { runFullAggregation } from '@/lib/analytics-aggregator';
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
      const result = await runFullAggregation({
        forceRefresh
      });
      
      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - startTime;
      
      // Update job metadata
      await jobsCollection.updateOne(
        { _id: jobId },
        {
          $set: {
            status: result.success ? 'completed' : 'failed',
            completedAt,
            durationMs,
            recordsProcessed: result.recordsProcessed,
            recordsCreated: result.recordsCreated,
            recordsUpdated: result.recordsUpdated,
            errors: result.errors,
            updatedAt: completedAt
          }
        }
      );
      
      console.log(`[Analytics Aggregation] Completed in ${durationMs}ms:`, {
        success: result.success,
        recordsProcessed: result.recordsProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        errors: result.errors.length
      });
      
      return NextResponse.json({
        success: result.success,
        jobId: jobId.toString(),
        durationMs,
        recordsProcessed: result.recordsProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        errors: result.errors
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
