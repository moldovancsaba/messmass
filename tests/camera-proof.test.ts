// tests/camera-proof.test.ts
// WHAT: Camera proof in the Fanmass report (owner answer 501), the opt-in headline from per-photo records (answer 512)
//     and the months the report covers, drive and Camera together.
// WHY: A brand or club of a Camera photo counts only when Fanmass read its name from the picture; the proof shown is that
//     reading. The opt-in headline counts photos with a stored opt-in record, never a typed marketing opt-in, and says
//     Not measured when no photo has one.

import { buildAllEventsReport } from '@/lib/hashtagReport';
import { photoOptIn } from '@/lib/hashtagReport/calculated';
import { cameraProofPipeline, findCameraProof, proofNameKey, readCameraProof } from '@/lib/hashtagReport/cameraProof';
import { withCameraVision } from '@/lib/hashtagReport/dashboard';
import { readDriveSummary, type ReportDb } from '@/lib/hashtagReport/measured';
import { mergePhotoSummaries } from '@/lib/hashtagReport/mergeSummaries';
import type { HashtagReport, MeasuredLayer } from '@/lib/hashtagReport/types';
import type { VisionProgressData } from '@/components/theme/interactive-report/types';
import { driveFacet } from './helpers/driveFacet';

const names = (id: string) => ({ e1: 'MTK x DVSC', e2: 'Camera Night' } as Record<string, string>)[id] ?? '';

describe('the proof of a name in Camera photos', () => {
  it('counts each photo once, keeps its strongest reading and merges spellings of one name', () => {
    const proof = readCameraProof([
      { photo: 'p1', eventId: 'e1', name: 'Veolia', kind: 'brand', readText: 'O VEOLIA', ocrConfidence: 0.7, match: 'contains' },
      { photo: 'p1', eventId: 'e1', name: 'Veolia', kind: 'brand', readText: 'VEOLIA', ocrConfidence: 0.95, match: 'exact' },
      { photo: 'p2', eventId: 'e2', name: 'VEOLIA', kind: 'brand', readText: 'veolia', ocrConfidence: 0.8, match: 'exact' },
      { photo: 'p2', eventId: 'e2', name: 'MTK Budapest', kind: 'club', readText: 'MTK', ocrConfidence: 0.9, match: 'exact' },
    ], names);
    expect(proof).toEqual([
      { kind: 'brand', name: 'Veolia', photos: 2, appearances: 3, weightedCount: 2, soloPhotos: 2, coOccurrencePhotos: 0, avgSharePct: 100, samples: [
        { readText: 'VEOLIA', ocrConfidence: 0.95, match: 'exact', event: 'MTK x DVSC' },
        { readText: 'veolia', ocrConfidence: 0.8, match: 'exact', event: 'Camera Night' },
      ] },
      { kind: 'club', name: 'MTK Budapest', photos: 1, appearances: 1, weightedCount: 1, soloPhotos: 1, coOccurrencePhotos: 0, avgSharePct: 100, samples: [{ readText: 'MTK', ocrConfidence: 0.9, match: 'exact', event: 'Camera Night' }] },
    ]);
    expect(findCameraProof(proof, 'brand', 'veolia')?.photos).toBe(2);
    expect(findCameraProof(proof, 'club', 'Veolia')).toBeNull();
    expect(proofNameKey('Ferencvárosi TC')).toBe('ferencvarositc');
  });

  it('computes fractional multi-brand weighting when multiple brands share a photo', () => {
    const proof = readCameraProof([
      { photo: 'p1', eventId: 'e1', name: 'Tippmix', kind: 'brand', readText: 'TIPPMIX', ocrConfidence: 0.95, match: 'exact' },
      { photo: 'p1', eventId: 'e1', name: 'Tippmix', kind: 'brand', readText: 'TIPPMIX', ocrConfidence: 0.9, match: 'exact' },
      { photo: 'p1', eventId: 'e1', name: 'Nike', kind: 'brand', readText: 'NIKE', ocrConfidence: 0.92, match: 'exact' },
      { photo: 'p2', eventId: 'e1', name: 'Tippmix', kind: 'brand', readText: 'TIPPMIX', ocrConfidence: 0.96, match: 'exact' },
    ], names);
    const tippmix = findCameraProof(proof, 'brand', 'Tippmix');
    const nike = findCameraProof(proof, 'brand', 'Nike');
    expect(tippmix?.photos).toBe(2);
    expect(tippmix?.appearances).toBe(3);
    expect(tippmix?.soloPhotos).toBe(1);
    expect(tippmix?.coOccurrencePhotos).toBe(1);
    expect(tippmix?.weightedCount).toBe(1.67);
    expect(nike?.photos).toBe(1);
    expect(nike?.coOccurrencePhotos).toBe(1);
    expect(nike?.weightedCount).toBe(0.33);
  });

  it('takes no reading without its confidence and no row without a name', () => {
    expect(readCameraProof([
      { photo: 'p1', name: 'Nike', kind: 'brand', readText: 'NIKE', ocrConfidence: null },
      { photo: 'p2', name: '', kind: 'brand', readText: 'X', ocrConfidence: 0.9 },
    ], names)).toEqual([]);
  });

  it('reads only text-read regions with a reading confidence, a person\'s correction before the machine result', () => {
    const pipeline = cameraProofPipeline({ eventId: { $in: ['e1'] } });
    expect(pipeline[0]).toEqual({ $match: { eventId: { $in: ['e1'] } } });
    expect(JSON.stringify(pipeline[1])).toContain('"$ifNull":["$humanReview.correction.analysis.detection.brandRegions","$analysis.detection.brandRegions"]');
    expect(pipeline[3]).toEqual({ $match: {
      'regions.evidence.tier': 'text_read',
      'regions.evidence.ocrConfidence': { $type: 'number' },
      'regions.shortName': { $type: 'string', $ne: '' },
    } });
  });
});

describe('every event together, with Camera proof, opt-ins and months', () => {
  const proofRows = [
    { photo: 'p1', eventId: 'e2', name: 'Veolia', kind: 'brand', readText: 'VEOLIA', ocrConfidence: 0.9, match: 'exact' },
    { photo: 'p2', eventId: 'e2', name: 'Tippmix', kind: 'brand', readText: 'TIPPMIX', ocrConfidence: 0.8, match: 'exact' },
  ];
  const db = {
    collection: (name: string) => ({
      countDocuments: async (filter: Record<string, unknown>) => (name === 'fanmass_camera_photo_analyses' && 'optIn.received' in filter ? 3 : 0),
      aggregate: (pipeline: Array<Record<string, any>>) => ({
        toArray: async () => {
          if (name === 'fanmass_camera_photo_analyses') return proofRows;
          // Two SZRT drive photos placed in the first event, both with an opt-in record
          const rows = [{ eventId: 'e1', optIn: { received: true } }, { eventId: 'e1', optIn: { received: true } }];
          return pipeline[1]?.$group ? [{ _id: 'e1' }] : [driveFacet(rows)];
        },
      }),
      find: () => ({
        toArray: async () => {
          if (name === 'projects') {
            return [
              { _id: 'e1', eventName: 'MTK x DVSC', eventDate: '2025-11-22', stats: {} },
              { _id: 'e2', eventName: 'Camera Night', eventDate: '2026.02.08', stats: { camera_images_taken: 4 } },
            ];
          }
          return [{ eventId: 'e2', summary: { photoResultsReceived: 4 } }];
        },
      }),
    }),
  } as unknown as ReportDb;

  it('lists the names proven in Camera photos with their proof', async () => {
    const report = await buildAllEventsReport(db);
    expect(report.measured.photos.brands).toEqual([
      { name: 'Tippmix', count: 1, appearances: 1, weightedCount: 1, soloPhotos: 1, coOccurrencePhotos: 0, avgSharePct: 100 },
      { name: 'Veolia', count: 1, appearances: 1, weightedCount: 1, soloPhotos: 1, coOccurrencePhotos: 0, avgSharePct: 100 },
    ]);
    expect(report.measured.cameraProof.map((entry) => [entry.name, entry.samples[0].event])).toEqual([['Tippmix', 'Camera Night'], ['Veolia', 'Camera Night']]);
  });

  it('covers the Camera months next to the drive months', async () => {
    const report = await buildAllEventsReport(db);
    expect(report.measured.events.find((event) => event.id === 'e2')?.cameraPhotos).toBe(4);
    expect(report.measured.months).toEqual([
      { month: '2025-11', events: 1, drivePhotos: 2, cameraPhotos: 0 },
      { month: '2026-02', events: 1, drivePhotos: 0, cameraPhotos: 4 },
    ]);
  });

  it('headlines the photos with a stored opt-in record, drive and Camera together', async () => {
    const report = await buildAllEventsReport(db);
    // 2 drive photos + 3 of the 4 Camera results carry an opt-in record
    expect(report.calculated.photoOptInShare).toMatchObject({ value: 83.3, numerator: 5, denominator: 6, basis: 'photos' });
  });

  it('says Not measured when no photo of the report has an opt-in record', () => {
    const layer: MeasuredLayer = { events: [], counters: {}, photos: { ...mergePhotoSummaries([]), analysed: 4, withOptIn: 0 }, drive: readDriveSummary().drive, cameraProof: [], months: [] };
    expect(photoOptIn(layer)).toMatchObject({ value: null, numerator: null, denominator: 4 });
  });
});

describe('Camera results added to the vision Fanmass published for the drive library', () => {
  const published: VisionProgressData = {
    totalImages: 100, processedCount: 80, percent: 80, status: 'idle', currentSport: '', currentFile: '', lastUpdated: '', optInImages: 100,
    aggregates: {
      totalPeople: 50, genders: { male: 30, female: 20, malePct: 60, femalePct: 40 }, ageGroups: { children: 1, teens: 2, adults: 3, seniors: 4 },
      topBrands: [{ brand: 'Veolia', count: 55, logoUrl: 'https://cdn/veolia.svg' }], topClubs: [], topEmotions: [{ emotion: 'happy', count: 10 }], sportsBreakdown: {},
    },
    recentImages: [],
  };
  const camera = (over: Partial<MeasuredLayer> = {}): HashtagReport => ({
    success: true, scope: { type: 'all', id: 'all', tags: [] }, generatedAt: '', calculated: {} as HashtagReport['calculated'],
    coverage: { events: 1, eventsWithCounters: 0, eventsWithPhotoResults: 1, eventsWithDrivePhotos: 0 },
    measured: {
      events: [], counters: {}, drive: readDriveSummary().drive, months: [],
      photos: { ...mergePhotoSummaries([{ photoResultsReceived: 4, peopleCounts: { measured: 6 }, genderProjection: { male: 2, female: 4 }, emotionProjection: { happy: 3 } }]), withOptIn: 4, brands: [{ name: 'VEOLIA', count: 2 }, { name: 'MVM', count: 1 }] },
      cameraProof: [{ kind: 'brand', name: 'MVM', photos: 1, samples: [{ readText: 'MVM', ocrConfidence: 0.9, match: 'exact', event: 'Camera Night' }] }],
      ...over,
    },
  });

  it('adds the Camera photos, people and proven names next to the SZRT ones, the logo kept', () => {
    const vision = withCameraVision(published, camera());
    expect(vision).toMatchObject({ totalImages: 104, processedCount: 84, percent: 81, optInImages: 104 });
    expect(vision.aggregates.totalPeople).toBe(56);
    expect(vision.aggregates.genders).toMatchObject({ male: 32, female: 24 });
    expect(vision.aggregates.topBrands).toEqual([{ brand: 'Veolia', count: 57, logoUrl: 'https://cdn/veolia.svg' }, { brand: 'MVM', count: 1 }]);
    expect(vision.aggregates.topEmotions).toEqual([{ emotion: 'happy', count: 13 }]);
    expect(vision.cameraProof?.[0].name).toBe('MVM');
    // The published document is not changed
    expect(published.aggregates.topBrands[0].count).toBe(55);
  });

  it('leaves the published vision as it is when Camera measured nothing', () => {
    const none = camera({ photos: mergePhotoSummaries([]), cameraProof: [] });
    expect(withCameraVision(published, none)).toBe(published);
  });
});
