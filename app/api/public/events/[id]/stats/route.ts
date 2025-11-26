// app/api/public/events/[id]/stats/route.ts
// WHAT: Public API endpoint for external stats injection
// WHY: Allow Fanmass to inject enriched fan identification data into MessMass events

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { requireAPIWriteAuth } from '@/lib/apiAuth';
import { applyCorsHeaders } from '@/lib/cors';
import { logRequestStart, logRequestEnd } from '@/lib/logger';
import { validateStatsUpdate, sanitizeStatsUpdate, type StatsUpdateRequest } from '@/lib/statsValidator';
import { createAuditLog } from '@/lib/auditLog';

export const runtime = 'nodejs';

/**
 * POST /api/public/events/[id]/stats
 * WHAT: Inject external stats data into an event
 * WHY: Allow Fanmass to enrich MessMass events with fan identification data
 * 
 * AUTH: Bearer token with write permissions required
 * PATH PARAMS:
 *   - id: Project/Event ObjectId
 * 
 * REQUEST BODY:
 *   - stats: Object with KYC variable updates (male, female, merched, etc.)
 *   - source: Optional source identifier (e.g., "fanmass")
 *   - metadata: Optional metadata (confidence scores, processing time, etc.)
 * 
 * RESPONSE:
 *   - success: true
 *   - updatedFields: Array of field names that were updated
 *   - timestamp: ISO 8601 with milliseconds
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
    const authResult = await requireAPIWriteAuth(request);
    if (!authResult.success) {
      logRequestEnd(startTime, { method: 'POST', pathname: `/api/public/events/${id}/stats` }, authResult.response!.status);
      return applyCorsHeaders(authResult.response!, request);
    }
    
    // WHAT: Validate event ID format
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
    const validation = validateStatsUpdate(body);
    if (!validation.valid) {
      logRequestEnd(startTime, { method: 'POST', pathname: `/api/public/events/${id}/stats` }, 400);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Invalid stats data',
          errorCode: 'INVALID_STATS_DATA',
          details: validation.errors,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
      return applyCorsHeaders(response, request);
    }
    
    const client = await clientPromise;
    const db = client.db(config.dbName);
    
    // WHAT: Check if event exists and get current stats
    const project = await db
      .collection('projects')
      .findOne({ _id: new ObjectId(id) });
    
    if (!project) {
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
      eventId: id,
      userId: authResult.user!.id,
      userEmail: authResult.user!.email,
      action: 'stats_update',
      changes,
      metadata: body.metadata,
      request
    });
    
    logRequestEnd(startTime, {
      method: 'POST',
      pathname: `/api/public/events/${id}/stats`,
      userId: authResult.user?.id
    }, 200);
    
    const response = NextResponse.json({
      success: true,
      updatedFields: Object.keys(sanitizedStats),
      warnings: validation.warnings,
      timestamp: new Date().toISOString()
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
