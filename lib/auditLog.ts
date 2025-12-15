// lib/auditLog.ts
// WHAT: Audit logging system for API write operations
// WHY: Track all external data modifications for compliance and debugging
// HOW: Store detailed logs with before/after values, metadata, and request context

import { ObjectId } from 'mongodb';
import { getDb } from './db';
import type { NextRequest } from 'next/server';

/**
 * Audit log document interface
 */
export interface AuditLogDoc {
  _id?: ObjectId;
  
  // Context
  eventId: ObjectId;
  userId: ObjectId;
  userEmail: string;
  action: 'stats_update';
  
  // Request metadata
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  source?: string; // From request body metadata
  
  // Changes
  changes: {
    field: string;
    before: any;
    after: any;
  }[];
  
  // Additional metadata
  metadata?: {
    processingTime?: number;
    confidence?: number;
    [key: string]: any;
  };
}

/**
 * Parameters for creating an audit log
 */
export interface CreateAuditLogParams {
  eventId: string;
  userId: string;
  userEmail: string;
  action: 'stats_update';
  changes: {
    field: string;
    before: any;
    after: any;
  }[];
  metadata?: any;
  request: NextRequest;
}

/**
 * Parameters for querying audit logs
 */
export interface GetAuditLogsParams {
  eventId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Result of audit log query
 */
export interface AuditLogsResult {
  logs: AuditLogDoc[];
  total: number;
}

/**
 * createAuditLog
 * WHAT: Create audit log entry for API write operation
 * WHY: Track all external data modifications for compliance
 * 
 * @param params - Audit log parameters
 * @returns Promise that resolves when log is created
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  const db = await getDb();
  const collection = db.collection<AuditLogDoc>('api_audit_logs');
  
  const log: AuditLogDoc = {
    eventId: new ObjectId(params.eventId),
    userId: new ObjectId(params.userId),
    userEmail: params.userEmail,
    action: params.action,
    timestamp: new Date().toISOString(),
    ipAddress: params.request.headers.get('x-forwarded-for') || 
               params.request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: params.request.headers.get('user-agent') || 'unknown',
    source: params.metadata?.source,
    changes: params.changes,
    metadata: params.metadata
  };
  
  await collection.insertOne(log);
}

/**
 * getAuditLogs
 * WHAT: Query audit logs with filtering and pagination
 * WHY: Admin UI needs to display audit trail
 * 
 * @param params - Query parameters
 * @returns Promise with logs and total count
 */
export async function getAuditLogs(params: GetAuditLogsParams = {}): Promise<AuditLogsResult> {
  const db = await getDb();
  const collection = db.collection<AuditLogDoc>('api_audit_logs');
  
  // Build filter
  const filter: any = {};
  
  if (params.eventId) {
    filter.eventId = new ObjectId(params.eventId);
  }
  
  if (params.userId) {
    filter.userId = new ObjectId(params.userId);
  }
  
  // Date range filter
  if (params.startDate || params.endDate) {
    filter.timestamp = {};
    if (params.startDate) {
      filter.timestamp.$gte = params.startDate;
    }
    if (params.endDate) {
      filter.timestamp.$lte = params.endDate;
    }
  }
  
  // Get total count
  const total = await collection.countDocuments(filter);
  
  // Get paginated results
  const limit = params.limit || 50;
  const offset = params.offset || 0;
  
  const logs = await collection
    .find(filter)
    .sort({ timestamp: -1 }) // Most recent first
    .skip(offset)
    .limit(limit)
    .toArray();
  
  return { logs, total };
}

/**
 * createAuditLogIndexes
 * WHAT: Create database indexes for audit log collection
 * WHY: Optimize query performance for filtering and pagination
 * 
 * @returns Promise that resolves when indexes are created
 */
export async function createAuditLogIndexes(): Promise<void> {
  const db = await getDb();
  const collection = db.collection('api_audit_logs');
  
  await collection.createIndex({ eventId: 1, timestamp: -1 });
  await collection.createIndex({ userId: 1, timestamp: -1 });
  await collection.createIndex({ timestamp: -1 });
  await collection.createIndex({ action: 1, timestamp: -1 });
}
