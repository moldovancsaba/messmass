// lib/hashtagReport/cameraProof.ts
// WHAT: The brand and club names Fanmass proved in Camera photos, read from the stored per-photo results
//     (fanmass_camera_photo_analyses, analysis.detection.brandRegions), with the text that proves each one.
// WHY: Owner answer 501 (2026-11-15): Camera proof belongs in the global report next to the SZRT proof. A name counts only
//     when Fanmass read it from the picture (evidence tier `text_read` with its reading confidence, the same rule as the
//     SZRT evidence library and Fanmass's own `still_proven`); a name a model only suggested is never counted. Messmass
//     stores no crop of a Camera photo, so the proof shown is the text that was read, its confidence and the event.
//     Client-safe: no database or Node import, the pages pass the result to the dashboard.

/** One proof of a name in one Camera photo: the text read from the picture. */
export interface CameraProofSample {
  readText: string;
  /** How sure the text reading was (0..1), as Fanmass recorded it. */
  ocrConfidence: number;
  /** How the text matched the name (`exact`, `contains`, ...), as Fanmass recorded it. */
  match: string | null;
  /** The Messmass event the photo belongs to. */
  event: string;
}

/** A brand or club proven in Camera photos: in how many photos, and the strongest proofs (one per photo). */
export interface CameraProofEntry {
  kind: 'brand' | 'club';
  name: string;
  photos: number;
  samples: CameraProofSample[];
}

export const CAMERA_PROOF_SAMPLE_LIMIT = 6;
/** Proof rows read at most per report; a Camera photo carries a handful of proven regions at most. */
export const CAMERA_PROOF_ROW_LIMIT = 5000;

/** The key two spellings of one name share (case, accents, spaces and punctuation do not count). */
export function proofNameKey(name: string): string {
  return String(name ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** The proven regions of the Camera photo results matching `match`, one row per region. A person's correction of a
 * result replaces the machine's regions; a region without a text reading and its confidence is not proof. */
export function cameraProofPipeline(match: Record<string, unknown>): Array<Record<string, unknown>> {
  return [
    { $match: match },
    { $project: { eventId: 1, regions: { $ifNull: ['$humanReview.correction.analysis.detection.brandRegions', '$analysis.detection.brandRegions'] } } },
    { $unwind: '$regions' },
    { $match: {
      'regions.evidence.tier': 'text_read',
      'regions.evidence.ocrConfidence': { $type: 'number' },
      'regions.shortName': { $type: 'string', $ne: '' },
    } },
    { $project: {
      photo: '$_id',
      eventId: 1,
      name: '$regions.shortName',
      kind: '$regions.evidence.entityKind',
      readText: { $ifNull: ['$regions.evidence.ocrText', '$regions.visibleText'] },
      ocrConfidence: '$regions.evidence.ocrConfidence',
      match: '$regions.evidence.match',
    } },
    { $limit: CAMERA_PROOF_ROW_LIMIT },
  ];
}

type ProofRow = { photo?: unknown; eventId?: unknown; name?: unknown; kind?: unknown; readText?: unknown; ocrConfidence?: unknown; match?: unknown };

/** The proof rows as one entry per name: photos counted once each, the strongest reading of each photo kept. */
export function readCameraProof(rows: ProofRow[], eventName: (eventId: string) => string): CameraProofEntry[] {
  const byName = new Map<string, { kind: 'brand' | 'club'; names: Map<string, number>; photos: Map<string, CameraProofSample> }>();
  for (const row of rows) {
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    const key = proofNameKey(name);
    const confidence = typeof row.ocrConfidence === 'number' && Number.isFinite(row.ocrConfidence) ? row.ocrConfidence : null;
    if (!key || confidence === null) continue;
    // The clubs, leagues and federations of the Fanmass dictionary are clubs here; every other name is a brand
    const kind: 'brand' | 'club' = ['club', 'federation', 'league', 'nationalTeam'].includes(String(row.kind)) ? 'club' : 'brand';
    const id = `${kind}|${key}`;
    const entry = byName.get(id) ?? { kind, names: new Map(), photos: new Map() };
    entry.names.set(name, (entry.names.get(name) ?? 0) + 1);
    const photo = String(row.photo ?? '');
    const sample: CameraProofSample = {
      readText: typeof row.readText === 'string' && row.readText.trim() ? row.readText.trim().slice(0, 120) : name,
      ocrConfidence: confidence,
      match: typeof row.match === 'string' ? row.match : null,
      event: eventName(String(row.eventId ?? '')) || 'Unnamed event',
    };
    const kept = entry.photos.get(photo);
    if (!kept || kept.ocrConfidence < sample.ocrConfidence) entry.photos.set(photo, sample);
    byName.set(id, entry);
  }
  return [...byName.values()]
    .map((entry) => ({
      kind: entry.kind,
      // The spelling Fanmass used most often
      name: [...entry.names.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0],
      photos: entry.photos.size,
      samples: [...entry.photos.values()]
        .sort((a, b) => b.ocrConfidence - a.ocrConfidence || a.readText.localeCompare(b.readText))
        .slice(0, CAMERA_PROOF_SAMPLE_LIMIT),
    }))
    .sort((a, b) => b.photos - a.photos || a.name.localeCompare(b.name));
}

/** The proof of one name, matched in any spelling, or nothing. */
export function findCameraProof(proof: CameraProofEntry[] | undefined, kind: 'brand' | 'club', name: string): CameraProofEntry | null {
  const key = proofNameKey(name);
  return (proof ?? []).find((entry) => entry.kind === kind && proofNameKey(entry.name) === key) ?? null;
}
