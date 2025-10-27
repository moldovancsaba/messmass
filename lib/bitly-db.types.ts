// lib/bitly-db.types.ts
// WHAT: TypeScript interfaces for MongoDB Bitly integration collections
// WHY: Ensures type safety for database operations and documents schema structure
// NOTE: All timestamps use ISO 8601 with milliseconds format (YYYY-MM-DDTHH:MM:SS.sssZ)

import { ObjectId } from 'mongodb';
import type { BitlyCampaign } from './bitly.types';

/**
 * WHAT: Bitly link document stored in MongoDB (bitly_links collection)
 * WHY: Associates Bitly shortened URLs with MessMass event projects and stores analytics snapshots
 * 
 * RELATIONSHIP: Many-to-One
 * - One project can have MANY Bitly links
 * - One Bitly link belongs to ONLY ONE project (or no project if unassigned)
 */
export interface BitlyLinkDocument {
  _id: ObjectId;
  
  // WHAT: Reference to parent MessMass project (optional for unassigned links)
  // WHY: Enables filtering links by project and aggregating project-level analytics
  projectId: ObjectId | null;
  
  // WHAT: Core Bitly link metadata
  // WHY: Identifies the link and provides context for analytics
  bitlink: string; // e.g., "bit.ly/3fK8Lm2" (normalized format without https://)
  link_id?: string; // Bitly's internal link ID if available
  long_url: string; // Original destination URL
  title: string; // Human-readable title for the link
  
  // WHAT: Organization/workspace identifier from Bitly
  // WHY: Supports multi-workspace scenarios and filtering
  group_guid?: string;
  
  // WHAT: User-defined tags from Bitly
  // WHY: Enables additional categorization and filtering in MessMass
  tags: string[];
  
  // WHAT: UTM campaign parameters extracted from long_url
  // WHY: Powers campaign attribution and performance tracking
  campaign: BitlyCampaign;
  
  // WHAT: Link creation timestamp from Bitly (ISO 8601 with milliseconds)
  // WHY: Historical context for link age and lifecycle analysis
  bitly_created_at: string;
  
  // WHAT: Aggregated click statistics snapshot
  // WHY: Quick access to KPIs without fetching full timeseries
  click_summary: {
    total: number; // Total clicks including duplicates
    unique?: number; // Unique clicks (if available from Bitly)
    updatedAt: string; // ISO 8601 with milliseconds - when this snapshot was taken
  };
  
  // WHAT: Daily click timeseries data
  // WHY: Enables trend visualization and time-based analytics
  // NOTE: Limited to last 365 days to control document size
  clicks_timeseries: Array<{
    date: string; // ISO 8601 date (YYYY-MM-DD)
    clicks: number; // Click count for this day
  }>;
  
  // WHAT: Geographic distribution of clicks
  // WHY: Powers geographic analytics and audience insights
  geo: {
    countries: Array<{
      country: string; // ISO 3166-1 alpha-2 country code (e.g., "US", "HU")
      clicks: number;
    }>;
    cities?: Array<{
      city: string;
      country?: string; // ISO 3166-1 alpha-2 country code
      clicks: number;
    }>;
  };
  
  // WHAT: Traffic source breakdown (platform-level)
  // WHY: Enables campaign attribution and source tracking at platform level
  // EXAMPLES: "Instagram", "Facebook", "direct", "Google"
  referrers: Array<{
    referrer: string; // Platform name (e.g., "Instagram", "Facebook", "direct")
    clicks: number;
  }>;
  
  // WHAT: Domain-level traffic source breakdown (more granular than referrers)
  // WHY: Distinguishes between mobile vs web platforms and specific sources
  // EXAMPLES: "l.instagram.com" (Instagram mobile), "www.instagram.com" (Instagram web)
  referring_domains: Array<{
    domain: string; // Specific domain (e.g., "l.instagram.com", "qr.partners.bit.ly", "direct")
    clicks: number;
  }>;
  
  // WHAT: Sync control fields
  // WHY: Manages incremental sync and prevents redundant API calls
  lastSyncAt: string; // ISO 8601 with milliseconds - last successful sync timestamp
  lastClicksSyncedUntil?: string; // ISO 8601 date - boundary of latest synced daily data
  
  // WHAT: Favorite flag for quick filtering
  // WHY: Allows admins to mark important links for priority viewing
  favorite?: boolean;
  
  // WHAT: Soft delete flag
  // WHY: Allows archiving links without losing historical data
  archived?: boolean;
  
  // WHAT: Standard MongoDB timestamps (ISO 8601 with milliseconds)
  // WHY: Audit trail for document lifecycle
  createdAt: string;
  updatedAt: string;
}

/**
 * WHAT: Sync log document for tracking Bitly API sync operations (bitly_sync_logs collection)
 * WHY: Provides observability, debugging, and monitoring of sync process
 * 
 * USE CASES:
 * - Monitor sync health and success rate
 * - Debug sync failures and rate limit issues
 * - Track API usage and performance
 */
export interface BitlySyncLogDocument {
  _id: ObjectId;
  
  // WHAT: Unique identifier for this sync run (UUID v4)
  // WHY: Groups related log entries for a single sync operation
  runId: string;
  
  // WHAT: Sync trigger source
  // WHY: Differentiates manual admin triggers from automated cron jobs
  scope: 'manual' | 'cron';
  
  // WHAT: Optional specific link that was synced (for granular logging)
  // WHY: Enables per-link sync tracking and error diagnosis
  linkId?: ObjectId;
  bitlink?: string; // Normalized bitlink for readability
  
  // WHAT: Sync execution timestamps (ISO 8601 with milliseconds)
  // WHY: Tracks sync duration and identifies long-running operations
  startedAt: string;
  endedAt?: string; // Undefined if sync is still running or crashed
  
  // WHAT: Sync outcome status
  // WHY: Quick filtering of successful vs failed syncs
  status: 'success' | 'partial' | 'error';
  
  // WHAT: Sync operation metrics
  // WHY: Quantifies sync scope and efficiency
  metrics: {
    linksScanned: number; // Total links evaluated for sync
    linksUpdated: number; // Links with new data persisted
    apiCalls: number; // Total Bitly API requests made
    rateLimitResets: number; // Number of times we hit rate limit and waited
  };
  
  // WHAT: Detailed error information for failures
  // WHY: Enables root cause analysis and retry logic refinement
  errors?: Array<{
    code?: string | number; // Error code from Bitly API or internal
    message: string; // Human-readable error description
    retriable?: boolean; // Whether this error can be retried
    at: string; // ISO 8601 with milliseconds - when error occurred
  }>;
  
  // WHAT: Standard MongoDB timestamps (ISO 8601 with milliseconds)
  // WHY: Audit trail for log document lifecycle
  createdAt: string;
  updatedAt: string;
}

/**
 * WHAT: Input payload for associating a Bitly link with a project
 * WHY: Type-safe API contract for link association endpoint
 */
export interface AssociateLinkInput {
  projectId: string; // MongoDB ObjectId as string
  bitlinkOrLongUrl: string; // Either "bit.ly/abc123" or "https://example.com/page"
  title?: string; // Optional custom title (falls back to Bitly title)
  tags?: string[]; // Optional tags for categorization
}

/**
 * WHAT: Input payload for updating a Bitly link association
 * WHY: Type-safe API contract for link update endpoint
 */
export interface UpdateLinkInput {
  projectId?: string; // Reassign to different project (null to unassign)
  title?: string; // Update custom title
  tags?: string[]; // Update tags
  archived?: boolean; // Archive/unarchive link
  favorite?: boolean; // Mark/unmark link as favorite
}

/**
 * WHAT: Response payload for link association operations
 * WHY: Consistent API response shape for link operations
 */
export interface BitlyLinkResponse {
  success: boolean;
  link?: BitlyLinkDocument;
  message?: string;
  error?: string;
}

/**
 * WHAT: Response payload for sync operations
 * WHY: Provides sync status and summary to API callers
 */
export interface BitlySyncResponse {
  success: boolean;
  runId: string;
  startedAt: string; // ISO 8601 with milliseconds
  endedAt?: string; // ISO 8601 with milliseconds
  status: 'success' | 'partial' | 'error' | 'running';
  summary: {
    linksScanned: number;
    linksUpdated: number;
    errors: number;
  };
  message?: string;
}
