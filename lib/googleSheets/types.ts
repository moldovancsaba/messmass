// lib/googleSheets/types.ts
// WHAT: TypeScript types for Google Sheets integration (v12.0.0)
// WHY: Type safety for all sheet sync operations

import { ObjectId } from 'mongodb';

/**
 * WHAT: Partner's Google Sheet configuration
 * WHY: Store connection details and sync settings
 */
export interface GoogleSheetConfig {
  enabled: boolean;                        // Is sync enabled for this partner?
  sheetId: string;                         // Google Sheet ID from URL
  sheetName: string;                       // Tab/worksheet name (default: "Events")
  serviceAccountEmail: string;             // For display only
  uuidColumn: string;                      // Column letter for UUID (default: "A")
  headerRow: number;                       // Header row number (default: 1)
  dataStartRow: number;                    // First data row (default: 2)
  lastSyncAt?: Date;                       // Last successful sync timestamp
  lastSyncStatus?: 'success' | 'error' | 'pending';
  lastSyncError?: string;                  // Last error message
  syncMode: 'manual' | 'auto';             // Auto includes daily cron
  columnMap: SheetColumnMap;               // Mapping configuration
}

/**
 * WHAT: Sync statistics for monitoring
 * WHY: Track usage and performance
 */
export interface GoogleSheetStats {
  totalEvents: number;                     // Events managed via sheet
  lastPullAt?: Date;                       // Last pull operation
  lastPushAt?: Date;                       // Last push operation
  pullCount: number;                       // Total pull operations
  pushCount: number;                       // Total push operations
  eventsCreated: number;                   // Events created from sheet
  eventsUpdated: number;                   // Events updated from sheet
}

/**
 * WHAT: Column mapping configuration
 * WHY: Define how sheet columns map to MessMass fields
 */
export interface SheetColumnDefinition {
  field: string;                           // MessMass field path (e.g., "stats.remoteImages")
  type: 'uuid' | 'string' | 'number' | 'date' | 'timestamp' | 'status' | 'text';
  required?: boolean;                      // Is this field required?
  readOnly?: boolean;                      // Can users edit this field?
  computed?: boolean;                      // Is this a computed/derived field?
}

export type SheetColumnMap = Record<string, SheetColumnDefinition>;

/**
 * WHAT: Single row from Google Sheet
 * WHY: Type-safe representation of sheet data
 */
export interface SheetRow {
  rowNumber: number;                       // Sheet row number (1-indexed)
  A?: string;                              // MessMass UUID
  B?: string;                              // Partner 1
  C?: string;                              // Partner 2
  D?: string;                              // Event Title
  E?: string;                              // Event Name (auto-generated)
  F?: string;                              // Event Date
  G?: number;                              // Event Attendees
  H?: number;                              // Event Result Home
  I?: number;                              // Event Result Visitor
  J?: number;                              // Remote Images
  K?: number;                              // Hostess Images
  L?: number;                              // Selfies
  M?: number;                              // All Images (computed)
  N?: number;                              // Remote Fans
  O?: number;                              // Stadium Fans
  P?: number;                              // Total Fans (computed)
  Q?: number;                              // Female
  R?: number;                              // Male
  S?: number;                              // Gen Alpha
  T?: number;                              // Gen YZ
  U?: number;                              // Gen X
  V?: number;                              // Boomer
  W?: number;                              // Merched
  X?: number;                              // Jersey
  Y?: number;                              // Scarf
  Z?: number;                              // Flags
  AA?: number;                             // Baseball Cap
  AB?: number;                             // Other Merch
  AC?: number;                             // Visit QR Code
  AD?: number;                             // Visit Short URL
  AE?: number;                             // Visit Web
  AF?: number;                             // Visit Facebook
  AG?: number;                             // Visit Instagram
  AH?: number;                             // Visit YouTube
  AI?: number;                             // Visit TikTok
  AJ?: number;                             // Visit X
  AK?: number;                             // Visit Trustpilot
  AL?: number;                             // Total Bitly Clicks
  AM?: number;                             // Unique Bitly Clicks
  AN?: string;                             // Last Modified
  AO?: string;                             // Sync Status
  AP?: string;                             // Notes
  [key: string]: string | number | undefined; // Allow dynamic access
}

/**
 * WHAT: Parsed event data from sheet row
 * WHY: Validated and typed event ready for MongoDB
 */
export interface ParsedEventFromSheet {
  eventType: 'two-partner' | 'single-partner' | 'standalone';
  eventName: string;
  eventDate: string;                       // ISO 8601 date
  partnerId?: ObjectId | string;           // Home team
  opponentId?: ObjectId | string;          // Away team (two-partner only)
  partnerName?: string;                    // For lookup
  opponentName?: string;                   // For lookup
  eventTitle?: string;                     // Custom title
  stats: Record<string, number>;           // All stats fields
  googleSheetUuid: string;                 // UUID from sheet
  googleSheetSyncedAt: Date;
  googleSheetSource: 'sheet';
  isSyncedFromSheet: boolean;
  notes?: string;
}

/**
 * WHAT: Result of pull operation
 * WHY: Track success/failure for each row
 */
export interface PullOperationResult {
  success: boolean;
  rowNumber: number;
  eventId?: ObjectId | string;             // Created/updated event ID
  eventName?: string;
  action: 'created' | 'updated' | 'skipped' | 'error';
  error?: string;
}

/**
 * WHAT: Result of push operation
 * WHY: Track success/failure for each event
 */
export interface PushOperationResult {
  success: boolean;
  eventId: ObjectId | string;
  eventName: string;
  rowNumber?: number;                      // Sheet row number
  action: 'created' | 'updated' | 'error';
  error?: string;
}

/**
 * WHAT: Sync operation summary
 * WHY: High-level result for UI display
 */
export interface SyncOperationSummary {
  success: boolean;
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  results: (PullOperationResult | PushOperationResult)[];
  timestamp: Date;
  duration: number;                        // Milliseconds
}

/**
 * WHAT: Validation error for sheet row
 * WHY: Detailed error reporting
 */
export interface SheetValidationError {
  rowNumber: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * WHAT: Conflict detection result
 * WHY: Show which system has newer data
 */
export interface SyncConflict {
  eventId: ObjectId | string;
  eventName: string;
  sheetModified: Date;
  messmassModified: Date;
  conflictingFields: string[];
  newerSource: 'sheet' | 'messmass';
}

/**
 * WHAT: Database access abstraction for sync logic
 * WHY: Enable dry-run mode and separation of concerns
 */
export interface SyncDbAccess {
  getEventsByUuids(uuids: string[]): Promise<any[]>;
  createEvents(events: any[]): Promise<Array<{ id: string; data: any }>>;
  updateEvents(updates: Array<{ uuid: string; data: any }>): Promise<Array<{ id: string; data: any }>>;
  updateSheetWithUuid(rowNumber: number, uuid: string): Promise<{ success: boolean; message?: string }>;
  updatePartnerSyncStats(syncStats: any): Promise<{ success: boolean; message?: string }>;
  updatePartnerError(error: string): Promise<{ success: boolean; message?: string }>;
}

/**
 * WHAT: Options for pull operation
 */
export interface PullOptions {
  dryRun?: boolean;
  partnerId: string;
  config: GoogleSheetConfig; // Pass full config from DB
  context?: {
    timestamp: string;
    operation: string;
    userAgent: string;
  };
}

/**
 * WHAT: Summary of pull operation returned by the function
 */
export interface PullSummary {
  success?: boolean; // Added success flag
  error?: string;    // Top-level error message
  totalRows: number;
  eventsCreated: number;
  eventsUpdated: number;
  errors: Array<{ row: number; error: string }>;
  results?: Array<{ id: string; data: any; action: 'created' | 'updated' }>; // Added results detail
}

export interface PushSummary {
  success?: boolean;
  error?: string;
  totalEvents: number;
  rowsCreated: number;
  rowsUpdated: number;
  errors: Array<{ eventId: string; error: string }>;
}

/**
 * WHAT: Database access abstraction for push logic
 */
export interface PushDbAccess {
  getEvents(): Promise<Array<{ id: string; data: any }>>;
  updateEventWithUuid(eventId: string, uuid: string, rowNumber: number): Promise<{ success: boolean }>;
  updatePartnerSyncStats(syncStats: any): Promise<{ success: boolean }>;
  updatePartnerError(error: string): Promise<{ success: boolean }>;
}

/**
 * WHAT: Options for push operation
 */
export interface PushOptions {
  dryRun?: boolean;
  partnerId: string;
  eventId?: string;
  config: GoogleSheetConfig; // Pass full config from DB
  context?: {
    timestamp: string;
    operation: string;
    userAgent: string;
  };
}

/**
 * WHAT: Extended summary for push with preview
 */
export interface PushSummaryWithPreview extends PushSummary {
  success?: boolean;
  preview?: Array<{
    action: 'create' | 'update';
    eventName: string;
    rowNumber?: number;
    data: any;
  }>;
}
