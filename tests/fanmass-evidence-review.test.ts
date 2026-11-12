// tests/szrt-evidence-review.test.ts
// WHAT: Human review of the proof behind SZRT brand and club figures: list, confirm, reject, correct, restore, add, delete.
// WHY: The owner wants a person to be able to correct the machine at any time (a club "found" inside another word was
//     once shown as proof). A person's decision must win: it is stored with who and when, survives later deliveries,
//     hides a rejected sample from the report, and reaches the figures through the overrides list.

jest.mock('@/lib/mongodb', () => ({ __esModule: true, default: Promise.resolve({ db: () => ({ collection: () => ({}) }) }) }));
jest.mock('@/lib/config', () => ({ __esModule: true, default: { dbName: 'test', fanmassIntegrationToken: 'secret-token' } }));

import {
  createHumanEvidence, deleteHumanEvidence, listEvidenceForReview, listReviewOverrides, listTrainingRules, reviewEvidence, trainingTextKey,
} from '@/lib/fanmassEvidenceReview';
import { isProof, pickEvidence, storeEvidenceBatch, parseEvidenceBatch, toSample, type BrandEvidenceDoc } from '@/lib/fanmassEvidence';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46]).toString('base64');
const now = () => '2026-11-12T13:00:00Z';

function doc(over: Partial<BrandEvidenceDoc> = {}): BrandEvidenceDoc {
  return {
    origin: 'szrt', _id: 'Basketball/a.jpg#ocr_001', fileKey: 'Basketball/a.jpg', sport: 'Basketball', entityKind: 'club', name: 'Porto', nameKey: 'porto', tier: 'text_read',
    method: 'ocr', match: 'contains', readText: 'WWW.SPORTOLONEM', ocrConfidence: 1, confidence: 0.9, itemType: 'other', onPerson: true,
    box: { x: 0.1, y: 0.1, w: 0.2, h: 0.1 }, area: 0.02, score: 0.81, cropUrl: 'https://cdn.example/c.jpg', analyzedAt: '2026-11-12T10:00:00Z',
    pipeline: 'p', receivedAt: '2026-11-12T11:00:00Z', source: 'fanmass', ...over,
  };
}

/** A tiny in-memory collection: enough of the Mongo surface the review code uses. */
function memory(rows: BrandEvidenceDoc[]) {
  const store = new Map(rows.map((r) => [r._id, structuredClone(r)]));
  const get = (path: string, row: Record<string, any>) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), row);
  const matches = (row: Record<string, any>, f: Record<string, any>): boolean =>
    Object.entries(f).every(([k, cond]) => {
      if (k === '$or') return (cond as Array<Record<string, any>>).some((c) => matches(row, c));
      const v = get(k, row);
      if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
        if ('$exists' in cond) return (v !== undefined) === cond.$exists;
        if ('$ne' in cond) return v !== cond.$ne;
        if ('$in' in cond) return cond.$in.includes(v);
        if ('$regex' in cond) return new RegExp(cond.$regex).test(String(v ?? ''));
      }
      return v === cond;
    });
  const apply = (row: Record<string, any>, u: Record<string, any>) => {
    for (const [k, v] of Object.entries(u.$set ?? {})) row[k] = v;
    for (const k of Object.keys(u.$unset ?? {})) delete row[k];
  };
  const collection = {
    find: (f: Record<string, any>) => {
      let list = [...store.values()].filter((r) => matches(r, f));
      const cursor: any = { sort: () => cursor, skip: (n: number) => { list = list.slice(n); return cursor; }, limit: (n: number) => { list = list.slice(0, n); return cursor; }, toArray: async () => list };
      return cursor;
    },
    findOne: async (f: Record<string, any>) => [...store.values()].find((r) => matches(r, f)) ?? null,
    countDocuments: async (f: Record<string, any>) => [...store.values()].filter((r) => matches(r, f)).length,
    updateOne: async (f: Record<string, any>, u: Record<string, any>, o?: { upsert?: boolean }) => {
      const row = [...store.values()].find((r) => matches(r, f));
      if (row) apply(row, u); else if (o?.upsert) { const fresh: any = { _id: f._id }; apply(fresh, u); store.set(fresh._id, fresh); }
    },
    insertOne: async (d: BrandEvidenceDoc) => { store.set(d._id, d); },
    deleteOne: async (f: Record<string, any>) => { for (const [id, r] of store) if (matches(r, f)) store.delete(id); },
    deleteMany: async (f: Record<string, any>) => { let n = 0; for (const [id, r] of store) if (matches(r, f)) { store.delete(id); n += 1; } return { deletedCount: n }; },
    aggregate: () => ({ toArray: async () => [] }),
  };
  return { db: { collection: () => collection } as any, store };
}

describe('review: read', () => {
  it('lists the weakest unreviewed proof first by default and can filter by decision, kind and name', async () => {
    const { db } = memory([doc(), doc({ _id: 'Football/b.jpg#ocr_001', fileKey: 'Football/b.jpg', name: 'Veolia', nameKey: 'veolia', entityKind: 'brand', score: 0.98 }), doc({ _id: 'x#1', fileKey: 'x', review: { status: 'rejected', by: 'a', at: now(), note: '' } })]);
    expect((await listEvidenceForReview(db, {})).rows.map((r) => r.id)).toEqual(['Basketball/a.jpg#ocr_001', 'Football/b.jpg#ocr_001']);
    expect((await listEvidenceForReview(db, { status: 'rejected' })).rows.map((r) => r.id)).toEqual(['x#1']);
    expect((await listEvidenceForReview(db, { status: 'all', kind: 'brand' })).rows.map((r) => r.name)).toEqual(['Veolia']);
    expect((await listEvidenceForReview(db, { status: 'all', name: 'por' })).total).toBe(2);
  });
});

describe('review: update', () => {
  it('rejects a wrong proof, records who and when, and the report no longer treats it as proof', async () => {
    const { db, store } = memory([doc()]);
    const row = await reviewEvidence(db, 'Basketball/a.jpg#ocr_001', { action: 'reject', note: 'SPORTOLONEM is not Porto' }, 'owner@example.com', now);
    expect(row.review).toMatchObject({ status: 'rejected', by: 'owner@example.com', at: now(), note: 'SPORTOLONEM is not Porto' });
    expect(isProof(store.get('Basketball/a.jpg#ocr_001')!)).toBe(false);
    expect(pickEvidence([store.get('Basketball/a.jpg#ocr_001')!])).toEqual([]);
  });

  it('corrects the name and kind, keeps the original, and restore brings it back', async () => {
    const { db } = memory([doc()]);
    const fixed = await reviewEvidence(db, 'Basketball/a.jpg#ocr_001', { action: 'correct', name: 'Sportoló Nem', kind: 'brand' }, 'owner', now);
    expect(fixed).toMatchObject({ name: 'Sportoló Nem', nameKey: 'sportolo-nem', entityKind: 'brand', review: { status: 'corrected', original: { name: 'Porto', nameKey: 'porto', entityKind: 'club' } } });
    expect(isProof(fixed)).toBe(true);
    expect(toSample(fixed).reviewed).toBe('corrected');
    const again = await reviewEvidence(db, 'Basketball/a.jpg#ocr_001', { action: 'correct', name: 'Other Name' }, 'owner', now);
    expect(again.review?.original).toMatchObject({ name: 'Porto' }); // the first original is kept, not the previous correction
    const restored = await reviewEvidence(db, 'Basketball/a.jpg#ocr_001', { action: 'restore' }, 'owner', now);
    expect(restored).toMatchObject({ name: 'Porto', nameKey: 'porto', entityKind: 'club' });
    expect(restored.review).toBeUndefined();
  });

  it('confirms a weak sample so it counts as proof', async () => {
    const { db } = memory([doc({ tier: 'model_identified', readText: '' })]);
    const row = await reviewEvidence(db, 'Basketball/a.jpg#ocr_001', { action: 'confirm' }, 'owner', now);
    expect(isProof(row)).toBe(true);
    expect(toSample(row).reviewed).toBe('confirmed');
  });

  it('refuses bad input and unknown samples', async () => {
    const { db } = memory([doc()]);
    await expect(reviewEvidence(db, 'nope', { action: 'reject' }, 'o', now)).rejects.toMatchObject({ status: 404 });
    await expect(reviewEvidence(db, 'Basketball/a.jpg#ocr_001', { action: 'burn' }, 'o', now)).rejects.toMatchObject({ status: 400 });
    await expect(reviewEvidence(db, 'Basketball/a.jpg#ocr_001', { action: 'correct', name: 'Unknown' }, 'o', now)).rejects.toMatchObject({ status: 400 });
    await expect(reviewEvidence(db, 'Basketball/a.jpg#ocr_001', { action: 'correct', name: 'X', kind: 'planet' }, 'o', now)).rejects.toMatchObject({ status: 400 });
  });
});

describe('review: create and delete', () => {
  it('adds a sample a person made: a stored picture, counted as proof, deletable', async () => {
    const { db, store } = memory([]);
    const upload = jest.fn().mockResolvedValue('https://cdn.example/h.jpg');
    const row = await createHumanEvidence(db, { name: 'Veolia', kind: 'brand', crop: JPEG, sport: 'Football', note: 'seen on the board' }, 'owner', { upload, now, id: () => 'u1' });
    expect(row).toMatchObject({ _id: 'human:u1', source: 'human', tier: 'human', cropUrl: 'https://cdn.example/h.jpg', review: { status: 'confirmed', by: 'owner', note: 'seen on the board' } });
    expect(isProof(row)).toBe(true);
    expect(toSample(row).reviewed).toBe('human');
    await deleteHumanEvidence(db, 'human:u1');
    expect(store.has('human:u1')).toBe(false);
  });

  it('needs a real name, a kind and a picture', async () => {
    const { db } = memory([]);
    const upload = jest.fn().mockResolvedValue('https://cdn.example/h.jpg');
    for (const bad of [{ kind: 'brand', crop: JPEG }, { name: 'Veolia', crop: JPEG }, { name: 'Veolia', kind: 'brand' }, { name: 'Veolia', kind: 'brand', crop: 'not an image' }, { name: 'Veolia', kind: 'brand', crop: JPEG, box: { x: 2, y: 0, w: 1, h: 1 } }]) {
      await expect(createHumanEvidence(db, bad, 'o', { upload, now })).rejects.toMatchObject({ status: 400 });
    }
    expect(upload).not.toHaveBeenCalled();
  });

  it('refuses to delete an automatic sample: it must be rejected so a delivery cannot bring it back', async () => {
    const { db, store } = memory([doc()]);
    await expect(deleteHumanEvidence(db, 'Basketball/a.jpg#ocr_001')).rejects.toMatchObject({ status: 409, code: 'AUTOMATIC_EVIDENCE_CANNOT_BE_DELETED' });
    expect(store.size).toBe(1);
  });
});

describe('a person decision wins over a later delivery', () => {
  const batch = (extra: Record<string, unknown> = {}) => parseEvidenceBatch({
    pipeline: 'p', ...extra,
    samples: [{ fileKey: 'Basketball/a.jpg', sport: 'Basketball', analyzedAt: '2026-11-12T10:00:00Z', crop: JPEG,
      region: { regionId: 'ocr_001', shortName: 'Porto', visibleText: 'FC PORTO', itemType: 'other', confidence: 0.9, bbox: { x: 0.1, y: 0.1, w: 0.2, h: 0.1 },
        evidence: { tier: 'text_read', method: 'ocr', match: 'contains', ocrText: 'FC PORTO', ocrConfidence: 1, entityKind: 'club', onPerson: false } } }],
  });
  const upload = async () => 'https://cdn.example/new.jpg';

  it('does not overwrite a reviewed sample and says so', async () => {
    const { db, store } = memory([doc({ _id: 'szrt|Basketball/a.jpg#ocr_001', review: { status: 'rejected', by: 'owner', at: now(), note: '' } })]);
    const { parsed } = batch();
    const result = await storeEvidenceBatch(db, parsed, { upload, now });
    expect(result).toMatchObject({ stored: 0, skipped: [{ index: 0, reason: 'human_reviewed' }] });
    expect(store.get('szrt|Basketball/a.jpg#ocr_001')!.readText).toBe('WWW.SPORTOLONEM');
    expect(store.get('szrt|Basketball/a.jpg#ocr_001')!.review?.status).toBe('rejected');
  });

  it('replaces only unreviewed deliveries of the pictures named, never a person sample', async () => {
    const { db, store } = memory([
      doc({ _id: 'szrt|Basketball/a.jpg#ocr_009', name: 'Old', nameKey: 'old' }),
      doc({ _id: 'szrt|Basketball/a.jpg#ocr_010', review: { status: 'confirmed', by: 'o', at: now(), note: '' } }),
      doc({ _id: 'human:u1', fileKey: 'Basketball/a.jpg', source: 'human', tier: 'human' }),
      doc({ _id: 'szrt|Football/z.jpg#ocr_001', fileKey: 'Football/z.jpg' }),
      doc({ _id: 'camera-e1|Basketball/a.jpg#ocr_001', origin: 'camera-e1', fileKey: 'Basketball/a.jpg' }), // same file key, another origin
    ]);
    const { parsed, replaceFiles, origin } = batch({ replaceFiles: ['Basketball/a.jpg'] });
    const result = await storeEvidenceBatch(db, parsed, { upload, now, replaceFiles, origin });
    expect(result.replaced).toBe(1);
    expect([...store.keys()].sort()).toEqual(['camera-e1|Basketball/a.jpg#ocr_001', 'human:u1', 'szrt|Basketball/a.jpg#ocr_001', 'szrt|Basketball/a.jpg#ocr_010', 'szrt|Football/z.jpg#ocr_001']);
  });

  it('accepts a request that only withdraws pictures', () => {
    expect(parseEvidenceBatch({ pipeline: 'p', samples: [], replaceFiles: ['Basketball/a.jpg'] }).replaceFiles).toEqual(['Basketball/a.jpg']);
    expect(() => parseEvidenceBatch({ pipeline: 'p', samples: [], replaceFiles: ['../x'] })).toThrow(expect.objectContaining({ code: 'INVALID_EVIDENCE_BATCH' }));
    expect(() => parseEvidenceBatch({ pipeline: 'p', samples: [] })).toThrow(expect.objectContaining({ code: 'INVALID_EVIDENCE_BATCH' }));
  });
});

describe('overrides for Fanmass', () => {
  it('lists every decision and every sample a person added, with the region it is about', async () => {
    const { db } = memory([
      doc({ _id: 'szrt|Basketball/a.jpg#ocr_001', review: { status: 'rejected', by: 'o', at: now(), note: '' } }),
      doc({ _id: 'szrt|Football/b.jpg#ocr_002', fileKey: 'Football/b.jpg', name: 'Sportoló Nem', nameKey: 'sportolo-nem', entityKind: 'brand', review: { status: 'corrected', by: 'o', at: now(), note: '' } }),
      doc({ _id: 'human:u1', fileKey: 'human/u1', source: 'human', tier: 'human', name: 'Veolia', entityKind: 'brand', review: { status: 'confirmed', by: 'o', at: now(), note: '' } }),
      doc({ _id: 'Football/c.jpg#ocr_001', fileKey: 'Football/c.jpg' }),
    ]);
    expect(await listReviewOverrides(db)).toEqual([
      { id: 'szrt|Basketball/a.jpg#ocr_001', origin: 'szrt', fileKey: 'Basketball/a.jpg', regionId: 'ocr_001', source: 'fanmass', status: 'rejected', name: 'Porto', kind: 'club' },
      { id: 'szrt|Football/b.jpg#ocr_002', origin: 'szrt', fileKey: 'Football/b.jpg', regionId: 'ocr_002', source: 'fanmass', status: 'corrected', name: 'Sportoló Nem', kind: 'brand' },
      { id: 'human:u1', origin: 'szrt', fileKey: 'human/u1', regionId: '', source: 'human', status: 'confirmed', name: 'Veolia', kind: 'brand' },
    ]);
  });
});

describe('the library is global: origins', () => {
  it('lists any origin, or one, and a person-added sample carries the origin they chose', async () => {
    const { db } = memory([doc(), doc({ _id: 'camera-e1|x#1', origin: 'camera-e1', fileKey: 'x', name: 'Adidas', nameKey: 'adidas', entityKind: 'brand' })]);
    expect((await listEvidenceForReview(db, { status: 'all' })).total).toBe(2);
    expect((await listEvidenceForReview(db, { status: 'all', origin: 'camera-e1' })).rows.map((r) => r.name)).toEqual(['Adidas']);
    const row = await createHumanEvidence(db, { name: 'Veolia', kind: 'brand', crop: JPEG, origin: 'camera-e1' }, 'owner', { upload: async () => 'https://cdn.example/h.jpg', now, id: () => 'u9' });
    expect(row.origin).toBe('camera-e1');
    expect((await createHumanEvidence(db, { name: 'Veolia', kind: 'brand', crop: JPEG }, 'owner', { upload: async () => 'https://cdn.example/h.jpg', now, id: () => 'u10' })).origin).toBe('manual');
    await expect(createHumanEvidence(db, { name: 'Veolia', kind: 'brand', crop: JPEG, origin: 'Bad Origin!' }, 'owner', { upload: async () => 'x', now })).rejects.toMatchObject({ status: 400 });
  });

  it('keeps overrides per origin on request', async () => {
    const { db } = memory([
      doc({ review: { status: 'rejected', by: 'o', at: now(), note: '' } }),
      doc({ _id: 'camera-e1|x#1', origin: 'camera-e1', fileKey: 'x', review: { status: 'rejected', by: 'o', at: now(), note: '' } }),
    ]);
    expect((await listReviewOverrides(db)).map((o) => o.origin).sort()).toEqual(['camera-e1', 'szrt']);
    expect((await listReviewOverrides(db, { origin: 'szrt' })).map((o) => o.origin)).toEqual(['szrt']);
  });
});

describe('training: what the decisions teach the whole system', () => {
  it('turns rejections into deny rules, and corrections and confirmations and additions into alias rules', async () => {
    const rejected = { status: 'rejected' as const, by: 'o', at: now(), note: '' };
    const { db } = memory([
      doc({ _id: 'szrt|a#1', readText: 'WWW.SPORTOLONEM', review: rejected }),                                                            // Porto is not SPORTOLONEM
      doc({ _id: 'szrt|b#1', readText: 'LE COPER', name: 'Lee Cooper', nameKey: 'lee-cooper', entityKind: 'brand', tier: 'text_read', review: { status: 'confirmed', by: 'o', at: now(), note: '' } }),
      doc({ _id: 'camera-e1|c#1', origin: 'camera-e1', readText: 'Atomerőmű', name: 'Atomerőmű SE', nameKey: 'atomeromu-se', review: { status: 'corrected', by: 'o', at: now(), note: '', original: { name: 'Paks', nameKey: 'paks', entityKind: 'club' } } }),
      doc({ _id: 'human:u1', origin: 'manual', source: 'human', tier: 'human', readText: 'MVM', name: 'MVM', nameKey: 'mvm', entityKind: 'brand', review: { status: 'confirmed', by: 'o', at: now(), note: '' } }),
      doc({ _id: 'szrt|d#1', readText: '', review: rejected }),   // no text read: nothing to teach
      doc({ _id: 'szrt|e#1', readText: 'FC PORTO' }),            // not reviewed: nothing to teach
    ]);
    const { deny, alias } = await listTrainingRules(db);
    expect(deny).toEqual([
      { text: 'wwwsportolonem', readText: 'WWW.SPORTOLONEM', name: 'Porto', kind: 'club' },
      { text: 'atomeromu', readText: 'Atomerőmű', name: 'Paks', kind: 'club' },
    ]);
    expect(alias.map((r) => `${r.text}=${r.name}/${r.kind}`).sort()).toEqual(['atomeromu=Atomerőmű SE/club', 'lecoper=Lee Cooper/brand', 'mvm=MVM/brand']);
  });

  it('folds the text the way Fanmass does: lowercase, no accents, letters and digits only', () => {
    expect(trainingTextKey('Atomerőmű')).toBe('atomeromu');
    expect(trainingTextKey('WWW.SPORTOLONEM')).toBe('wwwsportolonem');
    expect(trainingTextKey('Fc-Porto  1')).toBe('fcporto1');
  });
});
