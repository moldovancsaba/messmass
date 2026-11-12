// tests/szrt-brand-evidence.test.ts
// WHAT: Proof samples behind SZRT brand and club figures: what is accepted, how it is stored, what the report may show.
// WHY: The owner treats an unproven brand as prohibited content. A sample must carry the text read from the
//     picture, a model-only guess must never be offered as proof, and nothing that identifies a person or a
//     file may leave the API.

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({ db: () => ({ collection: () => ({}) }) }),
}));

import {
  EVIDENCE_SAMPLE_LIMIT,
  MAX_EVIDENCE_BATCH,
  evidenceNameKey,
  listBrandEvidence,
  parseEvidenceBatch,
  pickEvidence,
  PROOF_FILTER,
  storeEvidenceBatch,
  type BrandEvidenceDoc,
} from '@/lib/szrtBrandEvidence';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46]).toString('base64');

function sample(overrides: Record<string, unknown> = {}, region: Record<string, unknown> = {}, evidence: Record<string, unknown> = {}) {
  return {
    fileKey: 'Football/abc-123.jpg',
    sport: 'Football',
    analyzedAt: '2026-11-12T10:00:00Z',
    region: {
      regionId: 'ocr_001',
      shortName: 'Veolia',
      visibleText: 'O VEOLIA',
      itemType: 'clothing',
      confidence: 0.9,
      bbox: { x: 0.3, y: 0.35, w: 0.06, h: 0.03 },
      evidence: { tier: 'text_read', method: 'ocr', match: 'contains', ocrText: 'O VEOLIA', ocrConfidence: 1, entityKind: 'brand', onPerson: true, ...evidence },
      ...region,
    },
    crop: JPEG,
    ...overrides,
  };
}

const envelope = (samples: unknown[]) => ({ pipeline: 'fanmass_full_text_evidence_v1', samples });

describe('evidenceNameKey', () => {
  it('ignores case, accents and punctuation so Hungarian names match', () => {
    expect(evidenceNameKey('Szerencsejáték Zrt.')).toBe(evidenceNameKey('szerencsejatek zrt'));
    expect(evidenceNameKey('  O2  ')).toBe('o2');
    expect(evidenceNameKey('---')).toBe('');
  });
});

describe('parseEvidenceBatch', () => {
  it('turns one proven region into a document with its box, text and score', () => {
    const { parsed, skipped } = parseEvidenceBatch(envelope([sample()]));
    expect(skipped).toEqual([]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].doc).toMatchObject({
      _id: 'Football/abc-123.jpg#ocr_001', entityKind: 'brand', name: 'Veolia', nameKey: 'veolia', tier: 'text_read',
      readText: 'O VEOLIA', ocrConfidence: 1, onPerson: true, sport: 'Football',
    });
    expect(parsed[0].doc.score).toBeCloseTo(0.81, 3);
    expect(parsed[0].crop.length).toBeGreaterThan(0);
    expect(parsed[0].photo).toBeNull();
  });

  it('refuses a broken envelope and an oversize batch', () => {
    expect(() => parseEvidenceBatch(null)).toThrow(expect.objectContaining({ code: 'INVALID_EVIDENCE_BATCH' }));
    expect(() => parseEvidenceBatch({ pipeline: 'x', samples: [] })).toThrow(expect.objectContaining({ code: 'INVALID_EVIDENCE_BATCH' }));
    expect(() => parseEvidenceBatch({ samples: [sample()] })).toThrow(expect.objectContaining({ code: 'INVALID_EVIDENCE_BATCH' }));
    expect(() => parseEvidenceBatch(envelope(Array.from({ length: MAX_EVIDENCE_BATCH + 1 }, () => sample()))))
      .toThrow(expect.objectContaining({ code: 'EVIDENCE_BATCH_TOO_LARGE', status: 413 }));
  });

  it('skips a bad sample with its reason and still takes the good ones, keeping the sender index', () => {
    const { parsed, skipped } = parseEvidenceBatch(envelope([
      sample({}, { shortName: 'Unknown' }),
      sample(),
      sample({}, { bbox: { x: 0.9, y: 0.1, w: 0.3, h: 0.1 } }),
      sample({}, {}, { ocrText: '', tier: 'text_read' }, ),
      sample({ crop: 'not-an-image' }),
      sample({ fileKey: '../etc/passwd' }),
      sample({}, {}, { tier: 'guess' }),
      sample({ analyzedAt: 'yesterday' }),
    ]));
    expect(parsed.map((p) => p.index)).toEqual([1]);
    expect(skipped).toEqual([
      { index: 0, reason: 'placeholder_name' },
      { index: 2, reason: 'invalid_box' },
      { index: 3, reason: 'text_read_without_text' },
      { index: 4, reason: 'invalid_crop_image' },
      { index: 5, reason: 'invalid_file_key' },
      { index: 6, reason: 'invalid_tier' },
      { index: 7, reason: 'invalid_analyzed_at' },
    ]);
  });
});

function doc(overrides: Partial<BrandEvidenceDoc>): BrandEvidenceDoc {
  return {
    _id: 'Football/a.jpg#ocr_001', fileKey: 'Football/a.jpg', sport: 'Football', entityKind: 'brand', name: 'Veolia', nameKey: 'veolia',
    tier: 'text_read', method: 'ocr', match: 'exact', readText: 'VEOLIA', ocrConfidence: 1, confidence: 0.98, itemType: 'clothing',
    onPerson: false, box: { x: 0.1, y: 0.1, w: 0.2, h: 0.1 }, area: 0.02, score: 0.98, cropUrl: 'https://cdn.example/c.jpg',
    analyzedAt: '2026-11-12T10:00:00Z', pipeline: 'p', receivedAt: '2026-11-12T11:00:00Z', ...overrides,
  };
}

describe('pickEvidence', () => {
  it('puts the strongest proof first, one per photo, and never offers a model-only guess as proof', () => {
    const picked = pickEvidence([
      doc({ _id: 'Football/a.jpg#1', fileKey: 'Football/a.jpg', score: 0.5 }),
      doc({ _id: 'Football/a.jpg#2', fileKey: 'Football/a.jpg', score: 0.9 }),
      doc({ _id: 'Handball/b.jpg#1', fileKey: 'Handball/b.jpg', score: 0.7 }),
      doc({ _id: 'Handball/c.jpg#1', fileKey: 'Handball/c.jpg', score: 1, tier: 'model_identified' }),
    ]);
    expect(picked.map((d) => d._id)).toEqual(['Football/a.jpg#2', 'Handball/b.jpg#1']);
  });

  it('breaks a score tie by the bigger box and caps the list', () => {
    const many = Array.from({ length: 30 }, (_, i) => doc({ _id: `Football/${i}.jpg#1`, fileKey: `Football/${i}.jpg`, score: 0.8, area: i / 1000 }));
    const picked = pickEvidence(many);
    expect(picked).toHaveLength(EVIDENCE_SAMPLE_LIMIT);
    expect(picked[0]._id).toBe('Football/29.jpg#1');
  });
});

describe('storeEvidenceBatch', () => {
  const now = () => '2026-11-12T12:00:00Z';

  it('uploads crop and photo and upserts one document per region', async () => {
    const updateOne = jest.fn().mockResolvedValue({});
    const db = { collection: () => ({ updateOne, find: jest.fn(), aggregate: jest.fn() }) };
    let uploads = 0;
    const upload = jest.fn(async (_bytes: Buffer, _folder: string): Promise<string> => `https://cdn.example/${++uploads}.jpg`);
    const { parsed } = parseEvidenceBatch(envelope([sample({ photo: JPEG })]));
    const result = await storeEvidenceBatch(db, parsed, { upload, now });
    expect(result).toEqual({ stored: 1, skipped: [], replaced: 0 });
    expect(upload).toHaveBeenCalledTimes(2);
    const [filter, update, options] = updateOne.mock.calls[0];
    expect(filter).toEqual({ _id: 'Football/abc-123.jpg#ocr_001' });
    expect(update.$set).toMatchObject({ cropUrl: 'https://cdn.example/1.jpg', photoUrl: 'https://cdn.example/2.jpg', receivedAt: now(), name: 'Veolia', source: 'fanmass' });
    expect(update.$unset).toBeUndefined();
    expect(options).toEqual({ upsert: true });
  });

  it('drops a previously delivered full photo when the resend carries none', async () => {
    const updateOne = jest.fn().mockResolvedValue({});
    const db = { collection: () => ({ updateOne, find: jest.fn(), aggregate: jest.fn() }) };
    const { parsed } = parseEvidenceBatch(envelope([sample()]));
    await storeEvidenceBatch(db, parsed, { upload: async () => 'https://cdn.example/c.jpg', now });
    expect(updateOne.mock.calls[0][1].$unset).toEqual({ photoUrl: '' });
    expect(updateOne.mock.calls[0][1].$set.photoUrl).toBeUndefined();
  });

  it('reports a failed upload against the sender index and stores nothing for it', async () => {
    const updateOne = jest.fn().mockResolvedValue({});
    const db = { collection: () => ({ updateOne, find: jest.fn(), aggregate: jest.fn() }) };
    const { parsed } = parseEvidenceBatch(envelope([sample({}, { shortName: 'Unknown' }), sample()]));
    const result = await storeEvidenceBatch(db, parsed, { upload: async () => null, now });
    expect(result).toEqual({ stored: 0, skipped: [{ index: 1, reason: 'media_storage_failed' }], replaced: 0 });
    expect(updateOne).not.toHaveBeenCalled();
  });
});

describe('listBrandEvidence', () => {
  function fakeDb(docs: BrandEvidenceDoc[], counts: { proven: number; model: number }) {
    const find = jest.fn(() => ({ sort: () => ({ limit: () => ({ toArray: async () => docs }) }) }));
    const aggregate = jest.fn((pipeline: unknown[]) => ({
      toArray: async () => [{ n: (pipeline[0] as { $match?: { tier?: string } }).$match?.tier === 'model_identified' ? counts.model : counts.proven }],
    }));
    return { db: { collection: () => ({ updateOne: jest.fn(), find, aggregate }) }, find, aggregate };
  }

  it('returns proof samples and both counts, without file keys or paths', async () => {
    const { db, find } = fakeDb([doc({ photoUrl: 'https://cdn.example/p.jpg', onPerson: true })], { proven: 41, model: 6 });
    const listing = await listBrandEvidence(db, { kind: 'brand', name: 'VEOLIA' });
    expect(find).toHaveBeenCalledWith({ entityKind: 'brand', nameKey: 'veolia', ...PROOF_FILTER });
    expect(listing).toMatchObject({ kind: 'brand', name: 'Veolia', provenPhotos: 41, modelIdentifiedPhotos: 6 });
    expect(listing.samples).toHaveLength(1);
    expect(listing.samples[0]).toMatchObject({ cropUrl: 'https://cdn.example/c.jpg', photoUrl: 'https://cdn.example/p.jpg', readText: 'VEOLIA', onPerson: true });
    const serialised = JSON.stringify(listing);
    expect(serialised).not.toContain('abc');
    expect(serialised).not.toContain('Football/a.jpg');
    expect(serialised).not.toContain('fileKey');
  });

  it('returns an empty listing for a name with no usable key', async () => {
    const { db, find } = fakeDb([], { proven: 0, model: 0 });
    expect(await listBrandEvidence(db, { kind: 'club', name: '---' })).toMatchObject({ provenPhotos: 0, samples: [] });
    expect(find).not.toHaveBeenCalled();
  });
});
