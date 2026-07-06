/* WHAT: Notification utility functions for logging project activities
 * WHY: Single, authenticated, server-side creation path for the notifications
 *      collection. There is intentionally no HTTP create endpoint — see
 *      docs/audits/notification-system-audit-2026-07-05.md.
 *
 * Design (ground-up rebuild, 2026-07-05):
 * - Idempotent creation: an atomic upsert keyed by a deterministic `dedupeKey`
 *   (actor + normalized action + project + 5-minute bucket). This replaces the
 *   previous non-atomic findOne→insert, so concurrent edits can no longer race
 *   into duplicate notifications (requires the unique sparse index on dedupeKey;
 *   see scripts/ensure-notification-indexes.ts).
 * - Stable identity: the actor is stored as `actorId` (stable) plus `user`
 *   (denormalized display name for rendering). Grouping keys off the id, never
 *   the mutable name.
 * - Retention-ready: `occurredAt` is a real BSON Date so a TTL index can bound
 *   the collection (the legacy `timestamp` ISO string is kept for the client). */

import { Db } from 'mongodb';

export type NotificationActivityType =
  | 'create'
  | 'edit'
  | 'edit-stats'
  | 'api_stats_update'
  | 'webhook_disabled'
  | 'webhook_failed';

export interface CreateNotificationParams {
  activityType: NotificationActivityType;
  /** Stable user id of the actor (preferred key for grouping/attribution). */
  actorId?: string | null;
  /** Display name of the actor, denormalized for rendering. */
  actorName: string;
  projectId: string;
  projectName: string;
  projectSlug?: string | null;
  apiUser?: {
    id: string;
    email: string;
  };
  modifiedFields?: string[];
  metadata?: {
    webhookId?: string;
    reason?: string;
    [key: string]: unknown;
  };
}

/** Grouping window in milliseconds — rapid activity inside one window collapses. */
const GROUPING_WINDOW_MS = 5 * 60 * 1000;

/**
 * WHAT: Normalize activity type for grouping only.
 * WHY: A project metadata save ('edit') and a stats save ('edit-stats') on the
 *      same project in the same window are one logical action to the operator,
 *      so they share a dedupe bucket (audit finding M1). The stored activityType
 *      is preserved for display; only the grouping key is normalized.
 */
function groupingAction(activityType: NotificationActivityType): string {
  return activityType === 'edit-stats' ? 'edit' : activityType;
}

/**
 * WHAT: Deterministic idempotency key for a notification within a time bucket.
 * WHY: Two writes with the same key collapse into one document via upsert.
 */
export function buildDedupeKey(
  params: Pick<CreateNotificationParams, 'activityType' | 'actorId' | 'actorName' | 'projectId'>,
  nowMs: number
): string {
  const actorKey = params.actorId || params.actorName;
  const bucket = Math.floor(nowMs / GROUPING_WINDOW_MS);
  return `${actorKey}|${groupingAction(params.activityType)}|${params.projectId}|${bucket}`;
}

/**
 * WHAT: Create (or refresh) a notification with an atomic, idempotent upsert.
 * WHY: Logs user activities for the header bell panel without duplicates or races.
 *
 * @returns true on success, false on validation error or DB failure (logged).
 */
export async function createNotification(db: Db, params: CreateNotificationParams): Promise<boolean> {
  try {
    const notifications = db.collection('notifications');

    // WHAT: Validate required fields
    if (!params.activityType || !params.actorName || !params.projectId || !params.projectName) {
      console.error('createNotification: missing required fields', {
        activityType: params.activityType,
        hasActor: !!params.actorName,
        projectId: params.projectId,
      });
      return false;
    }

    const now = new Date();
    const timestamp = now.toISOString();
    const dedupeKey = buildDedupeKey(params, now.getTime());

    // WHAT: Fields set only when the notification is first inserted this window.
    const setOnInsert: Record<string, unknown> = {
      activityType: params.activityType,
      actorId: params.actorId ?? null,
      user: params.actorName, // denormalized display name (client reads `user`)
      projectId: params.projectId,
      dedupeKey,
      readBy: [],
      archivedBy: [],
      createdAt: timestamp,
    };

    if (params.activityType === 'api_stats_update' && params.apiUser) {
      setOnInsert.apiUser = params.apiUser;
    }
    if (params.modifiedFields && params.modifiedFields.length > 0) {
      setOnInsert.modifiedFields = params.modifiedFields;
    }
    if (
      (params.activityType === 'webhook_disabled' || params.activityType === 'webhook_failed') &&
      params.metadata
    ) {
      setOnInsert.metadata = params.metadata;
    }

    // WHAT: Fields refreshed on every activity in the window (insert and update).
    const set: Record<string, unknown> = {
      timestamp, // ISO string for the client
      occurredAt: now, // BSON Date for TTL + range/sort
      projectName: params.projectName,
      projectSlug: params.projectSlug ?? null,
    };

    // WHAT: One atomic upsert keyed by dedupeKey.
    // WHY: Eliminates the check-then-insert race; the unique sparse index on
    //      dedupeKey guarantees a single document per (actor, action, project, window).
    await notifications.updateOne({ dedupeKey }, { $setOnInsert: setOnInsert, $set: set }, { upsert: true });
    return true;
  } catch (error) {
    // WHAT: Surface, don't swallow. Callers wrap this in try/catch and log too,
    //       so a failure is always observable rather than a silent boolean.
    console.error('createNotification failed:', error);
    return false;
  }
}

/**
 * WHAT: Resolve the acting admin (stable id + display name) from the session.
 * WHY: Notifications must attribute to a stable id, not a mutable display name.
 */
export async function getCurrentActor(): Promise<{ id: string | null; name: string }> {
  try {
    const { getAdminUser } = await import('./auth');
    const user = await getAdminUser();
    return { id: user?.id ?? null, name: user?.name || 'Admin User' };
  } catch (error) {
    console.error('getCurrentActor failed:', error);
    return { id: null, name: 'Admin User' };
  }
}
