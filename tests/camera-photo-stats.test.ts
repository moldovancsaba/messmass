// tests/camera-photo-stats.test.ts
// WHAT: parsePhotoStats accepts only camera_ names with whole totals and bounded averages; applyPhotoStats writes exactly those stats paths (one $set, never
//     another key, never a removal) and is idempotent; registerPhotoStatVariables creates catalog entries with $setOnInsert only and never changes an existing one.
// HOW: fakes only. The collections are in-memory objects that apply the one update operator the code uses, so no database is opened and nothing is written
//     anywhere (the camera counters must never be tried against the production data of messmass).

import { ObjectId } from 'mongodb';
import {
  applyPhotoStats,
  CAMERA_CATALOG_CATEGORY,
  CAMERA_STAT_NAME,
  humanizeCameraStatName,
  MAX_PHOTO_STAT_NAMES,
  parsePhotoStats,
  registerPhotoStatVariables,
  type PhotoStatsInput,
} from '@/lib/cameraPhotoStats';

const good = {
  totals: { camera_images_approved: 12, camera_gender_female: 7, camera_people_total: 20 },
  averages: { camera_avg_people_per_image: 1.5 },
};

function parsed(body: unknown): PhotoStatsInput {
  const result = parsePhotoStats(body);
  if (!result.ok) throw new Error(`expected a valid body, got: ${result.error}`);
  return result.value;
}

describe('parsePhotoStats: what is accepted', () => {
  test('totals, averages and labels are accepted and names come out in alphabetical order', () => {
    const value = parsed({
      totals: { camera_people_total: 20, camera_gender_female: 7, camera_images_approved: 12 },
      averages: { camera_avg_people_per_image: 1.5 },
      labels: { camera_gender_female: '  Women  ' },
    });
    expect(Object.keys(value.totals)).toEqual(['camera_gender_female', 'camera_images_approved', 'camera_people_total']);
    expect(value.totals.camera_gender_female).toBe(7);
    expect(value.averages).toEqual({ camera_avg_people_per_image: 1.5 });
    expect(value.labels).toEqual({ camera_gender_female: 'Women' });
  });

  test('averages and labels are optional, and a total of zero or one billion is a counter', () => {
    expect(parsed({ totals: { camera_images_taken: 0 } })).toEqual({ totals: { camera_images_taken: 0 }, averages: {}, labels: {} });
    expect(parsed({ totals: { camera_images_taken: 1_000_000_000 } }).totals.camera_images_taken).toBe(1_000_000_000);
  });

  test('only averages is fine when totals is an empty object; custom option names are fine', () => {
    expect(parsed({ totals: {}, averages: { camera_avg_vetting_seconds: 42 } }).averages.camera_avg_vetting_seconds).toBe(42);
    expect(parsed({ totals: { camera_merch_vintage_scarf_2026: 3 } }).totals.camera_merch_vintage_scarf_2026).toBe(3);
  });

  test('an average keeps at most four decimals, and minus zero is stored as zero', () => {
    const value = parsed({ totals: { camera_images_taken: -0 }, averages: { camera_avg_vetting_seconds: 12.345678, camera_avg_people_per_image: 0.00004 } });
    expect(value.averages.camera_avg_vetting_seconds).toBe(12.3457);
    expect(value.averages.camera_avg_people_per_image).toBe(0);
    expect(Object.is(value.totals.camera_images_taken, 0)).toBe(true);
  });

  test('the longest name (the prefix and 80 more characters) is accepted, one more is not', () => {
    const longest = `camera_${'a'.repeat(80)}`;
    expect(parsed({ totals: { [longest]: 1 } }).totals[longest]).toBe(1);
    expect(parsePhotoStats({ totals: { [`${longest}a`]: 1 } }).ok).toBe(false);
  });

  test('exactly 300 names are accepted, 301 are not', () => {
    const names = (count: number, from = 0) => Object.fromEntries(Array.from({ length: count }, (_, i) => [`camera_n${from + i}`, 1]));
    expect(parsePhotoStats({ totals: names(MAX_PHOTO_STAT_NAMES) }).ok).toBe(true);
    expect(parsePhotoStats({ totals: names(MAX_PHOTO_STAT_NAMES + 1) }).ok).toBe(false);
    // Totals and averages together: 200 + 101.
    const together = parsePhotoStats({ totals: names(200), averages: names(101, 1000) });
    expect(together).toEqual({ ok: false, error: expect.stringContaining('300') });
  });
});

describe('parsePhotoStats: what is refused (and then nothing can be written)', () => {
  const refused = (body: unknown, fragment?: string) => {
    const result = parsePhotoStats(body);
    expect(result.ok).toBe(false);
    if (!result.ok && fragment) expect(result.error).toContain(fragment);
  };

  test('a body that is not an object, or has no totals, or has no counter at all', () => {
    for (const body of [null, undefined, 'x', 5, [], [good]]) refused(body);
    refused({}, 'totals');
    refused({ averages: { camera_avg_vetting_seconds: 1 } }, 'totals');
    refused({ totals: null }, 'totals');
    refused({ totals: [] }, 'totals');
    refused({ totals: {} }, 'at least one');
    refused({ totals: {}, averages: {} }, 'at least one');
    refused({ totals: { camera_images_taken: 1 }, averages: [] }, 'averages');
  });

  test('a top-level field other than totals, averages and labels', () => {
    refused({ ...good, extra: 1 }, 'extra');
    refused({ ...good, stats: { female: 3 } }, 'stats');
    refused({ ...good, source: 'camera' }, 'source');
  });

  test('every name that does not start with camera_ (so nothing outside the namespace can be written)', () => {
    const hostile = [
      'female', 'male', 'genAlpha', 'scarf', 'approvedImages', 'fanmassGenderFemalePct', 'visitQrCode', 'reportText1', 'totalFans',
      'camera', 'camera_', 'Camera_x', 'CAMERA_X', 'cameraimages', 'camera-images', 'camera.images', 'camera_images.approved', 'camera_a b', 'camera_ä',
      'camera_Upper', 'camera_$set', 'camera_x$', 'xcamera_x', ' camera_x', 'camera_x ', 'stats.camera_x', 'stats.female', '__proto__', 'constructor', '$set', '',
    ];
    for (const name of hostile) {
      expect(CAMERA_STAT_NAME.test(name)).toBe(false);
      refused({ totals: { [name]: 1 } }, 'not a camera counter name');
      refused({ totals: { camera_images_taken: 1 }, averages: { [name]: 1 } }, 'not a camera counter name');
    }
  });

  test('a name arriving as an own "__proto__" key (JSON.parse) is refused too', () => {
    refused(JSON.parse('{"totals": {"__proto__": 1}}'), 'not a camera counter name');
    refused(JSON.parse('{"totals": {"camera_images_taken": 1}, "labels": {"__proto__": "x"}}'), 'labels');
  });

  test('one bad name refuses the whole request, however many good ones come with it', () => {
    refused({ totals: { ...good.totals, female: 1 } }, 'female');
  });

  test('a name in both totals and averages', () => {
    refused({ totals: { camera_images_taken: 1 }, averages: { camera_images_taken: 1.5 } }, 'both totals and averages');
  });

  test('totals must be whole numbers from 0 to one billion', () => {
    for (const bad of [-1, 1.5, '3', null, undefined, true, {}, [], NaN, Infinity, -Infinity, 1_000_000_001]) {
      refused({ totals: { camera_images_taken: bad } }, 'camera_images_taken');
    }
  });

  test('averages must be finite numbers from 0 to one billion', () => {
    for (const bad of [-0.1, '2', null, undefined, true, {}, NaN, Infinity, 1_000_000_001]) {
      refused({ totals: { camera_images_taken: 1 }, averages: { camera_avg_vetting_seconds: bad } }, 'camera_avg_vetting_seconds');
    }
  });

  test('labels: only for names that are present, only text of 1 to 80 characters', () => {
    const base = { totals: { camera_images_taken: 1 } };
    refused({ ...base, labels: { camera_gender_female: 'Women' } }, 'not in totals or averages');
    refused({ ...base, labels: { female: 'Women' } }, 'not in totals or averages');
    refused({ ...base, labels: [] }, 'labels');
    refused({ ...base, labels: 'Women' }, 'labels');
    for (const bad of ['', '   ', 5, null, {}, 'x'.repeat(81), 'two\nlines', 'bell\u0007']) {
      refused({ ...base, labels: { camera_images_taken: bad } }, 'label');
    }
    expect(parsePhotoStats({ ...base, labels: { camera_images_taken: 'x'.repeat(80) } }).ok).toBe(true);
  });

  test('whatever is accepted, every name in the result starts with camera_', () => {
    const result = parsed({
      totals: { camera_a: 1, camera_b_2: 2 },
      averages: { camera_c: 0.5 },
      labels: { camera_a: 'A' },
    });
    for (const map of [result.totals, result.averages, result.labels]) {
      for (const name of Object.keys(map)) expect(name.startsWith('camera_')).toBe(true);
    }
  });
});

// A one-document collection that applies the update operators the code uses ($set with dotted paths) to a plain object.
function fakeProjects(initial: Record<string, unknown>) {
  const id = new ObjectId();
  let doc: Record<string, any> = { _id: id, ...JSON.parse(JSON.stringify(initial)) };
  const updates: Array<{ filter: Record<string, unknown>; update: Record<string, any> }> = [];
  const collection = {
    updateOne: async (filter: Record<string, unknown>, update: Record<string, any>) => {
      updates.push({ filter, update });
      if (String(filter._id) !== String(id)) return { matchedCount: 0 };
      for (const [path, value] of Object.entries(update.$set ?? {})) {
        const keys = path.split('.');
        let target = doc;
        for (const key of keys.slice(0, -1)) target = target[key] ??= {};
        target[keys[keys.length - 1]] = JSON.parse(JSON.stringify(value));
      }
      return { matchedCount: 1 };
    },
  };
  return { id, collection, updates, snapshot: () => JSON.parse(JSON.stringify(doc)) as Record<string, any> };
}

describe('applyPhotoStats', () => {
  const now = '2026-10-12T10:00:00.000Z';

  test('one update with a stats path for each counter and the audit copy, and nothing else', async () => {
    const event = fakeProjects({ eventName: 'Derby', stats: { female: 5 } });
    const input = parsed(good);
    expect(await applyPhotoStats(event.collection as never, event.id, input, now)).toBe(true);

    expect(event.updates).toHaveLength(1);
    const { filter, update } = event.updates[0];
    expect(filter).toEqual({ _id: event.id });
    expect(Object.keys(update)).toEqual(['$set']);
    const paths = Object.keys(update.$set).sort();
    expect(paths).toEqual([
      'cameraPhotoStats',
      'stats.camera_avg_people_per_image',
      'stats.camera_gender_female',
      'stats.camera_images_approved',
      'stats.camera_people_total',
    ]);
    for (const path of paths) expect(path === 'cameraPhotoStats' || path.startsWith('stats.camera_')).toBe(true);
    expect(update.$set.cameraPhotoStats).toEqual({ totals: input.totals, averages: input.averages, updatedAt: now });
  });

  test('every other stat, every other field and keys camera did not send this time are left exactly as they were', async () => {
    const event = fakeProjects({
      eventName: 'Derby',
      stats: { female: 5, male: 4, scarf: 2, approvedImages: 9, fanmassGenderFemalePct: 52.1, camera_gender_female: 99, camera_old_counter: 4 },
      cameraLinkStats: { baseline: { visitQrCode: 1 } },
    });
    await applyPhotoStats(event.collection as never, event.id, parsed(good), now);
    const after = event.snapshot();
    expect(after.stats).toEqual({
      female: 5, male: 4, scarf: 2, approvedImages: 9, fanmassGenderFemalePct: 52.1,
      camera_gender_female: 7, camera_old_counter: 4,
      camera_images_approved: 12, camera_people_total: 20, camera_avg_people_per_image: 1.5,
    });
    expect(after.eventName).toBe('Derby');
    expect(after.cameraLinkStats).toEqual({ baseline: { visitQrCode: 1 } });
  });

  test('camera_gender_female ends as camera\'s whole total, not a sum: a second push with a smaller or larger total just replaces it', async () => {
    const event = fakeProjects({ stats: {} });
    await applyPhotoStats(event.collection as never, event.id, parsed({ totals: { camera_gender_female: 7 } }), now);
    await applyPhotoStats(event.collection as never, event.id, parsed({ totals: { camera_gender_female: 9 } }), now);
    expect(event.snapshot().stats.camera_gender_female).toBe(9);
    await applyPhotoStats(event.collection as never, event.id, parsed({ totals: { camera_gender_female: 8 } }), now);
    expect(event.snapshot().stats.camera_gender_female).toBe(8);
  });

  test('the same push twice changes nothing; a later push at another time changes only the audit time', async () => {
    const event = fakeProjects({ stats: { female: 1 } });
    const input = parsed(good);
    await applyPhotoStats(event.collection as never, event.id, input, now);
    const first = event.snapshot();
    await applyPhotoStats(event.collection as never, event.id, input, now);
    expect(event.snapshot()).toEqual(first);

    await applyPhotoStats(event.collection as never, event.id, input, '2026-10-12T10:30:00.000Z');
    const third = event.snapshot();
    expect(third.stats).toEqual(first.stats);
    expect(third.cameraPhotoStats.updatedAt).toBe('2026-10-12T10:30:00.000Z');
  });

  test('the audit copy is replaced as a whole, so a name camera stopped sending leaves it (the stat itself stays)', async () => {
    const event = fakeProjects({ stats: {} });
    await applyPhotoStats(event.collection as never, event.id, parsed({ totals: { camera_a: 1, camera_b: 2 } }), now);
    await applyPhotoStats(event.collection as never, event.id, parsed({ totals: { camera_a: 3 } }), now);
    const after = event.snapshot();
    expect(after.cameraPhotoStats.totals).toEqual({ camera_a: 3 });
    expect(after.stats).toEqual({ camera_a: 3, camera_b: 2 });
  });

  test('an event that does not exist is reported as not found and nothing is created', async () => {
    const event = fakeProjects({ stats: {} });
    expect(await applyPhotoStats(event.collection as never, new ObjectId(), parsed(good), now)).toBe(false);
    expect(event.snapshot().stats).toEqual({});
  });
});

// A catalog collection that applies an upsert with $setOnInsert the way MongoDB does: insert when no entry has the name, otherwise change nothing.
function fakeCatalog(existing: Array<Record<string, unknown>> = []) {
  const docs: Array<Record<string, any>> = existing.map((d) => ({ ...d }));
  const calls: Array<{ operations: any[]; options: unknown }> = [];
  const collection = {
    bulkWrite: async (operations: any[], options: unknown) => {
      calls.push({ operations, options });
      for (const operation of operations) {
        const { filter, update, upsert } = operation.updateOne;
        if (Object.keys(update).some((key) => key !== '$setOnInsert')) throw new Error('only $setOnInsert is allowed');
        if (!upsert) throw new Error('upsert is required');
        if (!docs.some((d) => d.name === filter.name)) docs.push({ ...update.$setOnInsert });
      }
      return {};
    },
  };
  return { collection, docs, calls };
}

describe('registerPhotoStatVariables', () => {
  const now = '2026-10-12T10:00:00.000Z';

  test('one entry per counter, written with $setOnInsert only, with the camera label or a humanised name', async () => {
    const catalog = fakeCatalog();
    const input = parsed({ ...good, labels: { camera_gender_female: 'Women counted by camera' } });
    await registerPhotoStatVariables(catalog.collection as never, input, now);

    expect(catalog.calls).toHaveLength(1);
    expect(catalog.calls[0].options).toEqual({ ordered: false });
    for (const operation of catalog.calls[0].operations) {
      expect(Object.keys(operation)).toEqual(['updateOne']);
      expect(Object.keys(operation.updateOne.update)).toEqual(['$setOnInsert']);
      expect(operation.updateOne.upsert).toBe(true);
      expect(operation.updateOne.filter).toEqual({ name: operation.updateOne.update.$setOnInsert.name });
    }

    const byName = Object.fromEntries(catalog.docs.map((d) => [d.name, d]));
    expect(Object.keys(byName).sort()).toEqual(['camera_avg_people_per_image', 'camera_gender_female', 'camera_images_approved', 'camera_people_total']);
    expect(byName.camera_gender_female.label).toBe('Women counted by camera');
    expect(byName.camera_images_approved.label).toBe('Camera: images approved');
    for (const doc of catalog.docs) {
      expect(doc).toMatchObject({
        category: CAMERA_CATALOG_CATEGORY,
        derived: false,
        isSystem: false,
        flags: { visibleInClicker: false, editableInManual: false },
        createdAt: now,
        updatedAt: now,
      });
      expect(typeof doc.order).toBe('number');
      expect(doc.name.startsWith('camera_')).toBe(true);
    }
  });

  test('totals are counts and averages are numeric (types the catalog accepts)', async () => {
    const catalog = fakeCatalog();
    await registerPhotoStatVariables(catalog.collection as never, parsed(good), now);
    const type = (name: string) => catalog.docs.find((d) => d.name === name)?.type;
    expect(type('camera_images_approved')).toBe('count');
    expect(type('camera_gender_female')).toBe('count');
    expect(type('camera_avg_people_per_image')).toBe('numeric');
    for (const doc of catalog.docs) expect(['count', 'percentage', 'currency', 'numeric', 'text', 'boolean', 'date']).toContain(doc.type);
  });

  test('an entry that exists is never changed: a label or category an administrator set stays, and so does its type', async () => {
    const edited = {
      name: 'camera_gender_female', label: 'Women (our wording)', type: 'percentage', category: 'Demographics', derived: false,
      flags: { visibleInClicker: true, editableInManual: true }, order: 3, isSystem: false, createdAt: 'then', updatedAt: 'then',
    };
    const catalog = fakeCatalog([edited]);
    await registerPhotoStatVariables(catalog.collection as never, parsed({ ...good, labels: { camera_gender_female: 'Camera label' } }), now);
    await registerPhotoStatVariables(catalog.collection as never, parsed(good), '2026-10-13T00:00:00.000Z');
    expect(catalog.docs.find((d) => d.name === 'camera_gender_female')).toEqual(edited);
    // The others were created once and a second push did not duplicate them.
    expect(catalog.docs.filter((d) => d.name === 'camera_images_approved')).toHaveLength(1);
    expect(catalog.docs).toHaveLength(4);
  });

  test('a duplicate-key answer (two first pushes at once) is fine; any other failure is thrown', async () => {
    const duplicate = Object.assign(new Error('E11000 duplicate key'), { writeErrors: [{ code: 11000 }, { code: 11000 }] });
    const single = Object.assign(new Error('E11000 duplicate key'), { writeErrors: { code: 11000 } });
    const mixed = Object.assign(new Error('mixed'), { writeErrors: [{ code: 11000 }, { code: 121 }] });
    const plain = new Error('connection lost');
    const failing = (error: Error) => ({ bulkWrite: async () => { throw error; } });
    await expect(registerPhotoStatVariables(failing(duplicate) as never, parsed(good), now)).resolves.toBeUndefined();
    await expect(registerPhotoStatVariables(failing(single) as never, parsed(good), now)).resolves.toBeUndefined();
    await expect(registerPhotoStatVariables(failing(mixed) as never, parsed(good), now)).rejects.toThrow('mixed');
    await expect(registerPhotoStatVariables(failing(plain) as never, parsed(good), now)).rejects.toThrow('connection lost');
  });
});

describe('humanizeCameraStatName', () => {
  test('the prefix becomes "Camera:" and underscores become spaces', () => {
    expect(humanizeCameraStatName('camera_gender_female')).toBe('Camera: gender female');
    expect(humanizeCameraStatName('camera_avg_vetting_seconds')).toBe('Camera: avg vetting seconds');
    expect(humanizeCameraStatName('camera_merch__x_')).toBe('Camera: merch x');
  });
});
