/**
 * OPS-SEC-03: Account lockout after repeated failed logins
 *
 * WHAT: After 5 failed login attempts per identifier (email), lock for 15 minutes.
 * WHY: Brute-force protection; no user-existence leak (same 401 message for invalid password and locked).
 * HOW: MongoDB collection auth_lockout; clear on successful login.
 */

import { getDb } from './db';

const COLLECTION = 'auth_lockout';
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface LockoutRecord {
  _id: string;           // email (lowercase)
  failedAttempts: number;
  lockedUntil: Date | null;
  updatedAt: Date;
}

/**
 * Returns true if the identifier is currently locked out.
 */
export async function isLockedOut(identifier: string): Promise<boolean> {
  const db = await getDb();
  const doc = await db.collection<LockoutRecord>(COLLECTION).findOne({
    _id: identifier.toLowerCase(),
  });
  if (!doc || !doc.lockedUntil) return false;
  if (new Date() >= doc.lockedUntil) {
    await clearLockout(identifier);
    return false;
  }
  return true;
}

/**
 * Records a failed attempt; sets lockedUntil when attempts >= MAX_ATTEMPTS.
 * Uses $inc for atomicity under concurrent requests.
 */
export async function recordFailedAttempt(identifier: string): Promise<{ locked: boolean; lockedUntil?: Date }> {
  const db = await getDb();
  const col = db.collection<LockoutRecord>(COLLECTION);
  const key = identifier.toLowerCase();
  const now = new Date();

  await col.updateOne(
    { _id: key },
    {
      $inc: { failedAttempts: 1 },
      $set: { updatedAt: now },
      $setOnInsert: { lockedUntil: null },
    },
    { upsert: true }
  );

  const doc = await col.findOne({ _id: key });
  const failed = doc?.failedAttempts ?? 1;
  const shouldLock = failed >= MAX_ATTEMPTS;
  const lockedUntil = shouldLock ? new Date(now.getTime() + LOCK_DURATION_MS) : null;
  if (shouldLock && doc) {
    await col.updateOne({ _id: key }, { $set: { lockedUntil, updatedAt: now } });
  }

  return {
    locked: shouldLock,
    lockedUntil: lockedUntil ?? undefined,
  };
}

/**
 * Clears lockout for the identifier (call on successful login).
 */
export async function clearLockout(identifier: string): Promise<void> {
  const db = await getDb();
  await db.collection<LockoutRecord>(COLLECTION).deleteOne({ _id: identifier.toLowerCase() });
}

export const LOCKOUT_MAX_ATTEMPTS = MAX_ATTEMPTS;
export const LOCKOUT_DURATION_MS = LOCK_DURATION_MS;
