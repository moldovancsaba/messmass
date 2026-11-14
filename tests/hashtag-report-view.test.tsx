// tests/hashtag-report-view.test.tsx
// WHAT: The unified hashtag report page shows only what was measured, and says what each percentage divided by what.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HashtagReportView from '@/components/hashtagReport/HashtagReportView';
import { calculate } from '@/lib/hashtagReport/calculated';
import { mergePhotoSummaries } from '@/lib/hashtagReport/mergeSummaries';
import { sumDrivePhotos } from '@/lib/hashtagReport/measured';
import type { HashtagReport, MeasuredLayer } from '@/lib/hashtagReport/types';

const report = (measured: MeasuredLayer): HashtagReport => ({
  success: true,
  scope: { type: 'hashtag', id: 'derby' },
  generatedAt: '2026-11-14T00:00:00.000Z',
  measured,
  calculated: calculate(measured),
  coverage: {
    events: measured.events.length,
    eventsWithCounters: measured.events.filter((e) => e.hasCounters).length,
    eventsWithPhotoResults: measured.events.filter((e) => e.hasPhotoResults).length,
    eventsWithDrivePhotos: measured.events.filter((e) => e.drivePhotos > 0).length,
  },
});

const event = (over = {}) => ({ id: 'e1', name: 'Derby', date: '2026-02-01', hasCounters: true, hasPhotoResults: true, drivePhotos: 0, ...over });
const noDrive = sumDrivePhotos([]);
const rollup = { photoResultsReceived: 10, optInPhotos: 10, peopleCounts: { measured: 20 }, genderProjection: { male: 12, female: 8 }, ageProjection: { genZ: 15 }, emotionProjection: { happy: 14 }, smilingCount: 14, demographicPeopleMeasured: 20, brandMentions: [{ name: 'Nike', count: 4 }], clubMentions: [{ name: 'DVTK', count: 3 }] };

describe('the hashtag report page', () => {
  it('says so when no event carries the hashtag', () => {
    const html = renderToStaticMarkup(<HashtagReportView report={report({ events: [], counters: {}, photos: mergePhotoSummaries([]), drive: noDrive })} />);
    expect(html).toContain('No event carries #derby yet');
    expect(html).not.toContain('Photos taken');
  });

  it('says so when events carry it but nothing was measured', () => {
    const html = renderToStaticMarkup(<HashtagReportView report={report({ events: [event({ hasCounters: false, hasPhotoResults: false })], counters: {}, photos: mergePhotoSummaries([]), drive: noDrive })} />);
    expect(html).toContain('none of them has measured');
    expect(html).not.toContain('Approval rate');
  });

  it('shows each percentage with the two counts it came from, and "Not measured" for what nobody counted', () => {
    const photos = mergePhotoSummaries([rollup]);
    photos.withOptIn = 10;
    const html = renderToStaticMarkup(
      <HashtagReportView report={report({ events: [event()], counters: { camera_images_taken: 100, camera_images_approved: 90, camera_images_rejected: 5 }, photos, drive: noDrive })} />,
    );
    expect(html).toContain('94.7%');
    expect(html).toContain('90 of 95 photos decided in vetting');
    expect(html).toContain('10 of 100 photos taken');
    expect(html).toContain('10 of 10 photos analysed');
    // No consent counter was reported: not measured, not zero
    expect(html).toMatch(/Consent accepted<\/span><span[^>]*>Not measured/);
    expect(html).toContain('12 of 20 people with a measured gender are men');
    // The rollup lists model guesses as brands and clubs: they are not shown
    expect(html).not.toContain('Nike');
    expect(html).not.toContain('DVTK');
    expect(html).not.toContain('Brands');
  });

  it('says which count is missing when the opt-in count was not measured, not that the photos were not counted', () => {
    const html = renderToStaticMarkup(
      <HashtagReportView report={report({ events: [event()], counters: {}, photos: mergePhotoSummaries([rollup]), drive: noDrive })} />,
    );
    expect(html).toContain('No count of photos with a recorded opt-in was measured');
    expect(html).not.toContain('No count of photos analysed was measured');
  });

  it('shows no share when the counts do not agree, but keeps the counts visible', () => {
    const html = renderToStaticMarkup(
      <HashtagReportView report={report({ events: [event()], counters: { camera_images_taken: 5 }, photos: mergePhotoSummaries([rollup]), drive: noDrive })} />,
    );
    expect(html).toContain('10 of 5 photos taken; no share is shown because the counts do not agree');
  });

  it('shows the drive photos placed in the events, with how sure the placement is and the names read from the pictures', () => {
    const drive = sumDrivePhotos([
      { eventId: 'e1', assignment: { confidence: 0.9 }, optIn: { received: true }, analysis: { people: 3, genders: { male: 2, female: 1 }, brands: ['Veolia', 'Veolia'], clubs: ['DVTK'] } },
      { eventId: 'e1', assignment: { confidence: 0.4 }, optIn: { received: true }, analysis: null },
    ]);
    const html = renderToStaticMarkup(
      <HashtagReportView report={report({ events: [event({ hasCounters: false, hasPhotoResults: false, drivePhotos: 2 })], counters: {}, photos: mergePhotoSummaries([]), drive })} />,
    );
    expect(html).toContain('Drive photos placed in these events');
    expect(html).toContain('1 of 2 drive photos placed in events');
    expect(html).toContain('2 of 2 drive photos placed in events');
    expect(html).toContain('Veolia');
    expect(html).toContain('DVTK');
  });
});
