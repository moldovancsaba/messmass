// app/api/public/events/[id]/stats/route.ts
<<<<<<< HEAD
// WHAT: Public API endpoint for injecting enriched fan statistics
// WHY: Allow Fanmass to write identified fan data back into MessMass KYC system
=======
// WHAT: Public API endpoint for external stats injection
// WHY: Allow Fanmass to inject enriched fan identification data into MessMass events
>>>>>>> origin/main

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { requireAPIWriteAuth } from '@/lib/apiAuth';
import { applyCorsHeaders } from '@/lib/cors';
import { logRequestStart, logRequestEnd } from '@/lib/logger';
<<<<<<< HEAD
import { validateStatsUpdate, type StatsUpdateRequest } from '@/lib/statsValidator';
import { createAuditLog } from '@/lib/auditLog';
import { createNotification } from '@/lib/notificationUtils';
import { addDerivedMetrics } from '@/lib/projectStatsUtils';
=======
import { validateStatsUpdate, sanitizeStatsUpdate, type StatsUpdateRequest } from '@/lib/statsValidator';
import { createAuditLog } from '@/lib/auditLog';
>>>>>>> origin/main

export const runtime = 'nodejs';

/**
 * POST /api/public/events/[id]/stats
<<<<<<< HEAD
 * WHAT: Inject enriched fan statistics into event
 * WHY: Allow Fanmass to write identified fan data back into MessMass
=======
 * WHAT: Inject external stats data into an event
 * WHY: Allow Fanmass to enrich MessMass events with fan identification data
>>>>>>> origin/main
 * 
 * AUTH: Bearer token with write permissions required
 * PATH PARAMS:
 *   - id: Project/Event ObjectId
 * 
 * REQUEST BODY:
<<<<<<< HEAD
 *   - stats: Object with KYC variable updates (demographics, merchandise, fan counts)
 *   - source: Optional source identifier (e.g., "fanmass-v1.2.3")
 *   - metadata: Optional metadata (processingTime, confidence, etc.)
 * 
 * RESPONSE:
 *   - success: boolean
 *   - event: { id, eventName, updatedAt }
 *   - updated: Array of field names that were updated
 *   - derived: Array of derived metrics that were recalculated
 *   - timestamp: ISO 8601
=======
 *   - stats: Object with KYC variable updates (male, female, merched, etc.)
 *   - source: Optional source identifier (e.g., "fanmass")
 *   - metadata: Optional metadata (confidence scores, processing time, etc.)
 * 
 * RESPONSE:
 *   - success: true
 *   - updatedFields: Array of field names that were updated
 *   - timestamp: ISO 8601 with milliseconds
>>>>>>> origin/main
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = logRequestStart({
    method: 'POST',
    pathname: `/api/public/events/[id]/stats`,
    ip: request.headers.get('x-forwarded-for') || 'unknown'
  });
  
  try {
    const { id } = await params;
    
    // WHAT: Require Bearer token with write permissions
<<<<<<< HEAD
    // WHY: Write operations need explicit authorization
    const authResult = await requireAPIWriteAuth(request);
    if (!authResult.success) {
      logRequestEnd(startTime, { method: 'POST', pathname: `/api/public/events/${id}/stats` }, 403);
=======
    const authResult = await requireAPIWriteAuth(request);
    if (!authResult.success) {
      logRequestEnd(startTime, { method: 'POST', pathname: `/api/public/events/${id}/stats` }, authResult.response!.status);
>>>>>>> origin/main
      return applyCorsHeaders(authResult.response!, request);
    }
    
    // WHAT: Validate event ID format
<<<<<<< HEAD
    // WHY: Prevent NoSQL injection and invalid queries
=======
>>>>>>> origin/main
    if (!ObjectId.isValid(id)) {
      logRequestEnd(startTime, { method: 'POST', pathname: `/api/public/events/${id}/stats` }, 400);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Invalid event ID format',
          errorCode: 'INVALID_EVENT_ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
      return applyCorsHeaders(response, request);
    }
    
    // WHAT: Parse and validate request body
<<<<<<< HEAD
    // WHY: Ensure data integrity before writing to database
=======
>>>>>>> origin/main
    let body: StatsUpdateRequest;
    try {
      body = await request.json();
    } catch (error) {
      logRequestEnd(startTime, { method: 'POST', pathname: `/api/public/events/${id}/stats` }, 400);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          errorCode: 'INVALID_JSON',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
      return applyCorsHeaders(response, request);
    }
    
    // WHAT: Validate stats data
<<<<<<< HEAD
    // WHY: Reject invalid data before database operations
=======
>>>>>>> origin/main
    const validation = validateStatsUpdate(body);
    if (!validation.valid) {
      logRequestEnd(startTime, { method: 'POST', pathname: `/api/public/events/${id}/stats` }, 400);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Invalid stats data',
          errorCode: 'INVALID_STATS_DATA',
<<<<<<< HEAD
          errors: validation.errors,
          warnings: validation.warnings,
=======
          details: validation.errors,
>>>>>>> origin/main
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
      return applyCorsHeaders(response, request);
    }
    
    const client = await clientPromise;
    const db = client.db(config.dbName);
<<<<<<< HEAD
    const collection = db.collection('projects');
    
    // WHAT: Get existing event
    // WHY: Need current stats for before/after comparison and merging
    const event = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!event) {
=======
    
    // WHAT: Check if event exists and get current stats
    const project = await db
      .collection('projects')
      .findOne({ _id: new ObjectId(id) });
    
    if (!project) {
>>>>>>> origin/main
      logRequestEnd(startTime, { method: 'POST', pathname: `/api/public/events/${id}/stats` }, 404);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Event not found',
          errorCode: 'EVENT_NOT_FOUND',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
      return applyCorsHeaders(response, request);
    }
    
<<<<<<< HEAD
    // WHAT: Merge new stats with existing stats
    // WHY: Preserve fields not being updated
    const currentStats = event.stats || {};
    const updatedStats = {
      ...currentStats,
      ...body.stats
    };
    
    // WHAT: Recalculate derived metrics
    // WHY: Ensure totalFans, allImages are always up-to-date
    const enrichedStats = addDerivedMetrics(updatedStats);
    
    // WHAT: Update event in database
    // WHY: Persist the enriched stats
    const now = new Date().toISOString();
    await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          stats: enrichedStats,
          updatedAt: now
        }
      }
    );
    
    // WHAT: Build changes array for audit log
    // WHY: Track before/after values for compliance
    const changes = validation.validatedFields.map(field => ({
      field,
      before: currentStats[field] ?? null,
      after: body.stats[field]
    }));
    
    // WHAT: Create audit log entry (async, don't block response)
    // WHY: Track all external data modifications
    createAuditLog({
=======
    // WHAT: Sanitize and merge stats with existing data
    const sanitizedStats = sanitizeStatsUpdate(body);
    const currentStats = project.stats || {};
    const updatedStats = { ...currentStats, ...sanitizedStats };
    
    // WHAT: Calculate derived metrics
    // totalFans = remoteFans + stadium + indoor + outdoor
    const remoteFans = updatedStats.remoteFans || 0;
    const stadium = updatedStats.stadium || 0;
    const indoor = updatedStats.indoor || 0;
    const outdoor = updatedStats.outdoor || 0;
    updatedStats.totalFans = remoteFans + stadium + indoor + outdoor;
    
    // totalImages = remoteImages + hostessImages + selfies
    const remoteImages = updatedStats.remoteImages || 0;
    const hostessImages = updatedStats.hostessImages || 0;
    const selfies = updatedStats.selfies || 0;
    updatedStats.totalImages = remoteImages + hostessImages + selfies;
    
    // WHAT: Track changes for audit log
    const changes = Object.keys(sanitizedStats).map(field => ({
      field,
      before: currentStats[field] || 0,
      after: sanitizedStats[field]
    }));
    
    // WHAT: Update event in database
    const updateResult = await db
      .collection('projects')
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            stats: updatedStats,
            updatedAt: new Date().toISOString()
          }
        }
      );
    
    if (updateResult.matchedCount === 0) {
      logRequestEnd(startTime, { method: 'POST', pathname: `/api/public/events/${id}/stats` }, 404);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Event not found',
          errorCode: 'EVENT_NOT_FOUND',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
      return applyCorsHeaders(response, request);
    }
    
    // WHAT: Create audit log entry
    await createAuditLog({
>>>>>>> origin/main
      eventId: id,
      userId: authResult.user!.id,
      userEmail: authResult.user!.email,
      action: 'stats_update',
      changes,
      metadata: body.metadata,
      request
<<<<<<< HEAD
    }).catch(err => {
      console.error('Failed to create audit log:', err);
    });
    
    // WHAT: Create notification (async, don't block response)
    // WHY: Alert admins to API activity
    createNotification(db, {
      activityType: 'api_stats_update',
      user: authResult.user!.email,
      projectId: id,
      projectName: event.eventName,
      projectSlug: event.viewSlug,
      apiUser: {
        id: authResult.user!.id,
        email: authResult.user!.email
      },
      modifiedFields: validation.validatedFields
    }).catch(err => {
      console.error('Failed to create notification:', err);
=======
>>>>>>> origin/main
    });
    
    logRequestEnd(startTime, {
      method: 'POST',
      pathname: `/api/public/events/${id}/stats`,
<<<<<<< HEAD
      userId: authResult.user?.id,
      fieldsUpdated: validation.validatedFields.length
=======
      userId: authResult.user?.id
>>>>>>> origin/main
    }, 200);
    
    const response = NextResponse.json({
      success: true,
<<<<<<< HEAD
      event: {
        id: event._id.toString(),
        eventName: event.eventName,
        updatedAt: now
      },
      updated: validation.validatedFields,
      derived: ['totalFans', 'allImages'],
      timestamp: now
=======
      updatedFields: Object.keys(sanitizedStats),
      warnings: validation.warnings,
      timestamp: new Date().toISOString()
>>>>>>> origin/main
    });
    
    return applyCorsHeaders(response, request);
    
  } catch (error) {
    console.error('[POST /api/public/events/[id]/stats] Error:', error);
    const { id } = await params;
    logRequestEnd(startTime, { method: 'POST', pathname: `/api/public/events/${id}/stats` }, 500);
    
    const response = NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        errorCode: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
    
    return applyCorsHeaders(response, request);
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  return applyCorsHeaders(response, request);
}
