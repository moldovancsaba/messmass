// tests/editor-save-queue.test.ts
// WHAT: Pins the save queue the live editors route every save through.
// WHY: 2026-09-27: an operator's saves all failed with 401 while the editor
//     showed "Save Error" for 3 s and then "Ready"; nothing was retried and the
//     data existed only in React state. Overlapping PUTs could also land out of
//     order, letting an older snapshot overwrite a newer one. These tests lock
//     the rules that close both holes: coalescing, strict ordering, retry until
//     success, a 401 pause that waits for re-authentication, and flush().
// HOW: Fake timers drive the debounce/backoff; send() returns promises the test
//     settles by hand so "in flight" is an explicit, observable state.

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  ensureCsrfToken: jest.fn(async () => 'csrf-test-token'),
}));

import {
  addSentValues,
  createAccessRecovery,
  createResponseOrder,
  createSaveQueue,
  discardDraftFields,
  isNeedsAccessError,
  mergeFieldChanges,
  planDraftRestore,
  readDrafts,
  removeDraft,
  replaceDraft,
  sameFieldValue,
  sendJsonForSave,
  whenAllSaved,
  withoutDraftCounts,
  writeDraft,
  EDITOR_DRAFT_KEY_PREFIX,
  MAX_SENT_VALUES_PER_FIELD,
  SAVE_REQUEST_TIMEOUT_MS,
  SaveRequestError,
  type AccessCheckResult,
  type DraftStorage,
  type SaveQueueSnapshot,
  type StoredDraft,
} from '@/lib/editorSaveQueue';

interface Call<P> {
  payload: P;
  resolve: () => void;
  reject: (error: unknown) => void;
}

function controlledSend<P>() {
  const calls: Call<P>[] = [];
  const send = jest.fn(
    (payload: P) =>
      new Promise<void>((resolve, reject) => {
        calls.push({ payload, resolve: () => resolve(), reject });
      })
  );
  return { send, calls };
}

const settle = () => jest.advanceTimersByTimeAsync(0);

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('createSaveQueue', () => {
  it('coalesces rapid changes into one request carrying the latest snapshot', async () => {
    const { send, calls } = controlledSend<number>();
    const queue = createSaveQueue<number>({ send, debounceMs: 700 });

    queue.enqueue(1);
    await jest.advanceTimersByTimeAsync(200);
    queue.enqueue(2);
    await jest.advanceTimersByTimeAsync(200);
    queue.enqueue(3);
    expect(queue.getSnapshot()).toMatchObject({ state: 'saving', pendingCount: 3 });

    await jest.advanceTimersByTimeAsync(699);
    expect(send).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(calls[0].payload).toBe(3);

    calls[0].resolve();
    await settle();
    expect(queue.getSnapshot()).toMatchObject({ state: 'saved', pendingCount: 0, lastError: null });
  });

  it('still saves within maxWait while changes keep arriving', async () => {
    const { send, calls } = controlledSend<number>();
    const queue = createSaveQueue<number>({ send, debounceMs: 700, maxWaitMs: 3000 });

    // A clicker tapping every 300 ms never leaves a 700 ms quiet gap.
    for (let i = 1; i <= 10; i++) {
      queue.enqueue(i);
      await jest.advanceTimersByTimeAsync(300);
    }
    expect(send).toHaveBeenCalledTimes(1);
    expect(calls[0].payload).toBe(10);
  });

  it('keeps one request in flight and then sends only the newest snapshot', async () => {
    const { send, calls } = controlledSend<number>();
    const queue = createSaveQueue<number>({ send, debounceMs: 100 });

    queue.enqueue(1);
    await jest.advanceTimersByTimeAsync(100);
    expect(send).toHaveBeenCalledTimes(1);

    queue.enqueue(2);
    queue.enqueue(3);
    await jest.advanceTimersByTimeAsync(5000);
    expect(send).toHaveBeenCalledTimes(1); // still waiting on the first request
    expect(queue.getSnapshot().pendingCount).toBe(3);

    calls[0].resolve();
    await settle();
    expect(queue.getSnapshot().pendingCount).toBe(2);
    expect(send).toHaveBeenCalledTimes(2);
    expect(calls[1].payload).toBe(3);

    calls[1].resolve();
    await settle();
    expect(queue.getSnapshot()).toMatchObject({ state: 'saved', pendingCount: 0 });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('never sends an older snapshot after a newer one, even when the older request fails', async () => {
    const { send, calls } = controlledSend<number>();
    const queue = createSaveQueue<number>({ send, debounceMs: 100, retryDelaysMs: [1000] });

    queue.enqueue(1);
    await jest.advanceTimersByTimeAsync(100);
    queue.enqueue(2);
    calls[0].reject(new SaveRequestError('boom', { status: 500 }));
    await settle();

    await jest.advanceTimersByTimeAsync(1000);
    expect(send).toHaveBeenCalledTimes(2);
    expect(calls[1].payload).toBe(2);
    calls[1].resolve();
    await settle();

    const sent = calls.map((c) => c.payload);
    expect(sent).toEqual([...sent].sort((a, b) => a - b));
    expect(queue.getSnapshot()).toMatchObject({ state: 'saved', pendingCount: 0 });
  });

  it('keeps a failed snapshot and retries it with capped backoff until it succeeds', async () => {
    const { send, calls } = controlledSend<string>();
    const queue = createSaveQueue<string>({ send, debounceMs: 0, retryDelaysMs: [2000, 5000, 10000] });

    queue.enqueue('stats');
    await settle();
    expect(send).toHaveBeenCalledTimes(1);

    const expectedDelays = [2000, 5000, 10000, 10000];
    for (let attempt = 0; attempt < expectedDelays.length; attempt++) {
      calls[attempt].reject(new SaveRequestError('Server error', { status: 500 }));
      await settle();
      expect(queue.getSnapshot()).toMatchObject({
        state: 'retrying',
        pendingCount: 1,
        lastError: 'Server error',
        failedAttempts: attempt + 1,
      });
      await jest.advanceTimersByTimeAsync(expectedDelays[attempt] - 1);
      expect(send).toHaveBeenCalledTimes(attempt + 1);
      await jest.advanceTimersByTimeAsync(1);
      expect(send).toHaveBeenCalledTimes(attempt + 2);
      // The failure stays visible while the retry is running.
      expect(queue.getSnapshot().state).toBe('retrying');
    }

    expect(calls.every((c) => c.payload === 'stats')).toBe(true);
    calls[calls.length - 1].resolve();
    await settle();
    expect(queue.getSnapshot()).toMatchObject({
      state: 'saved',
      pendingCount: 0,
      lastError: null,
      failedAttempts: 0,
      nextRetryAt: null,
    });
  });

  it('reports offline when the request never reached the server', async () => {
    const { send, calls } = controlledSend<number>();
    const queue = createSaveQueue<number>({ send, debounceMs: 0 });
    queue.enqueue(1);
    await settle();
    calls[0].reject(new SaveRequestError('No connection to the server', { offline: true }));
    await settle();
    expect(queue.getSnapshot()).toMatchObject({ state: 'offline', pendingCount: 1 });
  });

  it('waits at least as long as the server Retry-After asks', async () => {
    const { send, calls } = controlledSend<number>();
    const queue = createSaveQueue<number>({ send, debounceMs: 0, retryDelaysMs: [2000] });
    queue.enqueue(1);
    await settle();
    calls[0].reject(new SaveRequestError('Rate limit exceeded', { status: 429, retryAfterMs: 20000 }));
    await settle();
    await jest.advanceTimersByTimeAsync(19999);
    expect(send).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('pauses on 401 until resume(), then sends the latest snapshot', async () => {
    const { send, calls } = controlledSend<number>();
    const onNeedsAccess = jest.fn();
    const queue = createSaveQueue<number>({ send, debounceMs: 100, onNeedsAccess });

    queue.enqueue(1);
    await jest.advanceTimersByTimeAsync(100);
    calls[0].reject(new SaveRequestError('Sign in or enter the page password to edit this event.', { status: 401 }));
    await settle();

    expect(onNeedsAccess).toHaveBeenCalledTimes(1);
    expect(queue.getSnapshot()).toMatchObject({ state: 'needs-access', pendingCount: 1 });

    // No retries and no new sends while paused, whatever happens meanwhile.
    queue.enqueue(2);
    queue.flush();
    await jest.advanceTimersByTimeAsync(120_000);
    expect(send).toHaveBeenCalledTimes(1);
    expect(queue.getSnapshot()).toMatchObject({ state: 'needs-access', pendingCount: 2 });

    queue.resume();
    expect(send).toHaveBeenCalledTimes(2);
    expect(calls[1].payload).toBe(2);
    calls[1].resolve();
    await settle();
    expect(queue.getSnapshot()).toMatchObject({ state: 'saved', pendingCount: 0 });
  });

  it('pauses on the EDIT_ACCESS_REQUIRED code the save routes answer with', async () => {
    const { send, calls } = controlledSend<number>();
    const onNeedsAccess = jest.fn();
    const queue = createSaveQueue<number>({ send, debounceMs: 0, onNeedsAccess });
    queue.enqueue(1);
    await settle();
    calls[0].reject(
      new SaveRequestError('Edit access expired or missing. Reopen the event edit link or sign in.', {
        status: 401,
        code: 'EDIT_ACCESS_REQUIRED',
      })
    );
    await settle();
    expect(onNeedsAccess).toHaveBeenCalledTimes(1);
    expect(queue.getSnapshot()).toMatchObject({ state: 'needs-access', pendingCount: 1 });
    await jest.advanceTimersByTimeAsync(120_000);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('pauses again if access is still refused after resume()', async () => {
    const { send, calls } = controlledSend<number>();
    const onNeedsAccess = jest.fn();
    const queue = createSaveQueue<number>({ send, debounceMs: 0, onNeedsAccess });
    queue.enqueue(1);
    await settle();
    calls[0].reject(new SaveRequestError('denied', { status: 401 }));
    await settle();
    queue.resume();
    calls[1].reject(new SaveRequestError('denied', { status: 401 }));
    await settle();
    expect(onNeedsAccess).toHaveBeenCalledTimes(2);
    expect(queue.getSnapshot()).toMatchObject({ state: 'needs-access', pendingCount: 1 });
  });

  it('flush() skips the debounce', async () => {
    const { send, calls } = controlledSend<number>();
    const queue = createSaveQueue<number>({ send, debounceMs: 700 });
    queue.enqueue(1);
    queue.flush();
    expect(send).toHaveBeenCalledTimes(1);
    expect(calls[0].payload).toBe(1);
  });

  it('flush() during a retry wait retries immediately', async () => {
    const { send, calls } = controlledSend<number>();
    const queue = createSaveQueue<number>({ send, debounceMs: 0, retryDelaysMs: [30000] });
    queue.enqueue(1);
    await settle();
    calls[0].reject(new SaveRequestError('Server error', { status: 500 }));
    await settle();
    expect(queue.getSnapshot().nextRetryAt).not.toBeNull();

    queue.flush();
    expect(send).toHaveBeenCalledTimes(2);
    expect(queue.getSnapshot().nextRetryAt).toBeNull();
  });

  it('flush() while a request is in flight sends the next snapshot as soon as it settles', async () => {
    const { send, calls } = controlledSend<number>();
    const queue = createSaveQueue<number>({ send, debounceMs: 700 });
    queue.enqueue(1);
    queue.flush();
    queue.enqueue(2);
    queue.flush();
    expect(send).toHaveBeenCalledTimes(1);

    calls[0].resolve();
    await settle();
    expect(send).toHaveBeenCalledTimes(2); // no 700 ms debounce wait
    expect(calls[1].payload).toBe(2);
  });

  it('tells onSaved how much is still unconfirmed', async () => {
    const { send, calls } = controlledSend<number>();
    const onSaved = jest.fn();
    const queue = createSaveQueue<number>({ send, debounceMs: 0, onSaved });

    queue.enqueue(1);
    await settle();
    queue.enqueue(2);
    calls[0].resolve();
    await settle();
    expect(onSaved).toHaveBeenLastCalledWith(1, { pendingCount: 1 });

    calls[1].resolve();
    await settle();
    expect(onSaved).toHaveBeenLastCalledWith(2, { pendingCount: 0 });
  });

  it('notifies subscribers only when the snapshot changes', async () => {
    const { send, calls } = controlledSend<number>();
    const queue = createSaveQueue<number>({ send, debounceMs: 0 });
    const seen: SaveQueueSnapshot[] = [];
    const unsubscribe = queue.subscribe((s) => seen.push(s));

    queue.enqueue(1);
    await settle();
    calls[0].resolve();
    await settle();
    expect(seen.map((s) => s.state)).toEqual(['saving', 'saved']);

    unsubscribe();
    queue.enqueue(2);
    expect(seen).toHaveLength(2);
  });

  it('dispose() cancels timers and ignores late responses', async () => {
    const { send, calls } = controlledSend<number>();
    const onSaved = jest.fn();
    const queue = createSaveQueue<number>({ send, debounceMs: 700, onSaved });
    queue.enqueue(1);
    queue.flush();
    queue.enqueue(2);
    queue.dispose();
    calls[0].resolve();
    await jest.advanceTimersByTimeAsync(10_000);
    expect(send).toHaveBeenCalledTimes(1);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('hold() sends nothing until released, then sends the newest snapshot', async () => {
    // A sheet pull writes the stored event; a snapshot taken before it must
    // not go out after it.
    const { send, calls } = controlledSend<number>();
    const queue = createSaveQueue<number>({ send, debounceMs: 100 });
    const release = queue.hold();
    queue.enqueue(1);
    queue.flush();
    queue.enqueue(2);
    await jest.advanceTimersByTimeAsync(60_000);
    expect(send).not.toHaveBeenCalled();
    expect(queue.getSnapshot()).toMatchObject({ state: 'saving', pendingCount: 2 });

    release();
    release(); // a second call has no further effect
    expect(send).toHaveBeenCalledTimes(1); // the flush asked for during the hold
    expect(calls[0].payload).toBe(2);
    calls[0].resolve();
    await settle();
    expect(queue.getSnapshot()).toMatchObject({ state: 'saved', pendingCount: 0 });
  });

  describe('with coalesce (payloads that name only what changed)', () => {
    type Changes = Record<string, number>;
    // Union, the newer value of a key winning -- the event editor's rule.
    const merge = (older: Changes, newer: Changes): Changes => ({ ...older, ...newer });

    it('merges waiting payloads instead of dropping the older one', async () => {
      const { send, calls } = controlledSend<Changes>();
      const queue = createSaveQueue<Changes>({ send, debounceMs: 700, coalesce: merge });

      queue.enqueue({ female: 1 });
      queue.enqueue({ male: 1 });
      queue.enqueue({ female: 2 });
      await jest.advanceTimersByTimeAsync(700);
      expect(send).toHaveBeenCalledTimes(1);
      expect(calls[0].payload).toEqual({ female: 2, male: 1 });
    });

    it('retries a failed payload together with what was queued meanwhile, the newer value winning', async () => {
      const { send, calls } = controlledSend<Changes>();
      const queue = createSaveQueue<Changes>({ send, debounceMs: 0, retryDelaysMs: [1000], coalesce: merge });

      queue.enqueue({ female: 1, jersey: 4 });
      await settle();
      queue.enqueue({ female: 2, male: 1 });
      calls[0].reject(new SaveRequestError('Server error', { status: 500 }));
      await settle();
      expect(queue.getSnapshot()).toMatchObject({ state: 'retrying', pendingCount: 2 });

      await jest.advanceTimersByTimeAsync(1000);
      expect(send).toHaveBeenCalledTimes(2);
      // jersey was only in the failed request: without the merge it was lost.
      expect(calls[1].payload).toEqual({ female: 2, jersey: 4, male: 1 });
      calls[1].resolve();
      await settle();
      expect(queue.getSnapshot()).toMatchObject({ state: 'saved', pendingCount: 0 });
    });

    it('keeps merging while paused for access, and sends it all on resume()', async () => {
      const { send, calls } = controlledSend<Changes>();
      const queue = createSaveQueue<Changes>({ send, debounceMs: 0, coalesce: merge });
      queue.enqueue({ female: 1 });
      await settle();
      calls[0].reject(new SaveRequestError('denied', { status: 401 }));
      await settle();
      queue.enqueue({ male: 3 });
      queue.resume();
      expect(calls[1].payload).toEqual({ female: 1, male: 3 });
    });

    it('unconfirmed() is everything not yet confirmed: the payload in flight merged with the one waiting', async () => {
      const { send, calls } = controlledSend<Changes>();
      const queue = createSaveQueue<Changes>({ send, debounceMs: 0, coalesce: merge });
      expect(queue.unconfirmed()).toBeNull();

      queue.enqueue({ female: 1 });
      expect(queue.unconfirmed()).toEqual({ female: 1 });
      await settle(); // now in flight
      queue.enqueue({ male: 1, female: 2 });
      expect(queue.unconfirmed()).toEqual({ female: 2, male: 1 });

      calls[0].resolve();
      await settle();
      expect(queue.unconfirmed()).toEqual({ male: 1, female: 2 });
      calls[1].resolve();
      await settle();
      expect(queue.unconfirmed()).toBeNull();
    });
  });

  it('without coalesce a newer payload replaces the waiting one (full snapshots)', async () => {
    const { send, calls } = controlledSend<{ n: number }>();
    const queue = createSaveQueue<{ n: number }>({ send, debounceMs: 100 });
    queue.enqueue({ n: 1 });
    queue.enqueue({ n: 2 });
    expect(queue.unconfirmed()).toEqual({ n: 2 });
    await jest.advanceTimersByTimeAsync(100);
    expect(calls.map((c) => c.payload)).toEqual([{ n: 2 }]);
  });

  it('a stalled request fails at the save timeout and is retried, instead of blocking every later save', async () => {
    // Stadium Wi-Fi can stall a request silently; with one request in flight,
    // an unanswered one used to hold back every save behind "Saving...".
    const realFetch = global.fetch;
    const signals: AbortSignal[] = [];
    global.fetch = jest.fn((_url: unknown, init?: RequestInit) => {
      if (init?.signal) signals.push(init.signal);
      return new Promise<Response>(() => {}); // never settles
    }) as unknown as typeof fetch;
    try {
      const queue = createSaveQueue<{ n: number }>({
        send: (payload) => sendJsonForSave('/api/projects', payload),
        debounceMs: 0,
        retryDelaysMs: [2000],
      });
      queue.enqueue({ n: 1 });
      await settle();
      expect(global.fetch).toHaveBeenCalledTimes(1);
      queue.enqueue({ n: 2 });

      await jest.advanceTimersByTimeAsync(SAVE_REQUEST_TIMEOUT_MS - 1);
      expect(queue.getSnapshot().state).toBe('saving');
      await jest.advanceTimersByTimeAsync(1);
      expect(signals[0].aborted).toBe(true);
      expect(queue.getSnapshot()).toMatchObject({
        state: 'retrying',
        pendingCount: 2,
        lastError: 'The server did not answer in time',
      });

      await jest.advanceTimersByTimeAsync(2000);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body);
      expect(body).toEqual({ n: 2 }); // the newest snapshot, not the stalled one
      queue.dispose();
    } finally {
      global.fetch = realFetch;
    }
  });
});

describe('createSaveQueue: saves the server refuses for good', () => {
  type Changes = Record<string, number>;
  const merge = (older: Changes, newer: Changes): Changes => ({ ...older, ...newer });

  function controlledSendWithAttempts<P>() {
    const calls: Array<{ payload: P; id: number; resolve: () => void; reject: (error: unknown) => void }> = [];
    const send = jest.fn(
      (payload: P, attempt: { id: number }) =>
        new Promise<void>((resolve, reject) => {
          calls.push({ payload, id: attempt.id, resolve: () => resolve(), reject });
        })
    );
    return { send, calls };
  }

  it('keeps a 400 apart: later changes are sent on their own and saved, the refused one is shown, not retried', async () => {
    // The 2026-09 review case: one Builder-mode blur queued
    // {'fanmass.peopleCount': 0}; PUT answers 400 to a dotted key; every later
    // clicker change was merged into it and refused with it, all event long.
    const { send, calls } = controlledSendWithAttempts<Changes>();
    const queue = createSaveQueue<Changes>({ send, debounceMs: 0, retryDelaysMs: [1000], coalesce: merge });

    queue.enqueue({ 'fanmass.peopleCount': 0 });
    await settle();
    queue.enqueue({ female: 7 });
    calls[0].reject(new SaveRequestError('Invalid stat key: "fanmass.peopleCount"', { status: 400 }));
    await settle();

    expect(send).toHaveBeenCalledTimes(2);
    expect(calls[1].payload).toEqual({ female: 7 });
    calls[1].resolve();
    await settle();

    expect(queue.getSnapshot()).toMatchObject({
      state: 'rejected',
      pendingCount: 1,
      rejectedCount: 1,
      failedAttempts: 0,
      lastError: 'Invalid stat key: "fanmass.peopleCount"',
    });
    // Later changes keep saving, each on its own.
    queue.enqueue({ female: 8 });
    await settle();
    expect(calls[2].payload).toEqual({ female: 8 });
    calls[2].resolve();
    await settle();
    await jest.advanceTimersByTimeAsync(120_000);
    expect(send).toHaveBeenCalledTimes(3);
    expect(queue.getSnapshot()).toMatchObject({ state: 'rejected', pendingCount: 1 });
    // Still unsaved, so still part of what the editor holds locally.
    expect(queue.unconfirmed()).toEqual({ 'fanmass.peopleCount': 0 });
  });

  it.each([404, 413, 422])('treats %i the same way', async (status) => {
    const { send, calls } = controlledSendWithAttempts<Changes>();
    const queue = createSaveQueue<Changes>({ send, debounceMs: 0, retryDelaysMs: [1000], coalesce: merge });
    queue.enqueue({ female: 1 });
    await settle();
    calls[0].reject(new SaveRequestError('refused', { status }));
    await settle();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(send).toHaveBeenCalledTimes(1);
    expect(queue.getSnapshot().state).toBe('rejected');
  });

  it('retryRejected() sends a refused payload again, first, under a new attempt id', async () => {
    const { send, calls } = controlledSendWithAttempts<Changes>();
    const queue = createSaveQueue<Changes>({ send, debounceMs: 0, coalesce: merge });
    queue.enqueue({ female: 1 });
    await settle();
    calls[0].reject(new SaveRequestError('Project not found', { status: 404 }));
    await settle();

    queue.retryRejected();
    expect(send).toHaveBeenCalledTimes(2);
    expect(calls[1].payload).toEqual({ female: 1 });
    expect(calls[1].id).not.toBe(calls[0].id);
    calls[1].resolve();
    await settle();
    expect(queue.getSnapshot()).toMatchObject({ state: 'saved', pendingCount: 0, rejectedCount: 0 });
  });

  it('a newer full snapshot that is confirmed supersedes a refused one', async () => {
    const { send, calls } = controlledSendWithAttempts<{ n: number }>();
    const queue = createSaveQueue<{ n: number }>({ send, debounceMs: 0 });
    queue.enqueue({ n: 1 });
    await settle();
    calls[0].reject(new SaveRequestError('too large', { status: 413 }));
    await settle();
    queue.enqueue({ n: 2 });
    await settle();
    calls[1].resolve();
    await settle();
    expect(queue.getSnapshot()).toMatchObject({ state: 'saved', pendingCount: 0 });
  });

  it('whenAllSaved resolves false while a refused payload is kept', async () => {
    const { send, calls } = controlledSendWithAttempts<Changes>();
    const queue = createSaveQueue<Changes>({ send, debounceMs: 0, coalesce: merge });
    queue.enqueue({ female: 1 });
    await settle();
    calls[0].reject(new SaveRequestError('refused', { status: 400 }));
    await settle();
    await expect(whenAllSaved(queue)).resolves.toBe(false);
  });
});

describe('createSaveQueue: retryFailedAlone', () => {
  type Changes = Record<string, number>;
  const merge = (older: Changes, newer: Changes): Changes => {
    const out = { ...older };
    for (const [k, v] of Object.entries(newer)) out[k] = (out[k] ?? 0) + v; // counts add up
    return out;
  };

  function controlledSendWithAttempts<P>() {
    const calls: Array<{ payload: P; id: number; resolve: () => void; reject: (error: unknown) => void }> = [];
    const send = jest.fn(
      (payload: P, attempt: { id: number }) =>
        new Promise<void>((resolve, reject) => {
          calls.push({ payload, id: attempt.id, resolve: () => resolve(), reject });
        })
    );
    return { send, calls };
  }

  it('retries a failed payload unchanged, under the same attempt id, before what was queued meanwhile', async () => {
    // A count sent twice under two different requests counts twice; the same
    // request sent twice is turned away by the server's late-write guard.
    const { send, calls } = controlledSendWithAttempts<Changes>();
    const queue = createSaveQueue<Changes>({ send, debounceMs: 0, retryDelaysMs: [1000], coalesce: merge, retryFailedAlone: true });

    queue.enqueue({ female: 1 });
    await settle();
    queue.enqueue({ female: 1 });
    queue.enqueue({ male: 1 });
    calls[0].reject(new SaveRequestError('The server did not answer in time'));
    await settle();
    expect(queue.getSnapshot()).toMatchObject({ state: 'retrying', pendingCount: 3 });

    await jest.advanceTimersByTimeAsync(1000);
    expect(calls[1].payload).toEqual({ female: 1 });
    expect(calls[1].id).toBe(calls[0].id);
    calls[1].resolve();
    await settle();

    expect(calls[2].payload).toEqual({ female: 1, male: 1 });
    expect(calls[2].id).not.toBe(calls[0].id);
    calls[2].resolve();
    await settle();
    expect(queue.getSnapshot()).toMatchObject({ state: 'saved', pendingCount: 0 });
  });

  it('after a 401 sends the kept payload first on resume(), then the rest', async () => {
    const { send, calls } = controlledSendWithAttempts<Changes>();
    const queue = createSaveQueue<Changes>({ send, debounceMs: 0, coalesce: merge, retryFailedAlone: true });
    queue.enqueue({ female: 1 });
    await settle();
    calls[0].reject(new SaveRequestError('denied', { status: 401 }));
    await settle();
    queue.enqueue({ male: 2 });
    queue.resume();
    expect(calls[1]).toMatchObject({ payload: { female: 1 }, id: calls[0].id });
    calls[1].resolve();
    await settle();
    expect(calls[2].payload).toEqual({ male: 2 });
  });

  it('unconfirmedPayloads() tells apart the payload that went out without an answer from those never sent', async () => {
    // The event editor's draft keeps the counts of the one that went out under
    // its clientSeq (it may be stored), and the rest as counts never sent.
    const { send, calls } = controlledSendWithAttempts<Changes>();
    const queue = createSaveQueue<Changes>({ send, debounceMs: 0, retryDelaysMs: [1000], coalesce: merge, retryFailedAlone: true });
    queue.enqueue({ female: 1 });
    await settle();
    queue.enqueue({ female: 1 });
    // In flight.
    expect(queue.unconfirmedPayloads()).toEqual([
      { payload: { female: 1 }, attempt: { id: calls[0].id }, sent: true },
      { payload: { female: 1 }, attempt: { id: expect.any(Number) }, sent: false },
    ]);

    // Failed, waiting to go out again under the same attempt: still unknown.
    calls[0].reject(new SaveRequestError('No connection to the server', { offline: true }));
    await settle();
    expect(queue.unconfirmedPayloads().map((p) => [p.payload, p.sent])).toEqual([
      [{ female: 1 }, true],
      [{ female: 1 }, false],
    ]);

    // Refused for good: known not stored, so no longer `sent`.
    await jest.advanceTimersByTimeAsync(1000);
    calls[1].reject(new SaveRequestError('refused', { status: 400 }));
    await settle();
    expect(queue.unconfirmedPayloads().find((p) => p.attempt.id === calls[0].id)).toMatchObject({ sent: false });

    // Confirmed: gone.
    calls[2].resolve();
    await settle();
    expect(queue.unconfirmedPayloads().map((p) => [p.payload, p.sent])).toEqual([[{ female: 1 }, false]]);
  });
});

describe('createSaveQueue: canCoalesce', () => {
  it('closes the open payload when the next change may not join it, and sends both in order', async () => {
    const { send, calls } = controlledSend<string[]>();
    const queue = createSaveQueue<string[]>({
      send,
      debounceMs: 100,
      coalesce: (a, b) => [...a, ...b],
      canCoalesce: (a, b) => a.length + b.length <= 3,
    });

    queue.enqueue(['a', 'b']);
    queue.enqueue(['c']);
    queue.enqueue(['d', 'e']); // would make 5: a new payload starts
    // The full one goes at once; the open one waits for the debounce.
    expect(send).toHaveBeenCalledTimes(1);
    expect(calls[0].payload).toEqual(['a', 'b', 'c']);
    expect(queue.getSnapshot().pendingCount).toBe(3);
    expect(queue.unconfirmed()).toEqual(['a', 'b', 'c', 'd', 'e']);

    calls[0].resolve();
    await jest.advanceTimersByTimeAsync(100);
    expect(calls[1].payload).toEqual(['d', 'e']);
  });
});

describe('whenAllSaved', () => {
  it('sends what is waiting at once and resolves true once the server confirmed it', async () => {
    const { send, calls } = controlledSend<number>();
    const queue = createSaveQueue<number>({ send, debounceMs: 700 });
    queue.enqueue(1);
    const done = whenAllSaved(queue);
    expect(send).toHaveBeenCalledTimes(1); // no 700 ms wait
    calls[0].resolve();
    await expect(done).resolves.toBe(true);
  });

  it('resolves true at once when nothing is waiting', async () => {
    const { send } = controlledSend<number>();
    const queue = createSaveQueue<number>({ send });
    await expect(whenAllSaved(queue)).resolves.toBe(true);
    expect(send).not.toHaveBeenCalled();
  });

  it('resolves false when the save fails or needs access', async () => {
    const { send, calls } = controlledSend<number>();
    const queue = createSaveQueue<number>({ send, debounceMs: 0 });
    queue.enqueue(1);
    const failed = whenAllSaved(queue);
    calls[0].reject(new SaveRequestError('Server error', { status: 500 }));
    await expect(failed).resolves.toBe(false);

    const refused = whenAllSaved(queue); // retries the failed save at once
    expect(send).toHaveBeenCalledTimes(2);
    calls[1].reject(new SaveRequestError('denied', { status: 401 }));
    await expect(refused).resolves.toBe(false);
    await expect(whenAllSaved(queue)).resolves.toBe(false); // still paused
  });

  it('resolves false after the timeout', async () => {
    const { send } = controlledSend<number>();
    const queue = createSaveQueue<number>({ send, debounceMs: 0 });
    queue.enqueue(1);
    const done = whenAllSaved(queue, 5000);
    await jest.advanceTimersByTimeAsync(5000);
    await expect(done).resolves.toBe(false);
  });
});

describe('createResponseOrder', () => {
  it('drops an answer older than one already applied', () => {
    // L1 leaves, L2 leaves, L2 answers first, L1 answers last.
    const order = createResponseOrder();
    const l1 = order.next();
    const l2 = order.next();
    expect(order.accept(l2)).toBe(true);
    expect(order.accept(l1)).toBe(false);
    expect(order.accept(l2)).toBe(false); // once per ticket
    expect(order.accept(order.next())).toBe(true);
  });
});

describe('isNeedsAccessError', () => {
  it('recognises a 401 and the EDIT_ACCESS_REQUIRED code, nothing else', () => {
    expect(isNeedsAccessError(new SaveRequestError('x', { status: 401 }))).toBe(true);
    expect(isNeedsAccessError({ code: 'EDIT_ACCESS_REQUIRED' })).toBe(true);
    expect(isNeedsAccessError(new SaveRequestError('x', { status: 403, code: 'CSRF_TOKEN_INVALID' }))).toBe(false);
    expect(isNeedsAccessError(new SaveRequestError('x', { status: 500 }))).toBe(false);
    expect(isNeedsAccessError(new Error('network'))).toBe(false);
  });
});

describe('createAccessRecovery', () => {
  function controlledAccess() {
    const answers: Array<(result: AccessCheckResult) => void> = [];
    const requestAccess = jest.fn(
      () =>
        new Promise<AccessCheckResult>((resolve) => {
          answers.push(resolve);
        })
    );
    return { requestAccess, answers };
  }

  it('checks at once and resumes when access is granted', async () => {
    const { requestAccess, answers } = controlledAccess();
    const onGranted = jest.fn();
    const recovery = createAccessRecovery({ requestAccess, onGranted });
    recovery.request();
    await settle();
    expect(requestAccess).toHaveBeenCalledTimes(1);
    answers[0]('granted');
    await settle();
    expect(onGranted).toHaveBeenCalledTimes(1);
  });

  it('backs off between checks that could not confirm access, capped at the last delay', async () => {
    const { requestAccess, answers } = controlledAccess();
    const onGranted = jest.fn();
    const recovery = createAccessRecovery({ requestAccess, onGranted, delaysMs: [0, 2000, 5000] });
    recovery.request();
    await settle();
    const expectedWaits = [2000, 5000, 5000];
    for (let i = 0; i < expectedWaits.length; i++) {
      answers[i]('retry');
      await settle();
      await jest.advanceTimersByTimeAsync(expectedWaits[i] - 1);
      expect(requestAccess).toHaveBeenCalledTimes(i + 1);
      await jest.advanceTimersByTimeAsync(1);
      expect(requestAccess).toHaveBeenCalledTimes(i + 2);
    }
    expect(onGranted).not.toHaveBeenCalled();
  });

  it('treats a thrown check as "try again later"', async () => {
    const requestAccess = jest.fn(async (): Promise<AccessCheckResult> => {
      throw new Error('network');
    });
    const recovery = createAccessRecovery({ requestAccess, onGranted: jest.fn(), delaysMs: [0, 1000] });
    recovery.request();
    await settle();
    await jest.advanceTimersByTimeAsync(1000);
    expect(requestAccess).toHaveBeenCalledTimes(2);
  });

  it('stops checking on "blocked" until asked again', async () => {
    const { requestAccess, answers } = controlledAccess();
    const onGranted = jest.fn();
    const onBlocked = jest.fn();
    const recovery = createAccessRecovery({ requestAccess, onGranted, onBlocked, delaysMs: [0, 1000] });
    recovery.request();
    await settle();
    answers[0]('blocked');
    await settle();
    expect(onBlocked).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(10 * 60_000);
    expect(requestAccess).toHaveBeenCalledTimes(1); // no timer-driven loop

    recovery.requestNow(); // the operator pressed Retry now
    await settle();
    expect(requestAccess).toHaveBeenCalledTimes(2);
    answers[1]('granted');
    await settle();
    expect(onGranted).toHaveBeenCalledTimes(1);
  });

  it('runs one check at a time', async () => {
    const { requestAccess } = controlledAccess();
    const recovery = createAccessRecovery({ requestAccess, onGranted: jest.fn() });
    recovery.request();
    await settle();
    recovery.request();
    recovery.requestNow();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(requestAccess).toHaveBeenCalledTimes(1);
  });

  it('reset() makes the next loss start without delay; dispose() silences late answers', async () => {
    const { requestAccess, answers } = controlledAccess();
    const onGranted = jest.fn();
    const recovery = createAccessRecovery({ requestAccess, onGranted, delaysMs: [0, 5000] });
    recovery.request();
    await settle();
    answers[0]('granted');
    await settle();
    recovery.reset();
    recovery.request();
    await settle();
    expect(requestAccess).toHaveBeenCalledTimes(2); // immediately, not after 5 s

    recovery.dispose();
    answers[1]('granted');
    await settle();
    expect(onGranted).toHaveBeenCalledTimes(1);
  });
});

// A Map-backed stand-in for localStorage.
function memoryStorage(): DraftStorage & { dump: () => Record<string, string> } {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    dump: () => Object.fromEntries(map),
  };
}

function throwingStorage(): DraftStorage {
  const fail = () => {
    throw new Error('SecurityError: storage is disabled');
  };
  return {
    get length(): number {
      return fail();
    },
    key: fail,
    getItem: fail,
    setItem: fail,
    removeItem: fail,
  };
}

function draft(partial: Partial<StoredDraft> & Pick<StoredDraft, 'tabId' | 'editedAt'>): StoredDraft {
  return { v: 1, scope: 'p1', base: {}, fields: {}, ...partial };
}

describe('draft storage', () => {
  it('keeps one draft per tab and reads them back oldest first, for this scope only', () => {
    const storage = memoryStorage();
    expect(writeDraft(storage, draft({ tabId: 'b', editedAt: 200, fields: { 'stats:female': 2 } }))).toBe(true);
    expect(writeDraft(storage, draft({ tabId: 'a', editedAt: 100, fields: { 'stats:female': 1 } }))).toBe(true);
    writeDraft(storage, draft({ scope: 'p2', tabId: 'c', editedAt: 50 }));
    // p10 must not match the p1 prefix.
    writeDraft(storage, draft({ scope: 'p10', tabId: 'd', editedAt: 60 }));

    const drafts = readDrafts(storage, 'p1');
    expect(drafts.map((d) => d.tabId)).toEqual(['a', 'b']);
    expect(drafts[1].fields).toEqual({ 'stats:female': 2 });
  });

  it('ignores malformed or foreign entries', () => {
    const storage = memoryStorage();
    storage.setItem(`${EDITOR_DRAFT_KEY_PREFIX}p1:x`, '{not json');
    storage.setItem(`${EDITOR_DRAFT_KEY_PREFIX}p1:y`, JSON.stringify({ v: 2, scope: 'p1', tabId: 'y' }));
    // tab id in the body does not match the key
    storage.setItem(`${EDITOR_DRAFT_KEY_PREFIX}p1:z`, JSON.stringify(draft({ tabId: 'other', editedAt: 1 })));
    expect(readDrafts(storage, 'p1')).toEqual([]);
  });

  it('removes a draft only if it was not rewritten meanwhile (compare-and-delete)', () => {
    const storage = memoryStorage();
    writeDraft(storage, draft({ tabId: 'a', editedAt: 100 }));
    writeDraft(storage, draft({ tabId: 'a', editedAt: 150 })); // the tab kept typing
    removeDraft(storage, 'p1', 'a', 100);
    expect(readDrafts(storage, 'p1')).toHaveLength(1);
    removeDraft(storage, 'p1', 'a', 150);
    expect(readDrafts(storage, 'p1')).toHaveLength(0);

    writeDraft(storage, draft({ tabId: 'b', editedAt: 1 }));
    removeDraft(storage, 'p1', 'b');
    expect(storage.dump()).toEqual({});
  });

  it('never throws when storage is unavailable', () => {
    const storage = throwingStorage();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(readDrafts(storage, 'p1')).toEqual([]);
    expect(writeDraft(storage, draft({ tabId: 'a', editedAt: 1 }))).toBe(false);
    expect(() => removeDraft(storage, 'p1', 'a', 1)).not.toThrow();
    expect(readDrafts(null, 'p1')).toEqual([]);
    expect(writeDraft(null, draft({ tabId: 'a', editedAt: 1 }))).toBe(false);
    warn.mockRestore();
  });
});

describe('mergeFieldChanges', () => {
  it('applies local changes the server has not touched', () => {
    const base = { 'stats:female': 0, 'stats:male': 0 };
    const local = { 'stats:female': 40, 'stats:male': 0 };
    const result = mergeFieldChanges(base, base, local, 'keep-current');
    expect(result).toEqual({ merged: local, applied: ['stats:female'], conflicts: [] });
  });

  it('keeps server changes to other fields', () => {
    const base = { 'stats:female': 0, 'stats:male': 0 };
    const server = { 'stats:female': 0, 'stats:male': 12 }; // an admin edited male
    const local = { 'stats:female': 40, 'stats:male': 0 };
    const { merged, conflicts } = mergeFieldChanges(server, base, local, 'keep-current');
    expect(merged).toEqual({ 'stats:female': 40, 'stats:male': 12 });
    expect(conflicts).toEqual([]);
  });

  it('flags a field changed on both sides and resolves it as asked', () => {
    const base = { 'stats:female': 0 };
    const server = { 'stats:female': 38 };
    const local = { 'stats:female': 40 };
    expect(mergeFieldChanges(server, base, local, 'keep-current')).toEqual({
      merged: { 'stats:female': 38 },
      applied: [],
      conflicts: ['stats:female'],
    });
    expect(mergeFieldChanges(server, base, local, 'take-local')).toEqual({
      merged: { 'stats:female': 40 },
      applied: ['stats:female'],
      conflicts: ['stats:female'],
    });
  });

  it('does not count the same change made on both sides as a conflict', () => {
    const result = mergeFieldChanges({ 'stats:female': 40 }, { 'stats:female': 0 }, { 'stats:female': 40 }, 'keep-current');
    expect(result).toEqual({ merged: { 'stats:female': 40 }, applied: [], conflicts: [] });
  });

  it('applies a local removal', () => {
    const base = { 'stats:reportImage1': 'https://i.example/a.png', 'stats:female': 1 };
    const local = { 'stats:female': 1 };
    const { merged, applied } = mergeFieldChanges(base, base, local, 'keep-current');
    expect(merged).toEqual({ 'stats:female': 1 });
    expect(applied).toEqual(['stats:reportImage1']);
  });

  it('compares objects regardless of key order', () => {
    expect(sameFieldValue({ a: ['x'], b: ['y'] }, { b: ['y'], a: ['x'] })).toBe(true);
    expect(sameFieldValue(['x', 'y'], ['y', 'x'])).toBe(false);
    expect(sameFieldValue(0, undefined)).toBe(false);
  });
});

describe('planDraftRestore', () => {
  it('restores the 2026-09-27 case: every save refused, server still at the loaded copy', () => {
    const loaded = { 'stats:female': 0, 'stats:male': 0, hashtags: [] };
    const d = draft({ tabId: 'a', editedAt: 1, base: loaded, fields: { 'stats:female': 412, 'stats:male': 388, hashtags: [] } });
    const plan = planDraftRestore(loaded, [d]);
    expect(plan.fields).toEqual({ 'stats:female': 412, 'stats:male': 388, hashtags: [] });
    expect(plan.adopted).toEqual([d]);
    expect(plan.conflicted).toEqual([]);
  });

  it("restores changes made after this tab's own confirmed save (the base moved with it)", () => {
    // Saved female=10 fine, then the grant expired and female=11 was refused.
    const server = { 'stats:female': 10 };
    const d = draft({ tabId: 'a', editedAt: 1, base: { 'stats:female': 10 }, fields: { 'stats:female': 11 } });
    expect(planDraftRestore(server, [d]).fields).toEqual({ 'stats:female': 11 });
  });

  it('does not apply a draft over a value an admin changed since; it waits for a choice', () => {
    const d = draft({ tabId: 'a', editedAt: 1, base: { 'stats:female': 0 }, fields: { 'stats:female': 40 } });
    const plan = planDraftRestore({ 'stats:female': 38 }, [d]);
    expect(plan.fields).toEqual({ 'stats:female': 38 });
    expect(plan.restored).toEqual([]);
    expect(plan.restoredEditedAt).toBeNull();
    expect(plan.adopted).toEqual([]);
    expect(plan.conflicted).toHaveLength(1);
    expect(plan.conflicted[0]).toMatchObject({ draft: d, conflicts: ['stats:female'] });
  });

  it('holds back only the conflicting value; the rest of the draft is restored', () => {
    // An admin re-entered female; male and jersey were only changed here.
    const base = { 'stats:female': 0, 'stats:male': 0, 'stats:jersey': 0 };
    const d = draft({
      tabId: 'a',
      editedAt: 7,
      base,
      fields: { 'stats:female': 412, 'stats:male': 388, 'stats:jersey': 97 },
    });
    const plan = planDraftRestore({ ...base, 'stats:female': 400 }, [d]);
    expect(plan.fields).toEqual({ 'stats:female': 400, 'stats:male': 388, 'stats:jersey': 97 });
    expect(plan.restored.sort()).toEqual(['stats:jersey', 'stats:male']);
    expect(plan.restoredEditedAt).toBe(7);
    expect(plan.adopted).toEqual([]);
    expect(plan.conflicted).toHaveLength(1);
    const [{ conflicts, held }] = plan.conflicted;
    expect(conflicts).toEqual(['stats:female']);
    // What stays in storage: only the held-back value, so "Keep saved values"
    // cannot take male and jersey with it.
    expect(held).toEqual({ v: 1, scope: 'p1', tabId: 'a', editedAt: 7, base: { 'stats:female': 0 }, fields: { 'stats:female': 412 } });
  });

  it("recognises this device's own save whose answer never arrived (not a conflict)", () => {
    // female 10 -> 11 was sent; its response was lost (reload, discarded tab).
    // Then female 12 and male 5 -> 9 were still waiting. The server holds 11.
    const d = draft({
      tabId: 'a',
      editedAt: 3,
      base: { 'stats:female': 10, 'stats:male': 5 },
      fields: { 'stats:female': 12, 'stats:male': 9 },
      sent: { 'stats:female': [11] },
    });
    const plan = planDraftRestore({ 'stats:female': 11, 'stats:male': 5 }, [d]);
    expect(plan.conflicted).toEqual([]);
    expect(plan.adopted).toEqual([d]);
    expect(plan.fields).toEqual({ 'stats:female': 12, 'stats:male': 9 });
  });

  it('still asks when the server holds a value this device never sent', () => {
    const d = draft({
      tabId: 'a',
      editedAt: 3,
      base: { 'stats:female': 10 },
      fields: { 'stats:female': 12 },
      sent: { 'stats:female': [11] },
    });
    const plan = planDraftRestore({ 'stats:female': 20 }, [d]);
    expect(plan.conflicted.map((c) => c.conflicts)).toEqual([['stats:female']]);
    expect(plan.fields).toEqual({ 'stats:female': 20 });
  });

  it('combines drafts from two tabs that changed different values', () => {
    const base = { 'stats:female': 0, 'stats:male': 0 };
    const a = draft({ tabId: 'a', editedAt: 1, base, fields: { 'stats:female': 5, 'stats:male': 0 } });
    const b = draft({ tabId: 'b', editedAt: 2, base, fields: { 'stats:female': 0, 'stats:male': 3 } });
    const plan = planDraftRestore(base, [b, a]);
    expect(plan.fields).toEqual({ 'stats:female': 5, 'stats:male': 3 });
    expect(plan.adopted.map((d) => d.tabId)).toEqual(['a', 'b']);
  });

  it('marks a draft whose values the server already has as obsolete', () => {
    const d = draft({ tabId: 'a', editedAt: 1, base: { 'stats:female': 0 }, fields: { 'stats:female': 7 } });
    const plan = planDraftRestore({ 'stats:female': 7 }, [d]);
    expect(plan.obsolete).toEqual([d]);
    expect(plan.adopted).toEqual([]);
    expect(plan.conflicted).toEqual([]);
  });
});

describe('planDraftRestore: counts', () => {
  // Gate A counted female from 100 while saving failed: its first +1 went out
  // and was never answered (outstanding), four more taps never went out.
  const gateA = (fields: Record<string, unknown> = { 'stats:female': 105 }) =>
    draft({
      tabId: 'gate-a',
      editedAt: 9,
      base: { 'stats:female': 100 },
      fields,
      counts: { 'stats:female': 4 },
      outstanding: [{ tabId: 'gate-a', clientSeq: 3, counts: { 'stats:female': 1 } }],
    });

  it("adds counts to the server's value, other devices' taps included, and never holds them back", () => {
    // Gate B counted 30 meanwhile. As a value, 105 was a conflict against 130,
    // and either choice lost someone's taps.
    const plan = planDraftRestore({ 'stats:female': 130 }, [gateA()]);
    expect(plan.conflicted).toEqual([]);
    expect(plan.fields).toEqual({ 'stats:female': 135 });
    expect(plan.values).toEqual({ 'stats:female': 130 });
    expect(plan.counts).toEqual({ 'stats:female': 4 });
    expect(plan.outstanding).toEqual([{ tabId: 'gate-a', clientSeq: 3, counts: { 'stats:female': 1 } }]);
    expect(plan.restoredEditedAt).toBe(9);
    expect(plan.adopted.map((d) => d.tabId)).toEqual(['gate-a']);
  });

  it("does not take another device's +1 for this device's own write", () => {
    // Gate B's single tap made the server 101 -- the number this device's
    // lost +1 would have made. Recorded as a sent value, 105 went back as a
    // value and B's tap was gone. As counts, both are kept: 106.
    const withSent = { ...gateA(), sent: { 'stats:female': [101] } };
    const plan = planDraftRestore({ 'stats:female': 101 }, [withSent]);
    expect(plan.fields).toEqual({ 'stats:female': 106 });
    expect(plan.counts).toEqual({ 'stats:female': 4 });
    expect(plan.outstanding).toHaveLength(1);
  });

  it('plans a request two drafts hold once, and a draft holding only that one as obsolete', () => {
    const copy = draft({
      tabId: 'later-tab',
      editedAt: 10,
      base: { 'stats:female': 100 },
      fields: { 'stats:female': 101 },
      outstanding: [{ tabId: 'gate-a', clientSeq: 3, counts: { 'stats:female': 1 } }],
    });
    const plan = planDraftRestore({ 'stats:female': 100 }, [gateA(), copy]);
    expect(plan.outstanding).toHaveLength(1);
    expect(plan.fields).toEqual({ 'stats:female': 105 });
    expect(plan.obsolete.map((d) => d.tabId)).toEqual(['later-tab']);
  });

  it('a value a newer draft set replaces what older drafts counted on it', () => {
    const typed = draft({ tabId: 'b', editedAt: 20, base: { 'stats:female': 100 }, fields: { 'stats:female': 50 } });
    const plan = planDraftRestore({ 'stats:female': 100 }, [gateA(), typed]);
    expect(plan.fields).toEqual({ 'stats:female': 50 });
    expect(plan.counts).toEqual({});
    // The request that may be stored still goes, before the value.
    expect(plan.outstanding).toHaveLength(1);
  });

  it('restores counts that add up to nothing on screen: the outstanding +1 may be stored, the -1 is not', () => {
    const d = draft({
      tabId: 'a',
      editedAt: 4,
      base: { 'stats:female': 7 },
      fields: { 'stats:female': 7 },
      counts: { 'stats:female': -1 },
      outstanding: [{ tabId: 'a', clientSeq: 1, counts: { 'stats:female': 1 } }],
    });
    const plan = planDraftRestore({ 'stats:female': 7 }, [d]);
    expect(plan.restored).toEqual([]);
    expect(plan.restoredEditedAt).toBe(4);
    expect(plan.adopted).toEqual([d]);
    expect(plan.counts).toEqual({ 'stats:female': -1 });
  });

  it('keeps the value rule for the fields a draft does not count', () => {
    const d = { ...gateA({ 'stats:female': 105, 'stats:male': 40 }), base: { 'stats:female': 100, 'stats:male': 0 } };
    const plan = planDraftRestore({ 'stats:female': 100, 'stats:male': 12 }, [d]);
    // male was typed here and changed on the server: held back; female counts on.
    expect(plan.conflicted.map((c) => c.conflicts)).toEqual([['stats:male']]);
    expect(plan.fields).toEqual({ 'stats:female': 105, 'stats:male': 12 });
    // What stays in storage for the choice holds no counts: they are sent now.
    expect(plan.conflicted[0].held).not.toHaveProperty('counts');
    expect(plan.conflicted[0].held).not.toHaveProperty('outstanding');
  });

  it('reads counts back from storage, and drops malformed ones', () => {
    const storage = memoryStorage();
    writeDraft(storage, gateA());
    expect(readDrafts(storage, 'p1')[0]).toMatchObject({
      counts: { 'stats:female': 4 },
      outstanding: [{ tabId: 'gate-a', clientSeq: 3, counts: { 'stats:female': 1 } }],
    });
    storage.setItem(
      `${EDITOR_DRAFT_KEY_PREFIX}p1:gate-a`,
      JSON.stringify({ ...gateA(), counts: { 'stats:female': 'four' }, outstanding: [{ tabId: 'gate-a', clientSeq: -1, counts: {} }] })
    );
    const [read] = readDrafts(storage, 'p1');
    expect(read).not.toHaveProperty('counts');
    expect(read).not.toHaveProperty('outstanding');
  });

  it('"Keep saved values" keeps the counts of a draft it narrows', () => {
    const storage = memoryStorage();
    const d = { ...gateA({ 'stats:female': 105, 'stats:male': 40 }), base: { 'stats:female': 100, 'stats:male': 0 } };
    writeDraft(storage, d);
    expect(discardDraftFields(storage, d, ['stats:male'])).toBe(true);
    expect(readDrafts(storage, 'p1')[0]).toMatchObject({ counts: { 'stats:female': 4 }, outstanding: [{ clientSeq: 3 }] });
    expect(withoutDraftCounts(d)).not.toHaveProperty('counts');
  });
});

describe('addSentValues', () => {
  it('remembers only values that differ from the base, newest last, capped per field', () => {
    let sent = addSentValues(undefined, { 'stats:female': 10, 'stats:male': 5 }, { 'stats:female': 11, 'stats:male': 5 });
    expect(sent).toEqual({ 'stats:female': [11] });
    sent = addSentValues(sent, { 'stats:female': 10 }, { 'stats:female': 12 });
    sent = addSentValues(sent, { 'stats:female': 10 }, { 'stats:female': 11 }); // re-sent: moves to the end
    expect(sent['stats:female']).toEqual([12, 11]);

    for (let i = 0; i < MAX_SENT_VALUES_PER_FIELD + 5; i++) sent = addSentValues(sent, {}, { 'stats:jersey': i });
    expect(sent['stats:jersey']).toHaveLength(MAX_SENT_VALUES_PER_FIELD);
    expect(sent['stats:jersey'][MAX_SENT_VALUES_PER_FIELD - 1]).toBe(MAX_SENT_VALUES_PER_FIELD + 4);
  });
});

describe('discardDraftFields ("Keep saved values")', () => {
  it('drops only the named values and keeps every other unsaved value', () => {
    const storage = memoryStorage();
    const d = draft({
      tabId: 'a',
      editedAt: 5,
      base: { 'stats:female': 0, 'stats:male': 0 },
      fields: { 'stats:female': 412, 'stats:male': 388 },
      sent: { 'stats:female': [411] },
    });
    writeDraft(storage, d);
    expect(discardDraftFields(storage, d, ['stats:female'])).toBe(true);
    expect(readDrafts(storage, 'p1')).toEqual([
      { v: 1, scope: 'p1', tabId: 'a', editedAt: 5, base: { 'stats:male': 0 }, fields: { 'stats:male': 388 } },
    ]);
  });

  it('removes a draft narrowed to its held-back values once they are discarded', () => {
    const storage = memoryStorage();
    const d = draft({ tabId: 'a', editedAt: 5, base: { 'stats:female': 0, 'stats:male': 0 }, fields: { 'stats:female': 412, 'stats:male': 388 } });
    writeDraft(storage, d);
    const plan = planDraftRestore({ 'stats:female': 400, 'stats:male': 0 }, [d]);
    // On load the editor stores the narrowed draft in place of the full one.
    expect(replaceDraft(storage, plan.conflicted[0].held, d.editedAt)).toBe(true);
    expect(readDrafts(storage, 'p1')[0].fields).toEqual({ 'stats:female': 412 });
    expect(discardDraftFields(storage, d, plan.conflicted[0].conflicts)).toBe(true);
    expect(storage.dump()).toEqual({});
  });

  it('leaves a draft alone that its tab rewrote meanwhile', () => {
    const storage = memoryStorage();
    const d = draft({ tabId: 'a', editedAt: 5, base: { 'stats:female': 0 }, fields: { 'stats:female': 412 } });
    writeDraft(storage, { ...d, editedAt: 6, fields: { 'stats:female': 413 } });
    expect(discardDraftFields(storage, d, ['stats:female'])).toBe(false);
    expect(readDrafts(storage, 'p1')[0].fields).toEqual({ 'stats:female': 413 });
    expect(discardDraftFields(throwingStorage(), d, ['stats:female'])).toBe(false);
  });
});

describe('sendJsonForSave', () => {
  const realFetch = global.fetch;

  function mockFetch(response: { ok: boolean; status: number; body?: unknown; retryAfter?: string }) {
    const fetchMock = jest.fn(async () => ({
      ok: response.ok,
      status: response.status,
      json: async () => {
        if (response.body === undefined) throw new Error('not json');
        return response.body;
      },
      headers: { get: (name: string) => (name === 'Retry-After' ? response.retryAfter ?? null : null) },
    }));
    global.fetch = fetchMock as unknown as typeof fetch;
    return fetchMock;
  }

  afterEach(() => {
    global.fetch = realFetch;
  });

  it('sends the JSON body with the CSRF header and resolves on success', async () => {
    const fetchMock = mockFetch({ ok: true, status: 200, body: { success: true, modified: true } });
    await expect(sendJsonForSave('/api/projects', { projectId: 'p1' })).resolves.toEqual({ success: true, modified: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/projects');
    expect(init.method).toBe('PUT');
    expect((init.headers as Record<string, string>)['X-CSRF-Token']).toBe('csrf-test-token');
    expect(init.body).toBe(JSON.stringify({ projectId: 'p1' }));
  });

  it('keeps the 401 status and code so the queue can ask for access', async () => {
    mockFetch({ ok: false, status: 401, body: { success: false, error: 'Sign in', code: 'PAGE_PASSWORD_REQUIRED' } });
    const error = await sendJsonForSave('/api/projects', {}).catch((e) => e);
    expect(error).toBeInstanceOf(SaveRequestError);
    expect(error).toMatchObject({ status: 401, code: 'PAGE_PASSWORD_REQUIRED', message: 'Sign in', offline: false });
  });

  it('marks a request that never reached the server as offline', async () => {
    global.fetch = jest.fn(async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    const error = await sendJsonForSave('/api/projects', {}).catch((e) => e);
    expect(error).toMatchObject({ offline: true, status: null });
  });

  it('resolves a { stale: true } answer like any success, so the queue counts it as confirmed', async () => {
    // A write of the same editor with this clientSeq or a later one landed
    // first; retrying this one could only be refused as stale again.
    mockFetch({ ok: true, status: 200, body: { success: true, stale: true } });
    const onSaved = jest.fn();
    const queue = createSaveQueue<{ female: number }>({
      send: (payload) => sendJsonForSave('/api/projects', payload),
      debounceMs: 0,
      onSaved,
    });
    queue.enqueue({ female: 3 });
    await settle();
    await settle();
    expect(onSaved).toHaveBeenCalledWith({ female: 3 }, { pendingCount: 0 });
    expect(queue.getSnapshot()).toMatchObject({ state: 'saved', pendingCount: 0, failedAttempts: 0 });
  });

  it('treats success:false as a failure even with a 2xx status', async () => {
    mockFetch({ ok: true, status: 200, body: { success: false, error: 'Invalid project ID' } });
    await expect(sendJsonForSave('/api/projects', {})).rejects.toMatchObject({ message: 'Invalid project ID' });
  });

  it('passes Retry-After through for rate-limited saves', async () => {
    mockFetch({ ok: false, status: 429, body: { error: 'Too many requests' }, retryAfter: '12' });
    const error = await sendJsonForSave('/api/projects', {}).catch((e) => e);
    expect(error).toMatchObject({ status: 429, retryAfterMs: 12000 });
  });

  it('gives up on a request that never answers, and aborts it', async () => {
    let signal: AbortSignal | undefined;
    global.fetch = jest.fn((_url: unknown, init?: RequestInit) => {
      signal = init?.signal ?? undefined;
      return new Promise<Response>(() => {});
    }) as unknown as typeof fetch;
    const pending = sendJsonForSave('/api/projects', {}, 'PUT', 1000).catch((e) => e);
    await jest.advanceTimersByTimeAsync(1000);
    const error = await pending;
    expect(error).toBeInstanceOf(SaveRequestError);
    expect(error).toMatchObject({ message: 'The server did not answer in time', status: null });
    expect(signal?.aborted).toBe(true);
  });

  it('handles a non-JSON error page', async () => {
    mockFetch({ ok: false, status: 502 });
    const error = await sendJsonForSave('/api/projects', {}).catch((e) => e);
    expect(error).toMatchObject({ status: 502, message: 'HTTP 502' });
  });
});
