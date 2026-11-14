// tests/hashtag-report.test.ts
// WHAT: The unified hashtag report: one builder for every hashtag, measured data and Messmass calculations only.
// WHY: "No manually entered number, by design" must be a test that fails, not a promise: the builder may fetch only the
//     allowlisted machine counters, ignores every other stat even when the database hands it over, and every
//     calculation shows its two counts or gives nothing.

import { buildHashtagReport } from '@/lib/hashtagReport';
import { calculate, share } from '@/lib/hashtagReport/calculated';
import { CAMERA_TOTAL_COUNTERS, MACHINE_EVENT_PROJECTION, hashtagFilter, sumDrivePhotos, type ReportDb } from '@/lib/hashtagReport/measured';
import { mergePhotoSummaries } from '@/lib/hashtagReport/mergeSummaries';

const rollup = (over: Record<string, unknown> = {}) => ({
  photoResultsReceived: 10, optInPhotos: 10, personBoxes: 22, faceBoxes: 20, peopleCounts: { measured: 20 },
  genderProjection: { male: 12, female: 8 }, ageProjection: { genX: 5, genZ: 15 }, emotionProjection: { happy: 14 },
  smilingCount: 14, demographicPeopleMeasured: 20, humanConfirmedPhotos: 2, humanCorrectedPhotos: 1,
  brandMentions: [{ name: 'Nike', count: 4 }, { name: 'Veolia', count: 2 }], clubMentions: [{ name: 'DVTK', count: 3 }],
  moderationPhotosReviewed: 10, moderationFlaggedPhotos: 1, ...over,
});

describe('adding the photo rollups of several events', () => {
  it('sums every count and count map', () => {
    const merged = mergePhotoSummaries([rollup(), rollup({ photoResultsReceived: 5, genderProjection: { male: 1, female: 4 } })]);
    expect(merged.analysed).toBe(15);
    expect(merged.genders).toEqual({ male: 13, female: 12 });
    expect(merged.people.measured).toBe(40);
    expect(merged.demographicPeople).toBe(40);
  });

  it('does not carry over the brand and club names a rollup lists: they are model guesses, not names read from the picture', () => {
    const merged = mergePhotoSummaries([rollup()]) as unknown as Record<string, unknown>;
    expect(merged.brands).toBeUndefined();
    expect(merged.clubs).toBeUndefined();
    expect(JSON.stringify(merged)).not.toContain('Nike');
  });

  it('leaves the opt-in count to the measured layer', () => {
    expect(mergePhotoSummaries([rollup()]).withOptIn).toBeNull();
  });
});

describe('the calculations', () => {
  it('give the value with the two counts it came from', () => {
    expect(share(9, 12, 'photos decided', 'photos approved')).toEqual({ value: 75, numerator: 9, denominator: 12, basis: 'photos decided', part: 'photos approved' });
  });

  it('give nothing when a count is unknown, the whole is empty or the part exceeds the whole', () => {
    expect(share(null, 12, 'x', 'y').value).toBeNull();
    expect(share(3, 0, 'x', 'y').value).toBeNull();
    expect(share(20130, 13572, 'x', 'y')).toMatchObject({ value: null, numerator: 20130, denominator: 13572 });
  });

  it('treat a counter nobody reported as unknown, not zero', () => {
    const photos = mergePhotoSummaries([rollup()]);
    photos.withOptIn = 10;
    const calc = calculate({ events: [], counters: {}, photos, drive: sumDrivePhotos([]) });
    expect(calc.analysedShare).toMatchObject({ value: null, denominator: null });
    expect(calc.optInShare).toMatchObject({ value: 100, numerator: 10, denominator: 10 });
    expect(calc.maleShare.value).toBe(60);
    expect(calc.smilingShare.value).toBe(70);
  });
});

describe('what the builder may read', () => {
  const calls: Array<{ collection: string; filter: Record<string, unknown>; options?: Record<string, unknown> }> = [];
  const db: ReportDb = {
    collection: (name) => ({
      countDocuments: async (filter) => {
        calls.push({ collection: `${name}#count`, filter });
        return 7;
      },
      find: (filter, options) => {
        calls.push({ collection: name, filter, options });
        return {
          toArray: async () => {
            if (name === 'fanmass_event_drive_photos') {
              return [
                { eventId: 'e2', assignment: { confidence: 0.8 }, optIn: { received: true }, analysis: { people: 2, genders: { male: 1, female: 1 }, clubs: ['DVTK', 'DVTK'] } },
                { eventId: 'e2', assignment: { confidence: 0.3 }, optIn: { received: true }, analysis: null },
              ];
            }
            if (name === 'projects') {
              return [
                // The database hands over manual stats too (as a bug or a changed projection would): they must stay unused
                { _id: 'e1', eventName: 'Derby', eventDate: '2026-02-01', stats: { camera_images_taken: 100, camera_images_approved: 90, camera_images_rejected: 5, szerencsejatekAllRegistered: 13572, marketingOptin: 20130, allImages: 999 } },
                { _id: 'e2', eventName: 'Cup', eventDate: '2026-01-01', stats: { allImages: 500, userRegistration: 77 } },
              ];
            }
            return [{ eventId: 'e1', summary: rollup() }];
          },
        };
      },
    }),
  };

  beforeEach(() => { calls.length = 0; });

  it('fetches only event identity and allowlisted Camera counters', async () => {
    await buildHashtagReport(db, 'anything');
    const projection = calls.find((c) => c.collection === 'projects')?.options?.projection as Record<string, unknown>;
    expect(projection).toEqual(MACHINE_EVENT_PROJECTION);
    const statKeys = Object.keys(projection).filter((key) => key.startsWith('stats'));
    expect(statKeys).not.toContain('stats');
    expect(statKeys.every((key) => key.startsWith('stats.camera_'))).toBe(true);
    expect(statKeys).toHaveLength(CAMERA_TOTAL_COUNTERS.length);
  });

  it('ignores every manual stat even when the database returns it', async () => {
    const report = await buildHashtagReport(db, 'anything');
    expect(Object.keys(report.measured.counters).sort()).toEqual(['camera_images_approved', 'camera_images_rejected', 'camera_images_taken']);
    const everything = JSON.stringify(report);
    for (const manual of ['13572', '20130', '999', '"77"', 'szerencsejatek', 'marketingOptin', 'userRegistration']) {
      expect(everything).not.toContain(manual);
    }
  });

  it('builds the same report for any hashtag, and says what it covers', async () => {
    const report = await buildHashtagReport(db, '#Derby2027');
    expect(report.scope).toEqual({ type: 'hashtag', id: 'Derby2027' });
    expect(report.coverage).toEqual({ events: 2, eventsWithCounters: 1, eventsWithPhotoResults: 1, eventsWithDrivePhotos: 1 });
    expect(report.measured.events.map((event) => event.name)).toEqual(['Cup', 'Derby']);
    expect(report.calculated.analysedShare).toMatchObject({ value: 10, numerator: 10, denominator: 100 });
    expect(report.calculated.approvalRate).toMatchObject({ value: 94.7, numerator: 90, denominator: 95 });
    // The rollup of the second event does not exist: nothing is invented for it
    expect(report.measured.photos.analysed).toBe(10);
  });

  it('adds the drive photos placed in the events, apart from the Camera results, with names counted once per photo', async () => {
    const report = await buildHashtagReport(db, 'anything');
    expect(report.measured.drive).toMatchObject({ placed: 2, placedOverHalf: 1, analysed: 1, withOptIn: 2, people: 2, clubs: [{ name: 'DVTK', count: 1 }] });
    expect(report.measured.events.find((e) => e.id === 'e2')?.drivePhotos).toBe(2);
    expect(report.calculated.driveConfidentShare).toMatchObject({ value: 50, numerator: 1, denominator: 2 });
    expect(report.calculated.driveOptInShare.value).toBe(100);
  });

  it('counts the opt-ins from the stored per-photo results of the hashtag events, not from the rollups', async () => {
    const report = await buildHashtagReport(db, 'anything');
    const count = calls.find((c) => c.collection === 'fanmass_camera_photo_analyses#count');
    expect(count?.filter).toMatchObject({ eventId: { $in: ['e1', 'e2'] }, tombstone: { $ne: true }, 'optIn.received': true });
    expect(report.measured.photos.withOptIn).toBe(7);
    // 7 of the 10 analysed photos carry it, so the share is calculated from those two counts
    expect(report.calculated.optInShare).toMatchObject({ value: 70, numerator: 7, denominator: 10, part: 'photos with a recorded opt-in' });
    // The names a rollup lists are guesses and never reach the report
    expect(JSON.stringify(report)).not.toContain('Nike');
  });

  it('finds the events of a hashtag written with or without #, in any case, inside one organization when asked', () => {
    const filter = hashtagFilter('#Derby', 'org_1') as { $or: Array<Record<string, unknown>>; organizationId: string };
    expect(filter.organizationId).toBe('org_1');
    expect(filter.$or[0]).toEqual({ hashtags: 'Derby' });
    expect(filter.$or[1]).toEqual({ hashtags: '#Derby' });
    expect((filter.$or[2].hashtags as { $regex: RegExp }).$regex.test('#derby')).toBe(true);
    // ...and as one comma-separated text, like the classic hashtag report
    const listed = (filter.$or[3].hashtags as { $regex: RegExp }).$regex;
    expect(listed.test('cup, Derby ,final')).toBe(true);
    expect(listed.test('derbyshire')).toBe(false);
  });
});
