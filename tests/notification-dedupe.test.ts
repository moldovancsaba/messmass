/**
 * Unit tests for the notification idempotency/grouping key (audit H1, M1, H4).
 * WHAT: buildDedupeKey determines when two activities collapse into one
 *       notification via the atomic upsert. This locks that contract.
 */

import { buildDedupeKey } from '@/lib/notificationUtils';

const WINDOW_MS = 5 * 60 * 1000;
const base = { activityType: 'edit' as const, actorId: 'u1', actorName: 'Alice', projectId: 'p1' };

describe('buildDedupeKey', () => {
  // Window-aligned base time so [t, t+WINDOW) is exactly one bucket.
  const t = 3_000_000 * WINDOW_MS;

  it('is identical for the same actor/action/project within one 5-minute window', () => {
    expect(buildDedupeKey(base, t)).toBe(buildDedupeKey(base, t + WINDOW_MS - 1));
  });

  it('differs across window boundaries', () => {
    expect(buildDedupeKey(base, t)).not.toBe(buildDedupeKey(base, t + WINDOW_MS));
  });

  it('groups edit and edit-stats together (M1)', () => {
    const t = 1_000_000_000_000;
    const editKey = buildDedupeKey({ ...base, activityType: 'edit' }, t);
    const statsKey = buildDedupeKey({ ...base, activityType: 'edit-stats' }, t);
    expect(statsKey).toBe(editKey);
  });

  it('does NOT group create with edit', () => {
    const t = 1_000_000_000_000;
    expect(buildDedupeKey({ ...base, activityType: 'create' }, t)).not.toBe(
      buildDedupeKey({ ...base, activityType: 'edit' }, t)
    );
  });

  it('keys off the stable actorId, not the display name (H4)', () => {
    const t = 1_000_000_000_000;
    const renamed = buildDedupeKey({ ...base, actorName: 'Alice Renamed' }, t);
    expect(renamed).toBe(buildDedupeKey(base, t));
  });

  it('falls back to actorName when actorId is absent', () => {
    const t = 1_000_000_000_000;
    const key = buildDedupeKey({ ...base, actorId: null }, t);
    expect(key).toContain('Alice');
  });

  it('separates different projects', () => {
    const t = 1_000_000_000_000;
    expect(buildDedupeKey({ ...base, projectId: 'p1' }, t)).not.toBe(
      buildDedupeKey({ ...base, projectId: 'p2' }, t)
    );
  });
});
