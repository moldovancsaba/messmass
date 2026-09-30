// lib/editorSaveQueue.ts
// WHAT: A client-side save queue for the live editors (EditorDashboard and
//     PartnerEditorDashboard). One request in flight at a time, rapid changes
//     coalesced into one payload, failed saves kept and retried until the
//     server confirms them.
// WHY: On 2026-09-27 an event operator typed data into /edit/<slug> for hours
//     while every PUT /api/projects answered 401. The editor showed "Save Error"
//     for 3 seconds, flipped back to "Ready", and kept the numbers only in React
//     state -- nothing was stored, nothing was retried, and a reload threw it all
//     away. The same code also fired one PUT per click with no ordering, so two
//     overlapping requests could land out of order and an older snapshot could
//     overwrite a newer one.
// HOW: At most one payload is in flight. New changes go into the open
//     payload (pending), combined with it by `coalesce(older, newer)`, so the
//     queue sends one request for everything waiting and never sends older
//     data after newer data. When `canCoalesce` says a change may not join the
//     open payload (it would grow past what one request may carry), that
//     payload is closed and waits, oldest first, and a new one opens.
//     By default the newer payload replaces the older one -- right when every
//     payload is a FULL snapshot of what the editor stores (the partner
//     editor). The event editor's payloads carry only the values a change
//     touched, so it merges them (union, the newest value of a key wins); a
//     replace there would drop the earlier change.
//       - enqueue() coalesces into the pending payload and (re)starts a short
//         debounce; a max-wait bound keeps a continuous clicker from
//         postponing the save forever.
//       - changes made while a request is in flight wait as the pending payload
//         and go out when it settles.
//       - a payload that failed in a way worth retrying (server error, no
//         connection, no answer in time, rate limit) is kept and retried with
//         backoff until it succeeds -- by default coalesced under anything
//         queued meanwhile, so the newer values win. With `retryFailedAlone`
//         it is retried unchanged, before anything queued after it, under the
//         same attempt id (the event editor: its clicker counts must not be
//         sent twice under two different requests; see SaveAttempt).
//       - a "needs access" failure (HTTP 401) pauses the queue and calls
//         onNeedsAccess; nothing is sent until the caller has re-established
//         access and calls resume().
//       - a payload the server refused for good (400, 404, 413, 422: it will
//         refuse it again, unchanged) is set aside as rejected: kept, counted
//         as unsaved and shown, but not retried and never merged into, so it
//         cannot take later changes down with it. retryRejected() sends it
//         again. A later full snapshot that is confirmed supersedes it.
//     Framework-free on purpose: React state is only a subscriber, which keeps the
//     ordering rules unit-testable with fake timers.
//     The same file holds the helpers the editor wires around the queue:
//     whenAllSaved (wait for the server to confirm, before a sheet push/pull),
//     createAccessRecovery (re-establish access after a 401, with backoff), the
//     unsaved-draft store with its restore rule (see "Unsaved-change drafts"),
//     sendJsonForSave (one request, with a timeout) and createResponseOrder
//     (drop a load answer older than one already applied).

import { ensureCsrfToken } from './apiClient';

export type SaveQueueState =
  | 'idle' // nothing changed since the editor loaded
  | 'saving' // a change is waiting for the debounce or is in flight
  | 'saved' // the server confirmed the latest change
  | 'retrying' // the last attempt failed; a retry is scheduled or running
  | 'needs-access' // the server answered 401; paused until resume()
  | 'offline' // the last attempt could not reach the server
  | 'rejected'; // the server refused a save for good; kept, not retried until retryRejected()

export interface SaveQueueSnapshot {
  state: SaveQueueState;
  /** Changes made locally that the server has not confirmed yet. */
  pendingCount: number;
  /** Message of the most recent failure; cleared by the next success. */
  lastError: string | null;
  /** Epoch ms of the last confirmed save, or null if none yet. */
  lastSavedAt: number | null;
  /** Epoch ms when the scheduled retry fires, or null if none is scheduled. */
  nextRetryAt: number | null;
  /** Consecutive failed attempts since the last confirmed save. */
  failedAttempts: number;
  /** Changes in payloads the server refused for good (included in pendingCount). */
  rejectedCount: number;
}

/**
 * One attempt to send a payload. `id` is the same for every attempt to send
 * one unchanged payload, and new for any other payload -- a merged one, or one
 * taken back after a refusal. A caller that numbers its requests for the
 * server's late-write guard sends a retry under the same number, so a copy of
 * it that already landed turns the retry away instead of applying it twice.
 */
export interface SaveAttempt {
  id: number;
}

export interface SaveQueueOptions<P> {
  /** Performs the request. Resolve on success; reject (ideally with a SaveRequestError) on failure. */
  send: (payload: P, attempt: SaveAttempt) => Promise<unknown>;
  /**
   * Combine a payload the server has not confirmed yet with a newer one: a
   * pending payload with the next enqueue(), a failed payload with the one
   * queued meanwhile. Must keep every change of both, the newer value winning.
   * Default: the newer payload replaces the older (full snapshots).
   */
  coalesce?: (older: P, newer: P) => P;
  /**
   * May `newer` be combined into `older`? false closes `older` (it is sent
   * as it is, in turn) and starts a new payload -- e.g. when the two together
   * would be more than one request may carry. Default: always.
   */
  canCoalesce?: (older: P, newer: P) => boolean;
  /**
   * Retry a failed payload unchanged and before anything queued after it,
   * instead of coalescing it under the next one. Default false.
   */
  retryFailedAlone?: boolean;
  /** Decides whether a failure is a refusal that sending again cannot change. Default: isRejectedSaveError. */
  isRejected?: (error: unknown) => boolean;
  /** Quiet period after the last change before sending. */
  debounceMs?: number;
  /** Longest a change may wait for the debounce while changes keep arriving. */
  maxWaitMs?: number;
  /** Backoff between retries; the last entry repeats. */
  retryDelaysMs?: readonly number[];
  /** Decides whether a failure means "re-authenticate" rather than "retry". Default: isNeedsAccessError. */
  isNeedsAccess?: (error: unknown) => boolean;
  /** Browser connectivity hint. Default: navigator.onLine when available. */
  isOnline?: () => boolean;
  /** Called after the server confirms a payload. pendingCount is what is still unconfirmed. */
  onSaved?: (payload: P, info: { pendingCount: number }) => void;
  /** Called once each time the queue pauses on a needs-access failure. */
  onNeedsAccess?: (error: unknown) => void;
}

export interface SaveQueue<P> {
  /** Queue a payload; it is coalesced with any payload not yet sent. */
  enqueue(payload: P): void;
  /**
   * Everything the server has not confirmed yet, as one payload (the one in
   * flight coalesced with the pending one), or null when nothing is waiting.
   */
  unconfirmed(): P | null;
  /**
   * The payloads unconfirmed() combines, one by one, oldest first, each with
   * its attempt. `sent` marks the one whose outcome is unknown: handed to
   * send() without an answer yet, or failed and waiting to go out again under
   * the same attempt id (retryFailedAlone, or too large to combine). It may
   * have been stored. A payload refused for good is not `sent`: the server
   * stored nothing of it.
   */
  unconfirmedPayloads(): Array<{ payload: P; attempt: SaveAttempt; sent: boolean }>;
  /** Send now: skips the debounce and any scheduled retry wait. No effect while paused for access. */
  flush(): void;
  /** Leave the needs-access pause and send what is waiting immediately. */
  resume(): void;
  /** Send the payloads the server refused for good once more, before anything else (a "Retry now"). */
  retryRejected(): void;
  /**
   * Stop sending until the returned release is called; changes keep queueing.
   * For the time another writer changes the same record (a sheet pull), so a
   * change queued before that write cannot land after it. Holds nest; calling
   * a release twice has no further effect.
   */
  hold(): () => void;
  /** Stop all timers and ignore late responses. The owner keeps its own copy of unsaved data. */
  dispose(): void;
  getSnapshot(): SaveQueueSnapshot;
  subscribe(listener: (snapshot: SaveQueueSnapshot) => void): () => void;
}

export const DEFAULT_SAVE_DEBOUNCE_MS = 700;
export const DEFAULT_SAVE_MAX_WAIT_MS = 3000;
export const DEFAULT_SAVE_RETRY_DELAYS_MS: readonly number[] = [2000, 5000, 10000, 20000, 30000];

// WHAT: Upper bound on a server-supplied Retry-After.
// WHY: The rate limiter's window is a minute; a larger or garbled hint must not
//     leave an operator's data parked for longer than that.
const MAX_RETRY_AFTER_MS = 60_000;

// WHAT: A save failure that keeps what the queue needs to decide what to do next.
// WHY: apiPut() throws a plain Error whose message is all that survives, so a
//     401 (re-authenticate), a 500 (retry) and a dropped connection (offline)
//     were indistinguishable -- the root of the silent "Save Error" loop.
export class SaveRequestError extends Error {
  readonly status: number | null;
  readonly code: string | null;
  readonly retryAfterMs: number | null;
  readonly offline: boolean;

  constructor(
    message: string,
    details: { status?: number | null; code?: string | null; retryAfterMs?: number | null; offline?: boolean } = {}
  ) {
    super(message);
    this.name = 'SaveRequestError';
    this.status = details.status ?? null;
    this.code = details.code ?? null;
    this.retryAfterMs = details.retryAfterMs ?? null;
    this.offline = details.offline ?? false;
  }
}

function statusOf(error: unknown): number | null {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: unknown }).status;
    return typeof status === 'number' ? status : null;
  }
  return null;
}

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return 'Save failed';
}

function codeOf(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === 'string' ? code : null;
  }
  return null;
}

// WHAT: Does this failure mean "re-establish access, then retry"?
// WHY: The save routes answer 401 with code EDIT_ACCESS_REQUIRED when the edit
//     grant or the admin session is missing (lib/apiGuards.ts). Either signal
//     is enough; retrying such a save unchanged can only fail again.
export function isNeedsAccessError(error: unknown): boolean {
  return statusOf(error) === 401 || codeOf(error) === 'EDIT_ACCESS_REQUIRED';
}

const defaultIsNeedsAccess = isNeedsAccessError;

// WHAT: Statuses that refuse a save for good: sent again unchanged, it would be
//     refused again.
// WHY: The queue used to retry every failure but a 401 forever, and merged
//     every later change into the refused payload, so one unstorable value (a
//     dotted key, an oversized body) stopped every save from that device for
//     the rest of the event -- and its draft brought the value back after a
//     reload. 403 is not here: the CSRF refusal is fixed by the retry itself
//     (sendJsonForSave drops the stale token first).
const REJECTED_STATUSES = new Set([400, 404, 413, 422]);

export function isRejectedSaveError(error: unknown): boolean {
  const status = statusOf(error);
  return status !== null && REJECTED_STATUSES.has(status);
}

function defaultIsOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

function sameSnapshot(a: SaveQueueSnapshot, b: SaveQueueSnapshot): boolean {
  return (
    a.state === b.state &&
    a.pendingCount === b.pendingCount &&
    a.lastError === b.lastError &&
    a.lastSavedAt === b.lastSavedAt &&
    a.nextRetryAt === b.nextRetryAt &&
    a.failedAttempts === b.failedAttempts &&
    a.rejectedCount === b.rejectedCount
  );
}

// One payload, the number of changes (enqueue calls) in it, and the attempt id
// it is sent under. A payload that changes gets a new id.
interface Entry<P> {
  payload: P;
  changes: number;
  id: number;
}

export function createSaveQueue<P>(options: SaveQueueOptions<P>): SaveQueue<P> {
  const debounceMs = Math.max(0, options.debounceMs ?? DEFAULT_SAVE_DEBOUNCE_MS);
  const maxWaitMs = Math.max(debounceMs, options.maxWaitMs ?? DEFAULT_SAVE_MAX_WAIT_MS);
  const retryDelays =
    options.retryDelaysMs && options.retryDelaysMs.length > 0 ? options.retryDelaysMs : DEFAULT_SAVE_RETRY_DELAYS_MS;
  const isNeedsAccess = options.isNeedsAccess ?? defaultIsNeedsAccess;
  const isRejected = options.isRejected ?? isRejectedSaveError;
  const isOnline = options.isOnline ?? defaultIsOnline;
  const coalesce = options.coalesce ?? ((_older: P, newer: P) => newer);
  const canCoalesce = options.canCoalesce ?? (() => true);
  // Full snapshots (no coalesce given): a newer confirmed payload holds every
  // older one, including one the server refused.
  const fullSnapshots = options.coalesce === undefined;

  let nextId = 0;
  const entry = (payload: P, changes: number): Entry<P> => ({ payload, changes, id: ++nextId });

  // Closed payloads, oldest first; a failed one kept apart goes back in front.
  let ready: Entry<P>[] = [];
  // The open payload new changes are combined into.
  let pending: Entry<P> | null = null;
  let inFlight: Entry<P> | null = null;
  // The attempt id last handed to send(); see unconfirmedPayloads().
  let sentId = 0;
  // Refused for good: kept and counted, not sent until retryRejected().
  let rejected: Array<{ entry: Entry<P>; error: string }> = [];
  let firstPendingAt: number | null = null;
  let lastEnqueueAt = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let nextRetryAt: number | null = null;
  let flushWhenSettled = false;
  let paused = false;
  let holds = 0;
  let failedAttempts = 0;
  let backoffStep = 0;
  let failureKind: 'retrying' | 'offline' = 'retrying';
  let lastError: string | null = null;
  let lastSavedAt: number | null = null;
  let disposed = false;
  const listeners = new Set<(snapshot: SaveQueueSnapshot) => void>();

  const countOf = (entries: Array<Entry<P> | null>) => entries.reduce((sum, e) => sum + (e ? e.changes : 0), 0);
  const rejectedCount = () => countOf(rejected.map((r) => r.entry));
  const unconfirmedCount = () => countOf([...ready, pending, inFlight]) + rejectedCount();
  const hasWaiting = () => ready.length > 0 || pending !== null;

  const compute = (): SaveQueueSnapshot => {
    let state: SaveQueueState;
    if (paused) state = 'needs-access';
    else if (failedAttempts > 0) state = failureKind; // stays visible until a save succeeds
    else if (rejected.length > 0) state = 'rejected'; // stays until retried or superseded
    else if (hasWaiting() || inFlight) state = 'saving';
    else state = lastSavedAt !== null ? 'saved' : 'idle';
    return {
      state,
      pendingCount: unconfirmedCount(),
      lastError: lastError ?? (rejected.length > 0 ? rejected[rejected.length - 1].error : null),
      lastSavedAt,
      nextRetryAt,
      failedAttempts,
      rejectedCount: rejectedCount(),
    };
  };

  let snapshot = compute();

  const emit = () => {
    const next = compute();
    if (sameSnapshot(next, snapshot)) return;
    snapshot = next;
    for (const listener of Array.from(listeners)) {
      try {
        listener(snapshot);
      } catch (error) {
        // A broken subscriber must not stop the queue from saving.
        console.error('Save queue listener failed:', error);
      }
    }
  };

  const clearDebounce = () => {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = null;
  };

  const clearRetry = () => {
    if (retryTimer !== null) clearTimeout(retryTimer);
    retryTimer = null;
    nextRetryAt = null;
  };

  const sendNow = () => {
    clearDebounce();
    if (disposed || paused || holds > 0 || inFlight) return;
    let next: Entry<P> | null = null;
    if (ready.length > 0) {
      next = ready.shift()!;
    } else if (pending) {
      next = pending;
      pending = null;
      firstPendingAt = null;
    }
    if (!next) return;
    const sending = next;
    inFlight = sending;
    sentId = sending.id;
    emit();

    let request: Promise<unknown>;
    try {
      request = Promise.resolve(options.send(sending.payload, { id: sending.id }));
    } catch (error) {
      request = Promise.reject(error);
    }
    request.then(
      () => onSuccess(sending),
      (error: unknown) => onFailure(sending, error)
    );
  };

  // WHAT: Arm the send of what is waiting.
  // WHY: Only when nothing else governs the next send: an in-flight request
  //     re-arms this when it settles, a scheduled retry sends on its own timer,
  //     a needs-access pause waits for resume() and a hold for its release. A
  //     closed payload goes at once; the open one after the debounce.
  const scheduleSend = () => {
    if (disposed || paused || holds > 0 || inFlight || retryTimer !== null || !hasWaiting()) return;
    clearDebounce();
    if (ready.length > 0) {
      sendNow();
      return;
    }
    const now = Date.now();
    const due = Math.min(lastEnqueueAt + debounceMs, (firstPendingAt ?? now) + maxWaitMs);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      sendNow();
    }, Math.max(0, due - now));
  };

  const onSuccess = (sent: Entry<P>) => {
    if (disposed) return;
    inFlight = null;
    if (fullSnapshots) rejected = []; // superseded by this newer snapshot
    failedAttempts = 0;
    backoffStep = 0;
    lastError = null;
    lastSavedAt = Date.now();
    clearRetry();
    // Under a hold the flush request waits for the release instead.
    const sendImmediately = flushWhenSettled && holds === 0;
    if (holds === 0) flushWhenSettled = false;
    emit();

    if (options.onSaved) {
      try {
        options.onSaved(sent.payload, { pendingCount: unconfirmedCount() });
      } catch (error) {
        console.error('Save queue onSaved failed:', error);
      }
    }

    if (hasWaiting()) {
      if (sendImmediately) {
        sendNow();
        // A flush sends everything that was waiting, one request after another.
        if (hasWaiting()) flushWhenSettled = true;
      } else {
        scheduleSend();
      }
    }
  };

  const onFailure = (failed: Entry<P>, error: unknown) => {
    if (disposed) return;
    inFlight = null;
    flushWhenSettled = false;
    clearDebounce();
    clearRetry();

    // Refused for good: set aside, and go on with what was queued after it.
    // It is not merged into, so it cannot take later changes down with it.
    if (!isNeedsAccess(error) && isRejected(error)) {
      rejected.push({ entry: failed, error: messageOf(error) });
      failedAttempts = 0;
      backoffStep = 0;
      lastError = null;
      emit();
      scheduleSend();
      return;
    }

    if (options.retryFailedAlone) {
      // Retried unchanged, under the same attempt id, before anything newer.
      ready.unshift(failed);
    } else if (pending && canCoalesce(failed.payload, pending.payload)) {
      // Retried together with whatever was queued meanwhile: the failed
      // payload goes underneath, so a newer value of the same key wins and no
      // change of either is lost. Sending the failed one on its own after the
      // newer one could only overwrite newer data.
      pending = entry(coalesce(failed.payload, pending.payload), failed.changes + pending.changes);
    } else if (pending) {
      ready.unshift(failed); // too much to combine: first, on its own
    } else {
      pending = failed;
      if (firstPendingAt === null) firstPendingAt = Date.now();
    }
    failedAttempts += 1;
    lastError = messageOf(error);

    if (isNeedsAccess(error)) {
      paused = true;
      emit();
      if (options.onNeedsAccess) {
        try {
          options.onNeedsAccess(error);
        } catch (callbackError) {
          console.error('Save queue onNeedsAccess failed:', callbackError);
        }
      }
      return;
    }

    const offline = (error instanceof SaveRequestError && error.offline) || !isOnline();
    failureKind = offline ? 'offline' : 'retrying';
    const base = retryDelays[Math.min(backoffStep, retryDelays.length - 1)];
    backoffStep += 1;
    const hinted = error instanceof SaveRequestError && error.retryAfterMs ? error.retryAfterMs : 0;
    const delay = Math.max(base, Math.min(hinted, MAX_RETRY_AFTER_MS));
    nextRetryAt = Date.now() + delay;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      nextRetryAt = null;
      sendNow();
    }, delay);
    emit();
  };

  // WHAT: Send everything waiting now: skip the debounce and any retry wait,
  //     and send each waiting payload as soon as the one before it settles.
  const flush = () => {
    if (disposed || paused) return;
    clearDebounce();
    clearRetry();
    if (inFlight || holds > 0) {
      flushWhenSettled = true;
    } else {
      sendNow();
      if (hasWaiting()) flushWhenSettled = true;
    }
    emit();
  };

  const hold = () => {
    if (disposed) return () => {};
    holds += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      holds -= 1;
      if (disposed || holds > 0 || paused || inFlight || retryTimer !== null || !hasWaiting()) return;
      if (flushWhenSettled) {
        flushWhenSettled = false;
        sendNow();
      } else {
        scheduleSend();
      }
    };
  };

  return {
    enqueue(payload: P) {
      if (disposed) return;
      const now = Date.now();
      if (pending && canCoalesce(pending.payload, payload)) {
        pending = entry(coalesce(pending.payload, payload), pending.changes + 1);
      } else {
        if (pending) ready.push(pending); // full: sent as it is, in turn
        pending = entry(payload, 1);
        firstPendingAt = now;
      }
      if (firstPendingAt === null) firstPendingAt = now;
      lastEnqueueAt = now;
      scheduleSend();
      emit();
    },

    unconfirmed() {
      // Oldest first, so the newest value of a key wins.
      const entries = [...rejected.map((r) => r.entry), ...(inFlight ? [inFlight] : []), ...ready, ...(pending ? [pending] : [])];
      let merged: P | null = null;
      for (const e of entries) merged = merged === null ? e.payload : coalesce(merged, e.payload);
      return merged;
    },

    unconfirmedPayloads() {
      // Same order as unconfirmed(). Entry ids are unique, so only the entry
      // last handed to send() -- in flight, or put back to go out again --
      // carries sentId; a refused one keeps its id but is known not stored.
      const refused = rejected.map((r) => ({ payload: r.entry.payload, attempt: { id: r.entry.id }, sent: false }));
      const open = [...(inFlight ? [inFlight] : []), ...ready, ...(pending ? [pending] : [])].map((e) => ({
        payload: e.payload,
        attempt: { id: e.id },
        sent: e.id === sentId,
      }));
      return [...refused, ...open];
    },

    flush,

    resume() {
      if (disposed) return;
      if (!paused) {
        flush();
        return;
      }
      paused = false;
      backoffStep = 0;
      emit();
      sendNow();
    },

    retryRejected() {
      if (disposed || rejected.length === 0) return;
      // Taken back as new payloads: the server refused them, so nothing of
      // them was stored, and a new attempt id must not look like a copy of a
      // request that landed.
      ready = [...rejected.map((r) => entry(r.entry.payload, r.entry.changes)), ...ready];
      rejected = [];
      emit();
      flush();
    },

    hold,

    dispose() {
      disposed = true;
      clearDebounce();
      clearRetry();
      listeners.clear();
    },

    getSnapshot() {
      return snapshot;
    },

    subscribe(listener: (snapshot: SaveQueueSnapshot) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const DEFAULT_WHEN_SAVED_TIMEOUT_MS = 30_000;

// WHAT: Send what is waiting and resolve once the server has confirmed every
//     change made so far.
// WHY: Actions that read or overwrite the stored record behind the editor's
//     back (sheet push, sheet pull) must not run while its own changes are
//     still on their way: a push would send the older values, and a snapshot
//     sent after a pull would put the pre-pull values back.
// RETURNS: true when nothing is left unconfirmed; false as soon as a save fails,
//     needs access or was refused for good, or after timeoutMs.
export function whenAllSaved<P>(queue: SaveQueue<P>, timeoutMs: number = DEFAULT_WHEN_SAVED_TIMEOUT_MS): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    // A failure already shown when this starts is retried by the flush below;
    // only a failure after that counts.
    const failuresAtStart = queue.getSnapshot().failedAttempts;
    let done = false;
    let unsubscribe: () => void = () => {};
    let timer: ReturnType<typeof setTimeout> | null = null;
    const finish = (saved: boolean) => {
      if (done) return;
      done = true;
      if (timer !== null) clearTimeout(timer);
      unsubscribe();
      resolve(saved);
    };
    const check = (s: SaveQueueSnapshot) => {
      if (s.pendingCount === 0) finish(true);
      else if (s.state === 'needs-access' || s.state === 'rejected' || s.failedAttempts > failuresAtStart) finish(false);
    };
    unsubscribe = queue.subscribe(check);
    timer = setTimeout(() => finish(false), timeoutMs);
    check(queue.getSnapshot());
    if (!done) queue.flush();
  });
}

/**
 * Outcome of one attempt to re-establish save access:
 *   - 'granted': saving may be retried now (resume the queue);
 *   - 'retry':   access could not be checked (network, server error); try again later;
 *   - 'blocked': this page cannot get save access by itself (e.g. it was opened
 *                through an address that never issues a grant). No automatic
 *                attempts follow; the next request()/requestNow() tries again.
 */
export type AccessCheckResult = 'granted' | 'retry' | 'blocked';

export interface AccessRecoveryOptions {
  /**
   * Re-establish access, e.g. by re-loading the editor page's data (which lets
   * the server re-issue its grant) or by showing the password prompt. It may
   * stay pending for as long as a password prompt is open.
   */
  requestAccess: () => Promise<AccessCheckResult>;
  /** Called when access was re-established; normally SaveQueue.resume(). */
  onGranted: () => void;
  /** Called when an attempt answered 'blocked'. */
  onBlocked?: () => void;
  /** Wait before each consecutive attempt; the last entry repeats. */
  delaysMs?: readonly number[];
}

export interface AccessRecovery {
  /** Start re-establishing access unless an attempt is already scheduled or running. */
  request(): void;
  /** Same, but skip the wait (a "Retry now" click). No effect while an attempt is running. */
  requestNow(): void;
  /** Access proved good (a save went through): the next loss starts without delay. */
  reset(): void;
  dispose(): void;
}

// WHAT: First attempt immediately, then back off.
// WHY: If the page re-check says "access is fine" but the save is still refused
//     (e.g. a server that does not re-issue the grant), resuming at once would
//     loop GET + PUT as fast as the network allows.
export const DEFAULT_ACCESS_RECHECK_DELAYS_MS: readonly number[] = [0, 2000, 5000, 15000, 30000];

// WHAT: Drives "re-establish access, then resume the queue" after a 401 on save.
// WHY: Framework-free for the same reason as the queue: the backoff and the
//     one-attempt-at-a-time rule are what stop a refused save from turning into
//     a request storm, and they are testable only outside React.
export function createAccessRecovery(options: AccessRecoveryOptions): AccessRecovery {
  const delays =
    options.delaysMs && options.delaysMs.length > 0 ? options.delaysMs : DEFAULT_ACCESS_RECHECK_DELAYS_MS;
  let attempts = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let disposed = false;

  const run = (delay: number) => {
    attempts += 1;
    timer = setTimeout(async () => {
      timer = null;
      running = true;
      let result: AccessCheckResult = 'retry';
      try {
        result = await options.requestAccess();
      } catch {
        result = 'retry';
      }
      running = false;
      if (disposed) return;
      if (result === 'granted') {
        options.onGranted();
      } else if (result === 'blocked') {
        // Re-checking on a timer cannot change the answer; wait for the user
        // (Retry now) or for the page to regain access some other way.
        options.onBlocked?.();
      } else {
        // Could not confirm access (network, server error): try again later.
        request();
      }
    }, delay);
  };

  const request = () => {
    if (disposed || running || timer !== null) return;
    run(delays[Math.min(attempts, delays.length - 1)]);
  };

  return {
    request,
    requestNow() {
      if (disposed || running) return;
      if (timer !== null) clearTimeout(timer);
      timer = null;
      run(0);
    },
    reset() {
      attempts = 0;
    },
    dispose() {
      disposed = true;
      if (timer !== null) clearTimeout(timer);
      timer = null;
    },
  };
}

// ---------------------------------------------------------------------------
// Unsaved-change drafts
// ---------------------------------------------------------------------------
// WHAT: A copy of an editor's unsaved data in this browser's localStorage,
//     removed only once the server confirms a save that includes it, and the
//     rule for putting it back after a reload.
// WHY: 2026-09-27: every save was refused and the numbers lived only in React
//     state, so a reload lost hours of input. The draft survives a reload, a
//     crash or a closed tab.
// RESTORE RULE (three-way, per field -- no clocks):
//     Each draft stores `base`, the server content its changes were made on
//     top of (what the editor loaded, or what the server last confirmed from
//     it), `fields`, the local content, and `sent`, the values this device
//     sent since `base` without seeing a confirmation. On the next load, a
//     field the draft changed (fields != base) is put back when the server
//     still holds the base value for it -- or one of its `sent` values: a save
//     can reach the server while its answer never reaches the page (a reload,
//     a discarded background tab, a dropped connection), and this device's own
//     write is not someone else's change.
//     A field changed both locally and on the server since (another tab saved,
//     an admin edited, a sheet pull ran) is a conflict. Only that field is held
//     back, and the operator chooses; every other field of the draft is put
//     back. The stored draft is narrowed to its held-back fields, so choosing
//     "keep the saved values" discards those and nothing else.
//     Timestamps are not used to decide: the device clock and the server clock
//     differ, and this editor's own saves move the server's updatedAt too.
// COUNTS: A counted field (a clicker tap, +1/-1) is not a value: two devices
//     counting the same stat both count, so the server adds each count to what
//     it holds. The draft keeps counts apart from values -- `counts`, never
//     sent, and `outstanding`, the counts of a request that went out and was
//     never answered, with the tabId and clientSeq it went out under. A field
//     in either is left out of the value rule above (its `fields` entry is only
//     what the page showed): it is restored as the server's value plus the
//     counts, never held back, and its counts are sent again as counts -- an
//     outstanding request under its own tabId and clientSeq, so the server's
//     late-write guard stores it at most once. Restored as a value instead, a
//     count overwrote whatever another device counted meanwhile.
// TWO TABS: Each editor instance writes its own key (scope + tab id), so two
//     tabs never overwrite or delete each other's drafts. A later load adopts
//     every restorable draft into its own and removes the adopted keys, but
//     only if they were not rewritten meanwhile (compare-and-delete).

/** A flat map of independently mergeable fields, e.g. `stats:female` or `hashtags`. */
export type DraftFields = Record<string, unknown>;

/** Per field, the values this device sent since `base` without a confirmation, oldest first. */
export type SentValues = Record<string, unknown[]>;

/** Per field, a count to add to the server's value (clicker taps added up). */
export type DraftCounts = Record<string, number>;

/**
 * The counts of a request that went out and was never answered: it may or may
 * not have been stored. Sent again under the same tabId and clientSeq.
 */
export interface OutstandingCounts {
  tabId: string;
  clientSeq: number;
  counts: DraftCounts;
}

export interface StoredDraft {
  v: 1;
  /** What the draft belongs to, e.g. a project id. */
  scope: string;
  /** The editor instance (browser tab) that wrote it. */
  tabId: string;
  /** Epoch ms (this device's clock) of the last local change. Orders drafts; shown to the user. */
  editedAt: number;
  /** Server content the local changes were made on top of. */
  base: DraftFields;
  /** Local content, including the unsaved changes. */
  fields: DraftFields;
  /** Values sent to the server since `base` whose confirmation never arrived. */
  sent?: SentValues;
  /** Counts never sent (see COUNTS above). */
  counts?: DraftCounts;
  /** Counts of requests that went out without an answer (see COUNTS above). */
  outstanding?: OutstandingCounts[];
}

// WHAT: How many unconfirmed values are remembered per field.
// WHY: One entry per send; during a long outage a counter is sent many times.
//     The server can only hold one of the last few, and a report text can be
//     long, so older values are dropped rather than growing the draft.
export const MAX_SENT_VALUES_PER_FIELD = 10;

/**
 * Remember the values a save is about to send (only fields that differ from
 * `base`). Returns a new map; the newest value of a field comes last.
 */
export function addSentValues(
  sent: SentValues | undefined,
  base: DraftFields,
  sending: DraftFields,
  maxPerField: number = MAX_SENT_VALUES_PER_FIELD
): SentValues {
  const next: SentValues = { ...(sent || {}) };
  for (const [key, value] of Object.entries(sending)) {
    // An absent value cannot be stored in JSON; a removal is simply not remembered.
    if (value === undefined || sameFieldValue(value, base[key])) continue;
    const earlier = (next[key] || []).filter((v) => !sameFieldValue(v, value));
    next[key] = [...earlier, value].slice(-Math.max(1, maxPerField));
  }
  return next;
}

/** The subset of Storage the draft helpers use (localStorage in the browser). */
export type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

export const EDITOR_DRAFT_KEY_PREFIX = 'messmass:editor-draft:';

const draftKey = (scope: string, tabId: string) => `${EDITOR_DRAFT_KEY_PREFIX}${scope}:${tabId}`;

// Every storage access is wrapped: private windows, blocked site data and full
// quotas all throw, and the editor must keep working (and saving) without it.
export function getDraftStorage(): DraftStorage | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function createTabId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    // fall through
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

function parseDraft(raw: string | null, scope: string, tabId: string): StoredDraft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as Partial<StoredDraft> | null;
    if (
      !draft ||
      draft.v !== 1 ||
      draft.scope !== scope ||
      draft.tabId !== tabId ||
      typeof draft.editedAt !== 'number' ||
      !isPlainObject(draft.base) ||
      !isPlainObject(draft.fields)
    ) {
      return null;
    }
    const parsed: StoredDraft = { v: 1, scope, tabId, editedAt: draft.editedAt, base: draft.base, fields: draft.fields };
    // Optional, and only trusted in its exact shape: a bad `sent` is dropped,
    // which at worst turns this device's own write into a question.
    if (isPlainObject(draft.sent) && Object.values(draft.sent).every(Array.isArray)) {
      parsed.sent = draft.sent as SentValues;
    }
    // Counts likewise: a bad entry is dropped, and its field is then restored
    // by the value rule, as before counts were kept apart.
    if (isDraftCounts(draft.counts)) parsed.counts = draft.counts;
    if (Array.isArray(draft.outstanding)) {
      const outstanding = draft.outstanding.filter(isOutstandingCounts);
      if (outstanding.length > 0) parsed.outstanding = outstanding;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isDraftCounts(value: unknown): value is DraftCounts {
  return isPlainObject(value) && Object.values(value).every((n) => typeof n === 'number' && Number.isFinite(n));
}

function isOutstandingCounts(value: unknown): value is OutstandingCounts {
  return (
    isPlainObject(value) &&
    typeof value.tabId === 'string' &&
    value.tabId.length > 0 &&
    typeof value.clientSeq === 'number' &&
    Number.isSafeInteger(value.clientSeq) &&
    value.clientSeq >= 0 &&
    isDraftCounts(value.counts)
  );
}

/** The fields a draft counts (in `counts` or `outstanding`), which the value rule leaves alone. */
export function countedDraftFields(draft: Pick<StoredDraft, 'counts' | 'outstanding'>): Set<string> {
  const keys = new Set(Object.keys(draft.counts ?? {}));
  for (const out of draft.outstanding ?? []) for (const key of Object.keys(out.counts)) keys.add(key);
  return keys;
}

/**
 * The draft without its counts, and without the fields it counts (their
 * `fields` entry is only the number the page showed). What the value rule
 * reads, and what is left of a draft whose counts another page took over
 * (and now sends) while its values stay: a later load must not count them a
 * second time. Sending a value again is harmless; a count is not.
 */
export function withoutDraftCounts(draft: StoredDraft): StoredDraft {
  const counted = countedDraftFields(draft);
  const part: StoredDraft = { ...draft };
  delete part.counts;
  delete part.outstanding;
  if (counted.size === 0) return part;
  part.base = withoutKeys(draft.base, counted);
  part.fields = withoutKeys(draft.fields, counted);
  if (draft.sent) part.sent = withoutKeys(draft.sent, counted);
  return part;
}

function withoutKeys<T>(source: Record<string, T>, drop: Set<string>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [key, value] of Object.entries(source)) if (!drop.has(key)) out[key] = value;
  return out;
}

/** Every readable draft for this scope, oldest first. Never throws. */
export function readDrafts(storage: DraftStorage | null, scope: string): StoredDraft[] {
  if (!storage) return [];
  const prefix = `${EDITOR_DRAFT_KEY_PREFIX}${scope}:`;
  const drafts: StoredDraft[] = [];
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
    for (const key of keys) {
      const draft = parseDraft(storage.getItem(key), scope, key.slice(prefix.length));
      if (draft) drafts.push(draft);
    }
  } catch {
    // storage became unavailable mid-read: use what was read
  }
  return drafts.sort((a, b) => a.editedAt - b.editedAt);
}

/** Store (replace) this tab's draft. Returns false when it could not be stored. */
export function writeDraft(storage: DraftStorage | null, draft: StoredDraft): boolean {
  if (!storage) return false;
  try {
    storage.setItem(draftKey(draft.scope, draft.tabId), JSON.stringify(draft));
    return true;
  } catch (error) {
    console.warn('Could not keep unsaved editor changes on this device:', error);
    return false;
  }
}

/**
 * Remove one tab's draft. With `expectedEditedAt`, only when the stored draft is
 * still that version -- a tab that is still open may have written a newer one.
 */
export function removeDraft(
  storage: DraftStorage | null,
  scope: string,
  tabId: string,
  expectedEditedAt?: number
): void {
  if (!storage) return;
  try {
    const key = draftKey(scope, tabId);
    if (expectedEditedAt !== undefined) {
      const current = parseDraft(storage.getItem(key), scope, tabId);
      if (current && current.editedAt !== expectedEditedAt) return;
    }
    storage.removeItem(key);
  } catch {
    // storage unavailable: nothing to remove either
  }
}

/**
 * Replace a stored draft, but only while it is still the version that was
 * read (same editedAt): never over a newer one, never bringing back a removed one.
 */
export function replaceDraft(storage: DraftStorage | null, draft: StoredDraft, expectedEditedAt: number): boolean {
  if (!storage) return false;
  try {
    const key = draftKey(draft.scope, draft.tabId);
    const current = parseDraft(storage.getItem(key), draft.scope, draft.tabId);
    if (!current || current.editedAt !== expectedEditedAt) return false;
    storage.setItem(key, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

/**
 * Drop some fields from a stored draft: the operator chose the server's values
 * for them ("Keep saved values"). Every other unsaved value in it stays. Only
 * while the stored draft is still the version that was read (same editedAt); a
 * draft left with no change is removed. Returns false when it could not be
 * changed (storage unavailable, or a newer version was written meanwhile).
 */
export function discardDraftFields(storage: DraftStorage | null, draft: StoredDraft, keys: string[]): boolean {
  if (!storage) return false;
  try {
    const key = draftKey(draft.scope, draft.tabId);
    const current = parseDraft(storage.getItem(key), draft.scope, draft.tabId);
    if (!current) return true; // already gone
    if (current.editedAt !== draft.editedAt) return false;
    const drop = new Set(keys);
    const without = <T,>(source: Record<string, T>): Record<string, T> => {
      const out: Record<string, T> = {};
      for (const [k, v] of Object.entries(source)) if (!drop.has(k)) out[k] = v;
      return out;
    };
    const next: StoredDraft = {
      v: 1,
      scope: current.scope,
      tabId: current.tabId,
      editedAt: current.editedAt,
      base: without(current.base),
      fields: without(current.fields),
    };
    if (current.sent) {
      const sent = without(current.sent);
      if (Object.keys(sent).length > 0) next.sent = sent;
    }
    // Counts are never held back for a choice, so none is named here; they stay.
    if (current.counts) next.counts = current.counts;
    if (current.outstanding) next.outstanding = current.outstanding;
    const stillChanged =
      countedDraftFields(next).size > 0 ||
      Object.keys({ ...next.base, ...next.fields }).some((k) => !sameFieldValue(next.fields[k], next.base[k]));
    if (stillChanged) storage.setItem(key, JSON.stringify(next));
    else storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) out[key] = canonical(value[key]);
    return out;
  }
  return value;
}

/** Deep equality for JSON-like values, independent of object key order. `undefined` means absent. */
export function sameFieldValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === undefined || b === undefined) return false;
  try {
    return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
  } catch {
    return false;
  }
}

export interface FieldMergeResult {
  merged: DraftFields;
  /** Fields whose value in `merged` differs from `current`. */
  applied: string[];
  /** Fields changed both locally and in `current` since `base`, to different values. */
  conflicts: string[];
}

/**
 * Three-way merge of local changes onto `current` (usually the server copy).
 * A field counts as changed locally when `local` differs from `base`; it is
 * applied when `current` still holds the base value. When `current` changed it
 * too (to something else), it is a conflict, resolved by `onConflict`.
 */
export function mergeFieldChanges(
  current: DraftFields,
  base: DraftFields,
  local: DraftFields,
  onConflict: 'keep-current' | 'take-local'
): FieldMergeResult {
  const merged: DraftFields = { ...current };
  const applied: string[] = [];
  const conflicts: string[] = [];
  const keys = new Set([...Object.keys(base), ...Object.keys(local)]);
  for (const key of keys) {
    const localValue = local[key];
    const baseValue = base[key];
    if (sameFieldValue(localValue, baseValue)) continue; // not changed locally
    const currentValue = current[key];
    if (sameFieldValue(currentValue, localValue)) continue; // already there
    if (!sameFieldValue(currentValue, baseValue)) {
      conflicts.push(key);
      if (onConflict === 'keep-current') continue;
    }
    if (localValue === undefined) delete merged[key];
    else merged[key] = localValue;
    applied.push(key);
  }
  return { merged, applied, conflicts };
}

export interface HeldBackDraft {
  /** The draft as read from storage (its editedAt identifies that version). */
  draft: StoredDraft;
  /** Fields held back: changed on this device and on the server since, to different values. */
  conflicts: string[];
  /**
   * The draft narrowed to `conflicts`, to store in place of `draft` once its
   * other fields are safe elsewhere: a later load then holds back only these.
   */
  held: StoredDraft;
}

export interface DraftRestorePlan {
  /**
   * The server fields with every conflict-free change of every draft applied,
   * oldest draft first, and every restored count added on top.
   */
  fields: DraftFields;
  /** `fields` before any count was added: what to compare with the server to find the values to send. */
  values: DraftFields;
  /** Fields whose value in `fields` came from a draft. */
  restored: string[];
  /**
   * Newest editedAt among the drafts that put back at least one value or
   * count, or null when none did.
   */
  restoredEditedAt: number | null;
  /** Drafts entirely contained in `fields`, `counts` and `outstanding`. */
  adopted: StoredDraft[];
  /** Drafts with at least one held-back field; their other changes are in `fields`. */
  conflicted: HeldBackDraft[];
  /** Drafts holding nothing the server lacks: safe to remove. */
  obsolete: StoredDraft[];
  /** Counts never sent, per field: to send as counts. */
  counts: DraftCounts;
  /** Requests to send again under their own tabId and clientSeq (each once). */
  outstanding: OutstandingCounts[];
}

// WHAT: The draft's base, with each field the server now holds at one of the
//     draft's own `sent` values moved to that value.
// WHY: That value got there through this device's own save; measured against
//     it, the field was not changed by anyone else.
function baseWithOwnWrites(draft: StoredDraft, server: DraftFields): DraftFields {
  if (!draft.sent) return draft.base;
  let base = draft.base;
  for (const [key, values] of Object.entries(draft.sent)) {
    const serverValue = server[key];
    if (serverValue === undefined || sameFieldValue(serverValue, base[key])) continue;
    if (!values.some((value) => sameFieldValue(value, serverValue))) continue;
    if (base === draft.base) base = { ...draft.base };
    base[key] = serverValue;
  }
  return base;
}

function pickFields(source: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) if (source[key] !== undefined) out[key] = source[key];
  return out;
}

function narrowDraft(draft: StoredDraft, base: DraftFields, keys: string[]): StoredDraft {
  const narrowed: StoredDraft = {
    v: 1,
    scope: draft.scope,
    tabId: draft.tabId,
    editedAt: draft.editedAt,
    base: pickFields(base, keys),
    fields: pickFields(draft.fields, keys),
  };
  if (draft.sent) {
    const sent = pickFields(draft.sent, keys) as SentValues;
    if (Object.keys(sent).length > 0) narrowed.sent = sent;
  }
  return narrowed;
}

const addCount = (target: DraftCounts, key: string, n: number) => {
  target[key] = (target[key] ?? 0) + n;
};

/** Decide, per field, what a fresh load restores. See RESTORE RULE and COUNTS above. */
export function planDraftRestore(server: DraftFields, drafts: StoredDraft[]): DraftRestorePlan {
  let values = server;
  const adopted: StoredDraft[] = [];
  const conflicted: HeldBackDraft[] = [];
  const obsolete: StoredDraft[] = [];
  // Counts never sent; and every count shown on top of `values` (those plus the outstanding ones).
  const counts: DraftCounts = {};
  const shown: DraftCounts = {};
  const outstanding: OutstandingCounts[] = [];
  const planned = new Set<string>();
  let restoredEditedAt: number | null = null;
  for (const draft of [...drafts].sort((a, b) => a.editedAt - b.editedAt)) {
    // A counted field's `fields` entry is the base value plus the taps;
    // compared with the base it would read as a value this device set.
    const valueDraft = withoutDraftCounts(draft);
    const base = baseWithOwnWrites(valueDraft, server);
    const result = mergeFieldChanges(values, base, valueDraft.fields, 'keep-current');
    // Conflict-free values go in whatever else the draft holds.
    values = result.merged;
    // A value this newer draft set replaces what older drafts counted on it
    // (an outstanding request still goes: the value is sent after it).
    for (const key of result.applied) {
      delete counts[key];
      delete shown[key];
    }
    let countsRestored = false;
    for (const [key, n] of Object.entries(draft.counts ?? {})) {
      if (n === 0) continue;
      addCount(counts, key, n);
      addCount(shown, key, n);
      countsRestored = true;
    }
    for (const out of draft.outstanding ?? []) {
      const nonZero = Object.entries(out.counts).filter(([, n]) => n !== 0);
      const id = `${out.tabId}\n${out.clientSeq}`;
      // Two drafts can hold the same request (one page took it over from
      // another and kept both): it is one request, sent and shown once.
      if (nonZero.length === 0 || planned.has(id)) continue;
      planned.add(id);
      outstanding.push({ tabId: out.tabId, clientSeq: out.clientSeq, counts: Object.fromEntries(nonZero) });
      for (const [key, n] of nonZero) addCount(shown, key, n);
      countsRestored = true;
    }
    const restoresSomething = result.applied.length > 0 || countsRestored;
    if (restoresSomething) restoredEditedAt = Math.max(restoredEditedAt ?? draft.editedAt, draft.editedAt);
    if (result.conflicts.length > 0) {
      conflicted.push({ draft, conflicts: result.conflicts, held: narrowDraft(valueDraft, base, result.conflicts) });
    } else if (!restoresSomething) {
      obsolete.push(draft);
    } else {
      adopted.push(draft);
    }
  }
  // Shown as if no outstanding request was stored yet. One whose answer was
  // lost may have been, before `server` was read; the server says so only
  // when the request is sent again (answered stale), and the caller then
  // loads the event again (the event editor does, see EditorDashboard).
  const fields: DraftFields = { ...values };
  for (const [key, n] of Object.entries(shown)) {
    if (n === 0) continue;
    const value = values[key];
    fields[key] = (typeof value === 'number' && Number.isFinite(value) ? value : 0) + n;
  }
  for (const key of Object.keys(counts)) if (counts[key] === 0) delete counts[key];
  const restored = Object.keys({ ...server, ...fields }).filter((key) => !sameFieldValue(fields[key], server[key]));
  // Counts that add up to nothing on screen still have to be sent: an
  // outstanding +1 may have been stored, and the -1 after it was not.
  const toSend = restored.length > 0 || Object.keys(counts).length > 0 || outstanding.length > 0;
  return {
    fields,
    values,
    restored,
    restoredEditedAt: toSend ? restoredEditedAt : null,
    adopted,
    conflicted,
    obsolete,
    counts,
    outstanding,
  };
}

// WHAT: Longest one save request may take, from the CSRF lookup to the answer.
// WHY: The queue keeps one request in flight, so a request that never settles
//     (a connection that stalls silently on stadium Wi-Fi can take many minutes
//     to give up) would hold back every later save behind "Saving...". Past
//     this limit the request is abandoned and counts as a failed attempt, which
//     shows "Not saved" and is retried with backoff.
export const SAVE_REQUEST_TIMEOUT_MS = 25_000;

// WHAT: Send one JSON save request with the CSRF header, mapping every failure
//     to a SaveRequestError the queue can classify.
// WHY: Same CSRF handling as apiPut() (ensureCsrfToken), but the HTTP status,
//     the server's error code and Retry-After survive, and a request that never
//     reached the server is marked offline instead of looking like a 500.
// NOTE: No keepalive: its 64 KB body cap is smaller than an event with many
//     report texts, and the owner keeps a local copy of unsaved data anyway.
// STALE: The editor save routes answer { success: true, stale: true } when a
//     write from the same editor (tabId) with this clientSeq or a later one
//     already landed. Either it was this very request -- an earlier copy of a
//     retry, which goes out under the same clientSeq (SaveAttempt), whose
//     answer never arrived -- or a later request that carried this one's
//     changes too (a failed payload coalesced into the next one, as the
//     partner editor's full snapshots are). Either way the changes are stored.
//     It resolves like any success: the queue counts it as confirmed instead
//     of retrying something the server will keep refusing.
export async function sendJsonForSave(
  url: string,
  body: unknown,
  method: 'PUT' | 'POST' | 'PATCH' = 'PUT',
  timeoutMs: number = SAVE_REQUEST_TIMEOUT_MS
): Promise<unknown> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  // Rejects at the deadline even if the request ignores the abort signal.
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller?.abort();
      reject(new SaveRequestError('The server did not answer in time'));
    }, timeoutMs);
  });
  try {
    return await Promise.race([sendOnce(url, body, method, controller?.signal), deadline]);
  } finally {
    if (timer !== null) clearTimeout(timer);
  }
}

async function sendOnce(
  url: string,
  body: unknown,
  method: 'PUT' | 'POST' | 'PATCH',
  signal: AbortSignal | undefined
): Promise<unknown> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const csrfToken = await ensureCsrfToken();
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
      credentials: 'same-origin',
      signal,
    });
  } catch {
    throw new SaveRequestError('No connection to the server', { offline: true });
  }

  let data: { success?: boolean; error?: string; message?: string; code?: string } | null = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.ok && data?.success !== false) return data;

  const code = typeof data?.code === 'string' ? data.code : null;
  if (response.status === 403 && code === 'CSRF_TOKEN_INVALID') {
    // Drop the stale token so the retry fetches a fresh one (as apiRequest does).
    try {
      if (typeof document !== 'undefined') {
        document.cookie = 'csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    } catch {
      // cookie access blocked: the retry will surface the same error
    }
  }

  const retryAfterSeconds = Number(response.headers?.get?.('Retry-After'));
  throw new SaveRequestError(data?.error || data?.message || `HTTP ${response.status}`, {
    status: response.status,
    code,
    retryAfterMs: Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : null,
  });
}

// WHAT: Numbers overlapping loads of the same record, so an older answer never
//     replaces a newer one that was already applied.
// WHY: The editor page re-loads its event on tab focus and after a refused
//     save. Two loads can overlap and answer in either order; applying the
//     older copy last would hand the editor data it already moved past, and
//     its next save would write that older data back.
export interface ResponseOrder {
  /** Ticket for a load that is about to start. */
  next(): number;
  /** May this ticket's answer be applied? true at most once per ticket, and never after a newer one. */
  accept(ticket: number): boolean;
}

export function createResponseOrder(): ResponseOrder {
  let issued = 0;
  let applied = 0;
  return {
    next() {
      issued += 1;
      return issued;
    },
    accept(ticket: number) {
      if (ticket <= applied) return false;
      applied = ticket;
      return true;
    },
  };
}
