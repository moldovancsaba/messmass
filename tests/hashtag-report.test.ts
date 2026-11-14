// tests/hashtag-report.test.ts
// WHAT: The unified hashtag report: one builder for every hashtag, measured data and Messmass calculations only.
// WHY: "No manually entered number, by design" must be a test that fails, not a promise: the builder may fetch only the
//     allowlisted machine counters, ignores every other stat even when the database hands it over, and every
//     calculation shows its two counts or gives nothing.

import { buildAllEventsReport, buildFilterReport, buildHashtagReport, filterSlugHashtags } from '@/lib/hashtagReport';
import { calculate, share } from '@/lib/hashtagReport/calculated';
import { CAMERA_TOTAL_COUNTERS, MACHINE_EVENT_PROJECTION, eventsFilter, hashtagFilter, readDriveSummary, type ReportDb } from '@/lib/hashtagReport/measured';
import { driveAggregate } from './helpers/driveFacet';
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
    const calc = calculate({ events: [], counters: {}, photos, drive: readDriveSummary().drive });
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
      aggregate: (pipeline) => {
        calls.push({ collection: name, filter: pipeline[0].$match as Record<string, unknown> });
        return driveAggregate(() => [
          { eventId: 'e2', assignment: { confidence: 0.8 }, optIn: { received: true }, analysis: { people: 2, genders: { male: 1, female: 1 }, clubs: ['DVTK', 'DVTK'] } },
          { eventId: 'e2', assignment: { confidence: 0.3 }, optIn: { received: true }, analysis: null },
        ])(pipeline as any);
      },
      find: (filter, options) => {
        calls.push({ collection: name, filter, options });
        return {
          toArray: async () => {
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
    expect(report.scope).toEqual({ type: 'hashtag', id: 'Derby2027', tags: ['Derby2027'] });
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
    expect(report.measured.drive.events).toEqual([{ name: 'Cup', count: 2 }]);
    // A photo is found by its own hashtag as well as through the events that carry the hashtag
    const driveCall = calls.find((c) => c.collection === 'fanmass_event_drive_photos');
    expect(driveCall?.filter).toEqual({ $or: [{ hashtags: { $regex: /^#?a_*n_*y_*t_*h_*i_*n_*g$/i } }, { eventId: { $in: ['e1', 'e2'] } }] });
    // Camera photo results tagged with the hashtag are counted in any event
    expect(calls.find((c) => c.collection === 'fanmass_camera_photo_analyses#count' && 'hashtags' in c.filter)?.filter).toMatchObject({ hashtags: { $regex: /^#?a_*n_*y_*t_*h_*i_*n_*g$/i } });
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

  it('finds the events of a hashtag in every spelling (#, case, underscores), inside one organization when asked', () => {
    const filter = hashtagFilter('#Otp_Bank', 'org_1') as { $or: Array<Record<string, any>>; organizationId: string };
    expect(filter.organizationId).toBe('org_1');
    const plain = filter.$or[0].hashtags.$regex as RegExp;
    for (const spelling of ['otp_bank', 'otpbank', '#OTPBank', 'o_t_p_bank']) expect(plain.test(spelling)).toBe(true);
    expect(plain.test('otpbankpickszeged')).toBe(false);
    // ...as one comma-separated text, like the classic hashtag report
    const listed = filter.$or[1].hashtags.$regex as RegExp;
    expect(listed.test('cup, OTP_Bank ,final')).toBe(true);
    expect(listed.test('otpbanking')).toBe(false);
    // ...in the hashtags Fanmass wrote onto the event's photos (they work together with the typed ones)...
    expect((filter.$or[2].fanmassHashtags.$regex as RegExp).test('otpbank')).toBe(true);
    // ...and in any category list, compared without case, # or underscores
    expect(JSON.stringify(filter.$or[3])).toContain('categorizedHashtags');
    expect(JSON.stringify(filter.$or[3])).toContain('"otpbank"');
  });

  it('matches a category:tag query in that category only, and several hashtags all together', () => {
    const filter = hashtagFilter('campaign:TippmixReport2026') as { $or: Array<Record<string, { $regex: RegExp }>> };
    expect(filter.$or).toHaveLength(1);
    expect(filter.$or[0]['categorizedHashtags.campaign'].$regex.test('tippmixreport2026')).toBe(true);
    const both = eventsFilter(['derby', 'cup'], 'org_1') as { $and: unknown[]; organizationId: string };
    expect(both.$and).toHaveLength(2);
    expect(both.organizationId).toBe('org_1');
    expect(eventsFilter(null)).toEqual({});
    // Typed only (which events give ALL their photos to the report): the Fanmass hashtags are left out
    expect(JSON.stringify(hashtagFilter('veolia', undefined, true))).not.toContain('fanmassHashtags');
    expect(JSON.stringify(hashtagFilter('veolia'))).toContain('fanmassHashtags');
  });
});

describe('events that hold photos of the hashtag', () => {
  // One event carries the hashtag; Fanmass placed a tagged drive photo in a second event that does not
  const placedIn = '6af861d294eb1bfcaaca5622';
  const db: ReportDb = {
    collection: (name: string) => ({
      countDocuments: async () => 0,
      // Two tagged photos (one placed in an event without the hashtag, one in the library) and one untagged photo of
      // that event: the summary over the event must hold all three
      aggregate: driveAggregate((match) => {
        const tagged = [{ eventId: placedIn, assignment: { confidence: 1 }, optIn: { received: true }, analysis: null }, { eventId: null, optIn: { received: true } }];
        const untagged = [{ eventId: placedIn, assignment: { confidence: 0.5 }, optIn: { received: true }, analysis: null }];
        return JSON.stringify(match).includes(placedIn) ? [...tagged, ...untagged] : tagged;
      }),
      find: (filter: Record<string, any>) => ({
        toArray: async () => {
          if (name === 'projects') {
            return filter._id
              ? [{ _id: placedIn, eventName: 'Paksi FC x Nyíregyháza Spartacus FC', eventDate: '2025-12-20', stats: { camera_images_taken: 40, marketingOptin: 999 } }]
              : [{ _id: 'e1', eventName: 'Tagged event', eventDate: '2026-01-10', stats: {} }];
          }
          return [];
        },
      }),
    }),
  } as unknown as ReportDb;

  it('joins the report by themselves, with their machine counters and only the photos that carry the hashtag', async () => {
    const report = await buildHashtagReport(db, 'tippmixreport2026');
    expect(report.measured.events.map((e) => [e.name, e.joinedBy])).toEqual([
      ['Paksi FC x Nyíregyháza Spartacus FC', 'photos'],
      ['Tagged event', 'hashtag'],
    ]);
    expect(report.measured.counters).toEqual({ camera_images_taken: 40 });
    // The untagged photo of the joined event stays out: Fanmass hashtags are about the photos they were found in
    expect(report.measured.drive).toMatchObject({ photos: 2, placed: 1 });
    expect(report.measured.drive.events).toEqual([{ name: 'Paksi FC x Nyíregyháza Spartacus FC', count: 1 }]);
    expect(JSON.stringify(report)).not.toContain('999');
  });
});

describe('every event together', () => {
  it('measures every event and every drive photo, with no hashtag filter', async () => {
    const calls: Array<{ name: string; filter: Record<string, unknown> }> = [];
    const db = {
      collection: (name: string) => ({
        countDocuments: async (filter: Record<string, unknown>) => { calls.push({ name: `${name}#count`, filter }); return 0; },
        aggregate: (pipeline: Array<Record<string, any>>) => {
          calls.push({ name, filter: pipeline[0].$match });
          return driveAggregate(() => [{ eventId: 'e2', optIn: { received: true } }, { eventId: null, optIn: { received: true } }])(pipeline);
        },
        find: (filter: Record<string, unknown>) => ({
          toArray: async () => {
            calls.push({ name, filter });
            if (name === 'projects') return [{ _id: 'e1', eventName: 'A', stats: { camera_images_taken: 5, allImages: 999 } }, { _id: 'e2', eventName: 'B', stats: {} }];
            return [];
          },
        }),
      }),
    } as unknown as ReportDb;
    const report = await buildAllEventsReport(db);
    expect(report.scope).toEqual({ type: 'all', id: 'all', tags: [] });
    expect(calls.find((c) => c.name === 'projects')?.filter).toEqual({});
    expect(calls.find((c) => c.name === 'fanmass_event_drive_photos')?.filter).toEqual({});
    expect(report.coverage.events).toBe(2);
    expect(report.measured.counters).toEqual({ camera_images_taken: 5 });
    expect(report.measured.drive).toMatchObject({ photos: 2, placed: 1 });
    expect(JSON.stringify(report)).not.toContain('999');
  });
});

describe('several hashtags together (the hashtag filter)', () => {
  const calls: Array<{ name: string; filter: Record<string, any> }> = [];
  const db = {
    collection: (name: string) => ({
      countDocuments: async (filter: Record<string, any>) => { calls.push({ name: `${name}#count`, filter }); return 3; },
      aggregate: (pipeline: Array<Record<string, any>>) => { calls.push({ name, filter: pipeline[0].$match }); return driveAggregate(() => [])(pipeline); },
      find: (filter: Record<string, any>) => ({
        toArray: async () => {
          calls.push({ name, filter });
          if (name === 'filter_slugs') return filter.slug === 'saved' ? [{ hashtags: ['#TippmixReport2026', 'campaign:happy'] }] : [];
          return [];
        },
      }),
    }),
  } as unknown as ReportDb;

  beforeEach(() => { calls.length = 0; });

  it('takes events carrying all of them and photos tagged with all of them', async () => {
    const report = await buildFilterReport(db, ['#TippmixReport2026', 'campaign:happy', 'happy'], 'saved');
    expect(report.scope).toEqual({ type: 'filter', id: 'saved', tags: ['TippmixReport2026', 'campaign:happy', 'happy'] });
    expect(calls.find((c) => c.name === 'projects')?.filter.$and).toHaveLength(3);
    // Photo hashtags in every spelling, a category prefix dropped
    const all = calls.find((c) => c.name === 'fanmass_event_drive_photos')?.filter.hashtags.$all as RegExp[];
    expect(all.map((re) => re.test('tippmix_report_2026'))).toEqual([true, false, false]);
    expect(all.map((re) => re.test('happy'))).toEqual([false, true, true]);
    expect(report.measured.photos.tagged).toBe(3);
  });

  it('reads a saved filter by its slug, or the slug itself as hashtags', async () => {
    expect(await filterSlugHashtags(db, 'saved')).toEqual(['TippmixReport2026', 'campaign:happy']);
    expect(await filterSlugHashtags(db, '#derby, cup')).toEqual(['derby', 'cup']);
  });
});
