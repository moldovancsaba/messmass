// tests/hashtag-report-view.test.tsx
// WHAT: The unified hashtag report page shows only what was measured, and says what each percentage divided by what.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HashtagReportView from '@/components/hashtagReport/HashtagReportView';
import { calculate } from '@/lib/hashtagReport/calculated';
import { mergePhotoSummaries } from '@/lib/hashtagReport/mergeSummaries';
import { readDriveSummary } from '@/lib/hashtagReport/measured';
import { driveFacet } from './helpers/driveFacet';

const sumDrivePhotos = (rows: Array<Record<string, any>>) => readDriveSummary(driveFacet(rows)).drive;
import type { HashtagReport, MeasuredLayer } from '@/lib/hashtagReport/types';

const report = (layer: Omit<MeasuredLayer, 'cameraProof' | 'months'> & Partial<MeasuredLayer>): HashtagReport => {
  const measured: MeasuredLayer = { cameraProof: [], months: [], ...layer };
  return {
  success: true,
  scope: { type: 'hashtag', id: 'derby', tags: ['derby'] },
  generatedAt: '2026-11-14T00:00:00.000Z',
  measured,
  calculated: calculate(measured),
  coverage: {
    events: measured.events.length,
    eventsWithCounters: measured.events.filter((e) => e.hasCounters).length,
    eventsWithPhotoResults: measured.events.filter((e) => e.hasPhotoResults).length,
    eventsWithDrivePhotos: measured.events.filter((e) => e.drivePhotos > 0).length,
  },
  };
};

const event = (over = {}) => ({ id: 'e1', name: 'Derby', date: '2026-02-01', hasCounters: true, hasPhotoResults: true, drivePhotos: 0, cameraPhotos: 0, joinedBy: 'hashtag' as const, ...over });
const noDrive = sumDrivePhotos([]);
const rollup = { photoResultsReceived: 10, optInPhotos: 10, peopleCounts: { measured: 20 }, genderProjection: { male: 12, female: 8 }, ageProjection: { genZ: 15 }, emotionProjection: { happy: 14 }, smilingCount: 14, demographicPeopleMeasured: 20, brandMentions: [{ name: 'Nike', count: 4 }], clubMentions: [{ name: 'DVTK', count: 3 }] };

describe('the hashtag report page', () => {
  it('says so when no event carries the hashtag', () => {
    const html = renderToStaticMarkup(<HashtagReportView report={report({ events: [], counters: {}, photos: mergePhotoSummaries([]), drive: noDrive })} />);
    expect(html).toContain('No event and no photo carries #derby yet');
    expect(html).not.toContain('Photos taken');
  });

  it('says so when events carry it but nothing was measured', () => {
    const html = renderToStaticMarkup(<HashtagReportView report={report({ events: [event({ hasCounters: false, hasPhotoResults: false })], counters: {}, photos: mergePhotoSummaries([]), drive: noDrive })} />);
    expect(html).toContain('none of them has measured');
    expect(html).not.toContain('Approval rate');
  });

  it('shows each percentage with the two counts it came from, and hides unmeasured KPIs', () => {
    const photos = mergePhotoSummaries([rollup]);
    photos.withOptIn = 10;
    const html = renderToStaticMarkup(
      <HashtagReportView report={report({ events: [event()], counters: { camera_images_taken: 100, camera_images_approved: 90, camera_images_rejected: 5 }, photos, drive: noDrive })} />,
    );
    expect(html).toContain('94.7%');
    expect(html).toContain('90 of 95 photos decided in vetting');
    expect(html).toContain('10 of 100 photos taken');
    expect(html).toContain('10 of 10 photos analysed');
    // No consent counter was reported: hidden, never "Not measured" or zero
    expect(html).not.toContain('Consent accepted');
    expect(html).not.toContain('Not measured');
    expect(html).toContain('12 of 20 people with a measured gender are men');
    // The rollup lists model guesses as brands and clubs: they are not shown
    expect(html).not.toContain('Nike');
    expect(html).not.toContain('DVTK');
    expect(html).not.toContain('Brands');
  });

  it('hides opt-in KPI when the opt-in count was not measured', () => {
    const html = renderToStaticMarkup(
      <HashtagReportView report={report({ events: [event()], counters: {}, photos: mergePhotoSummaries([rollup]), drive: noDrive })} />,
    );
    expect(html).not.toContain('Not measured');
    expect(html).not.toContain('No count of');
    expect(html).not.toContain('Photos with opt-in');
  });

  it('hides conflicting share details when counts do not agree', () => {
    const html = renderToStaticMarkup(
      <HashtagReportView report={report({ events: [event()], counters: { camera_images_taken: 5 }, photos: mergePhotoSummaries([rollup]), drive: noDrive })} />,
    );
    expect(html).not.toContain('counts do not agree');
  });

  it('shows the drive photos placed in the events, with how sure the placement is and the names read from the pictures', () => {
    const drive = sumDrivePhotos([
      { eventId: 'e1', assignment: { confidence: 0.9 }, optIn: { received: true }, analysis: { people: 3, genders: { male: 2, female: 1 }, brands: ['Veolia', 'Veolia'], clubs: ['DVTK'] } },
      { eventId: 'e1', assignment: { confidence: 0.4 }, optIn: { received: true }, analysis: null },
    ]);
    const html = renderToStaticMarkup(
      <HashtagReportView report={report({ events: [event({ hasCounters: false, hasPhotoResults: false, drivePhotos: 2 })], counters: {}, photos: mergePhotoSummaries([]), drive })} />,
    );
    expect(html).toContain('Photo library tagged #derby');
    expect(html).toContain('1 matched with high confidence');
    expect(html).toContain('1 event carries it, 2 library photos');
    // No Camera data for this hashtag: no row of "Not measured" Camera figures
    expect(html).not.toContain('Photos taken');
    expect(html).not.toContain('Not measured');
    expect(html).toContain('2 of 2 drive photos');
    expect(html).toContain('Veolia');
    expect(html).toContain('DVTK');
  });

  it('shows drive photos tagged with the hashtag even when no event carries it', () => {
    const drive = { ...sumDrivePhotos([{ eventId: 'e9', assignment: { confidence: 1 }, optIn: { received: true }, analysis: null }]), events: [{ name: 'MTK x DVSC', count: 1 }] };
    const html = renderToStaticMarkup(<HashtagReportView report={report({ events: [], counters: {}, photos: mergePhotoSummaries([]), drive })} />);
    expect(html).not.toContain('No event and no photo carries');
    expect(html).toContain('Photo library tagged #derby');
    expect(html).toContain('MTK x DVSC');
  });

  it('headlines the photos with a stored opt-in record, and hides opt-in KPI when none has one', () => {
    const photos = { ...mergePhotoSummaries([rollup]), withOptIn: 0 };
    const none = renderToStaticMarkup(<HashtagReportView report={report({ events: [event()], counters: {}, photos, drive: noDrive })} />);
    expect(none).not.toContain('Not measured');
    expect(none).not.toContain('Photos with opt-in');
    const some = renderToStaticMarkup(<HashtagReportView report={report({ events: [event()], counters: {}, photos: { ...photos, withOptIn: 8 }, drive: noDrive })} />);
    expect(some).toContain('80%');
    expect(some).toContain('8 of 10 photos');
  });

  it('lists the months with drive and Camera photos, and the names proven in Camera photos', () => {
    const photos = { ...mergePhotoSummaries([rollup]), withOptIn: 10, brands: [{ name: 'Veolia', count: 2 }] };
    const html = renderToStaticMarkup(<HashtagReportView report={report({
      events: [event({ cameraPhotos: 10 })], counters: {}, photos, drive: noDrive,
      months: [{ month: '2025-11', events: 3, drivePhotos: 120, cameraPhotos: 0 }, { month: '2026-02', events: 1, drivePhotos: 0, cameraPhotos: 10 }],
    })} />);
    expect(html).toContain('By month');
    expect(html).toContain('November 2025');
    expect(html).toContain('February 2026');
    expect(html).toContain('Sponsor Brands');
    expect(html).toContain('Veolia');
  });
});
