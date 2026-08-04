// lib/tour/storage.ts
// WHAT: Guided-tour "seen" state persistence
// WHY: Mirrors lib/adminViewState.ts's style (plain functions, SSR-guarded,
//      try/catch) so this doesn't introduce a new persistence pattern --
//      the Tours menu reads this to show a completed checkmark per tour.

'use client';

import type { TourSeenRecord, TourSeenStatus } from './types';

function storageKey(tourId: string): string {
  return `mm-tour-${tourId}`;
}

/**
 * WHAT: Check whether a tour has already been completed or skipped
 * WHY: The Tours menu shows a checkmark instead of a plain "Start" button
 *      once a tour has been seen
 */
export function hasTourBeenSeen(tourId: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(storageKey(tourId)) !== null;
  } catch (err) {
    console.warn('Failed to read tour state from localStorage:', err);
    return false;
  }
}

/**
 * WHAT: Record that a tour was completed or skipped
 * WHY: Persists across sessions so the Tours menu reflects prior progress
 */
export function markTourSeen(tourId: string, status: TourSeenStatus): void {
  if (typeof window === 'undefined') return;

  try {
    const record: TourSeenRecord = { status, at: new Date().toISOString() };
    window.localStorage.setItem(storageKey(tourId), JSON.stringify(record));
  } catch (err) {
    console.warn('Failed to save tour state to localStorage:', err);
  }
}

/**
 * WHAT: Clear a tour's "seen" state
 * WHY: Not currently used by the manual-trigger Tours menu (Start already
 *      works as Replay regardless of prior completion), kept for parity
 *      with markTourSeen/hasTourBeenSeen and possible future use.
 */
export function clearTourSeen(tourId: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(storageKey(tourId));
  } catch (err) {
    console.warn('Failed to clear tour state from localStorage:', err);
  }
}
